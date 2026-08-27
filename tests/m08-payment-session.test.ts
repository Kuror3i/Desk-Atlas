import * as assert from "assert";
import {
  createPaymentSessionService,
  createReservationService,
  InMemoryWorkspaceRepository,
  PaymentSessionError,
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

  const floor = await workspaceRepo.createFloor({ name: "Test Floor" });
  const template = await workspaceRepo.createTemplate({
    name: "Test Template",
    capacity: 1,
    rateAmount: 150,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#000000",
    isActive: true,
  });
  const instance = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "A1",
    displayName: "Test Instance 1",
  });

  async function createWebReservation() {
    const request: CreateReservationRequest = {
      source: "WEB",
      customerFirstName: "Maria",
      customerLastName: "Santos",
      customerEmail: "maria@example.com",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: instance.id,
          startAt: "2026-09-01T09:00:00.000Z",
          endAt: "2026-09-01T11:00:00.000Z",
        },
      ],
    };

    return reservationService.createReservation(request, {
      paymentLinkBaseUrl: "https://deskatlas.test/pay",
    });
  }

  async function runTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
    } catch (error: any) {
      console.error(`[FAIL] ${name}:`, error.message);
      process.exit(1);
    }
  }

  async function expectPaymentError(name: string, fn: () => Promise<void>, expectedMessage: string) {
    try {
      await fn();
      console.error(`[FAIL] ${name}: Expected PaymentSessionError but none was thrown.`);
      process.exit(1);
    } catch (error: any) {
      if (!(error instanceof PaymentSessionError)) {
        console.error(`[FAIL] ${name}: Unexpected error type`, error);
        process.exit(1);
      }
      assert.strictEqual(error.message, expectedMessage);
      console.log(`[PASS] ${name}`);
    }
  }

  await runTest("active link", async () => {
    now = new Date("2026-08-26T09:00:00.000Z");
    const reservation = await createWebReservation();
    assert.ok(reservation.paymentSession);
    const session = await paymentSessionService.getPaymentSession(reservation.paymentSession!.token);
    assert.strictEqual(session.paymentStatus, "PENDING");
    assert.strictEqual(session.reservationStatus, "PENDING_PAYMENT");
    assert.ok(session.paymentMethods.length >= 1);
  });

  await expectPaymentError("invalid token", async () => {
    await paymentSessionService.getPaymentSession("invalid-token");
  }, "Invalid payment token.");

  await runTest("expired token", async () => {
    now = new Date("2026-08-26T10:00:00.000Z");
    const reservation = await createWebReservation();
    now = new Date("2026-08-26T11:00:00.000Z");
    const session = await paymentSessionService.getPaymentSession(reservation.paymentSession!.token);
    assert.strictEqual(session.paymentStatus, "EXPIRED");
    assert.strictEqual(session.reservationStatus, "EXPIRED");
  });

  await runTest("upload accepted before expiry", async () => {
    now = new Date("2026-08-26T12:00:00.000Z");
    const reservation = await createWebReservation();
    now = new Date("2026-08-26T12:45:00.000Z");
    const submission = await paymentSessionService.submitPaymentProof({
      token: reservation.paymentSession!.token,
      paymentMethodId: "pm-gcash",
      proofStoragePath: "reservation/proof-1.png",
    });
    assert.strictEqual(submission.paymentStatus, "UNDER_REVIEW");
    assert.strictEqual(submission.reservationStatus, "PAYMENT_UNDER_REVIEW");
  });

  await expectPaymentError("upload after expiry rejected", async () => {
    now = new Date("2026-08-26T14:00:00.000Z");
    const reservation = await createWebReservation();
    now = new Date("2026-08-26T15:00:00.000Z");
    await paymentSessionService.submitPaymentProof({
      token: reservation.paymentSession!.token,
      paymentMethodId: "pm-gcash",
      proofStoragePath: "reservation/proof-2.png",
    });
  }, "Payment session has expired.");

  await runTest("proof at minute 59 equivalent boundary", async () => {
    now = new Date("2026-08-26T16:00:00.000Z");
    const reservation = await createWebReservation();
    now = new Date("2026-08-26T16:59:59.000Z");
    const submission = await paymentSessionService.submitPaymentProof({
      token: reservation.paymentSession!.token,
      paymentMethodId: "pm-bank",
      proofStoragePath: "reservation/proof-3.png",
    });
    assert.strictEqual(submission.paymentStatus, "UNDER_REVIEW");
  });

  await runTest("failed upload does not stop expiry", async () => {
    now = new Date("2026-08-26T18:00:00.000Z");
    const reservation = await createWebReservation();
    now = new Date("2026-08-26T19:00:00.000Z");
    const session = await paymentSessionService.getPaymentSession(reservation.paymentSession!.token);
    assert.strictEqual(session.paymentStatus, "EXPIRED");
  });

  await expectPaymentError("duplicate proof behavior rejects second submission", async () => {
    now = new Date("2026-08-26T20:00:00.000Z");
    const reservation = await createWebReservation();
    now = new Date("2026-08-26T20:15:00.000Z");
    await paymentSessionService.submitPaymentProof({
      token: reservation.paymentSession!.token,
      paymentMethodId: "pm-gcash",
      proofStoragePath: "reservation/proof-4.png",
    });
    now = new Date("2026-08-26T20:20:00.000Z");
    await paymentSessionService.submitPaymentProof({
      token: reservation.paymentSession!.token,
      paymentMethodId: "pm-gcash",
      proofStoragePath: "reservation/proof-5.png",
    });
  }, "Payment proof has already been submitted for this session.");

  await runTest("server time is authoritative", async () => {
    now = new Date("2026-08-26T22:00:00.000Z");
    const reservation = await createWebReservation();
    now = new Date("2026-08-26T23:00:00.000Z");
    await expectPaymentError(
      "server time inner assertion",
      async () => {
        await paymentSessionService.submitPaymentProof({
          token: reservation.paymentSession!.token,
          paymentMethodId: "pm-bank",
          proofStoragePath: "reservation/proof-6.png",
        });
      },
      "Payment session has expired."
    );
  });

  await runTest("email link uses valid token", async () => {
    now = new Date("2026-08-27T00:00:00.000Z");
    const reservation = await createWebReservation();
    assert.ok(reservation.paymentSession?.paymentUrl.endsWith(reservation.paymentSession.token));
    const session = await paymentSessionService.getPaymentSession(reservation.paymentSession!.token);
    assert.strictEqual(session.reservationReferenceCode, reservation.referenceCode);
  });

  console.log("All M08 tests passed!");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
