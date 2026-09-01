import * as assert from "assert";
import {
  createCounterPaymentService,
  createPaymentReviewService,
  createPaymentSessionService,
  createReservationService,
  createStaffOperationsService,
  InMemoryWorkspaceRepository,
  ReservationMemoryRepository,
  StaffOperationsError,
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
  await runTest("empty database returns truthful empty state", async () => {
    const reservationRepo = new ReservationMemoryRepository();
    const staffService = createStaffOperationsService(
      reservationRepo,
      () => new Date("2026-08-29T10:00:00.000Z")
    );

    const list = await staffService.listOperationalReservations();
    assert.strictEqual(list.length, 0);

    const detail = await staffService.getOperationalReservation("non-existent-id");
    assert.strictEqual(detail, null);
  });

  // Setup populated environment
  let now = new Date("2026-08-29T10:00:00.000Z");
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

  // 2. Web reservation creation -> PENDING_PAYMENT (hidden from operational list)
  let webRes: any;
  await runTest("web reservation with pending payment is hidden from operational list", async () => {
    const request: CreateReservationRequest = {
      source: "WEB",
      customerFirstName: "Alice",
      customerLastName: "Walker",
      customerEmail: "alice@example.com",
      candidates: [
        { rank: 0, workspaceInstanceId: instance1.id, startAt: "2026-08-29T11:00:00.000Z", endAt: "2026-08-29T13:00:00.000Z" },
        { rank: 1, workspaceInstanceId: instance2.id, startAt: "2026-08-29T11:00:00.000Z", endAt: "2026-08-29T13:00:00.000Z" },
      ],
    };

    webRes = await reservationService.createReservation(request, {
      paymentLinkBaseUrl: "https://deskatlas.test/pay",
    });

    const list = await staffOperationsService.listOperationalReservations();
    assert.strictEqual(list.length, 0);

    // Detail lookup by ID and by referenceCode must return null for unconfirmed reservations
    const detailById = await staffOperationsService.getOperationalReservation(webRes.id);
    assert.strictEqual(detailById, null);

    const detailByRef = await staffOperationsService.getOperationalReservation(webRes.referenceCode);
    assert.strictEqual(detailByRef, null);
  });

  // 3. Kiosk reservation creation -> source = KIOSK, PENDING_COUNTER_CONFIRMATION (shown in Counter Queue on operational list)
  let kioskRes: any;
  await runTest("kiosk reservation with pending counter confirmation is shown in operational list for counter confirmation", async () => {
    const request: CreateReservationRequest = {
      source: "KIOSK",
      customerFirstName: "Bob",
      customerLastName: "Miller",
      customerEmail: "bob@example.com",
      paymentMethodId: "pm-cash",
      candidates: [
        { rank: 0, workspaceInstanceId: instance3.id, startAt: "2026-08-29T14:00:00.000Z", endAt: "2026-08-29T16:00:00.000Z" },
      ],
    };

    kioskRes = await reservationService.createReservation(request);

    const list = await staffOperationsService.listOperationalReservations();
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].reservationStatus, "PENDING_COUNTER_CONFIRMATION");

    const detail = await staffOperationsService.getOperationalReservation(kioskRes.id);
    assert.ok(detail);
    assert.strictEqual(detail.reservationStatus, "PENDING_COUNTER_CONFIRMATION");
    assert.strictEqual(detail.source, "KIOSK");
    assert.strictEqual(detail.customerFirstName, "Bob");
  });

  // 4. Staff confirms kiosk counter payment -> CONFIRMED (status transitions in operational list)
  await runTest("staff counter payment confirmation updates status to CONFIRMED and becomes operationally visible", async () => {
    await counterPaymentService.confirmPayment({
      paymentAttemptId: kioskRes.counterPaymentAttemptId!,
      actor: staffActor,
    });

    const list = await staffOperationsService.listOperationalReservations();
    assert.strictEqual(list.length, 1);
    assert.ok(list[0].reservationStatus === "CONFIRMED" || list[0].reservationStatus === "CHECKED_IN");

    const detail = await staffOperationsService.getOperationalReservation(kioskRes.id);
    assert.ok(detail);
    assert.ok(detail.reservationStatus === "CONFIRMED" || detail.reservationStatus === "CHECKED_IN");
    assert.strictEqual(detail.source, "KIOSK");
    assert.strictEqual(detail.customerFirstName, "Bob");
    assert.strictEqual(detail.customerLastName, "Miller");
    assert.ok(detail.confirmedAt);
  });

  // 5. Payment Proof Submission & Admin Approval for Web Reservation -> CONFIRMED
  await runTest("web reservation proof upload and approval updates status to CONFIRMED with assigned candidate", async () => {
    await paymentSessionService.submitPaymentProof({
      token: webRes.paymentSession!.token,
      paymentMethodId: "pm-gcash",
      proofStoragePath: `proofs/${webRes.referenceCode}.png`,
    });

    // Still under review -> not in operational view
    let detail = await staffOperationsService.getOperationalReservation(webRes.id);
    assert.strictEqual(detail, null);

    const session = await paymentSessionService.getPaymentSession(webRes.paymentSession!.token);
    await paymentReviewService.reviewPayment({
      paymentAttemptId: session.paymentAttemptId,
      actor: adminActor,
      decision: "APPROVE",
    });

    detail = await staffOperationsService.getOperationalReservation(webRes.id);
    assert.ok(detail);
    assert.strictEqual(detail.reservationStatus, "CONFIRMED");
    assert.ok(detail.confirmedAt);
    assert.strictEqual(detail.workspaceInstanceId, instance1.id);

    const list = await staffOperationsService.listOperationalReservations();
    assert.strictEqual(list.length, 2);
  });

  // 6. Check-in and Check-out lifecycle
  await runTest("staff check-in and check-out updates checkInState and reservationStatus", async () => {
    now = new Date("2026-08-29T11:15:00.000Z");
    const checkInResult = await staffOperationsService.checkInReservation({
      reservationId: webRes.id,
      actor: staffActor,
    });

    assert.strictEqual(checkInResult.reservationStatus, "CHECKED_IN");
    assert.strictEqual(checkInResult.checkInState, "CHECKED_IN");
    assert.ok(checkInResult.checkedInAt);

    let detail = await staffOperationsService.getOperationalReservation(webRes.id);
    assert.ok(detail);
    assert.strictEqual(detail.reservationStatus, "CHECKED_IN");
    assert.strictEqual(detail.checkInState, "CHECKED_IN");
    assert.ok(detail.checkedInAt);

    const checkOutResult = await staffOperationsService.checkOutReservation({
      reservationId: webRes.id,
      actor: staffActor,
    });

    assert.strictEqual(checkOutResult.reservationStatus, "COMPLETED");
    assert.strictEqual(checkOutResult.checkInState, "CHECKED_OUT");
    assert.ok(checkOutResult.checkedOutAt);

    detail = await staffOperationsService.getOperationalReservation(webRes.id);
    assert.ok(detail);
    assert.strictEqual(detail.reservationStatus, "COMPLETED");
    assert.strictEqual(detail.checkInState, "CHECKED_OUT");
    assert.ok(detail.checkedOutAt);
  });

  // 7. Validation: Empty or blank ID
  await runTest("getOperationalReservation throws StaffOperationsError on empty ID", async () => {
    let errorCaught = false;
    try {
      await staffOperationsService.getOperationalReservation("");
    } catch (err) {
      if (err instanceof StaffOperationsError) {
        errorCaught = true;
      }
    }
    assert.ok(errorCaught, "Should throw on empty ID");

    errorCaught = false;
    try {
      await staffOperationsService.getOperationalReservation("   ");
    } catch (err) {
      if (err instanceof StaffOperationsError) {
        errorCaught = true;
      }
    }
    assert.ok(errorCaught, "Should throw on whitespace-only ID");
  });

  // 8. Security & Staff-safe DTO audit
  await runTest("security audit: StaffOperationalReservation DTO does not leak sensitive internal fields", async () => {
    const list = await staffOperationsService.listOperationalReservations();
    const detail = await staffOperationsService.getOperationalReservation(webRes.id);

    const listJson = JSON.stringify(list);
    const detailJson = JSON.stringify(detail);

    for (const json of [listJson, detailJson]) {
      assert.ok(!json.includes("tokenHash"), "Must not include tokenHash");
      assert.ok(!json.includes("token_hash"), "Must not include token_hash");
      assert.ok(!json.includes("bookingTokenHash"), "Must not include bookingTokenHash");
      assert.ok(!json.includes("booking_token_hash"), "Must not include booking_token_hash");
      assert.ok(!json.includes("proofStoragePath"), "Must not include proofStoragePath");
      assert.ok(!json.includes("proof_storage_path"), "Must not include proof_storage_path");
      assert.ok(!json.includes("proofs/"), "Must not include proofs/ path");
      assert.ok(!json.includes("paymentLinkBaseUrl"), "Must not include paymentLinkBaseUrl");
    }
  });

  console.log("All MF-13 Staff Reservations tests passed!");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
