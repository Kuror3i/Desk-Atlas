import assert from "node:assert/strict";
import {
  CandidateValidationError,
  CandidateValidationContext,
  InMemoryWorkspaceRepository,
  ReservationMemoryRepository,
  createPaymentSessionService,
  createReservationService,
  createPaymentReviewService,
  validateCandidates,
  type CandidateSubmissionDTO,
} from "../packages/domain/src/index";
import { WorkspaceInstance, WorkspaceTemplate } from "../packages/domain/src/models/workspace";

async function run() {
  console.log("--- Starting MF-34 Customer Same Instance Backup Time Options Tests ---");

  const TEMPLATE_SKYPOD: WorkspaceTemplate = {
    id: "tpl-skypod",
    name: "Skypod Focus",
    description: "Private single focus pod",
    photoPath: "/photos/skypod.jpg",
    capacity: 1,
    rateAmount: 80,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#E0EFE4",
    defaultStyle: {},
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const INSTANCE_SKYPOD_1: WorkspaceInstance = {
    id: "inst-skypod-01",
    templateId: "tpl-skypod",
    floorId: "floor-1",
    instanceCode: "SP01",
    displayName: "Skypod 1",
    operationalStatus: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const INSTANCE_SKYPOD_2: WorkspaceInstance = {
    id: "inst-skypod-02",
    templateId: "tpl-skypod",
    floorId: "floor-1",
    instanceCode: "SP02",
    displayName: "Skypod 2",
    operationalStatus: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const validationContext: CandidateValidationContext = {
    instances: [INSTANCE_SKYPOD_1, INSTANCE_SKYPOD_2],
    templates: [TEMPLATE_SKYPOD],
  };

  // 1. Acceptance Criterion: Customer selects Skypod 1 (10am-1pm) as Main, Skypod 1 (11am-2pm) as Backup 1, Skypod 1 (1pm-4pm) as Backup 2
  console.log("1. Testing candidate validation for same instance with different start times (10am-1pm, 11am-2pm, 1pm-4pm)...");
  const sameInstanceCandidates: CandidateSubmissionDTO[] = [
    {
      rank: 0,
      workspaceInstanceId: "inst-skypod-01",
      startAt: "2026-09-01T02:00:00.000Z", // 10:00 AM Manila
      endAt: "2026-09-01T05:00:00.000Z",   // 01:00 PM Manila (3 hrs)
    },
    {
      rank: 1,
      workspaceInstanceId: "inst-skypod-01",
      startAt: "2026-09-01T03:00:00.000Z", // 11:00 AM Manila
      endAt: "2026-09-01T06:00:00.000Z",   // 02:00 PM Manila (3 hrs)
    },
    {
      rank: 2,
      workspaceInstanceId: "inst-skypod-01",
      startAt: "2026-09-01T05:00:00.000Z", // 01:00 PM Manila
      endAt: "2026-09-01T08:00:00.000Z",   // 04:00 PM Manila (3 hrs)
    },
  ];

  validateCandidates(sameInstanceCandidates, validationContext);
  assert.equal(sameInstanceCandidates.length, 3);
  console.log("[PASS] Validated 3 candidates on same instance with different time options");

  // 2. Acceptance Criterion: Rejects exact duplicate time option on the same instance
  console.log("2. Testing rejection of identical start time on same instance...");
  assert.throws(
    () => {
      const duplicateCandidates: CandidateSubmissionDTO[] = [
        {
          rank: 0,
          workspaceInstanceId: "inst-skypod-01",
          startAt: "2026-09-01T02:00:00.000Z", // 10:00 AM
          endAt: "2026-09-01T05:00:00.000Z",
        },
        {
          rank: 1,
          workspaceInstanceId: "inst-skypod-01", // Duplicate start time on Skypod 1
          startAt: "2026-09-01T02:00:00.000Z", // 10:00 AM
          endAt: "2026-09-01T05:00:00.000Z",
        },
      ];
      validateCandidates(duplicateCandidates, validationContext);
    },
    (err: any) =>
      err instanceof CandidateValidationError &&
      err.message.includes("Duplicate candidate selection")
  );
  console.log("[PASS] Successfully rejected duplicate time option on same instance");

  // 3. Acceptance Criterion: Hybrid candidates (same instance for Backup 1, different instance for Backup 2)
  console.log("3. Testing hybrid candidate set (same instance + different instance)...");
  const hybridCandidates: CandidateSubmissionDTO[] = [
    {
      rank: 0,
      workspaceInstanceId: "inst-skypod-01",
      startAt: "2026-09-01T02:00:00.000Z",
      endAt: "2026-09-01T05:00:00.000Z",
    },
    {
      rank: 1,
      workspaceInstanceId: "inst-skypod-01", // Same instance, different time
      startAt: "2026-09-01T03:00:00.000Z",
      endAt: "2026-09-01T06:00:00.000Z",
    },
    {
      rank: 2,
      workspaceInstanceId: "inst-skypod-02", // Different instance, same duration/date
      startAt: "2026-09-01T02:00:00.000Z",
      endAt: "2026-09-01T05:00:00.000Z",
    },
  ];
  validateCandidates(hybridCandidates, validationContext);
  console.log("[PASS] Hybrid candidate set successfully validated");

  // 4. End-to-End: Reservation creation with same-instance backups
  console.log("4. Testing full reservation creation with same-instance backups...");
  const resRepo = new ReservationMemoryRepository();
  const wsRepo = new InMemoryWorkspaceRepository();
  const paySessionSvc = createPaymentSessionService(resRepo);
  const resService = createReservationService(resRepo, wsRepo, resRepo, paySessionSvc);
  const reviewService = createPaymentReviewService(resRepo);

  const floor = await wsRepo.createFloor({ name: "Floor 1" });
  const template = await wsRepo.createTemplate({
    name: "Skypod Focus",
    capacity: 1,
    rateAmount: 80,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#E0EFE4",
    isActive: true,
  });

  const skypod1 = await wsRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "SP01",
    displayName: "Skypod 1",
  });

  const reservation = await resService.createReservation(
    {
      source: "WEB",
      customerFirstName: "Maria",
      customerLastName: "Santos",
      customerEmail: "maria.santos@example.com",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: skypod1.id,
          startAt: "2026-09-01T02:00:00.000Z", // 10:00 AM - 01:00 PM (3 hrs)
          endAt: "2026-09-01T05:00:00.000Z",
        },
        {
          rank: 1,
          workspaceInstanceId: skypod1.id,
          startAt: "2026-09-01T05:00:00.000Z", // 01:00 PM - 04:00 PM (3 hrs)
          endAt: "2026-09-01T08:00:00.000Z",
        },
      ],
    },
    { paymentLinkBaseUrl: "https://deskatlas.test/pay" }
  );

  assert.ok(reservation.id);
  assert.equal(reservation.status, "PENDING_PAYMENT");
  assert.equal(reservation.amountDue, 240, "3 hours @ 80/hr = 240 total");
  assert.equal(reservation.candidates?.length, 2);
  assert.equal(reservation.candidates[0].rank, 0);
  assert.equal(reservation.candidates[0].isAssigned, false, "No-hold rule preserved");
  assert.equal(reservation.candidates[1].rank, 1);
  assert.equal(reservation.candidates[1].isAssigned, false, "No-hold rule preserved");
  console.log("[PASS] Reservation created with same-instance backups and no-hold rule");

  // 5. Atomic Allocation with same-instance fallback
  console.log("5. Testing atomic allocation fallback to Backup 1 on the same instance...");
  // Simulate an existing confirmed booking that takes Skypod 1 from 10:00 AM to 01:00 PM
  const blockingReservation = await resService.createReservation(
    {
      source: "WEB",
      customerFirstName: "Blocking",
      customerLastName: "User",
      customerEmail: "blocking@example.com",
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: skypod1.id,
          startAt: "2026-09-01T02:00:00.000Z", // 10:00 AM - 01:00 PM
          endAt: "2026-09-01T05:00:00.000Z",
        },
      ],
    },
    { paymentLinkBaseUrl: "https://deskatlas.test/pay" }
  );

  // Submit proof and approve the blocking reservation
  const blockingAttempt = Array.from((resRepo as any).paymentAttempts.values()).find(
    (a: any) => a.reservationId === blockingReservation.id
  ) as any;
  await resRepo.submitPaymentProof({
    tokenHash: blockingAttempt.tokenHash,
    paymentMethodId: "pm-gcash",
    proofStoragePath: "proofs/blocking.png",
    proofSubmittedAt: new Date().toISOString(),
  });
  const blockingDecision = await reviewService.reviewPayment({
    paymentAttemptId: blockingAttempt.id,
    decision: "APPROVE",
    actor: { userId: "admin-1", role: "ADMIN" },
  });
  assert.equal(blockingDecision.reservationStatus, "CONFIRMED");
  assert.equal(blockingDecision.assignedCandidate?.startAt, "2026-09-01T02:00:00.000Z");

  // Now submit proof for Maria's reservation (Main: 10am-1pm Skypod 1, Backup 1: 1pm-4pm Skypod 1)
  const mariaAttempt = Array.from((resRepo as any).paymentAttempts.values()).find(
    (a: any) => a.reservationId === reservation.id
  ) as any;
  await resRepo.submitPaymentProof({
    tokenHash: mariaAttempt.tokenHash,
    paymentMethodId: "pm-gcash",
    proofStoragePath: "proofs/maria.png",
    proofSubmittedAt: new Date().toISOString(),
  });

  // Maria's payment is approved by admin: Main (10am-1pm) is blocked, so atomic allocation MUST allocate Backup 1 (1pm-4pm) on Skypod 1!
  const mariaDecision = await reviewService.reviewPayment({
    paymentAttemptId: mariaAttempt.id,
    decision: "APPROVE",
    actor: { userId: "admin-1", role: "ADMIN" },
  });

  assert.equal(mariaDecision.reservationStatus, "CONFIRMED");
  assert.ok(mariaDecision.assignedCandidate);
  assert.equal(mariaDecision.assignedCandidate.rank, 1, "Backup 1 allocated");
  assert.equal(mariaDecision.assignedCandidate.workspaceInstanceId, skypod1.id, "Allocated on same physical instance");
  assert.equal(mariaDecision.assignedCandidate.startAt, "2026-09-01T05:00:00.000Z", "Allocated to 1:00 PM start time");
  console.log("[PASS] Atomic allocation allocated Backup 1 on the same physical instance when Main was blocked");

  console.log("--- All MF-34 Customer Same Instance Backup Time Options Tests Passed Successfully! ---");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
