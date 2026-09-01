import * as assert from "assert";
import {
  createBookingAccessService,
  createGuestReservationTrackingService,
  createPaymentReviewService,
  createPaymentSessionService,
  createReservationService,
  createStaffOperationsService,
  GuestReservationTrackingError,
  InMemoryWorkspaceRepository,
  ReservationMemoryRepository,
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
  const staffOperationsService = createStaffOperationsService(reservationRepo, nowProvider);
  const trackingService = createGuestReservationTrackingService(reservationRepo);
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

  async function runTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
    } catch (error: any) {
      console.error(`[FAIL] ${name}:`, error.message);
      process.exit(1);
    }
  }

  async function expectTrackingError(
    name: string,
    fn: () => Promise<void>,
    expectedMessage: string
  ) {
    try {
      await fn();
      console.error(`[FAIL] ${name}: Expected GuestReservationTrackingError but none was thrown.`);
      process.exit(1);
    } catch (error: any) {
      if (!(error instanceof GuestReservationTrackingError)) {
        console.error(`[FAIL] ${name}: Unexpected error type`, error);
        process.exit(1);
      }

      assert.strictEqual(error.message, expectedMessage);
      console.log(`[PASS] ${name}`);
    }
  }

  async function createWebReservation(
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

    return reservationService.createReservation(request, {
      paymentLinkBaseUrl: "https://deskatlas.test/pay",
    });
  }

  async function approveReservation(reservation: Awaited<ReturnType<typeof createWebReservation>>) {
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

  await runTest("valid lookup", async () => {
    const reservation = await createWebReservation("lookup", instanceA.id);
    const result = await trackingService.getReservationTracking({
      referenceCode: reservation.referenceCode.toLowerCase(),
      customerEmail: "LOOKUP@example.com",
    });

    assert.strictEqual(result.referenceCode, reservation.referenceCode);
    assert.strictEqual(result.status, "PENDING_PAYMENT");
    assert.strictEqual(result.finalAssignment, null);
  });

  await expectTrackingError(
    "invalid reference",
    async () => {
      await trackingService.getReservationTracking({
        referenceCode: "missing-ref",
        customerEmail: "lookup@example.com",
      });
    },
    "Reservation tracking details were not found."
  );

  await expectTrackingError(
    "wrong contact verification",
    async () => {
      const reservation = await createWebReservation("wrong-contact", instanceA.id);
      await trackingService.getReservationTracking({
        referenceCode: reservation.referenceCode,
        customerEmail: "other@example.com",
      });
    },
    "Reservation tracking details were not found."
  );

  await runTest("no data leak", async () => {
    const reservation = await createWebReservation("no-leak", instanceA.id);
    const before = reservationRepo
      .getReservations()
      .find((entry) => entry.id === reservation.id)!;

    await assert.rejects(
      () =>
        trackingService.getReservationTracking({
          referenceCode: reservation.referenceCode,
          customerEmail: "wrong@example.com",
        }),
      (error: unknown) =>
        error instanceof GuestReservationTrackingError &&
        error.message === "Reservation tracking details were not found."
    );

    const after = reservationRepo
      .getReservations()
      .find((entry) => entry.id === reservation.id)!;
    assert.deepStrictEqual(after, before);
  });

  await runTest("Pending Payment", async () => {
    const reservation = await createWebReservation("pending-status", instanceA.id);
    const result = await trackingService.getReservationTracking({
      referenceCode: reservation.referenceCode,
      customerEmail: reservation.customerEmail,
    });

    assert.strictEqual(result.status, "PENDING_PAYMENT");
  });

  await runTest("Under Review", async () => {
    const reservation = await createWebReservation("under-review", instanceA.id);
    await paymentSessionService.submitPaymentProof({
      token: reservation.paymentSession!.token,
      paymentMethodId: "pm-gcash",
      proofStoragePath: "proofs/under-review.png",
    });

    const result = await trackingService.getReservationTracking({
      referenceCode: reservation.referenceCode,
      customerEmail: reservation.customerEmail,
    });

    assert.strictEqual(result.status, "PAYMENT_UNDER_REVIEW");
  });

  await runTest("Confirmed", async () => {
    const reservation = await createWebReservation("confirmed", instanceA.id);
    await approveReservation(reservation);
    await bookingAccessService.issueBookingAccess(
      reservation.id,
      reservation.referenceCode,
      "https://deskatlas.test/booking"
    );

    const result = await trackingService.getReservationTracking({
      referenceCode: reservation.referenceCode,
      customerEmail: reservation.customerEmail,
    });

    assert.strictEqual(result.status, "CONFIRMED");
    assert.ok(result.finalAssignment);
    assert.strictEqual(result.finalAssignment?.workspaceInstanceId, instanceA.id);
  });

  await runTest("Manual Resolution", async () => {
    const winningReservation = await createWebReservation(
      "manual-winning",
      instanceA.id,
      "2026-08-27T14:00:00.000Z",
      "2026-08-27T16:00:00.000Z"
    );
    await approveReservation(winningReservation);

    const manualReservation = await createWebReservation(
      "manual-losing",
      instanceA.id,
      "2026-08-27T14:00:00.000Z",
      "2026-08-27T16:00:00.000Z"
    );
    await approveReservation(manualReservation);

    const result = await trackingService.getReservationTracking({
      referenceCode: manualReservation.referenceCode,
      customerEmail: manualReservation.customerEmail,
    });

    assert.strictEqual(result.status, "NEEDS_MANUAL_RESOLUTION");
    assert.strictEqual(result.finalAssignment, null);
  });

  await runTest("Cancelled", async () => {
    const reservation = await createWebReservation("cancelled", instanceB.id);
    const stored = reservationRepo.getReservations().find((entry) => entry.id === reservation.id)!;
    stored.status = "CANCELLED";
    stored.updatedAt = "2026-08-27T10:10:00.000Z";

    const result = await trackingService.getReservationTracking({
      referenceCode: reservation.referenceCode,
      customerEmail: reservation.customerEmail,
    });

    assert.strictEqual(result.status, "CANCELLED");
  });

  await runTest("Expired", async () => {
    const reservation = await createWebReservation("expired", instanceB.id);
    now = new Date("2026-08-27T10:30:00.000Z");
    await paymentSessionService.getPaymentSession(reservation.paymentSession!.token);

    const result = await trackingService.getReservationTracking({
      referenceCode: reservation.referenceCode,
      customerEmail: reservation.customerEmail,
    });

    assert.strictEqual(result.status, "EXPIRED");
  });

  await runTest("Completed", async () => {
    now = new Date("2026-08-27T11:00:00.000Z");
    const reservation = await createWebReservation(
      "completed",
      instanceB.id,
      "2026-08-27T11:00:00.000Z",
      "2026-08-27T13:00:00.000Z"
    );
    await approveReservation(reservation);
    await staffOperationsService.checkInReservation({
      reservationId: reservation.id,
      actor: staffActor,
    });

    now = new Date("2026-08-27T12:00:00.000Z");
    await staffOperationsService.checkOutReservation({
      reservationId: reservation.id,
      actor: staffActor,
    });

    const result = await trackingService.getReservationTracking({
      referenceCode: reservation.referenceCode,
      customerEmail: reservation.customerEmail,
    });

    assert.strictEqual(result.status, "COMPLETED");
    assert.ok(result.completedAt);
  });

  console.log("All M13 tests passed!");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
