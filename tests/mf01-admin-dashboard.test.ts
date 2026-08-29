import * as assert from "assert";
import {
  createAdminDashboardService,
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
  await runTest("empty dataset", async () => {
    const reservationRepo = new ReservationMemoryRepository();
    const workspaceRepo = new InMemoryWorkspaceRepository();
    const dashboardService = createAdminDashboardService(
      reservationRepo,
      reservationRepo,
      workspaceRepo,
      () => new Date("2026-08-29T10:00:00.000Z")
    );

    const snapshot = await dashboardService.getDashboardSnapshot("today");

    assert.strictEqual(snapshot.range, "today");
    assert.strictEqual(snapshot.rangeLabel, "Today");
    assert.strictEqual(snapshot.metrics.reservations.value, 0);
    assert.strictEqual(snapshot.metrics.reservations.formattedValue, "0");
    assert.strictEqual(snapshot.metrics.checkedIn.value, 0);
    assert.strictEqual(snapshot.metrics.checkedIn.totalCapacity, 0);
    assert.strictEqual(snapshot.metrics.checkedIn.capacityPercentage, 0);
    assert.strictEqual(snapshot.metrics.pendingPayments.value, 0);
    assert.strictEqual(snapshot.metrics.rescheduled.value, 0);
    assert.strictEqual(snapshot.metrics.cancelled.value, 0);
    assert.strictEqual(snapshot.activity.length, 0);
    assert.strictEqual(snapshot.workspaceOverview.totalWorkspaces, 0);
    assert.strictEqual(snapshot.workspaceOverview.occupancyBar.availablePct, 0);
  });

  // Setup populated repository
  let now = new Date("2026-08-29T10:00:00.000Z"); // In UTC: 10:00, In Asia/Manila (UTC+8): 18:00 on 2026-08-29
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
  const dashboardService = createAdminDashboardService(
    reservationRepo,
    reservationRepo,
    workspaceRepo,
    nowProvider
  );

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
  const instance4 = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "DD-04",
    displayName: "Desk 4",
    operationalStatus: "MAINTENANCE",
  });

  async function createWebReservation(
    customerFirstName: string,
    customerEmail: string,
    workspaceInstanceId: string,
    startAt: string,
    endAt: string
  ) {
    const request: CreateReservationRequest = {
      source: "WEB",
      customerFirstName,
      customerLastName: "Customer",
      customerEmail,
      candidates: [{ rank: 0, workspaceInstanceId, startAt, endAt }],
    };

    return reservationService.createReservation(request, {
      paymentLinkBaseUrl: "https://deskatlas.test/pay",
    });
  }

  async function approveWebReservation(
    reservation: Awaited<ReturnType<typeof createWebReservation>>
  ) {
    await paymentSessionService.submitPaymentProof({
      token: reservation.paymentSession!.token,
      paymentMethodId: "pm-gcash",
      proofStoragePath: `proofs/${reservation.referenceCode}.png`,
    });

    const session = await paymentSessionService.getPaymentSession(reservation.paymentSession!.token);
    return paymentReviewService.reviewPayment({
      paymentAttemptId: session.paymentAttemptId,
      actor: adminActor,
      decision: "APPROVE",
    });
  }

  // Reservation 1: Today confirmed & checked in
  const res1 = await createWebReservation(
    "John",
    "john@example.com",
    instance1.id,
    "2026-08-29T09:00:00.000Z",
    "2026-08-29T11:00:00.000Z"
  );
  await approveWebReservation(res1);
  await staffOperationsService.checkInReservation({
    reservationId: res1.id,
    actor: staffActor,
  });

  // Reservation 2: Today pending payment
  const res2 = await createWebReservation(
    "Alice",
    "alice@example.com",
    instance2.id,
    "2026-08-29T12:00:00.000Z",
    "2026-08-29T14:00:00.000Z"
  );

  // Reservation 3: Today cancelled
  const res3 = await createWebReservation(
    "Bob",
    "bob@example.com",
    instance3.id,
    "2026-08-29T15:00:00.000Z",
    "2026-08-29T17:00:00.000Z"
  );
  const storedRes = reservationRepo.getReservations();
  const bobStored = storedRes.find((r) => r.id === res3.id)!;
  bobStored.status = "CANCELLED";

  // Reservation 4: 5 days ago (in 7d and 30d range)
  const res4 = await createWebReservation(
    "Charlie",
    "charlie@example.com",
    instance1.id,
    "2026-08-24T09:00:00.000Z",
    "2026-08-24T11:00:00.000Z"
  );
  const charlieStored = storedRes.find((r) => r.id === res4.id)!;
  charlieStored.createdAt = "2026-08-24T09:00:00.000Z";

  // Reservation 5: 20 days ago (in 30d range)
  const res5 = await createWebReservation(
    "David",
    "david@example.com",
    instance2.id,
    "2026-08-09T09:00:00.000Z",
    "2026-08-09T11:00:00.000Z"
  );
  const davidStored = storedRes.find((r) => r.id === res5.id)!;
  davidStored.createdAt = "2026-08-09T09:00:00.000Z";

  // 2. Today range test
  await runTest("today range metrics and occupancy", async () => {
    const snapshot = await dashboardService.getDashboardSnapshot("today");

    assert.strictEqual(snapshot.range, "today");
    assert.strictEqual(snapshot.rangeLabel, "Today");
    assert.strictEqual(snapshot.metrics.reservations.value, 3); // res1, res2, res3 created today
    assert.strictEqual(snapshot.metrics.checkedIn.value, 1); // res1 is checked in
    assert.strictEqual(snapshot.metrics.checkedIn.totalCapacity, 4);
    assert.strictEqual(snapshot.metrics.checkedIn.capacityPercentage, 25); // 1 of 4 = 25%
    assert.strictEqual(snapshot.metrics.pendingPayments.value, 1); // res2
    assert.strictEqual(snapshot.metrics.cancelled.value, 1); // res3

    assert.strictEqual(snapshot.workspaceOverview.totalWorkspaces, 4);
    assert.strictEqual(snapshot.workspaceOverview.breakdown.find((b) => b.label === "In Use")?.value, "1");
    assert.strictEqual(snapshot.workspaceOverview.breakdown.find((b) => b.label === "Maintenance")?.value, "1");
    assert.strictEqual(snapshot.workspaceOverview.breakdown.find((b) => b.label === "Available")?.value, "2");

    assert.ok(snapshot.activity.length > 0);
    const checkInActivity = snapshot.activity.find((a) => a.status === "Checked In");
    assert.ok(checkInActivity);
    assert.strictEqual(checkInActivity.name, "John Customer");
    assert.strictEqual(checkInActivity.initials, "JC");
  });

  // 3. 7 days range test
  await runTest("7 days range metrics", async () => {
    const snapshot = await dashboardService.getDashboardSnapshot("7d");

    assert.strictEqual(snapshot.range, "7d");
    assert.strictEqual(snapshot.rangeLabel, "Last 7 Days");
    assert.strictEqual(snapshot.metrics.reservations.value, 4); // res1, res2, res3 + res4 (5 days ago)
    assert.strictEqual(snapshot.metrics.checkedIn.value, 1);
  });

  // 4. 30 days range test
  await runTest("30 days range metrics", async () => {
    const snapshot = await dashboardService.getDashboardSnapshot("30d");

    assert.strictEqual(snapshot.range, "30d");
    assert.strictEqual(snapshot.rangeLabel, "Last 30 Days");
    assert.strictEqual(snapshot.metrics.reservations.value, 5); // res1, res2, res3, res4, res5
    assert.strictEqual(snapshot.metrics.checkedIn.value, 1);
  });

  // 5. Security audit test
  await runTest("security audit: no token hashes or proof storage paths", async () => {
    const snapshot = await dashboardService.getDashboardSnapshot("today");
    const jsonString = JSON.stringify(snapshot);

    assert.ok(!jsonString.includes("token_hash"));
    assert.ok(!jsonString.includes("booking_token_hash"));
    assert.ok(!jsonString.includes("proof_storage_path"));
    assert.ok(!jsonString.includes("proofs/"));
  });

  console.log("All MF-01 Admin Dashboard tests passed!");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
