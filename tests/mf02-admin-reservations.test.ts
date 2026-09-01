import * as assert from "assert";
import {
  createAdminReservationService,
  createCounterPaymentService,
  createPaymentReviewService,
  createPaymentSessionService,
  createReservationService,
  createStaffOperationsService,
  InMemoryWorkspaceRepository,
  ReservationMemoryRepository,
  type CreateReservationRequest,
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

  // 1. Empty dataset test
  await runTest("empty database returns truthful empty state", async () => {
    const reservationRepo = new ReservationMemoryRepository();
    const adminService = createAdminReservationService(
      reservationRepo,
      () => new Date("2026-08-29T10:00:00.000Z")
    );

    const result = await adminService.listReservations("all");
    assert.strictEqual(result.total, 0);
    assert.strictEqual(result.reservations.length, 0);

    const detail = await adminService.getReservationDetail("non-existent-id");
    assert.strictEqual(detail, null);
  });

  // Setup populated environment
  let now = new Date("2026-08-29T10:00:00.000Z");
  const nowProvider = () => now;

  const reservationRepo = new ReservationMemoryRepository();
  const workspaceRepo = new InMemoryWorkspaceRepository();
  const paymentSessionService = createPaymentSessionService(reservationRepo, nowProvider);
  const reservationService = createReservationService(
    reservationRepo,
    workspaceRepo,
    reservationRepo,
    paymentSessionService
  );
  const paymentReviewService = createPaymentReviewService(reservationRepo, nowProvider);
  const counterPaymentService = createCounterPaymentService(reservationRepo, nowProvider);
  const staffOperationsService = createStaffOperationsService(reservationRepo, nowProvider);
  const adminReservationService = createAdminReservationService(reservationRepo, nowProvider);

  const adminActor = { userId: "admin-user-1", role: "ADMIN" as const };
  const staffActor = { userId: "staff-user-1", role: "STAFF" as const };

  const floor = await workspaceRepo.createFloor({ name: "Ground Floor" });
  const template = await workspaceRepo.createTemplate({
    name: "Dedicated Desk",
    capacity: 1,
    rateAmount: 150,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#0f172a",
    isActive: true,
  });

  const instance1 = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "DD-01",
    displayName: "Desk 1",
  });
  const instance2 = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "DD-02",
    displayName: "Desk 2",
  });
  const instance3 = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "DD-03",
    displayName: "Desk 3",
  });

  // 2. Web reservation creation -> PENDING_PAYMENT (Awaiting Proof)
  let webRes: any;
  await runTest("web reservation created with pending payment and multiple candidates", async () => {
    const request: CreateReservationRequest = {
      source: "WEB",
      customerFirstName: "Alice",
      customerLastName: "Walker",
      customerEmail: "alice@example.com",
      candidates: [
        { rank: 0, workspaceInstanceId: instance1.id, startAt: "2026-08-29T11:00:00.000Z", endAt: "2026-08-29T13:00:00.000Z" },
        { rank: 1, workspaceInstanceId: instance2.id, startAt: "2026-08-29T11:00:00.000Z", endAt: "2026-08-29T13:00:00.000Z" },
      ],
    };

    webRes = await reservationService.createReservation(request, {
      paymentLinkBaseUrl: "https://deskatlas.test/pay",
    });

    const listResult = await adminReservationService.listReservations("all");
    assert.strictEqual(listResult.total, 1);
    const item = listResult.reservations[0];
    assert.strictEqual(item.referenceCode, webRes.referenceCode);
    assert.strictEqual(item.customerName, "Alice Walker");
    assert.strictEqual(item.customerInitials, "AW");
    assert.strictEqual(item.reservationStatus, "PENDING_PAYMENT");
    assert.strictEqual(item.status, "Awaiting Proof");
    assert.strictEqual(item.paymentStatus, "Pending");
    assert.strictEqual(item.mark, "!");
    assert.strictEqual(item.confirmedAt, null);

    // Filter testing: Awaiting proof vs Checked In
    const awaitingList = await adminReservationService.listReservations("awaiting_proof");
    assert.strictEqual(awaitingList.total, 1);

    const checkedInList = await adminReservationService.listReservations("checked_in");
    assert.strictEqual(checkedInList.total, 0);

    // Detail check by referenceCode
    const detail = await adminReservationService.getReservationDetail(webRes.referenceCode);
    assert.ok(detail);
    assert.strictEqual(detail.referenceCode, webRes.referenceCode);
    assert.strictEqual(detail.candidates.length, 2);
    assert.strictEqual(detail.candidates[0].tier, "MAIN");
    assert.strictEqual(detail.candidates[0].isAssigned, false);
    assert.strictEqual(detail.candidates[1].tier, "ALTERNATIVE 1");
    assert.strictEqual(detail.candidates[1].isAssigned, false);
    assert.strictEqual(detail.assignedCandidate, null); // No allocation before payment approval
  });

  // 3. Kiosk reservation creation -> source = KIOSK, Counter Confirmation
  let kioskRes: any;
  await runTest("kiosk reservation created with source = KIOSK", async () => {
    const request: CreateReservationRequest = {
      source: "KIOSK",
      customerFirstName: "Bob",
      customerLastName: "Miller",
      customerEmail: "bob@example.com",
      paymentMethodId: "pm-cash",
      candidates: [
        { rank: 0, workspaceInstanceId: instance3.id, startAt: "2026-08-29T14:00:00.000Z", endAt: "2026-08-29T16:00:00.000Z" },
      ],
    };

    kioskRes = await reservationService.createReservation(request);

    const detail = await adminReservationService.getReservationDetail(kioskRes.id);
    assert.ok(detail);
    assert.strictEqual(detail.source, "KIOSK");
    assert.strictEqual(detail.reservationStatus, "PENDING_COUNTER_CONFIRMATION");
    assert.strictEqual(detail.status, "Counter Confirmation");
    assert.strictEqual(detail.paymentStatus.includes("Counter"), true);
    assert.ok(detail.timeline[0].includes("Kiosk"));
  });

  // 4. Payment Proof Submission -> PAYMENT_UNDER_REVIEW
  await runTest("web payment proof submission updates state to Payment Review", async () => {
    await paymentSessionService.submitPaymentProof({
      token: webRes.paymentSession!.token,
      paymentMethodId: "pm-gcash",
      proofStoragePath: `proofs/${webRes.referenceCode}.png`,
    });

    const detail = await adminReservationService.getReservationDetail(webRes.id);
    assert.ok(detail);
    assert.strictEqual(detail.reservationStatus, "PAYMENT_UNDER_REVIEW");
    assert.strictEqual(detail.status, "Payment Review");
    assert.strictEqual(detail.mark, "⧖");
    assert.ok(detail.timeline.some((t) => t.includes("Payment proof uploaded")));
  });

  // 5. Payment Approval & Atomic Allocation -> CONFIRMED
  await runTest("admin payment approval allocates candidate and updates status to Confirmed", async () => {
    const session = await paymentSessionService.getPaymentSession(webRes.paymentSession!.token);
    await paymentReviewService.reviewPayment({
      paymentAttemptId: session.paymentAttemptId,
      actor: adminActor,
      decision: "APPROVE",
    });

    const detail = await adminReservationService.getReservationDetail(webRes.referenceCode);
    assert.ok(detail);
    assert.strictEqual(detail.reservationStatus, "CONFIRMED");
    assert.strictEqual(detail.status, "Confirmed");
    assert.strictEqual(detail.mark, "✓");
    assert.ok(detail.assignedCandidate);
    assert.strictEqual(detail.assignedCandidate.isAssigned, true);
    assert.strictEqual(detail.assignedCandidate.rank, 0);
    assert.strictEqual(detail.candidates[0].isAssigned, true);
    assert.strictEqual(detail.candidates[1].isAssigned, false);
    assert.ok(detail.timeline.some((t) => t.includes("Payment approved & Allocated")));
  });

  // 6. Check-in & Check-out operations
  await runTest("staff check-in and check-out updates reservation lifecycle", async () => {
    now = new Date("2026-08-29T11:15:00.000Z");
    await staffOperationsService.checkInReservation({
      reservationId: webRes.id,
      actor: staffActor,
    });

    let detail = await adminReservationService.getReservationDetail(webRes.id);
    assert.ok(detail);
    assert.strictEqual(detail.reservationStatus, "CHECKED_IN");
    assert.strictEqual(detail.status, "Checked In");
    assert.ok(detail.checkedInAt);
    assert.ok(detail.timeline.some((t) => t.includes("Customer checked in")));

    await staffOperationsService.checkOutReservation({
      reservationId: webRes.id,
      actor: staffActor,
    });

    detail = await adminReservationService.getReservationDetail(webRes.id);
    assert.ok(detail);
    assert.strictEqual(detail.reservationStatus, "COMPLETED");
    assert.strictEqual(detail.status, "Completed");
    assert.ok(detail.checkedOutAt);
    assert.ok(detail.timeline.some((t) => t.includes("Customer checked out")));
  });

  // 7. Security audit test: ensure sensitive internal tokens are not exposed in detail DTO
  await runTest("security audit: no token_hash or proof_storage_path in detail DTO", async () => {
    const detail = await adminReservationService.getReservationDetail(webRes.id);
    const jsonString = JSON.stringify(detail);

    assert.ok(!jsonString.includes("tokenHash"));
    assert.ok(!jsonString.includes("bookingTokenHash"));
    assert.ok(!jsonString.includes("proofStoragePath"));
    assert.ok(!jsonString.includes("proofs/"));
  });

  // 8. Expired awaiting proof (1hr) vanishes from admin reservations
  await runTest("expired awaiting proof (1hr) vanishes from admin reservations", async () => {
    const freshRepo = new ReservationMemoryRepository();
    let clock = new Date("2026-08-29T10:00:00.000Z");
    const testNowProvider = () => clock;
    const testPaymentSessionService = createPaymentSessionService(freshRepo, testNowProvider);
    const testReservationService = createReservationService(
      freshRepo,
      workspaceRepo,
      freshRepo,
      testPaymentSessionService
    );
    const testAdminReservationService = createAdminReservationService(freshRepo, testNowProvider);

    const pendingRes = await testReservationService.createReservation({
      source: "WEB",
      customerFirstName: "Charlie",
      customerLastName: "Brown",
      customerEmail: "charlie@example.com",
      candidates: [
        { rank: 0, workspaceInstanceId: instance1.id, startAt: "2026-08-29T15:00:00.000Z", endAt: "2026-08-29T17:00:00.000Z" },
      ],
    }, { paymentLinkBaseUrl: "https://deskatlas.test/pay" });

    // While within 1 hour: visible in "all" and "awaiting_proof"
    let listAll = await testAdminReservationService.listReservations("all");
    let listAwaiting = await testAdminReservationService.listReservations("awaiting_proof");
    assert.strictEqual(listAll.total, 1);
    assert.strictEqual(listAwaiting.total, 1);

    // Advance clock by 30 mins: still visible
    clock = new Date("2026-08-29T10:30:00.000Z");
    listAll = await testAdminReservationService.listReservations("all");
    listAwaiting = await testAdminReservationService.listReservations("awaiting_proof");
    assert.strictEqual(listAll.total, 1);
    assert.strictEqual(listAwaiting.total, 1);

    // Advance clock by 61 mins (> 1hr expiry): vanishes from reservations
    clock = new Date("2026-08-29T11:01:00.000Z");
    listAll = await testAdminReservationService.listReservations("all");
    listAwaiting = await testAdminReservationService.listReservations("awaiting_proof");
    assert.strictEqual(listAll.total, 0);
    assert.strictEqual(listAwaiting.total, 0);
  });

  console.log("All MF-02 Admin Reservations tests passed!");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
