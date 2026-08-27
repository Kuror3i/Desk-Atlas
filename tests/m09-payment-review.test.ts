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
  let now = new Date("2026-08-26T09:00:00.000Z");
  const nowProvider = () => now;
  const paymentSessionService = createPaymentSessionService(reservationRepo, nowProvider);
  const reservationService = createReservationService(
    reservationRepo,
    workspaceRepo,
    reservationRepo,
    paymentSessionService
  );
  const paymentReviewService = createPaymentReviewService(reservationRepo, nowProvider);

  const actor = { userId: "admin-user-1", role: "ADMIN" as const };

  const floor = await workspaceRepo.createFloor({ name: "Main Floor" });
  const template = await workspaceRepo.createTemplate({
    name: "Skypod",
    capacity: 1,
    rateAmount: 200,
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

  async function expectReviewError(
    name: string,
    fn: () => Promise<void>,
    expectedMessage: string,
    expectedType: "validation" | "conflict"
  ) {
    try {
      await fn();
      console.error(`[FAIL] ${name}: Expected review error but none was thrown.`);
      process.exit(1);
    } catch (error: any) {
      const expectedCtor =
        expectedType === "validation" ? PaymentReviewError : PaymentReviewConflictError;
      if (!(error instanceof expectedCtor)) {
        console.error(`[FAIL] ${name}: Unexpected error type`, error);
        process.exit(1);
      }
      assert.strictEqual(error.message, expectedMessage);
      console.log(`[PASS] ${name}`);
    }
  }

  async function createUnderReviewReservation(
    customerSlug: string,
    candidates: Array<{
      rank: 0 | 1 | 2;
      workspaceInstanceId: string;
      startAt: string;
      endAt: string;
    }>
  ) {
    const request: CreateReservationRequest = {
      source: "WEB",
      customerFirstName: `Customer-${customerSlug}`,
      customerLastName: "Tester",
      customerEmail: `${customerSlug}@example.com`,
      candidates,
    };

    const reservation = await reservationService.createReservation(request, {
      paymentLinkBaseUrl: "https://deskatlas.test/pay",
    });

    await paymentSessionService.submitPaymentProof({
      token: reservation.paymentSession!.token,
      paymentMethodId: "pm-gcash",
      proofStoragePath: `proofs/${customerSlug}.png`,
    });

    const session = await paymentSessionService.getPaymentSession(reservation.paymentSession!.token);
    return {
      reservation,
      paymentAttemptId: session.paymentAttemptId,
    };
  }

  async function createConfirmedBlockingReservation(
    customerSlug: string,
    workspaceInstanceId: string,
    startAt: string,
    endAt: string
  ) {
    const reservation = await createUnderReviewReservation(customerSlug, [
      { rank: 0, workspaceInstanceId, startAt, endAt },
    ]);
    return paymentReviewService.reviewPayment({
      paymentAttemptId: reservation.paymentAttemptId,
      actor,
      decision: "APPROVE",
    });
  }

  await runTest("Main available", async () => {
    now = new Date("2026-08-26T09:05:00.000Z");
    const pending = await createUnderReviewReservation("main-available", [
      {
        rank: 0,
        workspaceInstanceId: instanceA.id,
        startAt: "2026-09-01T09:00:00.000Z",
        endAt: "2026-09-01T11:00:00.000Z",
      },
    ]);

    const result = await paymentReviewService.reviewPayment({
      paymentAttemptId: pending.paymentAttemptId,
      actor,
      decision: "APPROVE",
    });

    assert.strictEqual(result.reservationStatus, "CONFIRMED");
    assert.strictEqual(result.paymentStatus, "APPROVED");
    assert.strictEqual(result.assignedCandidateRank, 0);
    assert.strictEqual(result.assignedCandidate?.workspaceInstanceId, instanceA.id);
  });

  await runTest("Main lost -> Alt1", async () => {
    await createConfirmedBlockingReservation(
      "block-main-alt1",
      instanceA.id,
      "2026-09-02T09:00:00.000Z",
      "2026-09-02T11:00:00.000Z"
    );

    now = new Date("2026-08-26T09:10:00.000Z");
    const pending = await createUnderReviewReservation("main-lost", [
      {
        rank: 0,
        workspaceInstanceId: instanceA.id,
        startAt: "2026-09-02T09:00:00.000Z",
        endAt: "2026-09-02T11:00:00.000Z",
      },
      {
        rank: 1,
        workspaceInstanceId: instanceB.id,
        startAt: "2026-09-02T09:00:00.000Z",
        endAt: "2026-09-02T11:00:00.000Z",
      },
    ]);

    const result = await paymentReviewService.reviewPayment({
      paymentAttemptId: pending.paymentAttemptId,
      actor,
      decision: "APPROVE",
    });

    assert.strictEqual(result.reservationStatus, "CONFIRMED");
    assert.strictEqual(result.assignedCandidateRank, 1);
    assert.strictEqual(result.assignedCandidate?.workspaceInstanceId, instanceB.id);
  });

  await runTest("Main+Alt1 lost -> Alt2", async () => {
    await createConfirmedBlockingReservation(
      "block-main-alt2",
      instanceA.id,
      "2026-09-03T09:00:00.000Z",
      "2026-09-03T11:00:00.000Z"
    );
    await createConfirmedBlockingReservation(
      "block-alt1-alt2",
      instanceB.id,
      "2026-09-03T09:00:00.000Z",
      "2026-09-03T11:00:00.000Z"
    );

    now = new Date("2026-08-26T09:15:00.000Z");
    const pending = await createUnderReviewReservation("alt2", [
      {
        rank: 0,
        workspaceInstanceId: instanceA.id,
        startAt: "2026-09-03T09:00:00.000Z",
        endAt: "2026-09-03T11:00:00.000Z",
      },
      {
        rank: 1,
        workspaceInstanceId: instanceB.id,
        startAt: "2026-09-03T09:00:00.000Z",
        endAt: "2026-09-03T11:00:00.000Z",
      },
      {
        rank: 2,
        workspaceInstanceId: instanceC.id,
        startAt: "2026-09-03T09:00:00.000Z",
        endAt: "2026-09-03T11:00:00.000Z",
      },
    ]);

    const result = await paymentReviewService.reviewPayment({
      paymentAttemptId: pending.paymentAttemptId,
      actor,
      decision: "APPROVE",
    });

    assert.strictEqual(result.reservationStatus, "CONFIRMED");
    assert.strictEqual(result.assignedCandidateRank, 2);
    assert.strictEqual(result.assignedCandidate?.workspaceInstanceId, instanceC.id);
  });

  await runTest("all lost -> manual resolution", async () => {
    await createConfirmedBlockingReservation(
      "block-main-manual",
      instanceA.id,
      "2026-09-04T09:00:00.000Z",
      "2026-09-04T11:00:00.000Z"
    );
    await createConfirmedBlockingReservation(
      "block-alt1-manual",
      instanceB.id,
      "2026-09-04T09:00:00.000Z",
      "2026-09-04T11:00:00.000Z"
    );
    await createConfirmedBlockingReservation(
      "block-alt2-manual",
      instanceC.id,
      "2026-09-04T09:00:00.000Z",
      "2026-09-04T11:00:00.000Z"
    );

    now = new Date("2026-08-26T09:20:00.000Z");
    const pending = await createUnderReviewReservation("manual", [
      {
        rank: 0,
        workspaceInstanceId: instanceA.id,
        startAt: "2026-09-04T09:00:00.000Z",
        endAt: "2026-09-04T11:00:00.000Z",
      },
      {
        rank: 1,
        workspaceInstanceId: instanceB.id,
        startAt: "2026-09-04T09:00:00.000Z",
        endAt: "2026-09-04T11:00:00.000Z",
      },
      {
        rank: 2,
        workspaceInstanceId: instanceC.id,
        startAt: "2026-09-04T09:00:00.000Z",
        endAt: "2026-09-04T11:00:00.000Z",
      },
    ]);

    const result = await paymentReviewService.reviewPayment({
      paymentAttemptId: pending.paymentAttemptId,
      actor,
      decision: "APPROVE",
    });

    assert.strictEqual(result.reservationStatus, "NEEDS_MANUAL_RESOLUTION");
    assert.strictEqual(result.assignedCandidate, null);
    assert.strictEqual(result.assignedCandidateRank, null);
  });

  await runTest("concurrent approvals for same spot/time", async () => {
    now = new Date("2026-08-26T09:25:00.000Z");
    const first = await createUnderReviewReservation("concurrent-a", [
      {
        rank: 0,
        workspaceInstanceId: instanceD.id,
        startAt: "2026-09-05T09:00:00.000Z",
        endAt: "2026-09-05T11:00:00.000Z",
      },
      {
        rank: 1,
        workspaceInstanceId: instanceB.id,
        startAt: "2026-09-05T09:00:00.000Z",
        endAt: "2026-09-05T11:00:00.000Z",
      },
    ]);
    const second = await createUnderReviewReservation("concurrent-b", [
      {
        rank: 0,
        workspaceInstanceId: instanceD.id,
        startAt: "2026-09-05T09:00:00.000Z",
        endAt: "2026-09-05T11:00:00.000Z",
      },
      {
        rank: 1,
        workspaceInstanceId: instanceC.id,
        startAt: "2026-09-05T09:00:00.000Z",
        endAt: "2026-09-05T11:00:00.000Z",
      },
    ]);

    const [resultA, resultB] = await Promise.all([
      paymentReviewService.reviewPayment({
        paymentAttemptId: first.paymentAttemptId,
        actor,
        decision: "APPROVE",
      }),
      paymentReviewService.reviewPayment({
        paymentAttemptId: second.paymentAttemptId,
        actor,
        decision: "APPROVE",
      }),
    ]);

    const assignedWorkspaceIds = [
      resultA.assignedCandidate?.workspaceInstanceId,
      resultB.assignedCandidate?.workspaceInstanceId,
    ];

    assert.strictEqual(
      assignedWorkspaceIds.filter((workspaceId) => workspaceId === instanceD.id).length,
      1
    );
    assert.notStrictEqual(resultA.assignedCandidate?.workspaceInstanceId, resultB.assignedCandidate?.workspaceInstanceId);
    assert.ok([resultA.assignedCandidateRank, resultB.assignedCandidateRank].includes(1));
  });

  await expectReviewError(
    "reject requires reason",
    async () => {
      now = new Date("2026-08-26T09:30:00.000Z");
      const pending = await createUnderReviewReservation("reject-reason", [
        {
          rank: 0,
          workspaceInstanceId: instanceA.id,
          startAt: "2026-09-06T09:00:00.000Z",
          endAt: "2026-09-06T11:00:00.000Z",
        },
      ]);
      await paymentReviewService.reviewPayment({
        paymentAttemptId: pending.paymentAttemptId,
        actor,
        decision: "REJECT",
        rejectionReason: "   ",
      });
    },
    "Rejection reason is required.",
    "validation"
  );

  await runTest("payment decision audited", async () => {
    now = new Date("2026-08-26T09:35:00.000Z");
    const pending = await createUnderReviewReservation("rejected", [
      {
        rank: 0,
        workspaceInstanceId: instanceA.id,
        startAt: "2026-09-07T09:00:00.000Z",
        endAt: "2026-09-07T11:00:00.000Z",
      },
    ]);

    const result = await paymentReviewService.reviewPayment({
      paymentAttemptId: pending.paymentAttemptId,
      actor,
      decision: "REJECT",
      rejectionReason: "Proof image does not match the amount due.",
    });

    const detail = await paymentReviewService.getPaymentReviewDetail(pending.paymentAttemptId);
    assert.strictEqual(result.paymentStatus, "REJECTED");
    assert.strictEqual(detail.rejectionReason, "Proof image does not match the amount due.");
    assert.strictEqual(detail.processedByUserId, actor.userId);
    assert.strictEqual(detail.processedAt, "2026-08-26T09:35:00.000Z");
  });

  await runTest("retry/idempotency behavior", async () => {
    now = new Date("2026-08-26T09:40:00.000Z");
    const pending = await createUnderReviewReservation("idempotent", [
      {
        rank: 0,
        workspaceInstanceId: instanceA.id,
        startAt: "2026-09-08T09:00:00.000Z",
        endAt: "2026-09-08T11:00:00.000Z",
      },
    ]);

    const firstResult = await paymentReviewService.reviewPayment({
      paymentAttemptId: pending.paymentAttemptId,
      actor,
      decision: "APPROVE",
    });
    const secondResult = await paymentReviewService.reviewPayment({
      paymentAttemptId: pending.paymentAttemptId,
      actor,
      decision: "APPROVE",
    });

    assert.deepStrictEqual(secondResult, firstResult);
  });

  await runTest("transaction rollback on failure", async () => {
    now = new Date("2026-08-26T09:45:00.000Z");
    const pending = await createUnderReviewReservation("rollback", [
      {
        rank: 0,
        workspaceInstanceId: instanceA.id,
        startAt: "2026-09-09T09:00:00.000Z",
        endAt: "2026-09-09T11:00:00.000Z",
      },
    ]);

    reservationRepo.setNextApprovalFailure("Simulated approval failure.");

    try {
      await paymentReviewService.reviewPayment({
        paymentAttemptId: pending.paymentAttemptId,
        actor,
        decision: "APPROVE",
      });
      throw new Error("Expected simulated approval failure.");
    } catch (error: any) {
      assert.strictEqual(error.message, "Simulated approval failure.");
    }

    const detail = await paymentReviewService.getPaymentReviewDetail(pending.paymentAttemptId);
    assert.strictEqual(detail.paymentStatus, "UNDER_REVIEW");
    assert.strictEqual(detail.reservationStatus, "PAYMENT_UNDER_REVIEW");
    assert.strictEqual(detail.submittedCandidates.some((candidate) => candidate.isAssigned), false);
  });

  await expectReviewError(
    "Staff proof approval denied",
    async () => {
      now = new Date("2026-08-26T09:50:00.000Z");
      const pending = await createUnderReviewReservation("staff-denied", [
        {
          rank: 0,
          workspaceInstanceId: instanceB.id,
          startAt: "2026-09-10T09:00:00.000Z",
          endAt: "2026-09-10T11:00:00.000Z",
        },
      ]);

      await paymentReviewService.reviewPayment({
        paymentAttemptId: pending.paymentAttemptId,
        actor: { userId: "staff-user-1", role: "STAFF" },
        decision: "APPROVE",
      });
    },
    "Only ADMIN may approve or reject online payment proof.",
    "conflict"
  );

  console.log("All M09 tests passed!");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
