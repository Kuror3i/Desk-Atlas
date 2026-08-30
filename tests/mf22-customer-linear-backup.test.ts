import assert from "node:assert/strict";
import {
  CandidateValidationError,
  CandidateValidationContext,
  InMemoryWorkspaceRepository,
  ReservationMemoryRepository,
  createPaymentSessionService,
  createReservationService,
  validateCandidates,
  type CandidateSubmissionDTO,
} from "../packages/domain/src/index";
import { WorkspaceInstance, WorkspaceTemplate } from "../packages/domain/src/models/workspace";

async function run() {
  console.log("--- Starting MF-22 Customer Linear Backup Selection Tests ---");

  const TEMPLATE_HOT_DESK: WorkspaceTemplate = {
    id: "tpl-hot-desk",
    name: "Dedicated Hot Desk",
    description: "Standard single desk",
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

  const TEMPLATE_MEETING_ROOM: WorkspaceTemplate = {
    id: "tpl-meeting-room",
    name: "Executive Meeting Room",
    description: "Private room with TV",
    photoPath: "/photos/meeting-room.jpg",
    capacity: 6,
    rateAmount: 300,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#DCFCE7",
    defaultStyle: {},
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const INSTANCES: WorkspaceInstance[] = [
    {
      id: "inst-desk-01",
      templateId: "tpl-hot-desk",
      floorId: "floor-1",
      instanceCode: "D01",
      displayName: "Hot Desk 01",
      operationalStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "inst-desk-02",
      templateId: "tpl-hot-desk",
      floorId: "floor-1",
      instanceCode: "D02",
      displayName: "Hot Desk 02",
      operationalStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "inst-desk-03",
      templateId: "tpl-hot-desk",
      floorId: "floor-1",
      instanceCode: "D03",
      displayName: "Hot Desk 03",
      operationalStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "inst-meet-01",
      templateId: "tpl-meeting-room",
      floorId: "floor-1",
      instanceCode: "M01",
      displayName: "Meeting Room 01",
      operationalStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const validationContext: CandidateValidationContext = {
    instances: INSTANCES,
    templates: [TEMPLATE_HOT_DESK, TEMPLATE_MEETING_ROOM],
  };

  // 1. Acceptance Criterion: Flow allows Main only (skipping backups)
  console.log("1. Testing Main only candidate (skipping backups)...");
  const mainOnlyCandidates: CandidateSubmissionDTO[] = [
    {
      rank: 0,
      workspaceInstanceId: "inst-desk-01",
      startAt: "2026-10-15T01:00:00.000Z", // 09:00 AM Manila
      endAt: "2026-10-15T04:00:00.000Z",   // 12:00 PM Manila (3 hours)
    },
  ];
  validateCandidates(mainOnlyCandidates, validationContext);
  assert.equal(mainOnlyCandidates.length, 1);
  assert.equal(mainOnlyCandidates[0].rank, 0);
  console.log("[PASS] Main only candidate successfully validated");

  // 2. Acceptance Criterion: Flow allows Main + Backup 1 (skipping Backup 2)
  console.log("2. Testing Main + Backup 1 (skipping Backup 2)...");
  const mainPlusBackup1: CandidateSubmissionDTO[] = [
    {
      rank: 0,
      workspaceInstanceId: "inst-desk-01",
      startAt: "2026-10-15T01:00:00.000Z",
      endAt: "2026-10-15T04:00:00.000Z",
    },
    {
      rank: 1,
      workspaceInstanceId: "inst-desk-02",
      startAt: "2026-10-15T02:00:00.000Z", // 10:00 AM Manila (different start time)
      endAt: "2026-10-15T05:00:00.000Z",   // 01:00 PM Manila (same 3 hours)
    },
  ];
  validateCandidates(mainPlusBackup1, validationContext);
  assert.equal(mainPlusBackup1.length, 2);
  assert.equal(mainPlusBackup1[0].rank, 0);
  assert.equal(mainPlusBackup1[1].rank, 1);
  console.log("[PASS] Main + Backup 1 successfully validated");

  // 3. Acceptance Criterion: Flow allows Main + Backup 1 + Backup 2
  console.log("3. Testing Main + Backup 1 + Backup 2...");
  const mainPlusTwoBackups: CandidateSubmissionDTO[] = [
    {
      rank: 0,
      workspaceInstanceId: "inst-desk-01",
      startAt: "2026-10-15T01:00:00.000Z",
      endAt: "2026-10-15T04:00:00.000Z",
    },
    {
      rank: 1,
      workspaceInstanceId: "inst-desk-02",
      startAt: "2026-10-15T02:00:00.000Z",
      endAt: "2026-10-15T05:00:00.000Z",
    },
    {
      rank: 2,
      workspaceInstanceId: "inst-desk-03",
      startAt: "2026-10-15T05:00:00.000Z", // 01:00 PM Manila (different start time)
      endAt: "2026-10-15T08:00:00.000Z",   // 04:00 PM Manila (same 3 hours)
    },
  ];
  validateCandidates(mainPlusTwoBackups, validationContext);
  assert.equal(mainPlusTwoBackups.length, 3);
  assert.equal(mainPlusTwoBackups[0].rank, 0);
  assert.equal(mainPlusTwoBackups[1].rank, 1);
  assert.equal(mainPlusTwoBackups[2].rank, 2);
  console.log("[PASS] Main + Backup 1 + Backup 2 successfully validated");

  // 4. Acceptance Criterion: Rejects backup with different workspace template/tier
  console.log("4. Testing rejection of backup with different template/tier...");
  assert.throws(
    () => {
      const invalidTierCandidates: CandidateSubmissionDTO[] = [
        {
          rank: 0,
          workspaceInstanceId: "inst-desk-01", // Hot desk
          startAt: "2026-10-15T01:00:00.000Z",
          endAt: "2026-10-15T04:00:00.000Z",
        },
        {
          rank: 1,
          workspaceInstanceId: "inst-meet-01", // Meeting room
          startAt: "2026-10-15T01:00:00.000Z",
          endAt: "2026-10-15T04:00:00.000Z",
        },
      ];
      validateCandidates(invalidTierCandidates, validationContext);
    },
    (err: any) =>
      err instanceof CandidateValidationError &&
      err.message.includes("same template/tier")
  );
  console.log("[PASS] Successfully rejected backup with different template/tier");

  // 5. Acceptance Criterion: Rejects backup with different booking date
  console.log("5. Testing rejection of backup with divergent date...");
  assert.throws(
    () => {
      const invalidDateCandidates: CandidateSubmissionDTO[] = [
        {
          rank: 0,
          workspaceInstanceId: "inst-desk-01",
          startAt: "2026-10-15T01:00:00.000Z", // Oct 15
          endAt: "2026-10-15T04:00:00.000Z",
        },
        {
          rank: 1,
          workspaceInstanceId: "inst-desk-02",
          startAt: "2026-10-16T01:00:00.000Z", // Oct 16 (divergent date)
          endAt: "2026-10-16T04:00:00.000Z",
        },
      ];
      validateCandidates(invalidDateCandidates, validationContext);
    },
    (err: any) =>
      err instanceof CandidateValidationError &&
      err.message.includes("same booking date")
  );
  console.log("[PASS] Successfully rejected backup with divergent date");

  // 6. Acceptance Criterion: Rejects backup with divergent duration
  console.log("6. Testing rejection of backup with divergent duration...");
  assert.throws(
    () => {
      const invalidDurationCandidates: CandidateSubmissionDTO[] = [
        {
          rank: 0,
          workspaceInstanceId: "inst-desk-01",
          startAt: "2026-10-15T01:00:00.000Z",
          endAt: "2026-10-15T04:00:00.000Z", // 3 hours
        },
        {
          rank: 1,
          workspaceInstanceId: "inst-desk-02",
          startAt: "2026-10-15T01:00:00.000Z",
          endAt: "2026-10-15T03:00:00.000Z", // 2 hours (duration mismatch)
        },
      ];
      validateCandidates(invalidDurationCandidates, validationContext);
    },
    (err: any) =>
      err instanceof CandidateValidationError &&
      err.message.includes("same duration")
  );
  console.log("[PASS] Successfully rejected backup with divergent duration");

  // 7. Acceptance Criterion: Rejects duplicate candidate on same instance with same start time, but accepts different start time
  console.log("7. Testing rejection of duplicate selection on same instance with same start time...");
  assert.throws(
    () => {
      const duplicateInstanceCandidates: CandidateSubmissionDTO[] = [
        {
          rank: 0,
          workspaceInstanceId: "inst-desk-01",
          startAt: "2026-10-15T01:00:00.000Z",
          endAt: "2026-10-15T04:00:00.000Z",
        },
        {
          rank: 1,
          workspaceInstanceId: "inst-desk-01", // Duplicate of Main with same start time
          startAt: "2026-10-15T01:00:00.000Z",
          endAt: "2026-10-15T04:00:00.000Z",
        },
      ];
      validateCandidates(duplicateInstanceCandidates, validationContext);
    },
    (err: any) =>
      err instanceof CandidateValidationError &&
      err.message.includes("Duplicate candidate selection")
  );
  console.log("[PASS] Successfully rejected duplicate candidate selection with identical time");

  console.log("7b. Testing acceptance of same instance with different start time...");
  const sameInstanceDiffTimeCandidates: CandidateSubmissionDTO[] = [
    {
      rank: 0,
      workspaceInstanceId: "inst-desk-01",
      startAt: "2026-10-15T01:00:00.000Z",
      endAt: "2026-10-15T04:00:00.000Z",
    },
    {
      rank: 1,
      workspaceInstanceId: "inst-desk-01", // Same instance as Main, different start time
      startAt: "2026-10-15T02:00:00.000Z",
      endAt: "2026-10-15T05:00:00.000Z",
    },
  ];
  validateCandidates(sameInstanceDiffTimeCandidates, validationContext);
  console.log("[PASS] Successfully accepted same instance with different start time");

  // 8. Full End-to-End Reservation Creation with Linear Candidates
  console.log("8. Testing full reservation creation with 3 ranked candidates...");
  const resRepo = new ReservationMemoryRepository();
  const wsRepo = new InMemoryWorkspaceRepository();
  const paySessionSvc = createPaymentSessionService(resRepo);
  const resService = createReservationService(resRepo, wsRepo, resRepo, paySessionSvc);

  const floor = await wsRepo.createFloor({ name: "Floor 1" });
  const template = await wsRepo.createTemplate({
    name: "Dedicated Hot Desk",
    capacity: 1,
    rateAmount: 60,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#E0EFE4",
    isActive: true,
  });

  const inst1 = await wsRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "HD01",
    displayName: "Hot Desk 01",
  });
  const inst2 = await wsRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "HD02",
    displayName: "Hot Desk 02",
  });
  const inst3 = await wsRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "HD03",
    displayName: "Hot Desk 03",
  });

  const reservation = await resService.createReservation(
    {
      source: "WEB",
      customerFirstName: "Juan",
      customerLastName: "Dela Cruz",
      customerEmail: "juan.delacruz@example.com",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: inst1.id,
          startAt: "2026-10-15T01:00:00.000Z",
          endAt: "2026-10-15T04:00:00.000Z", // 3 hours
        },
        {
          rank: 1,
          workspaceInstanceId: inst2.id,
          startAt: "2026-10-15T02:00:00.000Z",
          endAt: "2026-10-15T05:00:00.000Z", // 3 hours
        },
        {
          rank: 2,
          workspaceInstanceId: inst3.id,
          startAt: "2026-10-15T05:00:00.000Z",
          endAt: "2026-10-15T08:00:00.000Z", // 3 hours
        },
      ],
    },
    { paymentLinkBaseUrl: "https://deskatlas.test/pay" }
  );

  assert.ok(reservation.id);
  assert.equal(reservation.status, "PENDING_PAYMENT");
  assert.equal(reservation.rateSnapshot, 60);
  assert.equal(reservation.amountDue, 180, "3 hours @ 60/hr = 180 total");
  assert.equal(reservation.candidates?.length, 3);
  assert.equal(reservation.candidates[0].rank, 0);
  assert.equal(reservation.candidates[0].isAssigned, false, "No hold rule: not assigned before payment approval");
  assert.equal(reservation.candidates[1].rank, 1);
  assert.equal(reservation.candidates[1].isAssigned, false);
  assert.equal(reservation.candidates[2].rank, 2);
  assert.equal(reservation.candidates[2].isAssigned, false);
  console.log("[PASS] Full reservation creation preserves all 3 ranked candidates with no-hold rule");

  console.log("--- All MF-22 Customer Linear Backup Selection Tests Passed Successfully! ---");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
