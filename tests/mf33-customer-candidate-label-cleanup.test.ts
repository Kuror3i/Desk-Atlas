import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  CandidateValidationError,
  CandidateValidationContext,
  InMemoryWorkspaceRepository,
  ReservationMemoryRepository,
  createPaymentSessionService,
  createReservationService,
  validateCandidates,
  type CandidateSubmissionDTO,
  type CreateReservationRequest,
} from "../packages/domain/src/index";
import { WorkspaceInstance, WorkspaceTemplate } from "../packages/domain/src/models/workspace";

async function run() {
  console.log("--- Starting MF-33 Customer Candidate Label Cleanup Tests ---");

  // 1. Static UI Inspection: Ensure technical rank labels are removed from customer UI
  console.log("1. Inspecting customer-facing component files for technical rank strings...");

  const reservationPagePath = path.resolve(
    process.cwd(),
    "apps/customer-website/src/features/reservation/components/ReservationPage.tsx"
  );
  const scheduleCalendarPath = path.resolve(
    process.cwd(),
    "apps/customer-website/src/features/reservation/components/ScheduleCalendarStep.tsx"
  );
  const spotDetailModalPath = path.resolve(
    process.cwd(),
    "apps/customer-website/src/features/reservation/components/SpotDetailModal.tsx"
  );

  const reservationPageSrc = fs.readFileSync(reservationPagePath, "utf-8");
  const scheduleCalendarSrc = fs.readFileSync(scheduleCalendarPath, "utf-8");
  const spotDetailModalSrc = fs.readFileSync(spotDetailModalPath, "utf-8");

  const forbiddenRenderPatterns = [
    /\(Rank 0\)/i,
    /\(Rank 1\)/i,
    /\(Rank 2\)/i,
    /Rank 0 •/i,
    /Rank 1 •/i,
    /Rank 2 •/i,
    /`Rank \${/i,
    /Backup #\${/i,
    /Backup Spot #\${/i,
  ];

  for (const pattern of forbiddenRenderPatterns) {
    assert.equal(
      pattern.test(reservationPageSrc),
      false,
      `ReservationPage.tsx must not contain forbidden pattern: ${pattern}`
    );
    assert.equal(
      pattern.test(scheduleCalendarSrc),
      false,
      `ScheduleCalendarStep.tsx must not contain forbidden pattern: ${pattern}`
    );
    assert.equal(
      pattern.test(spotDetailModalSrc),
      false,
      `SpotDetailModal.tsx must not contain forbidden pattern: ${pattern}`
    );
  }

  // Ensure customer-friendly labels exist
  assert.ok(
    reservationPageSrc.includes("👑 Main Choice"),
    "ReservationPage must have '👑 Main Choice'"
  );
  assert.ok(
    reservationPageSrc.includes("🥈 Backup 1"),
    "ReservationPage must have '🥈 Backup 1'"
  );
  assert.ok(
    reservationPageSrc.includes("🥉 Backup 2"),
    "ReservationPage must have '🥉 Backup 2'"
  );
  assert.ok(
    reservationPageSrc.includes('"Main Choice"'),
    "ReservationPage must have 'Main Choice'"
  );
  assert.ok(
    reservationPageSrc.includes("`Backup ${cand.rank}`"),
    "ReservationPage must have '`Backup ${cand.rank}`'"
  );

  console.log("[PASS] All customer UI components have non-technical candidate labels (no rank 0/1/2)");

  // 2. Candidate Payload Contract Verification (Ranks 0, 1, 2 preserved in data transfer)
  console.log("2. Verifying candidate payload rank semantics...");

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

  const INSTANCES: WorkspaceInstance[] = [
    {
      id: "inst-desk-01",
      templateId: "tpl-hot-desk",
      floorId: "floor-1",
      instanceCode: "HD-01",
      displayName: "Hot Desk 01",
      operationalStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "inst-desk-02",
      templateId: "tpl-hot-desk",
      floorId: "floor-1",
      instanceCode: "HD-02",
      displayName: "Hot Desk 02",
      operationalStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "inst-desk-03",
      templateId: "tpl-hot-desk",
      floorId: "floor-1",
      instanceCode: "HD-03",
      displayName: "Hot Desk 03",
      operationalStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const validationContext: CandidateValidationContext = {
    instances: INSTANCES,
    templates: [TEMPLATE_HOT_DESK],
  };

  const candidatesDTO: CandidateSubmissionDTO[] = [
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
      startAt: "2026-10-15T05:00:00.000Z",
      endAt: "2026-10-15T08:00:00.000Z",
    },
  ];

  validateCandidates(candidatesDTO, validationContext);
  assert.equal(candidatesDTO[0].rank, 0);
  assert.equal(candidatesDTO[1].rank, 1);
  assert.equal(candidatesDTO[2].rank, 2);
  console.log("[PASS] Candidate submission payload preserves numeric ranks 0, 1, and 2");

  // 3. Candidate Validation Enforces Rank 0 (Main) is strictly required
  console.log("3. Testing that candidate validation still requires rank 0...");
  assert.throws(
    () => {
      const invalidNoMainCandidates: CandidateSubmissionDTO[] = [
        {
          rank: 1 as any,
          workspaceInstanceId: "inst-desk-02",
          startAt: "2026-10-15T01:00:00.000Z",
          endAt: "2026-10-15T04:00:00.000Z",
        },
      ];
      validateCandidates(invalidNoMainCandidates, validationContext);
    },
    (err: any) =>
      err instanceof CandidateValidationError &&
      err.message.includes("Main candidate")
  );
  console.log("[PASS] Main candidate (rank 0) requirement strictly preserved in domain");

  // 4. End-to-End Reservation Creation with numeric ranks
  console.log("4. Testing full reservation creation with candidate ranks 0, 1, 2...");
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
    instanceCode: "HD-01",
    displayName: "Hot Desk 01",
  });
  const inst2 = await wsRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "HD-02",
    displayName: "Hot Desk 02",
  });
  const inst3 = await wsRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "HD-03",
    displayName: "Hot Desk 03",
  });

  const reservationRequest: CreateReservationRequest = {
    source: "WEB",
    customerFirstName: "Maria",
    customerLastName: "Santos",
    customerEmail: "maria.santos@example.com",
    candidates: [
      {
        rank: 0,
        workspaceInstanceId: inst1.id,
        startAt: "2026-10-15T09:00:00Z",
        endAt: "2026-10-15T13:00:00Z",
      },
      {
        rank: 1,
        workspaceInstanceId: inst2.id,
        startAt: "2026-10-15T10:00:00Z",
        endAt: "2026-10-15T14:00:00Z",
      },
      {
        rank: 2,
        workspaceInstanceId: inst3.id,
        startAt: "2026-10-15T11:00:00Z",
        endAt: "2026-10-15T15:00:00Z",
      },
    ],
  };

  const createdReservation = await resService.createReservation(reservationRequest, {
    paymentLinkBaseUrl: "https://deskatlas.test/pay",
  });

  assert.ok(createdReservation.id);
  assert.equal(createdReservation.candidates?.length, 3);
  assert.equal(createdReservation.candidates[0].rank, 0);
  assert.equal(createdReservation.candidates[1].rank, 1);
  assert.equal(createdReservation.candidates[2].rank, 2);
  console.log("[PASS] Created reservation maintains candidate ranks 0, 1, 2");

  console.log("--- All MF-33 Customer Candidate Label Cleanup Tests Passed Successfully! ---");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
