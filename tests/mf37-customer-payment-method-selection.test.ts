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
  console.log("--- Starting MF-37 Customer Payment Method Selection Tests ---");

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
    rateAmount: 200,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#0284C7",
    isActive: true,
  });
  const instance = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "D1",
    displayName: "Desk 1",
  });

  async function createWebReservation() {
    const request: CreateReservationRequest = {
      source: "WEB",
      customerFirstName: "Juan",
      customerLastName: "Dela Cruz",
      customerEmail: "juan@example.com",
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

  // 1. Initial State: Only Active Web Methods are returned (Cash is omitted)
  const configuredMethods: PaymentMethod[] = [
    {
      id: "pm-gcash-1",
      methodType: "GCASH",
      displayName: "GCash Merchant Official",
      accountName: "DeskAtlas Operations Manila",
      accountNumber: "0917-888-9999",
      instructions: "Scan GCash QR or send money to 0917-888-9999",
      qrImagePath: "https://deskatlas.supabase.co/storage/v1/object/public/workspace-images/payment-qrs/gcash.png",
      allowWeb: true,
      allowKiosk: true,
      isActive: true,
      displayOrder: 1,
    },
    {
      id: "pm-maya-1",
      methodType: "BANK",
      displayName: "Maya Digital Bank",
      accountName: "DeskAtlas Manila Inc.",
      accountNumber: "0918-777-6666",
      instructions: "Send money via Maya / Maya Bank and screenshot receipt.",
      qrImagePath: "https://deskatlas.supabase.co/storage/v1/object/public/workspace-images/payment-qrs/maya.png",
      allowWeb: true,
      allowKiosk: false,
      isActive: true,
      displayOrder: 2,
    },
    {
      id: "pm-bdo-1",
      methodType: "BANK",
      displayName: "BDO Unibank Transfer",
      accountName: "DeskAtlas Manila Enterprise",
      accountNumber: "0012-3456-7890",
      instructions: "Transfer to BDO checking account and upload receipt.",
      qrImagePath: null,
      allowWeb: true,
      allowKiosk: false,
      isActive: true,
      displayOrder: 3,
    },
    {
      id: "pm-cash-counter",
      methodType: "CASH",
      displayName: "Counter Cash Only",
      accountName: null,
      accountNumber: null,
      instructions: "Pay at counter.",
      qrImagePath: null,
      allowWeb: false,
      allowKiosk: true,
      isActive: true,
      displayOrder: 4,
    },
    {
      id: "pm-inactive-bank",
      methodType: "BANK",
      displayName: "Legacy Inactive Bank",
      accountName: "Old Account",
      accountNumber: "9999-9999",
      instructions: "Do not use.",
      qrImagePath: null,
      allowWeb: true,
      allowKiosk: false,
      isActive: false,
      displayOrder: 5,
    },
  ];

  reservationRepo.setPaymentMethods(configuredMethods);

  const reservation = await createWebReservation();
  assert.ok(reservation.paymentSession?.token, "Reservation should have a payment session token");

  const session = await paymentSessionService.getPaymentSession(reservation.paymentSession.token);

  assert.equal(session.paymentMethods.length, 3, "Only active web methods should be returned");
  assert.equal(session.paymentMethods[0]?.id, "pm-gcash-1");
  assert.equal(session.paymentMethods[1]?.id, "pm-maya-1");
  assert.equal(session.paymentMethods[2]?.id, "pm-bdo-1");
  assert.equal(
    session.paymentMethods.some((m) => m.id === "pm-cash-counter"),
    false,
    "Cash / counter methods must NOT be present in web payment session"
  );
  assert.equal(
    session.paymentMethods.some((m) => m.id === "pm-inactive-bank"),
    false,
    "Inactive methods must NOT be present in web payment session"
  );
  console.log("[PASS] Only active Admin-configured web payment methods appear (Cash and inactive omitted)");

  // 2. Details and QR assets preserved for customer view
  const gcashMethod = session.paymentMethods.find((m) => m.id === "pm-gcash-1")!;
  assert.equal(gcashMethod.displayName, "GCash Merchant Official");
  assert.equal(gcashMethod.accountName, "DeskAtlas Operations Manila");
  assert.equal(gcashMethod.accountNumber, "0917-888-9999");
  assert.equal(gcashMethod.qrImagePath, "https://deskatlas.supabase.co/storage/v1/object/public/workspace-images/payment-qrs/gcash.png");
  assert.ok(gcashMethod.instructions?.includes("Scan GCash QR"));

  const mayaMethod = session.paymentMethods.find((m) => m.id === "pm-maya-1")!;
  assert.equal(mayaMethod.displayName, "Maya Digital Bank");
  assert.equal(mayaMethod.qrImagePath, "https://deskatlas.supabase.co/storage/v1/object/public/workspace-images/payment-qrs/maya.png");
  console.log("[PASS] Payment method details and QR image paths correctly provided");

  // 3. Customer selects Maya method and submits proof
  const proofSubmission = await paymentSessionService.submitPaymentProof({
    token: reservation.paymentSession.token,
    paymentMethodId: "pm-maya-1",
    proofStoragePath: `${reservation.id}/maya-proof.png`,
  });

  assert.equal(proofSubmission.paymentStatus, "UNDER_REVIEW");
  assert.equal(proofSubmission.reservationStatus, "PAYMENT_UNDER_REVIEW");

  const reviewSession = await paymentSessionService.getPaymentSession(reservation.paymentSession.token);
  assert.equal(reviewSession.paymentStatus, "UNDER_REVIEW");
  assert.equal(reviewSession.reservationStatus, "PAYMENT_UNDER_REVIEW");
  assert.equal(reviewSession.paymentMethodId, "pm-maya-1");
  console.log("[PASS] Proof upload submits against selected payment method (pm-maya-1)");

  // 4. Submitting with invalid / disabled / cash method is rejected
  const res2 = await createWebReservation();
  assert.ok(res2.paymentSession?.token);

  await assert.rejects(
    () =>
      paymentSessionService.submitPaymentProof({
        token: res2.paymentSession!.token,
        paymentMethodId: "pm-cash-counter",
        proofStoragePath: `${res2.id}/proof.png`,
      }),
    /Invalid payment method/,
    "Cannot submit proof against a cash / non-web payment method"
  );

  await assert.rejects(
    () =>
      paymentSessionService.submitPaymentProof({
        token: res2.paymentSession!.token,
        paymentMethodId: "pm-inactive-bank",
        proofStoragePath: `${res2.id}/proof.png`,
      }),
    /Invalid payment method/,
    "Cannot submit proof against an inactive payment method"
  );
  console.log("[PASS] Submission against cash or inactive method correctly rejected");

  // 5. Zero active web payment methods configured
  reservationRepo.setPaymentMethods([
    {
      id: "pm-cash-only",
      methodType: "CASH",
      displayName: "Cash Only",
      accountName: null,
      accountNumber: null,
      instructions: null,
      qrImagePath: null,
      allowWeb: false,
      allowKiosk: true,
      isActive: true,
      displayOrder: 1,
    },
  ]);

  const res3 = await createWebReservation();
  const sessionEmptyMethods = await paymentSessionService.getPaymentSession(res3.paymentSession!.token);
  assert.equal(sessionEmptyMethods.paymentMethods.length, 0, "No active web methods returned when none configured");
  console.log("[PASS] Zero active web payment methods returns empty array for frontend blocked alert");

  // 6. Server-authoritative 1-hour expiry behavior remains preserved
  now = new Date("2026-08-30T10:00:00.000Z");
  const res4 = await createWebReservation();
  now = new Date("2026-08-30T11:00:00.000Z"); // 60 minutes later
  const expiredSession = await paymentSessionService.getPaymentSession(res4.paymentSession!.token);
  assert.equal(expiredSession.paymentStatus, "EXPIRED");
  assert.equal(expiredSession.reservationStatus, "EXPIRED");
  console.log("[PASS] 1-hour payment session expiry behavior remains server-authoritative");

  console.log("--- All MF-37 Tests Passed Successfully! ---");
}

runTests().catch((error) => {
  console.error("MF-37 Test Failed:", error);
  process.exit(1);
});
