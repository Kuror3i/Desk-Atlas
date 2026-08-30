import * as assert from "assert";
import {
  CounterPaymentConflictError,
  ReservationError,
  ReservationMemoryRepository,
  createBookingAccessService,
  createCounterPaymentService,
  createReservationService,
  InMemoryWorkspaceRepository,
  type CreateReservationRequest,
} from "../packages/domain/src/index";

async function runTests() {
  const reservationRepo = new ReservationMemoryRepository();
  const workspaceRepo = new InMemoryWorkspaceRepository();
  let now = new Date("2026-08-27T09:00:00.000Z");
  const nowProvider = () => now;
  const reservationService = createReservationService(
    reservationRepo,
    workspaceRepo,
    reservationRepo
  );
  const counterPaymentService = createCounterPaymentService(reservationRepo, nowProvider);
  const bookingAccessService = createBookingAccessService(reservationRepo, nowProvider);

  const floor = await workspaceRepo.createFloor({ name: "Ground Floor" });
  const template = await workspaceRepo.createTemplate({
    name: "Skypod",
    capacity: 1,
    rateAmount: 150,
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
  const instanceC = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "SP-03",
    displayName: "Skypod 3",
  });
  const instanceD = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "SP-04",
    displayName: "Skypod 4",
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
        console.error(`[FAIL] ${name}: Unexpected error type`, error);
        process.exit(1);
      }

      assert.strictEqual(error.message, expectedMessage);
      console.log(`[PASS] ${name}`);
    }
  }

  async function createKioskReservation(input: {
    customerSlug: string;
    paymentMethodId: "pm-cash" | "pm-gcash";
    candidates: Array<{
      rank: 0 | 1 | 2;
      workspaceInstanceId: string;
      startAt: string;
      endAt: string;
    }>;
  }) {
    const request: CreateReservationRequest = {
      source: "KIOSK",
      customerFirstName: input.customerSlug,
      customerLastName: "Walker",
      customerEmail: `${input.customerSlug}@example.com`,
      paymentMethodId: input.paymentMethodId,
      candidates: input.candidates,
    };

    return reservationService.createReservation(request);
  }

  async function createConfirmedKioskReservation(
    customerSlug: string,
    paymentMethodId: "pm-cash" | "pm-gcash",
    candidates: Array<{
      rank: 0 | 1 | 2;
      workspaceInstanceId: string;
      startAt: string;
      endAt: string;
    }>,
    actor: { userId: string; role: "ADMIN" | "STAFF" }
  ) {
    const reservation = await createKioskReservation({
      customerSlug,
      paymentMethodId,
      candidates,
    });

    const result = await counterPaymentService.confirmPayment({
      paymentAttemptId: reservation.counterPaymentAttemptId!,
      actor,
    });

    return { reservation, result };
  }

  await runTest("kiosk create", async () => {
    const reservation = await createKioskReservation({
      customerSlug: "kiosk-create",
      paymentMethodId: "pm-cash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: instanceA.id,
          startAt: "2026-09-01T09:00:00.000Z",
          endAt: "2026-09-01T11:00:00.000Z",
        },
      ],
    });

    assert.strictEqual(reservation.source, "KIOSK");
    assert.strictEqual(reservation.status, "PENDING_COUNTER_CONFIRMATION");
    assert.ok(reservation.counterPaymentAttemptId);
  });

  await runTest("no web payment session", async () => {
    const reservation = await createKioskReservation({
      customerSlug: "no-web-session",
      paymentMethodId: "pm-gcash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: instanceB.id,
          startAt: "2026-09-02T09:00:00.000Z",
          endAt: "2026-09-02T11:00:00.000Z",
        },
      ],
    });

    assert.strictEqual(reservation.paymentSession, undefined);
    const record = await counterPaymentService.getCounterPaymentRecord(
      reservation.counterPaymentAttemptId!
    );
    assert.strictEqual(record.paymentMethodId, "pm-gcash");
    assert.strictEqual(record.paymentStatus, "PENDING");
  });

  await runTest("cash confirm", async () => {
    now = new Date("2026-08-27T09:05:00.000Z");
    const { reservation, result } = await createConfirmedKioskReservation(
      "cash-confirm",
      "pm-cash",
      [
        {
          rank: 0,
          workspaceInstanceId: instanceC.id,
          startAt: "2026-09-03T09:00:00.000Z",
          endAt: "2026-09-03T11:00:00.000Z",
        },
      ],
      { userId: "staff-user-1", role: "STAFF" }
    );

    assert.strictEqual(result.reservationStatus, "CONFIRMED");
    assert.strictEqual(result.paymentStatus, "APPROVED");
    const bookingAccess = await bookingAccessService.issueBookingAccess(
      reservation.id,
      reservation.referenceCode,
      "https://deskatlas.test/booking"
    );
    assert.ok(bookingAccess?.token);
  });

  await runTest("counter QR confirm", async () => {
    now = new Date("2026-08-27T09:10:00.000Z");
    const { result } = await createConfirmedKioskReservation(
      "counter-qr",
      "pm-gcash",
      [
        {
          rank: 0,
          workspaceInstanceId: instanceD.id,
          startAt: "2026-09-04T09:00:00.000Z",
          endAt: "2026-09-04T11:00:00.000Z",
        },
      ],
      { userId: "admin-user-1", role: "ADMIN" }
    );

    assert.strictEqual(result.reservationStatus, "CONFIRMED");
    assert.strictEqual(result.assignedCandidateRank, 0);
  });

  await runTest("allocation collision moves to manual resolution", async () => {
    await createConfirmedKioskReservation(
      "fallback-blocker",
      "pm-cash",
      [
        {
          rank: 0,
          workspaceInstanceId: instanceA.id,
          startAt: "2026-09-05T09:00:00.000Z",
          endAt: "2026-09-05T11:00:00.000Z",
        },
      ],
      { userId: "staff-user-2", role: "STAFF" }
    );

    now = new Date("2026-08-27T09:15:00.000Z");
    const reservation = await createKioskReservation({
      customerSlug: "fallback-target",
      paymentMethodId: "pm-cash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: instanceA.id,
          startAt: "2026-09-05T09:00:00.000Z",
          endAt: "2026-09-05T11:00:00.000Z",
        },
      ],
    });

    const result = await counterPaymentService.confirmPayment({
      paymentAttemptId: reservation.counterPaymentAttemptId!,
      actor: { userId: "staff-user-3", role: "STAFF" },
    });

    assert.strictEqual(result.reservationStatus, "NEEDS_MANUAL_RESOLUTION");
    assert.strictEqual(result.assignedCandidate, null);
  });

  await runTest("candidate lost moves to manual resolution", async () => {
    await createConfirmedKioskReservation(
      "manual-main",
      "pm-cash",
      [
        {
          rank: 0,
          workspaceInstanceId: instanceA.id,
          startAt: "2026-09-06T09:00:00.000Z",
          endAt: "2026-09-06T11:00:00.000Z",
        },
      ],
      { userId: "staff-user-4", role: "STAFF" }
    );

    now = new Date("2026-08-27T09:20:00.000Z");
    const reservation = await createKioskReservation({
      customerSlug: "manual-resolution",
      paymentMethodId: "pm-gcash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: instanceA.id,
          startAt: "2026-09-06T09:00:00.000Z",
          endAt: "2026-09-06T11:00:00.000Z",
        },
      ],
    });

    const result = await counterPaymentService.confirmPayment({
      paymentAttemptId: reservation.counterPaymentAttemptId!,
      actor: { userId: "admin-user-2", role: "ADMIN" },
    });

    assert.strictEqual(result.reservationStatus, "NEEDS_MANUAL_RESOLUTION");
    assert.strictEqual(result.assignedCandidate, null);
  });

  await runTest("QR email readiness", async () => {
    now = new Date("2026-08-27T09:25:00.000Z");
    const { reservation } = await createConfirmedKioskReservation(
      "qr-email",
      "pm-gcash",
      [
        {
          rank: 0,
          workspaceInstanceId: instanceD.id,
          startAt: "2026-09-07T09:00:00.000Z",
          endAt: "2026-09-07T11:00:00.000Z",
        },
      ],
      { userId: "staff-user-7", role: "STAFF" }
    );

    const bookingAccess = await bookingAccessService.issueBookingAccess(
      reservation.id,
      reservation.referenceCode,
      "https://deskatlas.test/booking"
    );
    const scan = await bookingAccessService.resolveBookingAccess(bookingAccess!.token);

    assert.strictEqual(scan.referenceCode, reservation.referenceCode);
    assert.ok(bookingAccess!.accessUrl.includes(bookingAccess!.token));
  });

  await runTest("web/kiosk source correctly persisted", async () => {
    const reservation = await createKioskReservation({
      customerSlug: "source-persisted",
      paymentMethodId: "pm-cash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: instanceA.id,
          startAt: "2026-09-08T09:00:00.000Z",
          endAt: "2026-09-08T11:00:00.000Z",
        },
      ],
    });

    const stored = reservationRepo.getReservations().find((entry) => entry.id === reservation.id);
    assert.strictEqual(stored?.source, "KIOSK");
  });

  await expectError(
    "kiosk backup candidates rejected",
    async () => {
      await createKioskReservation({
        customerSlug: "no-backups",
        paymentMethodId: "pm-cash",
        candidates: [
          {
            rank: 0,
            workspaceInstanceId: instanceA.id,
            startAt: "2026-09-09T09:00:00.000Z",
            endAt: "2026-09-09T11:00:00.000Z",
          },
          {
            rank: 1,
            workspaceInstanceId: instanceB.id,
            startAt: "2026-09-09T09:00:00.000Z",
            endAt: "2026-09-09T11:00:00.000Z",
          },
        ],
      });
    },
    "Kiosk reservations require exactly one candidate (Main).",
    ReservationError
  );

  await expectError(
    "invalid kiosk payment method rejected",
    async () => {
      await reservationService.createReservation({
        source: "KIOSK",
        customerFirstName: "Bad",
        customerLastName: "Method",
        customerEmail: "bad-method@example.com",
        paymentMethodId: "pm-bank",
        candidates: [
          {
            rank: 0,
            workspaceInstanceId: instanceA.id,
            startAt: "2026-09-10T09:00:00.000Z",
            endAt: "2026-09-10T11:00:00.000Z",
          },
        ],
      });
    },
    "Invalid kiosk payment method.",
    ReservationError
  );

  await expectError(
    "only Admin or Staff may confirm kiosk payment",
    async () => {
      const reservation = await createKioskReservation({
        customerSlug: "bad-actor",
        paymentMethodId: "pm-cash",
        candidates: [
          {
            rank: 0,
            workspaceInstanceId: instanceB.id,
            startAt: "2026-09-11T09:00:00.000Z",
            endAt: "2026-09-11T11:00:00.000Z",
          },
        ],
      });

      await counterPaymentService.confirmPayment({
        paymentAttemptId: reservation.counterPaymentAttemptId!,
        actor: { userId: "viewer-1", role: "CUSTOMER" as any },
      });
    },
    "Only ADMIN or STAFF may confirm kiosk counter payment.",
    CounterPaymentConflictError
  );

  console.log("All M11 tests passed!");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
