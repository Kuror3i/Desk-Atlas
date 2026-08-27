import * as assert from "assert";
import {
  BookingAccessError,
  createBookingAccessService,
  createPaymentReviewService,
  createPaymentSessionService,
  createReservationService,
  InMemoryWorkspaceRepository,
  ReservationMemoryRepository,
  type CreateReservationRequest,
} from "../packages/domain/src/index";

async function runTests() {
  const reservationRepo = new ReservationMemoryRepository();
  const workspaceRepo = new InMemoryWorkspaceRepository();
  let now = new Date("2026-08-26T09:00:00.000Z");
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
  const actor = { userId: "admin-user-1", role: "ADMIN" as const };

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
  const instance = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "SP-01",
    displayName: "Skypod 1",
  });
  const instance2 = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "SP-02",
    displayName: "Skypod 2",
  });
  const instance3 = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "SP-03",
    displayName: "Skypod 3",
  });
  const instance4 = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "SP-04",
    displayName: "Skypod 4",
  });
  const instance5 = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "SP-05",
    displayName: "Skypod 5",
  });
  const instance6 = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "SP-06",
    displayName: "Skypod 6",
  });
  const instance7 = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "SP-07",
    displayName: "Skypod 7",
  });
  const instance8 = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "SP-08",
    displayName: "Skypod 8",
  });
  const instance9 = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "SP-09",
    displayName: "Skypod 9",
  });
  const instance10 = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "SP-10",
    displayName: "Skypod 10",
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

  async function expectBookingError(
    name: string,
    fn: () => Promise<void>,
    expectedMessage: string
  ) {
    try {
      await fn();
      console.error(`[FAIL] ${name}: Expected BookingAccessError but none was thrown.`);
      process.exit(1);
    } catch (error: any) {
      if (!(error instanceof BookingAccessError)) {
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
    startAt: string,
    endAt: string
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
      actor,
      decision: "APPROVE",
    });

    assert.strictEqual(reviewResult.reservationStatus, "CONFIRMED");
    return reservation;
  }

  await runTest("before booking = not active", async () => {
    now = new Date("2026-08-26T09:00:00.000Z");
    const reservation = await createConfirmedReservation(
      "before-booking",
      instance.id,
      "2026-08-27T10:00:00.000Z",
      "2026-08-27T12:00:00.000Z"
    );
    const issue = await bookingAccessService.issueBookingAccess(
      reservation.id,
      reservation.referenceCode,
      "https://deskatlas.test/booking"
    );
    assert.ok(issue);

    const scan = await bookingAccessService.resolveBookingAccess(issue!.token);
    assert.strictEqual(scan.accessState, "NOT_ACTIVE");
  });

  await runTest("exact start boundary", async () => {
    now = new Date("2026-08-26T10:00:00.000Z");
    const reservation = await createConfirmedReservation(
      "start-boundary",
      instance2.id,
      "2026-08-26T10:00:00.000Z",
      "2026-08-26T12:00:00.000Z"
    );
    const issue = await bookingAccessService.issueBookingAccess(
      reservation.id,
      reservation.referenceCode,
      "https://deskatlas.test/booking"
    );
    const scan = await bookingAccessService.resolveBookingAccess(issue!.token);
    assert.strictEqual(scan.accessState, "ACTIVE");
  });

  await runTest("during booking = active", async () => {
    now = new Date("2026-08-26T11:00:00.000Z");
    const reservation = await createConfirmedReservation(
      "active-window",
      instance3.id,
      "2026-08-26T10:00:00.000Z",
      "2026-08-26T12:00:00.000Z"
    );
    const issue = await bookingAccessService.issueBookingAccess(
      reservation.id,
      reservation.referenceCode,
      "https://deskatlas.test/booking"
    );
    const scan = await bookingAccessService.resolveBookingAccess(issue!.token);
    assert.strictEqual(scan.accessState, "ACTIVE");
    assert.ok(scan.timeRemainingSeconds > 0);
  });

  await runTest("exact end boundary remains active", async () => {
    now = new Date("2026-08-26T12:00:00.000Z");
    const reservation = await createConfirmedReservation(
      "end-boundary",
      instance4.id,
      "2026-08-26T10:00:00.000Z",
      "2026-08-26T12:00:00.000Z"
    );
    const issue = await bookingAccessService.issueBookingAccess(
      reservation.id,
      reservation.referenceCode,
      "https://deskatlas.test/booking"
    );
    const scan = await bookingAccessService.resolveBookingAccess(issue!.token);
    assert.strictEqual(scan.accessState, "ACTIVE");
    assert.strictEqual(scan.timeRemainingSeconds, 0);
  });

  await runTest("after booking = expired", async () => {
    now = new Date("2026-08-26T12:00:01.000Z");
    const reservation = await createConfirmedReservation(
      "expired-window",
      instance5.id,
      "2026-08-26T10:00:00.000Z",
      "2026-08-26T12:00:00.000Z"
    );
    const issue = await bookingAccessService.issueBookingAccess(
      reservation.id,
      reservation.referenceCode,
      "https://deskatlas.test/booking"
    );
    const scan = await bookingAccessService.resolveBookingAccess(issue!.token);
    assert.strictEqual(scan.accessState, "EXPIRED");
  });

  await runTest("cancelled = invalid", async () => {
    now = new Date("2026-08-26T09:30:00.000Z");
    const reservation = await createConfirmedReservation(
      "cancelled-reservation",
      instance6.id,
      "2026-08-26T10:00:00.000Z",
      "2026-08-26T12:00:00.000Z"
    );
    const issue = await bookingAccessService.issueBookingAccess(
      reservation.id,
      reservation.referenceCode,
      "https://deskatlas.test/booking"
    );

    const storedReservation = reservationRepo
      .getReservations()
      .find((entry) => entry.id === reservation.id)!;
    storedReservation.status = "CANCELLED";
    storedReservation.qrRevokedAt = "2026-08-26T09:31:00.000Z";

    const scan = await bookingAccessService.resolveBookingAccess(issue!.token);
    assert.strictEqual(scan.accessState, "INVALID");
  });

  await runTest("opaque token contains no PII", async () => {
    now = new Date("2026-08-26T13:00:00.000Z");
    const reservation = await createConfirmedReservation(
      "opaque-token",
      instance7.id,
      "2026-08-27T10:00:00.000Z",
      "2026-08-27T12:00:00.000Z"
    );
    const issue = await bookingAccessService.issueBookingAccess(
      reservation.id,
      reservation.referenceCode,
      "https://deskatlas.test/booking"
    );
    assert.ok(issue);
    assert.ok(!issue!.token.includes("opaque-token"));
    assert.ok(!issue!.token.includes("@example.com"));
    assert.ok(!issue!.token.includes(reservation.referenceCode));
  });

  await runTest("repeated scan/re-entry", async () => {
    now = new Date("2026-08-26T11:15:00.000Z");
    const reservation = await createConfirmedReservation(
      "reentry",
      instance8.id,
      "2026-08-26T10:00:00.000Z",
      "2026-08-26T12:00:00.000Z"
    );
    const issue = await bookingAccessService.issueBookingAccess(
      reservation.id,
      reservation.referenceCode,
      "https://deskatlas.test/booking"
    );

    const firstScan = await bookingAccessService.resolveBookingAccess(issue!.token);
    const storedReservation = reservationRepo
      .getReservations()
      .find((entry) => entry.id === reservation.id)!;
    storedReservation.checkedInAt = "2026-08-26T11:16:00.000Z";

    const secondScan = await bookingAccessService.resolveBookingAccess(issue!.token);
    assert.strictEqual(firstScan.accessState, "ACTIVE");
    assert.strictEqual(secondScan.accessState, "ACTIVE");
    assert.strictEqual(secondScan.checkInState, "CHECKED_IN");
  });

  await expectBookingError("unknown token", async () => {
    await bookingAccessService.resolveBookingAccess("missing-token");
  }, "Invalid booking token.");

  await runTest("revoked token", async () => {
    now = new Date("2026-08-26T14:00:00.000Z");
    const reservation = await createConfirmedReservation(
      "revoked-token",
      instance9.id,
      "2026-08-26T15:00:00.000Z",
      "2026-08-26T17:00:00.000Z"
    );
    const issue = await bookingAccessService.issueBookingAccess(
      reservation.id,
      reservation.referenceCode,
      "https://deskatlas.test/booking"
    );
    const storedReservation = reservationRepo
      .getReservations()
      .find((entry) => entry.id === reservation.id)!;
    storedReservation.qrRevokedAt = "2026-08-26T14:05:00.000Z";

    const scan = await bookingAccessService.resolveBookingAccess(issue!.token);
    assert.strictEqual(scan.accessState, "INVALID");
  });

  await runTest("scan event recorded", async () => {
    now = new Date("2026-08-26T16:00:00.000Z");
    const reservation = await createConfirmedReservation(
      "scan-audit",
      instance10.id,
      "2026-08-26T15:00:00.000Z",
      "2026-08-26T17:00:00.000Z"
    );
    const issue = await bookingAccessService.issueBookingAccess(
      reservation.id,
      reservation.referenceCode,
      "https://deskatlas.test/booking"
    );

    await bookingAccessService.resolveBookingAccess(issue!.token);
    const scanEvents = reservationRepo.getBookingScanEvents();
    assert.strictEqual(scanEvents.length > 0, true);
    assert.strictEqual(scanEvents.at(-1)?.reservationId, reservation.id);
    assert.strictEqual(scanEvents.at(-1)?.accessState, "ACTIVE");
  });

  console.log("All M10 tests passed!");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
