import assert from 'node:assert/strict';
import {
  AuthError,
  DeactivatedAccountError,
  ForbiddenError,
  InMemoryAuthRepository,
  InMemoryWorkspaceRepository,
  ReservationMemoryRepository,
  UnauthorizedError,
  createAuthService,
  createReservationService,
  type AuthActor,
  type InMemoryUserRecord,
} from '../packages/domain/src/index';

async function run() {
  console.log('--- Running M17: Authentication & Final Security Gate Tests ---');

  const adminUser: InMemoryUserRecord = {
    id: 'user-admin-1',
    email: 'admin@deskatlas.com',
    password: 'SuperAdminPassword123!',
    role: 'ADMIN',
    displayName: 'Lead Admin',
    isActive: true,
  };

  const staffUser: InMemoryUserRecord = {
    id: 'user-staff-1',
    email: 'staff@deskatlas.com',
    password: 'StaffPassword123!',
    role: 'STAFF',
    displayName: 'Frontdesk Staff',
    isActive: true,
  };

  const deactivatedStaff: InMemoryUserRecord = {
    id: 'user-staff-inactive',
    email: 'inactive.staff@deskatlas.com',
    password: 'OldPassword123!',
    role: 'STAFF',
    displayName: 'Inactive Staff',
    isActive: false,
  };

  const deactivatedAdmin: InMemoryUserRecord = {
    id: 'user-admin-inactive',
    email: 'inactive.admin@deskatlas.com',
    password: 'OldAdminPassword123!',
    role: 'ADMIN',
    displayName: 'Inactive Admin',
    isActive: false,
  };

  const authRepository = new InMemoryAuthRepository([
    adminUser,
    staffUser,
    deactivatedStaff,
    deactivatedAdmin,
  ]);
  const authService = createAuthService(authRepository);

  // 1. Admin Login & Active Profile Check
  const adminSession = await authService.loginStaff(
    adminUser.email,
    adminUser.password
  );
  assert.ok(adminSession.token, 'Admin login should return a session token');
  assert.equal(adminSession.actor.role, 'ADMIN');
  assert.equal(adminSession.actor.id, adminUser.id);
  assert.equal(adminSession.actor.isActive, true);
  console.log('✓ Case 1 passed: Admin login verified with active profile');

  // 2. Staff Login
  const staffSession = await authService.loginStaff(
    staffUser.email,
    staffUser.password
  );
  assert.ok(staffSession.token, 'Staff login should return a session token');
  assert.equal(staffSession.actor.role, 'STAFF');
  assert.equal(staffSession.actor.id, staffUser.id);
  console.log('✓ Case 2 passed: Staff login verified with staff profile');

  // 3. Deactivated account rejection on login
  await assert.rejects(
    async () => {
      await authService.loginStaff(
        deactivatedStaff.email,
        deactivatedStaff.password
      );
    },
    (err: Error) => {
      assert.ok(err instanceof DeactivatedAccountError);
      return true;
    },
    'Deactivated staff should be rejected on login'
  );

  await assert.rejects(
    async () => {
      await authService.loginStaff(
        deactivatedAdmin.email,
        deactivatedAdmin.password
      );
    },
    (err: Error) => {
      assert.ok(err instanceof DeactivatedAccountError);
      return true;
    },
    'Deactivated admin should be rejected on login'
  );
  console.log('✓ Case 3 passed: Deactivated staff & admin rejected on login');

  // 4. Invalid credentials rejection
  await assert.rejects(
    async () => {
      await authService.loginStaff('admin@deskatlas.com', 'WrongPassword!');
    },
    (err: Error) => {
      assert.ok(err instanceof UnauthorizedError);
      return true;
    },
    'Invalid password should be rejected'
  );
  console.log('✓ Case 4 passed: Invalid credentials rejected');

  // 5. Session token verification
  const resolvedAdminActor = await authService.authenticateRequest({
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'authorization'
          ? `Bearer ${adminSession.token}`
          : null,
    },
  });
  assert.ok(resolvedAdminActor);
  assert.equal(resolvedAdminActor.id, adminUser.id);
  assert.equal(resolvedAdminActor.role, 'ADMIN');

  const resolvedAnonymous = await authService.authenticateRequest({
    headers: {
      get: () => null,
    },
  });
  assert.equal(resolvedAnonymous, null);
  console.log('✓ Case 5 passed: Session token verification and anonymous resolution verified');

  // 6. Admin-only Route Authorization Gate
  const adminActor: AuthActor = adminSession.actor;
  const staffActor: AuthActor = staffSession.actor;

  const adminPass = await authService.requireAdmin(adminActor);
  assert.equal(adminPass.role, 'ADMIN');

  await assert.rejects(
    async () => {
      await authService.requireAdmin(staffActor);
    },
    (err: Error) => {
      assert.ok(err instanceof ForbiddenError);
      assert.match(err.message, /Admin access required/i);
      return true;
    },
    'Staff actor must be rejected from Admin-only gate'
  );

  await assert.rejects(
    async () => {
      await authService.requireAdmin(null);
    },
    (err: Error) => {
      assert.ok(err instanceof UnauthorizedError);
      return true;
    },
    'Anonymous actor must be rejected with 401 from Admin-only gate'
  );
  console.log('✓ Case 6 passed: Admin-only authorization gate strictly enforces admin role');

  // 7. Staff or Admin Operation Authorization Gate
  const staffPass = await authService.requireStaffOrAdmin(staffActor);
  assert.equal(staffPass.role, 'STAFF');

  const adminStaffPass = await authService.requireStaffOrAdmin(adminActor);
  assert.equal(adminStaffPass.role, 'ADMIN');

  await assert.rejects(
    async () => {
      await authService.requireStaffOrAdmin(null);
    },
    (err: Error) => {
      assert.ok(err instanceof UnauthorizedError);
      return true;
    },
    'Anonymous actor must be rejected with 401 from Staff gate'
  );
  console.log('✓ Case 7 passed: Staff or Admin gate allows staff & admin and rejects anonymous');

  // 8. Kiosk Private Context Gate
  authRepository.setKioskSecret('kiosk-device-secret-9988');

  const validKioskContext = await authService.validateKioskContext({
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'x-kiosk-secret'
          ? 'kiosk-device-secret-9988'
          : null,
    },
  });
  assert.equal(validKioskContext, true, 'Valid kiosk secret should be accepted');

  const invalidKioskContext = await authService.validateKioskContext({
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'x-kiosk-secret' ? 'wrong-secret' : null,
    },
  });
  assert.equal(invalidKioskContext, false, 'Invalid kiosk secret should be rejected');
  console.log('✓ Case 8 passed: Kiosk private context gate verified');

  // 9. Payment Proof Storage Security Gate (Admin-only signed URL)
  const proofUrl = await authService.getSignedPaymentProofUrl(
    adminActor,
    'proofs/res-101/receipt.jpg'
  );
  assert.ok(proofUrl.includes('receipt.jpg'));
  assert.ok(proofUrl.includes('sig_'));

  await assert.rejects(
    async () => {
      await authService.getSignedPaymentProofUrl(
        staffActor,
        'proofs/res-101/receipt.jpg'
      );
    },
    (err: Error) => {
      assert.ok(err instanceof ForbiddenError);
      return true;
    },
    'Staff must be forbidden from accessing payment proof storage'
  );
  console.log('✓ Case 9 passed: Payment proof storage is private and Admin-authorized only');

  // 10. Guest-first customer reservation flow operates without customer account
  const workspaceRepo = new InMemoryWorkspaceRepository();
  const resRepo = new ReservationMemoryRepository();
  const reservationService = createReservationService(
    resRepo,
    workspaceRepo,
    resRepo
  );

  const floor = await workspaceRepo.createFloor({ name: 'Test Floor' });
  const template = await workspaceRepo.createTemplate({
    name: 'Desk Template',
    capacity: 1,
    rateAmount: 100,
    pricingUnit: 'HOURLY',
    defaultShape: 'desk',
    defaultColor: '#009689',
    isActive: true,
  });
  const instance = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: 'D1',
    displayName: 'Desk 1',
  });

  const guestReservation = await reservationService.createReservation(
    {
      source: 'WEB',
      customerFirstName: 'Jane',
      customerLastName: 'Doe',
      customerEmail: 'jane.doe@example.com',
      paymentMethodId: 'pm-gcash',
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: instance.id,
          startAt: '2027-01-01T09:00:00Z',
          endAt: '2027-01-01T11:00:00Z',
        },
      ],
    },
    { paymentLinkBaseUrl: 'https://deskatlas.test/pay' }
  );

  assert.ok(guestReservation.id, 'Guest reservation should succeed without login account');
  assert.ok(guestReservation.referenceCode, 'Guest reservation should generate a reference code');
  assert.equal(guestReservation.status, 'PENDING_PAYMENT');
  console.log('✓ Case 10 passed: Guest-first reservation succeeds without account creation');

  console.log('\n✅ All M17 Authentication & Security Gate tests passed successfully!\n');
}

run().catch((err) => {
  console.error('❌ M17 test failure:', err);
  process.exit(1);
});
