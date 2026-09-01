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

  await runTest("empty dataset", async () => {
    const reportsService = createReportsService(
      new ReservationMemoryRepository(),
      () => new Date("2026-08-27T12:00:00.000Z")
    );

    const snapshot = await reportsService.getAdminReportsSnapshot();
    assert.strictEqual(snapshot.summaryMetrics[0]?.rawValue, 0);
    assert.strictEqual(snapshot.summaryMetrics[1]?.rawValue, 0);
    assert.strictEqual(snapshot.topUsers.length, 0);
    assert.strictEqual(snapshot.recentReports.length, 6);
  });

  let now = new Date("2026-08-27T12:00:00.000Z");
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

  const floor = await workspaceRepo.createFloor({ name: "Ground Floor" });
  const template = await workspaceRepo.createTemplate({
    name: "Skypod",
    capacity: 1,
    rateAmount: 200,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#0f172a",
    isActive: true,
  });
  const instanceA = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "SP-01",
    displayName: "Skypod 1",
  });
  const instanceB = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "SP-02",
    displayName: "Skypod 2",
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
      customerLastName: "Tester",
      customerEmail,
      candidates: [{ rank: 0, workspaceInstanceId, startAt, endAt }],
    };

    return reservationService.createReservation(request, {
      paymentLinkBaseUrl: "https://deskatlas.test/pay",
    });
  }

  async function createKioskReservation(
    customerFirstName: string,
    customerEmail: string,
    workspaceInstanceId: string,
    startAt: string,
    endAt: string
  ) {
    const request: CreateReservationRequest = {
      source: "KIOSK",
      customerFirstName,
      customerLastName: "Tester",
      customerEmail,
      paymentMethodId: "pm-cash",
      candidates: [{ rank: 0, workspaceInstanceId, startAt, endAt }],
    };

    return reservationService.createReservation(request);
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

  const confirmed = await createWebReservation(
    "Alex",
    "alex@example.com",
    instanceA.id,
    "2026-08-27T09:00:00.000Z",
    "2026-08-27T11:00:00.000Z"
  );
  await approveWebReservation(confirmed);

  const julyPending = await createWebReservation(
    "Jamie",
    "jamie@example.com",
    instanceB.id,
    "2026-08-15T09:00:00.000Z",
    "2026-08-15T11:00:00.000Z"
  );

  const kioskConfirmed = await createKioskReservation(
    "Blair",
    "blair@example.com",
    instanceB.id,
    "2026-08-27T12:00:00.000Z",
    "2026-08-27T14:00:00.000Z"
  );
  await counterPaymentService.confirmPayment({
    paymentAttemptId: kioskConfirmed.counterPaymentAttemptId!,
    actor: staffActor,
  });

  const manualResolution = await createWebReservation(
    "Casey",
    "casey@example.com",
    instanceA.id,
    "2026-08-27T09:00:00.000Z",
    "2026-08-27T11:00:00.000Z"
  );
  await approveWebReservation(manualResolution);

  const cancelled = await createWebReservation(
    "Dana",
    "dana@example.com",
    instanceB.id,
    "2026-08-28T09:00:00.000Z",
    "2026-08-28T11:00:00.000Z"
  );

  const completed = await createWebReservation(
    "Alex",
    "alex@example.com",
    instanceB.id,
    "2026-08-27T15:00:00.000Z",
    "2026-08-27T17:00:00.000Z"
  );
  await approveWebReservation(completed);
  now = new Date("2026-08-27T15:15:00.000Z");
  await staffOperationsService.checkInReservation({
    reservationId: completed.id,
    actor: staffActor,
  });
  now = new Date("2026-08-27T16:30:00.000Z");
  await staffOperationsService.checkOutReservation({
    reservationId: completed.id,
    actor: staffActor,
  });
  now = new Date("2026-08-27T12:00:00.000Z");

  const storedReservations = reservationRepo.getReservations();
  const julyStored = storedReservations.find((entry) => entry.id === julyPending.id)!;
  julyStored.createdAt = "2026-07-15T10:00:00.000Z";
  julyStored.updatedAt = "2026-07-15T10:00:00.000Z";

  const cancelledStored = storedReservations.find((entry) => entry.id === cancelled.id)!;
  cancelledStored.status = "CANCELLED";
  cancelledStored.updatedAt = "2026-08-27T12:30:00.000Z";

  const paymentAttempts = Array.from(((reservationRepo as any).paymentAttempts as Map<string, any>).values());
  const julyAttempt = paymentAttempts.find((attempt) => attempt.reservationId === julyPending.id)!;
  julyAttempt.createdAt = "2026-07-15T10:00:00.000Z";
  const cancelledAttempt = paymentAttempts.find((attempt) => attempt.reservationId === cancelled.id)!;
  cancelledAttempt.refundStatus = "REFUNDED";

  await runTest("normal dataset", async () => {
    const snapshot = await reportsService.getAdminReportsSnapshot();

    assert.strictEqual(snapshot.summaryMetrics[0]?.rawValue, 5);
    assert.strictEqual(snapshot.summaryMetrics[1]?.rawValue, 1600);
    assert.strictEqual(snapshot.reportCategories.find((item) => item.id === "reservations")?.count, 6);
    assert.strictEqual(snapshot.reportCategories.find((item) => item.id === "payment")?.count, 6);
    assert.strictEqual(snapshot.reportCategories.find((item) => item.id === "cancellation")?.count, 2);
    assert.strictEqual(snapshot.topUsers[0]?.name, "Alex Tester");
    assert.strictEqual(snapshot.topUsers[0]?.bookings, 2);
  });

  await runTest("filter/date behavior already represented by UI", async () => {
    const snapshot = await reportsService.getAdminReportsSnapshot();
    assert.ok(snapshot.recentReports.every((report) => report.name.includes("August 2026")));
    assert.ok(snapshot.recentReports.every((report) => report.status === "ready"));
    assert.strictEqual(snapshot.summaryMetrics[0]?.label, "Total Reservations This Month");
  });

  await runTest("export correctness", async () => {
    const paymentsExport = await reportsService.exportAdminReport("payment");
    assert.ok(paymentsExport.content.includes("payment_status"));
    assert.ok(!paymentsExport.content.includes("token_hash"));
    assert.ok(!paymentsExport.content.includes("proof_storage_path"));
    assert.ok(!paymentsExport.content.includes("booking_token_hash"));

    const reservationsExport = await reportsService.exportAdminReport("reservations");
    const reservationLines = reservationsExport.content.trim().split("\n");
    assert.strictEqual(reservationLines.length, 7);
    assert.ok(reservationsExport.content.includes("customer_email"));
  });

  await runTest("authorization contract for final M17", async () => {
    const summaryExport = await reportsService.exportAdminReport("operations-summary");
    assert.ok(summaryExport.content.includes("metric,value"));
    assert.ok(!summaryExport.content.includes("proofs/"));
    assert.ok(!summaryExport.content.includes("pm-gcash"));
  });

  await runTest("large-enough dataset performance sanity", async () => {
    const largeRepo = new ReservationMemoryRepository();
    const largeWorkspaceRepo = new InMemoryWorkspaceRepository();
    const largeReservationService = createReservationService(
      largeRepo,
      largeWorkspaceRepo,
      largeRepo,
      createPaymentSessionService(largeRepo, nowProvider)
    );
    const largeReportsService = createReportsService(largeRepo, nowProvider);

    const largeFloor = await largeWorkspaceRepo.createFloor({ name: "Second Floor" });
    const largeTemplate = await largeWorkspaceRepo.createTemplate({
      name: "Desk",
      capacity: 1,
      rateAmount: 150,
      pricingUnit: "HOURLY",
      defaultShape: "rectangle",
      defaultColor: "#1f2937",
      isActive: true,
    });
    const largeInstance = await largeWorkspaceRepo.createInstance({
      templateId: largeTemplate.id,
      floorId: largeFloor.id,
      instanceCode: "D-01",
      displayName: "Desk 1",
    });

    for (let index = 0; index < 150; index += 1) {
      await largeReservationService.createReservation(
        {
          source: "WEB",
          customerFirstName: `Customer${index}`,
          customerLastName: "Load",
          customerEmail: `load-${index}@example.com`,
          candidates: [
            {
              rank: 0,
              workspaceInstanceId: largeInstance.id,
              startAt: `2026-08-${String((index % 28) + 1).padStart(2, "0")}T08:00:00.000Z`,
              endAt: `2026-08-${String((index % 28) + 1).padStart(2, "0")}T10:00:00.000Z`,
            },
          ],
        },
        {
          paymentLinkBaseUrl: "https://deskatlas.test/pay",
        }
      );
    }

    const snapshot = await largeReportsService.getAdminReportsSnapshot();
    assert.strictEqual(snapshot.summaryMetrics[0]?.rawValue, 150);
    assert.strictEqual(snapshot.reportCategories.find((item) => item.id === "reservations")?.count, 150);
  });

  console.log("All M14 tests passed!");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
