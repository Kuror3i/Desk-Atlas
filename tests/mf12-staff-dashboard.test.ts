import * as assert from "assert";
import {
  createCounterPaymentService,
  createPaymentReviewService,
  createPaymentSessionService,
  createReservationService,
  createStaffDashboardService,
  createStaffOperationsService,
  InMemoryWorkspaceRepository,
  ReservationMemoryRepository,
  StaffDashboardError,
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
    const dashboardService = createStaffDashboardService(
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
    assert.strictEqual(snapshot.activity.length, 0);
    assert.strictEqual(snapshot.workspaceOverview.totalWorkspaces, 0);
    assert.strictEqual(snapshot.workspaceOverview.occupancyBar.availablePct, 0);

    // Ensure Admin-only fields do not exist on staff snapshot metrics
    assert.strictEqual((snapshot.metrics as any).pendingPayments, undefined);
    assert.strictEqual((snapshot.metrics as any).rescheduled, undefined);
    assert.strictEqual((snapshot.metrics as any).cancelled, undefined);
  });

  // Setup populated repository
  let now = new Date("2026-08-29T10:00:00.000Z"); // In UTC: 10:00, In Asia/Manila (UTC+8): 18:00 on 2026-08-29
  const nowProvider = () => now;

  const reservationRepo = new ReservationMemoryRepository(nowProvider);
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
  const dashboardService = createStaffDashboardService(
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

  // Reservation 2: Today kiosk pending counter confirmation
  const res2Req: CreateReservationRequest = {
    source: "KIOSK",
    customerFirstName: "Alice",
    customerLastName: "Smith",
    customerEmail: "alice@example.com",
    paymentMethodId: "pm-cash",
    candidates: [
      {
        rank: 0,
        workspaceInstanceId: instance2.id,
        startAt: "2026-08-29T12:00:00.000Z",
        endAt: "2026-08-29T14:00:00.000Z",
      },
    ],
  };
  const res2 = await reservationService.createReservation(res2Req);

  // Reservation 3: Today confirmed via kiosk counter confirmation
  const res3Req: CreateReservationRequest = {
    source: "KIOSK",
    customerFirstName: "Bob",
    customerLastName: "Builder",
    customerEmail: "bob@example.com",
    paymentMethodId: "pm-cash",
    candidates: [
      {
        rank: 0,
        workspaceInstanceId: instance3.id,
        startAt: "2026-08-29T15:00:00.000Z",
        endAt: "2026-08-29T17:00:00.000Z",
      },
    ],
  };
  const res3 = await reservationService.createReservation(res3Req);
  await counterPaymentService.confirmPayment({
    paymentAttemptId: res3.counterPaymentAttemptId!,
    actor: staffActor,
  });

  // Reservation 4: 5 days ago (must be excluded from today)
  const res4 = await createWebReservation(
    "Charlie",
    "charlie@example.com",
    instance1.id,
    "2026-08-24T09:00:00.000Z",
    "2026-08-24T11:00:00.000Z"
  );
  const storedRes = reservationRepo.getReservations();
  const charlieStored = storedRes.find((r) => r.id === res4.id)!;
  charlieStored.createdAt = "2026-08-24T09:00:00.000Z";

  // 2. Today range test
  await runTest("today range metrics and occupancy", async () => {
    const snapshot = await dashboardService.getDashboardSnapshot("today");

    assert.strictEqual(snapshot.range, "today");
    assert.strictEqual(snapshot.rangeLabel, "Today");
    assert.strictEqual(snapshot.metrics.reservations.value, 3); // res1, res2, res3 created today (res4 excluded)
    assert.strictEqual(snapshot.metrics.checkedIn.value, 1); // res1 is checked in
    assert.strictEqual(snapshot.metrics.checkedIn.totalCapacity, 4);
    assert.strictEqual(snapshot.metrics.checkedIn.capacityPercentage, 25); // 1 of 4 = 25%

    // Workspace overview breakdown
    assert.strictEqual(snapshot.workspaceOverview.totalWorkspaces, 4);
    assert.strictEqual(snapshot.workspaceOverview.breakdown.find((b) => b.label === "In Use")?.value, "1");
    assert.strictEqual(snapshot.workspaceOverview.breakdown.find((b) => b.label === "Maintenance")?.value, "1");

    // Recent activity stream
    assert.ok(snapshot.activity.length > 0);
    const checkInActivity = snapshot.activity.find((a) => a.status === "Checked In");
    assert.ok(checkInActivity);
    assert.strictEqual(checkInActivity.name, "John Customer");
    assert.strictEqual(checkInActivity.initials, "JC");

    // Confirmed activity from counter confirmation
    const confirmedActivity = snapshot.activity.find((a) => a.status === "Confirmed");
    assert.ok(confirmedActivity);
  });

  // 3. Reject non-today ranges
  await runTest("non-today range rejection", async () => {
    let errorCaught = false;
    try {
      await dashboardService.getDashboardSnapshot("7d" as any);
    } catch (err) {
      if (err instanceof StaffDashboardError) {
        errorCaught = true;
      }
    }
    assert.ok(errorCaught, "Staff dashboard must reject 7d range");

    errorCaught = false;
    try {
      await dashboardService.getDashboardSnapshot("30d" as any);
    } catch (err) {
      if (err instanceof StaffDashboardError) {
        errorCaught = true;
      }
    }
    assert.ok(errorCaught, "Staff dashboard must reject 30d range");
  });

  // 4. Security audit test
  await runTest("security audit: no token hashes or proof storage paths", async () => {
    const snapshot = await dashboardService.getDashboardSnapshot("today");
    const jsonString = JSON.stringify(snapshot);

    assert.ok(!jsonString.includes("token_hash"));
    assert.ok(!jsonString.includes("booking_token_hash"));
    assert.ok(!jsonString.includes("proof_storage_path"));
    assert.ok(!jsonString.includes("proofs/"));
    assert.ok(!jsonString.includes("paymentLinkBaseUrl"));
  });

  console.log("All MF-12 Staff Dashboard tests passed!");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
