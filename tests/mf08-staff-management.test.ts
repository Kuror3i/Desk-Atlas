import * as assert from "assert";
import {
  createStaffManagementService,
  StaffManagementAuthorizationError,
  StaffManagementConflictError,
  StaffManagementError,
  StaffManagementMemoryRepository,
} from "../packages/domain/src/index";

async function runTests() {
  async function runTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
    } catch (error: any) {
      console.error(`[FAIL] ${name}:`, error.message);
      process.exit(1);
    }
  }

  const fixedNow = new Date("2026-08-29T10:00:00.000Z");
  const nowProvider = () => fixedNow;

  // 1. Empty state
  await runTest("empty database returns truthful empty staff list", async () => {
    const memoryRepo = new StaffManagementMemoryRepository([], nowProvider);
    const service = createStaffManagementService(memoryRepo, nowProvider);

    const list = await service.listStaff();
    assert.strictEqual(Array.isArray(list), true);
    assert.strictEqual(list.length, 0);
  });

  // 2. Create staff account (Admin & Staff)
  await runTest("admin creates staff and admin accounts successfully", async () => {
    const memoryRepo = new StaffManagementMemoryRepository([], nowProvider);
    const service = createStaffManagementService(memoryRepo, nowProvider);

    const adminActor = { userId: "admin-root", role: "ADMIN" as const };

    const staff1 = await service.createStaff({
      email: "jane.desk@deskatlas.com",
      displayName: "Jane Desk",
      password: "Password123!",
      role: "STAFF",
      actorUserId: adminActor.userId,
      actorRole: adminActor.role,
    });

    assert.strictEqual(staff1.email, "jane.desk@deskatlas.com");
    assert.strictEqual(staff1.name, "Jane Desk");
    assert.strictEqual(staff1.role, "Staff");
    assert.strictEqual(staff1.rawRole, "STAFF");
    assert.strictEqual(staff1.initials, "JD");
    assert.strictEqual(staff1.isActive, true);
    assert.strictEqual(staff1.status, "Active");
    assert.strictEqual((staff1 as any).password, undefined, "Password must never be in StaffMember response");

    const admin1 = await service.createStaff({
      email: "super.admin@deskatlas.com",
      displayName: "Super Admin",
      password: "Password123!",
      role: "ADMIN",
      actorUserId: adminActor.userId,
      actorRole: adminActor.role,
    });

    assert.strictEqual(admin1.name, "Super Admin");
    assert.strictEqual(admin1.role, "Admin");
    assert.strictEqual(admin1.rawRole, "ADMIN");
    assert.strictEqual(admin1.initials, "SA");

    const list = await service.listStaff(adminActor);
    assert.strictEqual(list.length, 2);
  });

  // 3. Duplicate email rejection
  await runTest("duplicate email is safely rejected with conflict error", async () => {
    const memoryRepo = new StaffManagementMemoryRepository([], nowProvider);
    const service = createStaffManagementService(memoryRepo, nowProvider);

    const adminActor = { userId: "admin-root", role: "ADMIN" as const };

    await service.createStaff({
      email: "duplicate@deskatlas.com",
      displayName: "Original User",
      role: "STAFF",
      actorUserId: adminActor.userId,
      actorRole: adminActor.role,
    });

    let threw = false;
    try {
      await service.createStaff({
        email: "DUPLICATE@deskatlas.com", // case-insensitive check
        displayName: "Second User",
        role: "STAFF",
        actorUserId: adminActor.userId,
        actorRole: adminActor.role,
      });
    } catch (e: any) {
      threw = true;
      assert.strictEqual(e instanceof StaffManagementConflictError, true);
    }
    assert.strictEqual(threw, true, "Should have thrown StaffManagementConflictError");
  });

  // 4. Input validation errors
  await runTest("validates email, non-blank name, role, and password length", async () => {
    const memoryRepo = new StaffManagementMemoryRepository([], nowProvider);
    const service = createStaffManagementService(memoryRepo, nowProvider);

    // Invalid email
    await assert.rejects(
      async () => {
        await service.createStaff({
          email: "invalid-email",
          displayName: "Valid Name",
          role: "STAFF",
        });
      },
      StaffManagementError,
      "Expected error on invalid email"
    );

    // Blank display name
    await assert.rejects(
      async () => {
        await service.createStaff({
          email: "valid@deskatlas.com",
          displayName: "   ",
          role: "STAFF",
        });
      },
      StaffManagementError,
      "Expected error on blank display name"
    );

    // Short password
    await assert.rejects(
      async () => {
        await service.createStaff({
          email: "valid@deskatlas.com",
          displayName: "Valid Name",
          password: "123",
          role: "STAFF",
        });
      },
      StaffManagementError,
      "Expected error on short password"
    );
  });

  // 5. Role restrictions: Staff actor cannot manage staff
  await runTest("staff actors cannot manage or create staff accounts", async () => {
    const memoryRepo = new StaffManagementMemoryRepository([], nowProvider);
    const service = createStaffManagementService(memoryRepo, nowProvider);

    const staffActor = { userId: "staff-uuid", role: "STAFF" as const };

    await assert.rejects(
      async () => {
        await service.listStaff(staffActor);
      },
      StaffManagementAuthorizationError,
      "Staff actor must not be allowed to list staff"
    );

    await assert.rejects(
      async () => {
        await service.createStaff({
          email: "test@deskatlas.com",
          displayName: "Test",
          role: "STAFF",
          actorRole: staffActor.role,
          actorUserId: staffActor.userId,
        });
      },
      StaffManagementAuthorizationError,
      "Staff actor must not be allowed to create staff"
    );
  });

  // 6. Update staff member display name and role
  await runTest("admin can update staff display name and role", async () => {
    const memoryRepo = new StaffManagementMemoryRepository([], nowProvider);
    const service = createStaffManagementService(memoryRepo, nowProvider);

    const adminActor = { userId: "admin-root", role: "ADMIN" as const };

    const created = await service.createStaff({
      email: "alex@deskatlas.com",
      displayName: "Alex Original",
      role: "STAFF",
      actorUserId: adminActor.userId,
      actorRole: adminActor.role,
    });

    const updated = await service.updateStaff({
      staffUserId: created.id,
      displayName: "Alex Promoted",
      role: "ADMIN",
      actorUserId: adminActor.userId,
      actorRole: adminActor.role,
    });

    assert.strictEqual(updated.name, "Alex Promoted");
    assert.strictEqual(updated.role, "Admin");
    assert.strictEqual(updated.rawRole, "ADMIN");
    assert.strictEqual(updated.initials, "AP");
  });

  // 7. Deactivate and Reactivate staff account
  await runTest("admin can deactivate and reactivate staff account without deleting records", async () => {
    const memoryRepo = new StaffManagementMemoryRepository([], nowProvider);
    const service = createStaffManagementService(memoryRepo, nowProvider);

    const adminActor = { userId: "admin-root", role: "ADMIN" as const };

    const created = await service.createStaff({
      email: "deact@deskatlas.com",
      displayName: "Deact User",
      role: "STAFF",
      actorUserId: adminActor.userId,
      actorRole: adminActor.role,
    });

    // Deactivate
    const deactivated = await service.deactivateStaff(created.id, adminActor);
    assert.strictEqual(deactivated.isActive, false);
    assert.strictEqual(deactivated.status, "Inactive");
    assert.strictEqual(deactivated.mark, "!");

    // Verify still in database list
    const listAfterDeact = await service.listStaff(adminActor);
    const found = listAfterDeact.find((s) => s.id === created.id);
    assert.ok(found);
    assert.strictEqual(found.isActive, false);

    // Reactivate
    const reactivated = await service.activateStaff(created.id, adminActor);
    assert.strictEqual(reactivated.isActive, true);
    assert.strictEqual(reactivated.status, "Active");
    assert.strictEqual(reactivated.mark, "✓");
  });

  // 8. Audit trail logging
  await runTest("writes audit logs for create, update, and deactivation actions", async () => {
    const memoryRepo = new StaffManagementMemoryRepository([], nowProvider);
    const service = createStaffManagementService(memoryRepo, nowProvider);

    const adminActor = { userId: "admin-root", role: "ADMIN" as const };

    const created = await service.createStaff({
      email: "audit.test@deskatlas.com",
      displayName: "Audit Tester",
      role: "STAFF",
      actorUserId: adminActor.userId,
      actorRole: adminActor.role,
    });

    await service.updateStaff({
      staffUserId: created.id,
      displayName: "Audit Tester Renamed",
      actorUserId: adminActor.userId,
      actorRole: adminActor.role,
    });

    await service.deactivateStaff(created.id, adminActor);

    assert.strictEqual(memoryRepo.auditLogs.length, 3);
    assert.strictEqual(memoryRepo.auditLogs[0].action, "CREATE_STAFF_ACCOUNT");
    assert.strictEqual(memoryRepo.auditLogs[0].entityId, created.id);
    assert.strictEqual(memoryRepo.auditLogs[0].actorUserId, adminActor.userId);

    assert.strictEqual(memoryRepo.auditLogs[1].action, "UPDATE_STAFF_ACCOUNT");
    assert.strictEqual(memoryRepo.auditLogs[1].metadata.newDisplayName, "Audit Tester Renamed");

    assert.strictEqual(memoryRepo.auditLogs[2].action, "DEACTIVATE_STAFF_ACCOUNT");
    assert.strictEqual(memoryRepo.auditLogs[2].metadata.newIsActive, false);
  });

  console.log("\nAll MF-08 staff management tests passed!");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
