import * as assert from "assert";
import {
  CounterPaymentConflictError,
  CounterPaymentError,
  PaymentReviewConflictError,
  ReservationError,
  ReservationMemoryRepository,
  createBookingAccessService,
  createCounterPaymentService,
  createPaymentReviewService,
  createPaymentSessionService,
  createReservationService,
  InMemoryWorkspaceRepository,
  type CreateReservationRequest,
} from "../packages/domain/src/index";

async function runTests() {
  const reservationRepo = new ReservationMemoryRepository();
  const workspaceRepo = new InMemoryWorkspaceRepository();
  let now = new Date("2026-08-29T10:00:00.000Z");
  const nowProvider = () => now;

  const reservationService = createReservationService(
    reservationRepo,
    workspaceRepo,
    reservationRepo
  );
  const counterPaymentService = createCounterPaymentService(reservationRepo, nowProvider);
  const bookingAccessService = createBookingAccessService(reservationRepo, nowProvider);
  const paymentReviewService = createPaymentReviewService(reservationRepo, nowProvider);
  const paymentSessionService = createPaymentSessionService(reservationRepo, nowProvider);

  const floor = await workspaceRepo.createFloor({ name: "Ground Floor" });
  const template = await workspaceRepo.createTemplate({
    name: "Hot Desk",
    capacity: 1,
    rateAmount: 100,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#0f172a",
    isActive: true,
  });

  const desk1 = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "HD-01",
    displayName: "Hot Desk 1",
  });
  const desk2 = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "HD-02",
    displayName: "Hot Desk 2",
  });
  const desk3 = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "HD-03",
    displayName: "Hot Desk 3",
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
        console.error(`[FAIL] ${name}: Unexpected error type ${error?.constructor?.name}`, error);
        process.exit(1);
      }

      assert.strictEqual(error.message, expectedMessage);
      console.log(`[PASS] ${name}`);
    }
  }

  // 1. Kiosk code generation and single candidate
  await runTest("kiosk creates pending counter reservation with generated reference code", async () => {
    const reservation = await reservationService.createReservation({
      source: "KIOSK",
      customerFirstName: "Alice",
      customerLastName: "Wonder",
      customerEmail: "alice@example.com",
      paymentMethodId: "pm-cash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: desk1.id,
          startAt: "2026-09-01T10:00:00.000Z",
          endAt: "2026-09-01T12:00:00.000Z",
        },
      ],
    });

    assert.strictEqual(reservation.source, "KIOSK");
    assert.strictEqual(reservation.status, "PENDING_COUNTER_CONFIRMATION");
    assert.ok(reservation.referenceCode && reservation.referenceCode.startsWith("DA-"));
    assert.ok(reservation.counterPaymentAttemptId);
    assert.strictEqual(reservation.candidates?.length, 1);
  });

  // 2. Multi-candidate / backup rejected
  await expectError(
    "kiosk rejects multiple candidates / backup selections",
    async () => {
      await reservationService.createReservation({
        source: "KIOSK",
        customerFirstName: "Bob",
        customerLastName: "Builder",
        customerEmail: "bob@example.com",
        paymentMethodId: "pm-cash",
        candidates: [
          {
            rank: 0,
            workspaceInstanceId: desk1.id,
            startAt: "2026-09-01T10:00:00.000Z",
            endAt: "2026-09-01T12:00:00.000Z",
          },
          {
            rank: 1,
            workspaceInstanceId: desk2.id,
            startAt: "2026-09-01T10:00:00.000Z",
            endAt: "2026-09-01T12:00:00.000Z",
          },
        ],
      });
    },
    "Kiosk reservations require exactly one candidate (Main).",
    ReservationError
  );

  // 3. Code lookup provides staff-safe summary
  await runTest("lookup by kiosk reference code returns booking summary", async () => {
    const reservation = await reservationService.createReservation({
      source: "KIOSK",
      customerFirstName: "Carol",
      customerLastName: "Danvers",
      customerEmail: "carol@example.com",
      paymentMethodId: "pm-cash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: desk2.id,
          startAt: "2026-09-02T10:00:00.000Z",
          endAt: "2026-09-02T12:00:00.000Z",
        },
      ],
    });

    const record = await counterPaymentService.getCounterPaymentRecordByCode(reservation.referenceCode);
    assert.strictEqual(record.reservationReferenceCode, reservation.referenceCode);
    assert.strictEqual(record.customerFirstName, "Carol");
    assert.strictEqual(record.customerLastName, "Danvers");
    assert.strictEqual(record.customerEmail, "carol@example.com");
    assert.strictEqual(record.amountDue, 200);
    assert.strictEqual(record.paymentStatus, "PENDING");
    assert.strictEqual(record.reservationStatus, "PENDING_COUNTER_CONFIRMATION");
  });

  // 4. Staff confirmation by code
  await runTest("staff can confirm kiosk payment by reference code", async () => {
    const reservation = await reservationService.createReservation({
      source: "KIOSK",
      customerFirstName: "David",
      customerLastName: "Copper",
      customerEmail: "david@example.com",
      paymentMethodId: "pm-cash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: desk3.id,
          startAt: "2026-09-03T10:00:00.000Z",
          endAt: "2026-09-03T12:00:00.000Z",
        },
      ],
    });

    const result = await counterPaymentService.confirmPayment({
      code: reservation.referenceCode,
      actor: { userId: "staff-101", role: "STAFF" },
    });

    assert.strictEqual(result.reservationStatus, "CONFIRMED");
    assert.strictEqual(result.paymentStatus, "APPROVED");
    assert.strictEqual(result.assignedCandidateRank, 0);
    assert.strictEqual(result.assignedCandidate?.workspaceInstanceId, desk3.id);

    // QR readiness
    const bookingAccess = await bookingAccessService.issueBookingAccess(
      result.reservationId,
      result.reservationReferenceCode,
      "https://deskatlas.test/booking"
    );
    assert.ok(bookingAccess?.token);
  });

  // 5. Admin confirmation by code
  await runTest("admin can confirm kiosk payment by reference code", async () => {
    const reservation = await reservationService.createReservation({
      source: "KIOSK",
      customerFirstName: "Eve",
      customerLastName: "Polastri",
      customerEmail: "eve@example.com",
      paymentMethodId: "pm-gcash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: desk1.id,
          startAt: "2026-09-04T10:00:00.000Z",
          endAt: "2026-09-04T12:00:00.000Z",
        },
      ],
    });

    const result = await counterPaymentService.confirmPayment({
      code: reservation.referenceCode,
      actor: { userId: "admin-101", role: "ADMIN" },
    });

    assert.strictEqual(result.reservationStatus, "CONFIRMED");
    assert.strictEqual(result.paymentStatus, "APPROVED");
    assert.strictEqual(result.assignedCandidateRank, 0);
  });

  // 6. Unknown / invalid code rejection
  await expectError(
    "invalid kiosk code lookup is rejected",
    async () => {
      await counterPaymentService.getCounterPaymentRecordByCode("NON-EXISTENT-CODE");
    },
    "Counter payment record was not found.",
    CounterPaymentError
  );

  await expectError(
    "invalid kiosk code confirmation is rejected",
    async () => {
      await counterPaymentService.confirmPayment({
        code: "NON-EXISTENT-CODE",
        actor: { userId: "staff-101", role: "STAFF" },
      });
    },
    "Counter payment attempt was not found.",
    Error
  );

  // 7. Non-staff/admin actor rejected
  await expectError(
    "customer actor cannot confirm kiosk payment",
    async () => {
      const reservation = await reservationService.createReservation({
        source: "KIOSK",
        customerFirstName: "Frank",
        customerLastName: "Castle",
        customerEmail: "frank@example.com",
        paymentMethodId: "pm-cash",
        candidates: [
          {
            rank: 0,
            workspaceInstanceId: desk2.id,
            startAt: "2026-09-05T10:00:00.000Z",
            endAt: "2026-09-05T12:00:00.000Z",
          },
        ],
      });

      await counterPaymentService.confirmPayment({
        code: reservation.referenceCode,
        actor: { userId: "cust-1", role: "CUSTOMER" as any },
      });
    },
    "Only ADMIN or STAFF may confirm kiosk counter payment.",
    CounterPaymentConflictError
  );

  // 8. Staff online web proof review denied
  await expectError(
    "staff cannot approve online web proof",
    async () => {
      const webReservation = await reservationService.createReservation(
        {
          source: "WEB",
          customerFirstName: "Grace",
          customerLastName: "Hopper",
          customerEmail: "grace@example.com",
          candidates: [
            {
              rank: 0,
              workspaceInstanceId: desk1.id,
              startAt: "2026-09-06T10:00:00.000Z",
              endAt: "2026-09-06T12:00:00.000Z",
            },
          ],
        },
        { paymentLinkBaseUrl: "https://deskatlas.test/pay" }
      );

      await paymentSessionService.submitPaymentProof({
        token: webReservation.paymentSession!.token,
        paymentMethodId: "pm-gcash",
        proofStoragePath: "proofs/grace.png",
      });

      await paymentReviewService.reviewPayment({
        paymentAttemptId: webReservation.paymentSession!.paymentAttemptId,
        decision: "APPROVE",
        actor: { userId: "staff-101", role: "STAFF" },
      });
    },
    "Only ADMIN may approve or reject online payment proof.",
    PaymentReviewConflictError
  );

  // 9. Concurrency & collision fallback to Needs Manual Resolution
  await runTest("if selected workspace is unavailable, moves to Needs Manual Resolution", async () => {
    // Admin confirms a booking for desk2 at 10-12
    const blocker = await reservationService.createReservation({
      source: "KIOSK",
      customerFirstName: "Blocker",
      customerLastName: "User",
      customerEmail: "blocker@example.com",
      paymentMethodId: "pm-cash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: desk2.id,
          startAt: "2026-09-07T10:00:00.000Z",
          endAt: "2026-09-07T12:00:00.000Z",
        },
      ],
    });

    await counterPaymentService.confirmPayment({
      code: blocker.referenceCode,
      actor: { userId: "staff-101", role: "STAFF" },
    });

    // Another kiosk booking for the same desk & time
    const collision = await reservationService.createReservation({
      source: "KIOSK",
      customerFirstName: "Collision",
      customerLastName: "User",
      customerEmail: "collision@example.com",
      paymentMethodId: "pm-cash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: desk2.id,
          startAt: "2026-09-07T10:00:00.000Z",
          endAt: "2026-09-07T12:00:00.000Z",
        },
      ],
    });

    const result = await counterPaymentService.confirmPayment({
      code: collision.referenceCode,
      actor: { userId: "staff-101", role: "STAFF" },
    });

    assert.strictEqual(result.reservationStatus, "NEEDS_MANUAL_RESOLUTION");
    assert.strictEqual(result.assignedCandidate, null);
  });

  // 10. QR access lookup after kiosk confirmation
  await runTest("booking QR token resolution after confirmation", async () => {
    const reservation = await reservationService.createReservation({
      source: "KIOSK",
      customerFirstName: "Helen",
      customerLastName: "Keller",
      customerEmail: "helen@example.com",
      paymentMethodId: "pm-cash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: desk3.id,
          startAt: "2026-09-08T10:00:00.000Z",
          endAt: "2026-09-08T12:00:00.000Z",
        },
      ],
    });

    const decision = await counterPaymentService.confirmPayment({
      code: reservation.referenceCode,
      actor: { userId: "staff-101", role: "STAFF" },
    });

    const bookingAccess = await bookingAccessService.issueBookingAccess(
      decision.reservationId,
      decision.reservationReferenceCode,
      "https://deskatlas.test/booking"
    );

    now = new Date("2026-09-08T10:30:00.000Z");
    const scan = await bookingAccessService.resolveBookingAccess(bookingAccess!.token);

    assert.strictEqual(scan.accessState, "ACTIVE");
    assert.strictEqual(scan.referenceCode, reservation.referenceCode);
    assert.strictEqual(scan.customerName, "Helen Keller");
  });

  console.log("All MF16 tests passed!");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
