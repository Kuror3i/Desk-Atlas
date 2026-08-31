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
  createAvailabilityService,
  InMemoryWorkspaceRepository,
  InMemoryAvailabilityRepository,
  type CreateReservationRequest,
} from "../packages/domain/src/index";
import type { WorkspaceTemplate } from "../packages/domain/src/models/workspace";

async function runTests() {
  const reservationRepo = new ReservationMemoryRepository();
  const workspaceRepo = new InMemoryWorkspaceRepository();
  let now = new Date("2026-08-31T09:00:00.000Z");
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

  // Setup catalog
  const floor = await workspaceRepo.createFloor({ name: "Ground Floor" });
  const hotDeskTemplate = await workspaceRepo.createTemplate({
    name: "Hot Desk",
    capacity: 1,
    rateAmount: 100,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#0f172a",
    isActive: true,
  });

  const skypodTemplate = await workspaceRepo.createTemplate({
    name: "Skypod",
    capacity: 2,
    rateAmount: 250,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#16723a",
    isActive: true,
  });

  const hd1 = await workspaceRepo.createInstance({
    templateId: hotDeskTemplate.id,
    floorId: floor.id,
    instanceCode: "HD-01",
    displayName: "Hot Desk 1",
  });
  const hd2 = await workspaceRepo.createInstance({
    templateId: hotDeskTemplate.id,
    floorId: floor.id,
    instanceCode: "HD-02",
    displayName: "Hot Desk 2",
  });
  const sp1 = await workspaceRepo.createInstance({
    templateId: skypodTemplate.id,
    floorId: floor.id,
    instanceCode: "SP-01",
    displayName: "Skypod 1",
  });

  // Setup availability repository
  const availRepo = new InMemoryAvailabilityRepository();
  availRepo.setBusinessSettings({
    timezone: "Asia/Manila",
    bookingIntervalMinutes: 30,
  });

  const templateDeskModel: WorkspaceTemplate = {
    id: hotDeskTemplate.id,
    name: hotDeskTemplate.name,
    description: "High speed WiFi desk",
    photoPath: null,
    capacity: hotDeskTemplate.capacity,
    rateAmount: hotDeskTemplate.rateAmount,
    pricingUnit: hotDeskTemplate.pricingUnit,
    defaultShape: "rectangle",
    defaultColor: "#0f172a",
    defaultStyle: {},
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const templatePodModel: WorkspaceTemplate = {
    id: skypodTemplate.id,
    name: skypodTemplate.name,
    description: "Skypod focus unit",
    photoPath: null,
    capacity: skypodTemplate.capacity,
    rateAmount: skypodTemplate.rateAmount,
    pricingUnit: skypodTemplate.pricingUnit,
    defaultShape: "rectangle",
    defaultColor: "#16723a",
    defaultStyle: {},
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  availRepo.seedWorkspaceInstance({
    id: hd1.id,
    templateId: hotDeskTemplate.id,
    floorId: floor.id,
    instanceCode: "HD-01",
    displayName: "Hot Desk 1",
    operationalStatus: "ACTIVE",
    template: templateDeskModel,
  });
  availRepo.seedWorkspaceInstance({
    id: hd2.id,
    templateId: hotDeskTemplate.id,
    floorId: floor.id,
    instanceCode: "HD-02",
    displayName: "Hot Desk 2",
    operationalStatus: "ACTIVE",
    template: templateDeskModel,
  });
  availRepo.seedWorkspaceInstance({
    id: sp1.id,
    templateId: skypodTemplate.id,
    floorId: floor.id,
    instanceCode: "SP-01",
    displayName: "Skypod 1",
    operationalStatus: "ACTIVE",
    template: templatePodModel,
  });

  for (let d = 0; d < 7; d++) {
    availRepo.seedOperatingHours(d, [{ opensAt: "08:00:00", closesAt: "22:00:00" }]);
  }

  const availabilityService = createAvailabilityService(availRepo);

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

  // 1. Template-first immediate availability lookup
  await runTest("template-first immediate availability returns available physical instances", async () => {
    const res = await availabilityService.listTemplateAvailability({
      templateId: hotDeskTemplate.id,
      date: "2026-08-31",
      durationMinutes: 120,
      startTime: "10:00",
      nowIso: "2026-08-31T01:00:00.000Z", // 09:00 AM Manila
    });

    assert.strictEqual(res.templateId, hotDeskTemplate.id);
    assert.strictEqual(res.templateName, "Hot Desk");
    assert.strictEqual(res.durationMinutes, 120);
    assert.strictEqual(res.startTime, "10:00");
    assert.strictEqual(res.endTime, "12:00");
    assert.strictEqual(res.availableInstances.length, 2);
    assert.ok(res.availableInstances.some((i) => i.workspaceInstanceId === hd1.id));
    assert.ok(res.availableInstances.some((i) => i.workspaceInstanceId === hd2.id));
  });

  // 2. Kiosk immediate reservation creation with single candidate rank 0
  await runTest("kiosk creates immediate pending counter reservation with reference code", async () => {
    const reservation = await reservationService.createReservation({
      source: "KIOSK",
      customerFirstName: "Mateo",
      customerLastName: "Cruz",
      customerEmail: "mateo@example.com",
      paymentMethodId: "pm-cash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: hd1.id,
          startAt: "2026-08-31T09:00:00.000Z",
          endAt: "2026-08-31T11:00:00.000Z",
        },
      ],
    });

    assert.strictEqual(reservation.source, "KIOSK");
    assert.strictEqual(reservation.status, "PENDING_COUNTER_CONFIRMATION");
    assert.ok(reservation.referenceCode && reservation.referenceCode.startsWith("DA-"));
    assert.ok(reservation.counterPaymentAttemptId);
    assert.strictEqual(reservation.candidates?.length, 1);
    assert.strictEqual(reservation.paymentSession, undefined); // No web payment session
  });

  // 3. Multi-candidate / backup rejected for kiosk
  await expectError(
    "kiosk rejects backup selections / multiple candidates",
    async () => {
      await reservationService.createReservation({
        source: "KIOSK",
        customerFirstName: "Elena",
        customerLastName: "Reyes",
        customerEmail: "elena@example.com",
        paymentMethodId: "pm-gcash",
        candidates: [
          {
            rank: 0,
            workspaceInstanceId: hd1.id,
            startAt: "2026-08-31T09:00:00.000Z",
            endAt: "2026-08-31T11:00:00.000Z",
          },
          {
            rank: 1,
            workspaceInstanceId: hd2.id,
            startAt: "2026-08-31T09:00:00.000Z",
            endAt: "2026-08-31T11:00:00.000Z",
          },
        ],
      });
    },
    "Kiosk reservations require exactly one candidate (Main).",
    ReservationError
  );

  // 4. Kiosk reference code lookup by Staff
  await runTest("kiosk reference code is lookable by staff", async () => {
    const reservation = await reservationService.createReservation({
      source: "KIOSK",
      customerFirstName: "Lucas",
      customerLastName: "Santos",
      customerEmail: "lucas@example.com",
      paymentMethodId: "pm-cash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: sp1.id,
          startAt: "2026-08-31T09:00:00.000Z",
          endAt: "2026-08-31T12:00:00.000Z",
        },
      ],
    });

    const record = await counterPaymentService.getCounterPaymentRecordByCode(reservation.referenceCode);
    assert.strictEqual(record.reservationReferenceCode, reservation.referenceCode);
    assert.strictEqual(record.customerFirstName, "Lucas");
    assert.strictEqual(record.customerLastName, "Santos");
    assert.strictEqual(record.amountDue, 750); // 3 hrs * 250
    assert.strictEqual(record.paymentStatus, "PENDING");
  });

  // 5. Staff confirmation by reference code confirms reservation and assigns spot
  await runTest("staff confirmation by code confirms reservation and enables QR pass", async () => {
    const reservation = await reservationService.createReservation({
      source: "KIOSK",
      customerFirstName: "Nina",
      customerLastName: "Gomez",
      customerEmail: "nina@example.com",
      paymentMethodId: "pm-cash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: hd2.id,
          startAt: "2026-08-31T13:00:00.000Z",
          endAt: "2026-08-31T15:00:00.000Z",
        },
      ],
    });

    const result = await counterPaymentService.confirmPayment({
      code: reservation.referenceCode,
      actor: { userId: "staff-101", role: "STAFF" },
    });

    assert.ok(result.reservationStatus === "CONFIRMED" || result.reservationStatus === "CHECKED_IN");
    assert.strictEqual(result.paymentStatus, "APPROVED");
    assert.strictEqual(result.assignedCandidateRank, 0);
    assert.strictEqual(result.assignedCandidate?.workspaceInstanceId, hd2.id);

    // Issue booking QR access for emailed pass
    const bookingAccess = await bookingAccessService.issueBookingAccess(
      result.reservationId,
      result.reservationReferenceCode,
      "https://deskatlas.test/booking"
    );
    assert.ok(bookingAccess?.token);

    now = new Date("2026-08-31T13:30:00.000Z");
    const scan = await bookingAccessService.resolveBookingAccess(bookingAccess!.token);
    assert.strictEqual(scan.accessState, "ACTIVE");
    assert.strictEqual(scan.referenceCode, reservation.referenceCode);
    assert.strictEqual(scan.customerName, "Nina Gomez");
  });

  // 6. Admin confirmation by reference code
  await runTest("admin confirmation by code also confirms kiosk reservation", async () => {
    const reservation = await reservationService.createReservation({
      source: "KIOSK",
      customerFirstName: "Gabriel",
      customerLastName: "Vidal",
      customerEmail: "gabriel@example.com",
      paymentMethodId: "pm-gcash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: hd1.id,
          startAt: "2026-08-31T16:00:00.000Z",
          endAt: "2026-08-31T18:00:00.000Z",
        },
      ],
    });

    const result = await counterPaymentService.confirmPayment({
      code: reservation.referenceCode,
      actor: { userId: "admin-101", role: "ADMIN" },
    });

    assert.ok(result.reservationStatus === "CONFIRMED" || result.reservationStatus === "CHECKED_IN");
    assert.strictEqual(result.paymentStatus, "APPROVED");
  });

  // 7. Concurrency collision: moves to Needs Manual Resolution without automatic fallback
  await runTest("collision during confirmation moves reservation to Needs Manual Resolution", async () => {
    // 1st booking confirmed for SP-01
    const firstRes = await reservationService.createReservation({
      source: "KIOSK",
      customerFirstName: "First",
      customerLastName: "Customer",
      customerEmail: "first@example.com",
      paymentMethodId: "pm-cash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: sp1.id,
          startAt: "2026-08-31T18:00:00.000Z",
          endAt: "2026-08-31T20:00:00.000Z",
        },
      ],
    });

    await counterPaymentService.confirmPayment({
      code: firstRes.referenceCode,
      actor: { userId: "staff-101", role: "STAFF" },
    });

    // 2nd booking created for same SP-01 at same time
    const secondRes = await reservationService.createReservation({
      source: "KIOSK",
      customerFirstName: "Second",
      customerLastName: "Customer",
      customerEmail: "second@example.com",
      paymentMethodId: "pm-cash",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: sp1.id,
          startAt: "2026-08-31T18:00:00.000Z",
          endAt: "2026-08-31T20:00:00.000Z",
        },
      ],
    });

    const result = await counterPaymentService.confirmPayment({
      code: secondRes.referenceCode,
      actor: { userId: "staff-101", role: "STAFF" },
    });

    assert.strictEqual(result.reservationStatus, "NEEDS_MANUAL_RESOLUTION");
    assert.strictEqual(result.assignedCandidate, null);
  });

  // 8. Unauthorized user cannot confirm payment
  await expectError(
    "unauthorized user cannot confirm kiosk payment",
    async () => {
      const reservation = await reservationService.createReservation({
        source: "KIOSK",
        customerFirstName: "Unauthorized",
        customerLastName: "Actor",
        customerEmail: "unauth@example.com",
        paymentMethodId: "pm-cash",
        candidates: [
          {
            rank: 0,
            workspaceInstanceId: hd1.id,
            startAt: "2026-08-31T20:00:00.000Z",
            endAt: "2026-08-31T21:00:00.000Z",
          },
        ],
      });

      await counterPaymentService.confirmPayment({
        code: reservation.referenceCode,
        actor: { userId: "customer-1", role: "CUSTOMER" as any },
      });
    },
    "Only ADMIN or STAFF may confirm kiosk counter payment.",
    CounterPaymentConflictError
  );

  // 9. Kiosk listOccupiedInstances identifies instances occupied now or within 5 mins
  await runTest("listOccupiedInstances returns instances occupied now or within 5 mins", async () => {
    const testNowIso = "2026-08-31T10:00:00.000Z";
    availRepo.seedBlockingReservation(hd1.id, {
      reservationId: "res-occupied-now",
      reservationStatus: "CONFIRMED",
      startAt: "2026-08-31T09:30:00.000Z",
      endAt: "2026-08-31T11:30:00.000Z",
    });

    availRepo.seedBlockingReservation(hd2.id, {
      reservationId: "res-occupied-soon",
      reservationStatus: "CONFIRMED",
      startAt: "2026-08-31T10:03:00.000Z", // 3 mins from now (within 5 mins)
      endAt: "2026-08-31T12:00:00.000Z",
    });

    availRepo.seedBlockingReservation(sp1.id, {
      reservationId: "res-occupied-later",
      reservationStatus: "CONFIRMED",
      startAt: "2026-08-31T10:15:00.000Z", // 15 mins from now (> 5 mins)
      endAt: "2026-08-31T12:00:00.000Z",
    });

    const occupiedResult = await availabilityService.listOccupiedInstances({ nowIso: testNowIso });
    assert.ok(occupiedResult.occupiedInstanceIds.includes(hd1.id), "HD-01 is occupied now and should be returned");
    assert.ok(occupiedResult.occupiedInstanceIds.includes(hd2.id), "HD-02 is occupied within 5 mins and should be returned");
    assert.ok(!occupiedResult.occupiedInstanceIds.includes(sp1.id), "SP-01 is occupied later (>5m) and should not be returned");
  });

  console.log("All MF42 tests passed!");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
