import * as assert from "assert";
import {
  createPaymentSessionService,
  createReservationService,
  InMemoryWorkspaceRepository,
  PaymentSessionError,
  ReservationMemoryRepository,
  type CreateReservationRequest,
  type PaymentMethod,
} from "../packages/domain/src/index";

async function runTests() {
  console.log("--- Starting MF-38 Customer Payment Proof Confirmation Flow Tests ---");

  const reservationRepo = new ReservationMemoryRepository();
  const workspaceRepo = new InMemoryWorkspaceRepository();
  let now = new Date("2026-08-30T10:00:00.000Z");
  const nowProvider = () => now;
  const paymentSessionService = createPaymentSessionService(reservationRepo, nowProvider);
  const reservationService = createReservationService(
    reservationRepo,
    workspaceRepo,
    reservationRepo,
    paymentSessionService
  );

  const floor = await workspaceRepo.createFloor({ name: "Floor 1" });
  const template = await workspaceRepo.createTemplate({
    name: "Dedicated Desk",
    capacity: 1,
    rateAmount: 250,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#0284C7",
    isActive: true,
  });
  const instance = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "D101",
    displayName: "Desk 101",
  });

  async function createWebReservation() {
    const request: CreateReservationRequest = {
      source: "WEB",
      customerFirstName: "Andres",
      customerLastName: "Bonifacio",
      customerEmail: "andres@katipunan.ph",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: instance.id,
          startAt: "2026-09-01T08:00:00.000Z",
          endAt: "2026-09-01T12:00:00.000Z",
        },
      ],
    };

    return reservationService.createReservation(request, {
      paymentLinkBaseUrl: "https://deskatlas.test/pay",
    });
  }

  const testMethods: PaymentMethod[] = [
    {
      id: "pm-gcash-official",
      methodType: "GCASH",
      displayName: "GCash Express",
      accountName: "DeskAtlas Hub BGC",
      accountNumber: "0917-123-4567",
      instructions: "Scan QR or send to 0917-123-4567 and upload screenshot.",
      qrImagePath: "https://deskatlas.supabase.co/storage/v1/object/public/workspace-images/payment-qrs/gcash.png",
      allowWeb: true,
      allowKiosk: true,
      isActive: true,
      displayOrder: 1,
    },
    {
      id: "pm-bdo-bank",
      methodType: "BANK",
      displayName: "BDO Savings Account",
      accountName: "DeskAtlas BGC Enterprises",
      accountNumber: "0011-2233-4455",
      instructions: "Transfer to BDO account and upload payment receipt.",
      qrImagePath: null,
      allowWeb: true,
      allowKiosk: false,
      isActive: true,
      displayOrder: 2,
    },
  ];

  reservationRepo.setPaymentMethods(testMethods);

  // 1. Business Name resolution: Custom business name in settings propagates to session view
  reservationRepo.setBusinessName("DeskAtlas Bonifacio Global City");
  const res1 = await createWebReservation();
  assert.ok(res1.paymentSession?.token);

  const session1 = await paymentSessionService.getPaymentSession(res1.paymentSession.token);
  assert.equal(
    session1.businessName,
    "DeskAtlas Bonifacio Global City",
    "Configured businessName must be included in PaymentSessionView"
  );
  assert.equal(session1.paymentMethods.length, 2);
  console.log("[PASS] Configured business name is resolved and provided in PaymentSessionView");

  // 2. Selected method details and instructions are provided
  const gcash = session1.paymentMethods.find((m) => m.id === "pm-gcash-official")!;
  assert.equal(gcash.displayName, "GCash Express");
  assert.equal(gcash.accountName, "DeskAtlas Hub BGC");
  assert.equal(gcash.accountNumber, "0917-123-4567");
  assert.ok(gcash.qrImagePath?.includes("gcash.png"));
  console.log("[PASS] Payment method details and QR assets rendered from Admin configuration");

  // 3. Proof accepted before expiry transitions to UNDER_REVIEW / PAYMENT_UNDER_REVIEW
  now = new Date("2026-08-30T10:15:00.000Z"); // 15 mins into 60-min window
  const proofSubmission = await paymentSessionService.submitPaymentProof({
    token: res1.paymentSession.token,
    paymentMethodId: "pm-gcash-official",
    proofStoragePath: `${res1.id}/proof_receipt.png`,
  });

  assert.equal(proofSubmission.paymentStatus, "UNDER_REVIEW");
  assert.equal(proofSubmission.reservationStatus, "PAYMENT_UNDER_REVIEW");

  const reviewedSession = await paymentSessionService.getPaymentSession(res1.paymentSession.token);
  assert.equal(reviewedSession.paymentStatus, "UNDER_REVIEW");
  assert.equal(reviewedSession.reservationStatus, "PAYMENT_UNDER_REVIEW");
  assert.equal(reviewedSession.paymentMethodId, "pm-gcash-official");
  assert.equal(reviewedSession.businessName, "DeskAtlas Bonifacio Global City");
  console.log("[PASS] Successful proof submission transitions state to PAYMENT_UNDER_REVIEW and retains businessName");

  // 4. Duplicate proof submission on already-submitted session is rejected
  await assert.rejects(
    () =>
      paymentSessionService.submitPaymentProof({
        token: res1.paymentSession!.token,
        paymentMethodId: "pm-gcash-official",
        proofStoragePath: `${res1.id}/proof_duplicate.png`,
      }),
    /Payment proof has already been submitted/,
    "Cannot re-submit proof when session is already UNDER_REVIEW"
  );
  console.log("[PASS] Duplicate proof submission rejected");

  // 5. Proof attempted after expiry (e.g. at 61 minutes) is rejected
  now = new Date("2026-08-30T10:00:00.000Z");
  const res2 = await createWebReservation();
  assert.ok(res2.paymentSession?.token);

  now = new Date("2026-08-30T11:00:01.000Z"); // 1 hour + 1 second later
  await assert.rejects(
    () =>
      paymentSessionService.submitPaymentProof({
        token: res2.paymentSession!.token,
        paymentMethodId: "pm-gcash-official",
        proofStoragePath: `${res2.id}/proof_late.png`,
      }),
    /Payment session has expired/,
    "Proof submitted after expiry must be rejected"
  );

  const expiredSession = await paymentSessionService.getPaymentSession(res2.paymentSession.token);
  assert.equal(expiredSession.paymentStatus, "EXPIRED");
  assert.equal(expiredSession.reservationStatus, "EXPIRED");
  console.log("[PASS] Proof submitted after expiry is rejected and session marks EXPIRED");

  // 6. Confirmation text check: must not claim booking is confirmed
  // Under-review status guarantees reservation status is PAYMENT_UNDER_REVIEW and not CONFIRMED
  assert.notEqual(reviewedSession.reservationStatus, "CONFIRMED");
  assert.strictEqual(reviewedSession.reservationStatus, "PAYMENT_UNDER_REVIEW");
  console.log("[PASS] Confirmation state preserves core invariant: spot is NOT reserved until review approval");

  console.log("--- All MF-38 Tests Passed Successfully! ---");
}

runTests().catch((error) => {
  console.error("MF-38 Test Failed:", error);
  process.exit(1);
});
