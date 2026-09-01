import assert from "node:assert/strict";
import {
  CandidateValidationError,
  CandidateValidationContext,
  InMemoryAvailabilityRepository,
  InMemoryWorkspaceRepository,
  ReservationMemoryRepository,
  createAvailabilityService,
  createPaymentSessionService,
  createReservationService,
  validateCandidates,
  type CandidateSubmissionDTO,
  type TemplateAvailabilityQuery,
} from "../packages/domain/src/index";
import { WorkspaceInstance, WorkspaceTemplate } from "../packages/domain/src/models/workspace";

async function run() {
  console.log("--- Starting MF-41 Customer Template First Reserve Flow Tests ---");

  // 1. Setup in-memory repository for template-wide availability
  const availRepo = new InMemoryAvailabilityRepository();
  availRepo.setBusinessSettings({
    timezone: "Asia/Manila",
    bookingIntervalMinutes: 60,
  });

  const TEMPLATE_DESK: WorkspaceTemplate = {
    id: "tpl-desk",
    name: "Dedicated Hot Desk",
    description: "High speed WiFi desk",
    photoPath: "/photos/hot-desk.jpg",
    capacity: 1,
    rateAmount: 60,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#E0EFE4",
    defaultStyle: {},
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const TEMPLATE_POD: WorkspaceTemplate = {
    id: "tpl-pod",
    name: "Skypod Focus",
    description: "Single pod",
    photoPath: "/photos/pod.jpg",
    capacity: 1,
    rateAmount: 90,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#DCFCE7",
    defaultStyle: {},
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Seed instances
  // Desk 01: ACTIVE, available
  availRepo.seedWorkspaceInstance({
    id: "inst-desk-01",
    templateId: "tpl-desk",
    instanceCode: "HD01",
    displayName: "Hot Desk 01",
    operationalStatus: "ACTIVE",
    template: TEMPLATE_DESK,
  });

  // Desk 02: ACTIVE, has a confirmed reservation from 10:00 AM to 12:00 PM Manila
  availRepo.seedWorkspaceInstance({
    id: "inst-desk-02",
    templateId: "tpl-desk",
    instanceCode: "HD02",
    displayName: "Hot Desk 02",
    operationalStatus: "ACTIVE",
    template: TEMPLATE_DESK,
  });

  // Desk 03: MAINTENANCE
  availRepo.seedWorkspaceInstance({
    id: "inst-desk-03",
    templateId: "tpl-desk",
    instanceCode: "HD03",
    displayName: "Hot Desk 03",
    operationalStatus: "MAINTENANCE",
    template: TEMPLATE_DESK,
  });

  // Desk 04: BROKEN
  availRepo.seedWorkspaceInstance({
    id: "inst-desk-04",
    templateId: "tpl-desk",
    instanceCode: "HD04",
    displayName: "Hot Desk 04",
    operationalStatus: "BROKEN",
    template: TEMPLATE_DESK,
  });

  // Skypod 01: ACTIVE, different template
  availRepo.seedWorkspaceInstance({
    id: "inst-pod-01",
    templateId: "tpl-pod",
    instanceCode: "SP01",
    displayName: "Skypod 01",
    operationalStatus: "ACTIVE",
    template: TEMPLATE_POD,
  });

  // Operating hours: 09:00:00 to 18:00:00
  for (let d = 0; d < 7; d++) {
    availRepo.seedOperatingHours(d, [{ opensAt: "09:00:00", closesAt: "18:00:00" }]);
  }

  // Seed blocking reservation on Desk 02: 10:00 AM - 12:00 PM Manila (02:00 - 04:00 UTC) on 2026-10-15
  availRepo.seedBlockingReservation("inst-desk-02", {
    reservationId: "res-blocking-1",
    reservationStatus: "CONFIRMED",
    startAt: "2026-10-15T02:00:00.000Z", // 10:00 AM Manila
    endAt: "2026-10-15T04:00:00.000Z",   // 12:00 PM Manila
  });

  const availService = createAvailabilityService(availRepo);

  // 1. Acceptance Criterion: Query template availability for 10:00 AM (2 hours)
  console.log("1. Testing template-wide instance availability query at 10:00 AM (2 hours)...");
  const availAt10am = await availService.listTemplateAvailability({
    templateId: "tpl-desk",
    date: "2026-10-15",
    durationMinutes: 120,
    startTime: "10:00",
    nowIso: "2026-10-14T00:00:00.000Z",
  });

  assert.equal(availAt10am.templateId, "tpl-desk");
  assert.equal(availAt10am.templateName, "Dedicated Hot Desk");
  assert.equal(availAt10am.startTime, "10:00");
  assert.equal(availAt10am.endTime, "12:00");
  assert.equal(availAt10am.durationMinutes, 120);
  assert.equal(availAt10am.allInstances.length, 4, "4 instances for template");

  // Desk 01 should be available
  const desk1 = availAt10am.allInstances.find((i) => i.workspaceInstanceId === "inst-desk-01");
  assert.ok(desk1);
  assert.equal(desk1.isAvailable, true);
  assert.equal(desk1.blockingReason, null);

  // Desk 02 should be reserved/unavailable
  const desk2 = availAt10am.allInstances.find((i) => i.workspaceInstanceId === "inst-desk-02");
  assert.ok(desk2);
  assert.equal(desk2.isAvailable, false);
  assert.equal(desk2.blockingReason, "RESERVATION_CONFLICT");

  // Desk 03 (MAINTENANCE) should be unavailable
  const desk3 = availAt10am.allInstances.find((i) => i.workspaceInstanceId === "inst-desk-03");
  assert.ok(desk3);
  assert.equal(desk3.isAvailable, false);

  // Desk 04 (BROKEN) should be unavailable
  const desk4 = availAt10am.allInstances.find((i) => i.workspaceInstanceId === "inst-desk-04");
  assert.ok(desk4);
  assert.equal(desk4.isAvailable, false);

  // Only Desk 01 should be in availableInstances
  assert.equal(availAt10am.availableInstances.length, 1);
  assert.equal(availAt10am.availableInstances[0].workspaceInstanceId, "inst-desk-01");
  console.log("[PASS] Correctly evaluated template-wide availability and filtered conflicted/maintenance instances");

  // 2. Acceptance Criterion: Query template availability for 01:00 PM (after reservation on Desk 02 ends)
  console.log("2. Testing template-wide instance availability query at 01:00 PM (13:00)...");
  const availAt1pm = await availService.listTemplateAvailability({
    templateId: "tpl-desk",
    date: "2026-10-15",
    durationMinutes: 120,
    startTime: "13:00",
    nowIso: "2026-10-14T00:00:00.000Z",
  });

  const desk2At1pm = availAt1pm.allInstances.find((i) => i.workspaceInstanceId === "inst-desk-02");
  assert.ok(desk2At1pm);
  assert.equal(desk2At1pm.isAvailable, true, "Desk 02 is available at 1:00 PM");

  assert.equal(availAt1pm.availableInstances.length, 2, "Desk 01 and Desk 02 are available");
  console.log("[PASS] Correctly unlocked Desk 02 at 01:00 PM when reservation has ended");

  // 3. Acceptance Criterion: Template-first linear candidate validation rules
  console.log("3. Testing template-first candidate validation rules...");
  const validationInstances: WorkspaceInstance[] = [
    {
      id: "inst-desk-01",
      templateId: "tpl-desk",
      floorId: "floor-1",
      instanceCode: "HD01",
      displayName: "Hot Desk 01",
      operationalStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "inst-desk-02",
      templateId: "tpl-desk",
      floorId: "floor-1",
      instanceCode: "HD02",
      displayName: "Hot Desk 02",
      operationalStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "inst-pod-01",
      templateId: "tpl-pod",
      floorId: "floor-1",
      instanceCode: "SP01",
      displayName: "Skypod 01",
      operationalStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const validationContext: CandidateValidationContext = {
    instances: validationInstances,
    templates: [TEMPLATE_DESK, TEMPLATE_POD],
  };

  // 3a. Main only candidate
  const mainOnly: CandidateSubmissionDTO[] = [
    {
      rank: 0,
      workspaceInstanceId: "inst-desk-01",
      startAt: "2026-10-15T02:00:00.000Z", // 10:00 AM Manila
      endAt: "2026-10-15T04:00:00.000Z",   // 12:00 PM Manila (2 hrs)
    },
  ];
  validateCandidates(mainOnly, validationContext);
  console.log("[PASS] Main only candidate successfully validated");

  // 3b. Main + Backup 1 on different instance
  const mainPlusDiffInstance: CandidateSubmissionDTO[] = [
    {
      rank: 0,
      workspaceInstanceId: "inst-desk-01",
      startAt: "2026-10-15T02:00:00.000Z",
      endAt: "2026-10-15T04:00:00.000Z",
    },
    {
      rank: 1,
      workspaceInstanceId: "inst-desk-02",
      startAt: "2026-10-15T02:00:00.000Z",
      endAt: "2026-10-15T04:00:00.000Z",
    },
  ];
  validateCandidates(mainPlusDiffInstance, validationContext);
  console.log("[PASS] Main + Backup on different physical instance successfully validated");

  // 3c. Main + Backup 1 on SAME instance with different start time (MF-34)
  const mainPlusSameInstanceDiffTime: CandidateSubmissionDTO[] = [
    {
      rank: 0,
      workspaceInstanceId: "inst-desk-01",
      startAt: "2026-10-15T02:00:00.000Z", // 10:00 AM - 12:00 PM (2 hrs)
      endAt: "2026-10-15T04:00:00.000Z",
    },
    {
      rank: 1,
      workspaceInstanceId: "inst-desk-01", // Same instance, different time
      startAt: "2026-10-15T05:00:00.000Z", // 01:00 PM - 03:00 PM (2 hrs)
      endAt: "2026-10-15T07:00:00.000Z",
    },
  ];
  validateCandidates(mainPlusSameInstanceDiffTime, validationContext);
  console.log("[PASS] Same physical instance with different start time successfully validated");

  // 3d. Rejects duplicate instance with identical start time
  assert.throws(
    () => {
      const duplicate: CandidateSubmissionDTO[] = [
        {
          rank: 0,
          workspaceInstanceId: "inst-desk-01",
          startAt: "2026-10-15T02:00:00.000Z",
          endAt: "2026-10-15T04:00:00.000Z",
        },
        {
          rank: 1,
          workspaceInstanceId: "inst-desk-01",
          startAt: "2026-10-15T02:00:00.000Z",
          endAt: "2026-10-15T04:00:00.000Z",
        },
      ];
      validateCandidates(duplicate, validationContext);
    },
    (err: any) =>
      err instanceof CandidateValidationError &&
      err.message.includes("Duplicate candidate selection")
  );
  console.log("[PASS] Rejected duplicate instance with identical start time");

  // 3e. Rejects backup with different workspace template
  assert.throws(
    () => {
      const diffTemplate: CandidateSubmissionDTO[] = [
        {
          rank: 0,
          workspaceInstanceId: "inst-desk-01", // Hot desk
          startAt: "2026-10-15T02:00:00.000Z",
          endAt: "2026-10-15T04:00:00.000Z",
        },
        {
          rank: 1,
          workspaceInstanceId: "inst-pod-01",  // Skypod
          startAt: "2026-10-15T02:00:00.000Z",
          endAt: "2026-10-15T04:00:00.000Z",
        },
      ];
      validateCandidates(diffTemplate, validationContext);
    },
    (err: any) =>
      err instanceof CandidateValidationError &&
      err.message.includes("same template/tier")
  );
  console.log("[PASS] Rejected backup with different workspace template");

  // 4. End-to-End Guest Reservation Creation with Template-First Flow Data
  console.log("4. Testing end-to-end guest reservation creation...");
  const resRepo = new ReservationMemoryRepository();
  const wsRepo = new InMemoryWorkspaceRepository();
  const paySessionSvc = createPaymentSessionService(resRepo);
  const resService = createReservationService(resRepo, wsRepo, resRepo, paySessionSvc);

  const floor = await wsRepo.createFloor({ name: "Main Floor" });
  const tpl = await wsRepo.createTemplate({
    name: "Dedicated Hot Desk",
    capacity: 1,
    rateAmount: 60,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#E0EFE4",
    isActive: true,
  });

  const deskA = await wsRepo.createInstance({
    templateId: tpl.id,
    floorId: floor.id,
    instanceCode: "HD01",
    displayName: "Hot Desk 01",
  });
  const deskB = await wsRepo.createInstance({
    templateId: tpl.id,
    floorId: floor.id,
    instanceCode: "HD02",
    displayName: "Hot Desk 02",
  });

  const reservation = await resService.createReservation(
    {
      source: "WEB",
      customerFirstName: "Ana",
      customerLastName: "Reyes",
      customerEmail: "ana.reyes@example.com",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: deskA.id,
          startAt: "2026-10-15T02:00:00.000Z", // 10:00 AM - 12:00 PM (2 hrs)
          endAt: "2026-10-15T04:00:00.000Z",
        },
        {
          rank: 1,
          workspaceInstanceId: deskB.id,
          startAt: "2026-10-15T02:00:00.000Z", // 10:00 AM - 12:00 PM (2 hrs)
          endAt: "2026-10-15T04:00:00.000Z",
        },
      ],
    },
    { paymentLinkBaseUrl: "https://deskatlas.test/pay" }
  );

  assert.ok(reservation.id);
  assert.equal(reservation.status, "PENDING_PAYMENT");
  assert.equal(reservation.rateSnapshot, 60);
  assert.equal(reservation.amountDue, 120, "2 hours @ 60/hr = 120");
  assert.equal(reservation.candidates?.length, 2);
  assert.equal(reservation.candidates[0].rank, 0);
  assert.equal(reservation.candidates[0].isAssigned, false, "No-hold rule preserved");
  assert.equal(reservation.candidates[1].rank, 1);
  assert.equal(reservation.candidates[1].isAssigned, false, "No-hold rule preserved");
  console.log("[PASS] Full reservation created with template-first candidates and no-hold rule");

  console.log("--- All MF-41 Customer Template First Reserve Flow Tests Passed Successfully! ---");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
