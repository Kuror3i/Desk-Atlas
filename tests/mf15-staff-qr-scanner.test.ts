import * as assert from "assert";
import {
  BookingAccessError,
  createBookingAccessService,
  createPaymentReviewService,
  createPaymentSessionService,
  createReservationService,
  createStaffOperationsService,
  InMemoryWorkspaceRepository,
  ReservationMemoryRepository,
  type CreateReservationRequest,
} from "../packages/domain/src/index";
import { extractBookingToken } from "../apps/staff-dashboard/src/features/qr-scanner/hooks/useBookingLookup";

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

  // 1. Token extraction tests
  await runTest("extractBookingToken parses raw tokens and URLs", async () => {
    assert.strictEqual(extractBookingToken("abc-123-token"), "abc-123-token");
    assert.strictEqual(extractBookingToken("  abc-123-token  "), "abc-123-token");
    assert.strictEqual(
      extractBookingToken("https://deskatlas.com/booking/opaque-token-xyz"),
      "opaque-token-xyz"
    );
    assert.strictEqual(
      extractBookingToken("http://localhost:3000/booking/opaque-token-xyz/"),
      "opaque-token-xyz"
    );
    assert.strictEqual(
      extractBookingToken("https://deskatlas.com/booking/opaque-token-xyz?ref=RES-101"),
      "opaque-token-xyz"
    );
    assert.strictEqual(extractBookingToken(""), "");
    assert.strictEqual(extractBookingToken("   "), "");
  });

  // Setup domain environment
  const reservationRepo = new ReservationMemoryRepository();
  const workspaceRepo = new InMemoryWorkspaceRepository();
  let now = new Date("2026-08-29T10:00:00.000Z");
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
  const adminActor = { userId: "admin-user-1", role: "ADMIN" as const };
  const staffActor = { userId: "staff-user-1", role: "STAFF" as const };

  const floor = await workspaceRepo.createFloor({ name: "Ground Floor" });
  const template = await workspaceRepo.createTemplate({
    name: "Focus Pod",
    capacity: 1,
    rateAmount: 150,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#0f172a",
    isActive: true,
  });
  const instance = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "FP-01",
    displayName: "Focus Pod 1",
  });

  // Create confirmed reservation with booking QR access
  const bookingStart = "2026-08-29T10:00:00.000Z";
  const bookingEnd = "2026-08-29T12:00:00.000Z";

  const request: CreateReservationRequest = {
    source: "WEB",
    customerFirstName: "Jane",
    customerLastName: "Doe",
    customerEmail: "jane.doe@example.com",
    candidates: [
      {
        workspaceInstanceId: instance.id,
        rank: 0,
        startAt: bookingStart,
        endAt: bookingEnd,
      },
    ],
  };

  const created = await reservationService.createReservation(request, {
    paymentLinkBaseUrl: "https://deskatlas.test/pay",
  });

  await paymentSessionService.submitPaymentProof({
    token: created.paymentSession!.token,
    paymentMethodId: "pm-gcash",
    proofStoragePath: "proofs/jane.png",
  });

  const session = await paymentSessionService.getPaymentSession(created.paymentSession!.token);
  await paymentReviewService.reviewPayment({
    paymentAttemptId: session.paymentAttemptId,
    actor: adminActor,
    decision: "APPROVE",
  });

  const access = await bookingAccessService.issueBookingAccess(
    created.id,
    created.referenceCode,
    "https://deskatlas.com/booking"
  );
  assert.ok(access, "Booking access should be issued");

  // 2. Active QR Scan Modal Data test
  await runTest("active booking QR returns full modal details", async () => {
    now = new Date("2026-08-29T10:30:00.000Z"); // 30 mins into 2 hour booking
    const result = await bookingAccessService.resolveBookingAccess(access!.token);

    assert.strictEqual(result.reservationId, created.id);
    assert.strictEqual(result.referenceCode, created.referenceCode);
    assert.strictEqual(result.reservationStatus, "CONFIRMED");
    assert.strictEqual(result.accessState, "ACTIVE");
    assert.strictEqual(result.checkInState, "NOT_CHECKED_IN");
    assert.strictEqual(result.customerName, "Jane Doe");
    assert.strictEqual(result.customerEmail, "jane.doe@example.com");
    assert.strictEqual(result.workspaceInstanceId, instance.id);
    assert.strictEqual(result.bookingStartAt, bookingStart);
    assert.strictEqual(result.bookingEndAt, bookingEnd);
    assert.strictEqual(result.timeRemainingSeconds, 5400); // 90 mins remaining
  });

  // 3. Before-start scan test
  await runTest("scan before start time returns NOT_ACTIVE with 0 remaining seconds", async () => {
    now = new Date("2026-08-29T09:45:00.000Z"); // 15 mins before booking
    const result = await bookingAccessService.resolveBookingAccess(access!.token);

    assert.strictEqual(result.accessState, "NOT_ACTIVE");
    assert.strictEqual(result.timeRemainingSeconds, 0);
    assert.strictEqual(result.customerName, "Jane Doe");
  });

  // 4. After-end scan test
  await runTest("scan after end time returns EXPIRED", async () => {
    now = new Date("2026-08-29T12:05:00.000Z"); // 5 mins after booking end
    const result = await bookingAccessService.resolveBookingAccess(access!.token);

    assert.strictEqual(result.accessState, "EXPIRED");
    assert.strictEqual(result.timeRemainingSeconds, 0);
  });

  // 5. Cancelled reservation scan test
  await runTest("cancelled reservation returns INVALID", async () => {
    const res = reservationRepo.getReservations().find((r) => r.id === created.id);
    if (res) res.status = "CANCELLED";

    now = new Date("2026-08-29T10:30:00.000Z");
    const result = await bookingAccessService.resolveBookingAccess(access!.token);
    assert.strictEqual(result.accessState, "INVALID");

    // Restore status
    if (res) res.status = "CONFIRMED";
  });

  // 6. Revoked QR token test
  await runTest("revoked token returns INVALID", async () => {
    const res = reservationRepo.getReservations().find((r) => r.id === created.id);
    if (res) res.qrRevokedAt = "2026-08-29T10:15:00.000Z";

    now = new Date("2026-08-29T10:30:00.000Z");
    const result = await bookingAccessService.resolveBookingAccess(access!.token);
    assert.strictEqual(result.accessState, "INVALID");

    // Restore
    if (res) res.qrRevokedAt = null;
  });

  // 7. Unknown token test
  await runTest("unknown token throws BookingAccessError", async () => {
    await assert.rejects(
      async () => {
        await bookingAccessService.resolveBookingAccess("unknown-nonexistent-token");
      },
      (err: any) => {
        assert.ok(err instanceof BookingAccessError);
        assert.strictEqual(err.message, "Invalid booking token.");
        return true;
      }
    );
  });

  // 8. Repeated scan and re-entry test
  await runTest("repeated scan during active window supports re-entry and check-in/out states", async () => {
    now = new Date("2026-08-29T10:10:00.000Z");

    // 1st scan: not checked in
    const scan1 = await bookingAccessService.resolveBookingAccess(access!.token);
    assert.strictEqual(scan1.accessState, "ACTIVE");
    assert.strictEqual(scan1.checkInState, "NOT_CHECKED_IN");

    // Check in via Staff action
    await staffOperationsService.checkInReservation({
      reservationId: created.id,
      actor: staffActor,
    });

    // 2nd scan (Re-entry): checked in
    now = new Date("2026-08-29T10:45:00.000Z");
    const scan2 = await bookingAccessService.resolveBookingAccess(access!.token);
    assert.strictEqual(scan2.accessState, "ACTIVE");
    assert.strictEqual(scan2.checkInState, "CHECKED_IN");
    assert.ok(scan2.checkedInAt);

    // Check out
    await staffOperationsService.checkOutReservation({
      reservationId: created.id,
      actor: staffActor,
    });

    // 3rd scan: checked out
    now = new Date("2026-08-29T11:00:00.000Z");
    const scan3 = await bookingAccessService.resolveBookingAccess(access!.token);
    assert.strictEqual(scan3.accessState, "ACTIVE");
    assert.strictEqual(scan3.checkInState, "CHECKED_OUT");
    assert.ok(scan3.checkedOutAt);
  });

  // 9. Scan event audit recording test
  await runTest("scans record audit scan events", async () => {
    assert.ok(
      reservationRepo.getBookingScanEvents().length > 0,
      "Scan events should be recorded in repository"
    );
    const lastEvent =
      reservationRepo.getBookingScanEvents()[reservationRepo.getBookingScanEvents().length - 1];
    assert.strictEqual(lastEvent.reservationId, created.id);
  });

  // 10. Opaque token contains no PII
  await runTest("raw token contains no customer PII", async () => {
    assert.ok(!access!.token.includes("Jane"));
    assert.ok(!access!.token.includes("Doe"));
    assert.ok(!access!.token.includes("jane.doe@example.com"));
    assert.ok(!access!.token.includes(created.id));
  });

  console.log("All MF-15 tests passed!");
}

runTests();
