import * as assert from "assert";
import {
  createCounterPaymentService,
  createPaymentReviewService,
  createPaymentSessionService,
  createReportsService,
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
  await runTest("empty dataset returns zero metrics and safe defaults", async () => {
    const reservationRepo = new ReservationMemoryRepository();
    const reportsService = createReportsService(
      reservationRepo,
      () => new Date("2026-08-29T12:00:00.000Z")
    );

    const snapshot = await reportsService.getAdminReportsSnapshot("30days");
    assert.strictEqual(snapshot.range, "30days");
    assert.strictEqual(snapshot.rangeLabel, "Last 30 Days");
    assert.strictEqual(snapshot.summaryMetrics[0]?.rawValue, 0);
    assert.strictEqual(snapshot.summaryMetrics[1]?.rawValue, 0);
    assert.strictEqual(snapshot.summaryMetrics[2]?.rawValue, 0);
    assert.strictEqual(snapshot.summaryMetrics[3]?.rawValue, 0);
    assert.strictEqual(snapshot.revenueOverview.totalAmount, 0);
    assert.strictEqual(snapshot.revenueOverview.bars.length, 7);
    assert.strictEqual(snapshot.topWorkspaces.length, 0);
    assert.strictEqual(snapshot.topUsers.length, 0);
    assert.strictEqual(snapshot.reportCategories.length, 6);
    assert.strictEqual(snapshot.recentReports.length, 6);

    const exportData = await reportsService.exportAdminReport("operations-summary");
    assert.ok(exportData.content.includes("total_reservations,0"));
  });

  // Setup populated repository
  let now = new Date("2026-08-29T12:00:00.000Z");
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
  const reportsService = createReportsService(reservationRepo, nowProvider);

  const adminActor = { userId: "admin-user-1", role: "ADMIN" as const };
  const staffActor = { userId: "staff-user-1", role: "STAFF" as const };

  const floor1 = await workspaceRepo.createFloor({ name: "1st Floor" });
  const floor2 = await workspaceRepo.createFloor({ name: "2nd Floor" });

  const skypodTemplate = await workspaceRepo.createTemplate({
    name: "Skypod",
    capacity: 1,
    rateAmount: 250,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#0f172a",
    isActive: true,
  });
  const deskTemplate = await workspaceRepo.createTemplate({
    name: "Dedicated Desk",
    capacity: 1,
    rateAmount: 150,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#1e293b",
    isActive: true,
  });

  const skypod1 = await workspaceRepo.createInstance({
    templateId: skypodTemplate.id,
    floorId: floor1.id,
    instanceCode: "SP-01",
    displayName: "Skypod 01",
  });
  const skypod2 = await workspaceRepo.createInstance({
    templateId: skypodTemplate.id,
    floorId: floor1.id,
    instanceCode: "SP-02",
    displayName: "Skypod 02",
  });
  const desk1 = await workspaceRepo.createInstance({
    templateId: deskTemplate.id,
    floorId: floor2.id,
    instanceCode: "DD-01",
    displayName: "Dedicated Desk 01",
  });

  async function createWebReservation(
    customerFirstName: string,
    customerLastName: string,
    customerEmail: string,
    workspaceInstanceId: string,
    startAt: string,
    endAt: string
  ) {
    const request: CreateReservationRequest = {
      source: "WEB",
      customerFirstName,
      customerLastName,
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

  // 1. Alex - 2 confirmed bookings (Skypod 1 & Skypod 2)
  const resAlex1 = await createWebReservation(
    "Alex",
    "Rivera",
    "alex@example.com",
    skypod1.id,
    "2026-08-29T09:00:00.000Z",
    "2026-08-29T11:00:00.000Z"
  );
  await approveWebReservation(resAlex1);

  const resAlex2 = await createWebReservation(
    "Alex",
    "Rivera",
    "alex@example.com",
    skypod2.id,
    "2026-08-29T13:00:00.000Z",
    "2026-08-29T16:00:00.000Z"
  );
  await approveWebReservation(resAlex2);

  // 2. Blair - Kiosk confirmed (Desk 1)
  const resBlair = await reservationService.createReservation({
    source: "KIOSK",
    customerFirstName: "Blair",
    customerLastName: "Santos",
    customerEmail: "blair@example.com",
    paymentMethodId: "pm-cash",
    candidates: [{ rank: 0, workspaceInstanceId: desk1.id, startAt: "2026-08-29T10:00:00.000Z", endAt: "2026-08-29T12:00:00.000Z" }],
  });
  await counterPaymentService.confirmPayment({
    paymentAttemptId: resBlair.counterPaymentAttemptId!,
    actor: staffActor,
  });

  // 3. Casey - Needs manual resolution
  const resCasey = await createWebReservation(
    "Casey",
    "Lim",
    "casey@example.com",
    skypod1.id,
    "2026-08-29T09:00:00.000Z",
    "2026-08-29T11:00:00.000Z"
  );
  await approveWebReservation(resCasey);

  // 4. Dana - Cancelled
  const resDana = await createWebReservation(
    "Dana",
    "Cruz",
    "dana@example.com",
    desk1.id,
    "2026-08-29T14:00:00.000Z",
    "2026-08-29T16:00:00.000Z"
  );
  const storedReservations = reservationRepo.getReservations();
  const danaStored = storedReservations.find((r) => r.id === resDana.id)!;
  danaStored.status = "CANCELLED";

  // 5. Eric - Checked in & checked out
  const resEric = await createWebReservation(
    "Eric",
    "Torres",
    "eric@example.com",
    skypod1.id,
    "2026-08-29T07:00:00.000Z",
    "2026-08-29T09:00:00.000Z"
  );
  await approveWebReservation(resEric);
  now = new Date("2026-08-29T07:15:00.000Z");
  await staffOperationsService.checkInReservation({ reservationId: resEric.id, actor: staffActor });
  now = new Date("2026-08-29T08:45:00.000Z");
  await staffOperationsService.checkOutReservation({ reservationId: resEric.id, actor: staffActor });
  now = new Date("2026-08-29T12:00:00.000Z");

  // 2. Normal dataset snapshot test
  await runTest("normal dataset snapshot returns accurate metrics and categories", async () => {
    const snapshot = await reportsService.getAdminReportsSnapshot("today");

    assert.strictEqual(snapshot.range, "today");
    assert.strictEqual(snapshot.summaryMetrics[0]?.rawValue, 6); // 6 reservations today
    assert.strictEqual(snapshot.summaryMetrics[1]?.rawValue > 0, true); // payments
    assert.strictEqual(snapshot.summaryMetrics[3]?.rawValue, 2); // 1 cancelled + 1 manual resolution

    assert.strictEqual(snapshot.topUsers[0]?.name, "Alex Rivera");
    assert.strictEqual(snapshot.topUsers[0]?.bookings, 2);

    assert.strictEqual(snapshot.topWorkspaces.length > 0, true);
    assert.ok(
      snapshot.topWorkspaces[0]?.name === skypod1.id ||
      snapshot.topWorkspaces[0]?.name === "Skypod 01"
    );

    assert.strictEqual(snapshot.reportCategories.length, 6);
    assert.strictEqual(snapshot.reportCategories.find((c) => c.id === "reservations")?.count, 6);
  });

  // 3. Date range filters test
  await runTest("date range filtering across 7days, 30days, month, year, today", async () => {
    for (const range of ["today", "7days", "30days", "month", "year"] as const) {
      const snapshot = await reportsService.getAdminReportsSnapshot(range);
      assert.strictEqual(snapshot.range, range);
      assert.ok(snapshot.rangeLabel.length > 0);
      assert.strictEqual(snapshot.summaryMetrics.length, 4);
      assert.strictEqual(snapshot.revenueOverview.bars.length, 7);
      assert.ok(typeof snapshot.summaryMetrics[0]?.trend === "string");
    }
  });

  // 4. Revenue Overview bar chart test
  await runTest("revenue overview daily distribution bars", async () => {
    const snapshot = await reportsService.getAdminReportsSnapshot("7days");
    assert.strictEqual(snapshot.revenueOverview.bars.length, 7);
    const todayBar = snapshot.revenueOverview.bars[6];
    assert.ok(todayBar.amount > 0);
    assert.ok(todayBar.heightPercentage > 0);
    assert.strictEqual(snapshot.revenueOverview.totalAmount > 0, true);
  });

  // 5. CSV Exports correctness and security
  await runTest("csv exports contain authorized operational fields and strictly omit sensitive tokens", async () => {
    const exportTypes = [
      "operations-summary",
      "workspace",
      "reservations",
      "payment",
      "booking-activity",
      "cancellation",
      "checkin",
    ] as const;

    for (const type of exportTypes) {
      const result = await reportsService.exportAdminReport(type);
      assert.ok(result.filename.endsWith(".csv"));
      assert.strictEqual(result.contentType, "text/csv; charset=utf-8");
      assert.ok(result.content.length > 0);

      // Security check: Never leak sensitive hashes or proof storage paths
      assert.ok(!result.content.includes("token_hash"));
      assert.ok(!result.content.includes("booking_token_hash"));
      assert.ok(!result.content.includes("proof_storage_path"));
      assert.ok(!result.content.includes("proofs/"));
      assert.ok(!result.content.includes("SUPABASE_SERVICE_ROLE_KEY"));
    }
  });

  // 6. Range-filtered CSV export
  await runTest("csv export supports date range filtering", async () => {
    const result = await reportsService.exportAdminReport("reservations", "today");
    assert.ok(result.filename.includes("-today-"));
    const lines = result.content.trim().split("\n");
    assert.strictEqual(lines.length, 7); // header + 6 reservation rows
  });

  console.log("All MF-09 tests passed!");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
