import * as assert from "assert";
import {
  createPaymentReviewService,
  createPaymentSessionService,
  createReservationService,
  InMemoryWorkspaceRepository,
  PaymentReviewConflictError,
  PaymentReviewError,
  ReservationMemoryRepository,
  type CreateReservationRequest,
} from "../packages/domain/src/index";

async function runTests() {
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

  const adminActor = { userId: "admin-uuid-1", role: "ADMIN" as const };
  const staffActor = { userId: "staff-uuid-1", role: "STAFF" as const };

  const floor = await workspaceRepo.createFloor({ name: "2nd Floor Main" });
  const template = await workspaceRepo.createTemplate({
    name: "Dedicated Desk",
    capacity: 1,
    rateAmount: 150,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#154A32",
    isActive: true,
  });

  const spotA = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "DD-01",
    displayName: "Desk 01",
  });
  const spotB = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "DD-02",
    displayName: "Desk 02",
  });
  const spotC = await workspaceRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "DD-03",
    displayName: "Desk 03",
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

  // 1. Initial empty queue
  await runTest("Queue is initially empty when no payments are under review", async () => {
    const queue = await paymentReviewService.listPaymentReviewQueue();
    assert.strictEqual(Array.isArray(queue), true);
    assert.strictEqual(queue.length, 0);
  });

  // Helper to create reservation and submit proof
  async function createSubmittedPayment(slug: string) {
    const request: CreateReservationRequest = {
      source: "WEB",
      customerFirstName: `Alice-${slug}`,
      customerLastName: "Smith",
      customerEmail: `alice.${slug}@example.com`,
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: spotA.id,
          startAt: "2026-09-01T09:00:00.000Z",
          endAt: "2026-09-01T13:00:00.000Z",
        },
        {
          rank: 1,
          workspaceInstanceId: spotB.id,
          startAt: "2026-09-01T09:00:00.000Z",
          endAt: "2026-09-01T13:00:00.000Z",
        },
      ],
    };

    const reservation = await reservationService.createReservation(request, {
      paymentLinkBaseUrl: "https://deskatlas.test/pay",
    });

    const submitResult = await paymentSessionService.submitPaymentProof({
      token: reservation.paymentSession!.token,
      paymentMethodId: "pm-gcash",
      proofStoragePath: `payment-proofs/2026-09-01/${slug}.png`,
    });

    return { reservation, submitResult };
  }

  // 2. Populated queue
  let pendingAttempt1: string = "";
  let pendingAttempt2: string = "";

  await runTest("Queue lists submitted payments with accurate customer summaries", async () => {
    const res1 = await createSubmittedPayment("p1");
    pendingAttempt1 = res1.submitResult.paymentAttemptId;

    now = new Date("2026-08-29T10:10:00.000Z");
    const res2 = await createSubmittedPayment("p2");
    pendingAttempt2 = res2.submitResult.paymentAttemptId;

    const queue = await paymentReviewService.listPaymentReviewQueue();
    assert.strictEqual(queue.length, 2);
    assert.strictEqual(queue[0].paymentAttemptId, pendingAttempt1);
    assert.strictEqual(queue[0].customerFirstName, "Alice-p1");
    assert.strictEqual(queue[0].paymentStatus, "UNDER_REVIEW");
    assert.strictEqual(queue[1].paymentAttemptId, pendingAttempt2);
    assert.strictEqual(queue[1].customerFirstName, "Alice-p2");
  });

  // 3. Payment review detail
  await runTest("Payment review detail loads candidates and metadata", async () => {
    const detail = await paymentReviewService.getPaymentReviewDetail(pendingAttempt1);
    assert.strictEqual(detail.paymentAttemptId, pendingAttempt1);
    assert.strictEqual(detail.customerFirstName, "Alice-p1");
    assert.strictEqual(detail.customerLastName, "Smith");
    assert.strictEqual(detail.customerEmail, "alice.p1@example.com");
    assert.strictEqual(detail.submittedCandidates.length, 2);
    assert.strictEqual(detail.submittedCandidates[0].rank, 0);
    assert.strictEqual(detail.submittedCandidates[0].workspaceInstanceId, spotA.id);
    assert.strictEqual(detail.submittedCandidates[1].rank, 1);
    assert.strictEqual(detail.submittedCandidates[1].workspaceInstanceId, spotB.id);
    assert.strictEqual(detail.proofStoragePath, "payment-proofs/2026-09-01/p1.png");
  });

  // 4. Staff cannot approve online proofs
  await runTest("Staff actor is forbidden from approving online payment proof", async () => {
    try {
      await paymentReviewService.reviewPayment({
        paymentAttemptId: pendingAttempt1,
        actor: staffActor,
        decision: "APPROVE",
      });
      assert.fail("Should have thrown error for staff role");
    } catch (err: any) {
      assert.strictEqual(err instanceof PaymentReviewConflictError, true);
      assert.strictEqual(err.message, "Only ADMIN may approve or reject online payment proof.");
    }
  });

  // 5. Rejection requires reason
  await runTest("Rejection requires a non-empty reason", async () => {
    try {
      await paymentReviewService.reviewPayment({
        paymentAttemptId: pendingAttempt2,
        actor: adminActor,
        decision: "REJECT",
        rejectionReason: "   ",
      });
      assert.fail("Should have thrown validation error for empty rejection reason");
    } catch (err: any) {
      assert.strictEqual(err instanceof PaymentReviewError, true);
      assert.strictEqual(err.message, "Rejection reason is required.");
    }
  });

  // 6. Admin Rejection
  await runTest("Admin rejects payment attempt recording rejection reason", async () => {
    const result = await paymentReviewService.reviewPayment({
      paymentAttemptId: pendingAttempt2,
      actor: adminActor,
      decision: "REJECT",
      rejectionReason: "Screenshot blurred and amount mismatch",
    });

    assert.strictEqual(result.paymentStatus, "REJECTED");
    assert.strictEqual(result.rejectionReason, "Screenshot blurred and amount mismatch");

    const detail = await paymentReviewService.getPaymentReviewDetail(pendingAttempt2);
    assert.strictEqual(detail.paymentStatus, "REJECTED");
    assert.strictEqual(detail.rejectionReason, "Screenshot blurred and amount mismatch");
  });

  // 7. Admin Approval with Main candidate allocation
  await runTest("Admin approves payment and allocates Main candidate", async () => {
    const result = await paymentReviewService.reviewPayment({
      paymentAttemptId: pendingAttempt1,
      actor: adminActor,
      decision: "APPROVE",
    });

    assert.strictEqual(result.paymentStatus, "APPROVED");
    assert.strictEqual(result.reservationStatus, "CONFIRMED");
    assert.strictEqual(result.assignedCandidateRank, 0);
    assert.strictEqual(result.assignedCandidate?.workspaceInstanceId, spotA.id);

    // Queue should now be empty of UNDER_REVIEW payments
    const queue = await paymentReviewService.listPaymentReviewQueue();
    assert.strictEqual(queue.length, 0);
  });

  // 8. Allocation fallback Main -> Alt 1
  await runTest("Admin approves subsequent payment falling back to Alternative 1 when Main is occupied", async () => {
    const res3 = await createSubmittedPayment("p3");
    const result = await paymentReviewService.reviewPayment({
      paymentAttemptId: res3.submitResult.paymentAttemptId,
      actor: adminActor,
      decision: "APPROVE",
    });

    assert.strictEqual(result.paymentStatus, "APPROVED");
    assert.strictEqual(result.reservationStatus, "CONFIRMED");
    assert.strictEqual(result.assignedCandidateRank, 1);
    assert.strictEqual(result.assignedCandidate?.workspaceInstanceId, spotB.id);
  });

  console.log("\nAll MF-03 tests passed successfully!");
}

runTests();
