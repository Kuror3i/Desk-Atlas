import * as assert from "assert";
import {
  createAdminReservationService,
  createCounterPaymentService,
  createPaymentReviewService,
  createPaymentSessionService,
  createReservationService,
  createStaffOperationsService,
  createBookingAccessService,
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

  const now = new Date("2026-08-29T10:00:00.000Z");
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
  const adminReservationService = createAdminReservationService(reservationRepo, nowProvider);
  const bookingAccessService = createBookingAccessService(reservationRepo, nowProvider);

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

  // Helper to compute Admin detail action visibility
  function getVisibleAdminActions(detail: { reservationStatus: string; hasBookingQr: boolean }) {
    const isConfirmed = detail.reservationStatus === "CONFIRMED" || detail.reservationStatus === "CHECKED_IN";
    const actions: string[] = [];
    if (isConfirmed) {
      actions.push("Reschedule");
      actions.push("Cancel Booking");
      if (detail.hasBookingQr) {
        actions.push("View QR Code");
      }
    }
    return actions;
  }

  // 1. Web reservation created -> PENDING_PAYMENT
  let webRes: any;
  await runTest("Admin detail hides Reschedule, Cancel, and View QR for pending payment reservation", async () => {
    const request: CreateReservationRequest = {
      source: "WEB",
      customerFirstName: "Alice",
      customerLastName: "Walker",
      customerEmail: "alice@example.com",
      candidates: [
        { rank: 0, workspaceInstanceId: instance1.id, startAt: "2026-08-29T11:00:00.000Z", endAt: "2026-08-29T13:00:00.000Z" },
      ],
    };

    webRes = await reservationService.createReservation(request, {
      paymentLinkBaseUrl: "https://deskatlas.test/pay",
    });

    const detail = await adminReservationService.getReservationDetail(webRes.id);
    assert.ok(detail);
    assert.strictEqual(detail.reservationStatus, "PENDING_PAYMENT");
    assert.strictEqual(detail.hasBookingQr, false);

    const visibleActions = getVisibleAdminActions(detail);
    assert.strictEqual(visibleActions.length, 0, "No actions visible while pending payment");
  });

  // 2. Staff operations isolation: pending payment reservation is completely invisible to Staff
  await runTest("Staff list and detail routes do not expose PENDING_PAYMENT reservation", async () => {
    const list = await staffOperationsService.listOperationalReservations();
    assert.strictEqual(list.length, 0);

    const detailById = await staffOperationsService.getOperationalReservation(webRes.id);
    assert.strictEqual(detailById, null);

    const detailByRef = await staffOperationsService.getOperationalReservation(webRes.referenceCode);
    assert.strictEqual(detailByRef, null);
  });

  // 3. Payment proof uploaded -> PAYMENT_UNDER_REVIEW
  await runTest("Admin detail hides actions and Staff endpoints hide PAYMENT_UNDER_REVIEW reservation", async () => {
    await paymentSessionService.submitPaymentProof({
      token: webRes.paymentSession!.token,
      paymentMethodId: "pm-gcash",
      proofStoragePath: `proofs/${webRes.referenceCode}.png`,
    });

    const adminDetail = await adminReservationService.getReservationDetail(webRes.id);
    assert.ok(adminDetail);
    assert.strictEqual(adminDetail.reservationStatus, "PAYMENT_UNDER_REVIEW");
    assert.strictEqual(adminDetail.hasBookingQr, false);

    const visibleActions = getVisibleAdminActions(adminDetail);
    assert.strictEqual(visibleActions.length, 0, "No actions visible while payment under review");

    // Must still not be visible in Staff operations
    const staffList = await staffOperationsService.listOperationalReservations();
    assert.strictEqual(staffList.length, 0);

    const staffDetail = await staffOperationsService.getOperationalReservation(webRes.id);
    assert.strictEqual(staffDetail, null);

    // But visible in Admin Payment Review Queue!
    const reviewQueue = await paymentReviewService.listPaymentReviewQueue();
    assert.strictEqual(reviewQueue.length, 1);
    assert.strictEqual(reviewQueue[0].reservationId, webRes.id);
  });

  // 4. Admin approves payment & allocates -> CONFIRMED (without QR yet)
  await runTest("Admin confirmed reservation shows Reschedule and Cancel Booking, but hides QR until issued", async () => {
    const session = await paymentSessionService.getPaymentSession(webRes.paymentSession!.token);
    await paymentReviewService.reviewPayment({
      paymentAttemptId: session.paymentAttemptId,
      actor: adminActor,
      decision: "APPROVE",
    });

    let adminDetail = await adminReservationService.getReservationDetail(webRes.id);
    assert.ok(adminDetail);
    assert.strictEqual(adminDetail.reservationStatus, "CONFIRMED");
    assert.strictEqual(adminDetail.hasBookingQr, false);

    let visibleActions = getVisibleAdminActions(adminDetail);
    assert.deepStrictEqual(visibleActions, ["Reschedule", "Cancel Booking"]);

    // Now issue booking access token
    await bookingAccessService.issueBookingAccess(
      webRes.id,
      webRes.referenceCode,
      "https://deskatlas.test/access"
    );

    adminDetail = await adminReservationService.getReservationDetail(webRes.id);
    assert.ok(adminDetail);
    assert.strictEqual(adminDetail.hasBookingQr, true);

    visibleActions = getVisibleAdminActions(adminDetail);
    assert.deepStrictEqual(visibleActions, ["Reschedule", "Cancel Booking", "View QR Code"]);
  });

  // 5. Staff operational reservation visibility for CONFIRMED reservation
  await runTest("Staff list and detail routes now expose CONFIRMED reservation", async () => {
    const list = await staffOperationsService.listOperationalReservations();
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].reservationId, webRes.id);
    assert.strictEqual(list[0].reservationStatus, "CONFIRMED");

    const detail = await staffOperationsService.getOperationalReservation(webRes.id);
    assert.ok(detail);
    assert.strictEqual(detail.reservationId, webRes.id);
    assert.strictEqual(detail.reservationStatus, "CONFIRMED");
  });

  // 6. Kiosk unconfirmed reservation lifecycle
  await runTest("Kiosk reservation is hidden while unconfirmed and exposed once confirmed", async () => {
    const kioskReq: CreateReservationRequest = {
      source: "KIOSK",
      customerFirstName: "Bob",
      customerLastName: "Builder",
      customerEmail: "bob@example.com",
      paymentMethodId: "pm-cash",
      candidates: [
        { rank: 0, workspaceInstanceId: instance2.id, startAt: "2026-08-29T14:00:00.000Z", endAt: "2026-08-29T16:00:00.000Z" },
      ],
    };

    const kioskRes = await reservationService.createReservation(kioskReq);

    // Admin detail check
    let adminDetail = await adminReservationService.getReservationDetail(kioskRes.id);
    assert.ok(adminDetail);
    assert.strictEqual(adminDetail.reservationStatus, "PENDING_COUNTER_CONFIRMATION");
    assert.strictEqual(getVisibleAdminActions(adminDetail).length, 0);

    // Staff operational check: visible in Counter Queue
    let staffDetail = await staffOperationsService.getOperationalReservation(kioskRes.id);
    assert.ok(staffDetail);
    assert.strictEqual(staffDetail.reservationStatus, "PENDING_COUNTER_CONFIRMATION");

    let staffList = await staffOperationsService.listOperationalReservations();
    assert.strictEqual(staffList.length, 2);
    assert.ok(staffList.some((r) => r.reservationId === kioskRes.id && r.reservationStatus === "PENDING_COUNTER_CONFIRMATION"));

    // Confirm kiosk payment
    await counterPaymentService.confirmPayment({
      paymentAttemptId: kioskRes.counterPaymentAttemptId!,
      actor: staffActor,
    });

    // Now confirmed for staff and admin
    adminDetail = await adminReservationService.getReservationDetail(kioskRes.id);
    assert.ok(adminDetail);
    assert.ok(adminDetail.reservationStatus === "CONFIRMED" || adminDetail.reservationStatus === "CHECKED_IN");

    staffDetail = await staffOperationsService.getOperationalReservation(kioskRes.id);
    assert.ok(staffDetail);
    assert.ok(staffDetail.reservationStatus === "CONFIRMED" || staffDetail.reservationStatus === "CHECKED_IN");

    staffList = await staffOperationsService.listOperationalReservations();
    assert.strictEqual(staffList.length, 2);
  });

  console.log("All MF-24 Reservation Action Visibility & Staff Filter tests passed!");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
