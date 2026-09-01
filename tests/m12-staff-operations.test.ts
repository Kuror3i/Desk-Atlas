import * as assert from "assert";
import {
  CounterPaymentConflictError,
  PaymentReviewConflictError,
  ReservationMemoryRepository,
  StaffOperationsError,
  createBookingAccessService,
  createCounterPaymentService,
  createPaymentReviewService,
  createPaymentSessionService,
  createReservationService,
  createStaffOperationsService,
  InMemoryWorkspaceRepository,
  type CreateReservationRequest,
} from "../packages/domain/src/index";

async function runTests() {
  const reservationRepo = new ReservationMemoryRepository();
  const workspaceRepo = new InMemoryWorkspaceRepository();
  let now = new Date("2026-08-27T09:00:00.000Z");
  const nowProvider = () => now;

  const paymentSessionService = createPaymentSessionService(reservationRepo, nowProvider);
  const reservationService = createReservationService(
    reservationRepo,
    workspaceRepo,
    reservationRepo,
    paymentSessionService
  );
  const paymentReviewService = createPaymentReviewService(reservationRepo, nowProvider);
  const bookingAccessService = createBookingAccessService(reservationRepo, nowProvider);
  const counterPaymentService = createCounterPaymentService(reservationRepo, nowProvider);
  const staffOperationsService = createStaffOperationsService(reservationRepo, nowProvider);

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

  const staffActor = { userId: "staff-user-1", role: "STAFF" as const };
  const adminActor = { userId: "admin-user-1", role: "ADMIN" as const };

  async function runTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
    } catch (error: any) {
      console.error(`[FAIL] ${name}:`, error.message);
      process.exit(1);
    }
  }

  async function expectError(
    name: string,
    fn: () => Promise<void>,
    expectedMessage: string,
    expectedCtor: new (...args: any[]) => Error
  ) {
    try {
      await fn();
      console.error(`[FAIL] ${name}: Expected error but none was thrown.`);
      process.exit(1);
    } catch (error: any) {
      if (!(error instanceof expectedCtor)) {
        console.error(`[FAIL] ${name}: Unexpected error type`, error);
        process.exit(1);
      }

      assert.strictEqual(error.message, expectedMessage);
      console.log(`[PASS] ${name}`);
    }
  }

  async function createConfirmedReservation(
    customerSlug: string,
    workspaceInstanceId: string,
    startAt = "2026-08-27T10:00:00.000Z",
    endAt = "2026-08-27T12:00:00.000Z"
  ) {
    const request: CreateReservationRequest = {
      source: "WEB",
      customerFirstName: customerSlug,
      customerLastName: "Tester",
      customerEmail: `${customerSlug}@example.com`,
      candidates: [
        {
          rank: 0,
          workspaceInstanceId,
          startAt,
          endAt,
        },
      ],
    };

    const reservation = await reservationService.createReservation(request, {
      paymentLinkBaseUrl: "https://deskatlas.test/pay",
    });

    await paymentSessionService.submitPaymentProof({
      token: reservation.paymentSession!.token,
      paymentMethodId: "pm-gcash",
      proofStoragePath: `proofs/${customerSlug}.png`,
    });

    const session = await paymentSessionService.getPaymentSession(reservation.paymentSession!.token);
    const reviewResult = await paymentReviewService.reviewPayment({
      paymentAttemptId: session.paymentAttemptId,
      actor: adminActor,
      decision: "APPROVE",
    });

    assert.strictEqual(reviewResult.reservationStatus, "CONFIRMED");
    return reservation;
  }

  async function createPendingReservation(
    customerSlug: string,
    workspaceInstanceId: string,
    startAt = "2026-08-27T10:00:00.000Z",
    endAt = "2026-08-27T12:00:00.000Z"
  ) {
    const request: CreateReservationRequest = {
      source: "WEB",
      customerFirstName: customerSlug,
      customerLastName: "Pending",
      customerEmail: `${customerSlug}@example.com`,
      candidates: [
        {
          rank: 0,
          workspaceInstanceId,
          startAt,
          endAt,
        },
      ],
    };

    return reservationService.createReservation(request, {
      paymentLinkBaseUrl: "https://deskatlas.test/pay",
    });
  }

  await runTest("check-in from Confirmed", async () => {
    now = new Date("2026-08-27T10:15:00.000Z");
    const reservation = await createConfirmedReservation("checkin", instanceA.id);

    const result = await staffOperationsService.checkInReservation({
      reservationId: reservation.id,
      actor: staffActor,
    });

    assert.strictEqual(result.reservationStatus, "CHECKED_IN");
    assert.strictEqual(result.checkInState, "CHECKED_IN");
    assert.strictEqual(result.reentry, false);
  });

  await expectError(
    "invalid check-in state",
    async () => {
      now = new Date("2026-08-27T10:20:00.000Z");
      const reservation = await createPendingReservation("invalid-checkin", instanceB.id);
      await staffOperationsService.checkInReservation({
        reservationId: reservation.id,
        actor: staffActor,
      });
    },
    "Reservation is not in a check-in state.",
    Error
  );

  await runTest("check-out", async () => {
    now = new Date("2026-08-27T10:30:00.000Z");
    const reservation = await createConfirmedReservation("checkout", instanceB.id);
    await staffOperationsService.checkInReservation({
      reservationId: reservation.id,
      actor: staffActor,
    });

    now = new Date("2026-08-27T11:00:00.000Z");
    const result = await staffOperationsService.checkOutReservation({
      reservationId: reservation.id,
      actor: staffActor,
    });

    assert.strictEqual(result.reservationStatus, "COMPLETED");
    assert.strictEqual(result.checkInState, "CHECKED_OUT");
    assert.ok(result.checkedOutAt);
  });

  await runTest("re-entry", async () => {
    now = new Date("2026-08-27T13:40:00.000Z");
    const reservation = await createConfirmedReservation(
      "reentry",
      instanceA.id,
      "2026-08-27T13:00:00.000Z",
      "2026-08-27T15:00:00.000Z"
    );
    const bookingAccess = await bookingAccessService.issueBookingAccess(
      reservation.id,
      reservation.referenceCode,
      "https://deskatlas.test/booking"
    );

    await staffOperationsService.checkInReservation({
      reservationId: reservation.id,
      actor: staffActor,
    });

    const scan = await bookingAccessService.resolveBookingAccess(bookingAccess!.token);
    assert.strictEqual(scan.checkInState, "CHECKED_IN");

    now = new Date("2026-08-27T13:50:00.000Z");
    const result = await staffOperationsService.checkInReservation({
      reservationId: reservation.id,
      actor: staffActor,
    });
    assert.strictEqual(result.reentry, true);
  });

  await runTest("occupancy updates", async () => {
    now = new Date("2026-08-27T16:05:00.000Z");
    const reservation = await createConfirmedReservation(
      "occupancy",
      instanceB.id,
      "2026-08-27T16:00:00.000Z",
      "2026-08-27T18:00:00.000Z"
    );

    const before = await staffOperationsService.listOccupancy();
    const reserved = before.find((entry) => entry.reservationId === reservation.id);
    assert.strictEqual(reserved?.occupancyState, "RESERVED");

    await staffOperationsService.checkInReservation({
      reservationId: reservation.id,
      actor: staffActor,
    });

    const after = await staffOperationsService.listOccupancy();
    const occupied = after.find((entry) => entry.reservationId === reservation.id);
    assert.strictEqual(occupied?.occupancyState, "OCCUPIED");
  });

  await runTest("Staff kiosk confirm allowed in business-rule test", async () => {
    now = new Date("2026-08-27T09:45:00.000Z");
    const kioskReservation = await reservationService.createReservation({
      source: "KIOSK",
      customerFirstName: "kiosk",
      customerLastName: "Walker",
      customerEmail: "kiosk@example.com",
      paymentMethodId: "pm-cash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: instanceB.id,
          startAt: "2026-08-27T13:00:00.000Z",
          endAt: "2026-08-27T15:00:00.000Z",
        },
      ],
    });

    const result = await counterPaymentService.confirmPayment({
      paymentAttemptId: kioskReservation.counterPaymentAttemptId!,
      actor: staffActor,
    });

    assert.strictEqual(result.paymentStatus, "APPROVED");
  });

  await expectError(
    "Staff online proof approve denied by service contract",
    async () => {
      now = new Date("2026-08-27T09:50:00.000Z");
      const reservation = await createPendingReservation("staff-denied", instanceA.id);
      await paymentSessionService.submitPaymentProof({
        token: reservation.paymentSession!.token,
        paymentMethodId: "pm-gcash",
        proofStoragePath: "proofs/staff-denied.png",
      });

      const session = await paymentSessionService.getPaymentSession(reservation.paymentSession!.token);
      await paymentReviewService.reviewPayment({
        paymentAttemptId: session.paymentAttemptId,
        actor: staffActor,
        decision: "APPROVE",
      });
    },
    "Only ADMIN may approve or reject online payment proof.",
    PaymentReviewConflictError
  );

  await runTest("audit events", async () => {
    now = new Date("2026-08-27T19:10:00.000Z");
    const reservation = await createConfirmedReservation(
      "audit",
      instanceA.id,
      "2026-08-27T19:00:00.000Z",
      "2026-08-27T21:00:00.000Z"
    );
    await staffOperationsService.checkInReservation({
      reservationId: reservation.id,
      actor: staffActor,
    });
    await staffOperationsService.checkOutReservation({
      reservationId: reservation.id,
      actor: staffActor,
    });

    const activity = await staffOperationsService.listOperationalActivity(10);
    const checkOutEvent = activity.find(
      (entry) => entry.reservationId === reservation.id && entry.activityType === "CHECK_OUT"
    );
    const checkInEvent = activity.find(
      (entry) => entry.reservationId === reservation.id && entry.activityType === "CHECK_IN"
    );

    assert.ok(checkInEvent);
    assert.ok(checkOutEvent);
  });

  console.log("All M12 tests passed!");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
