import {
  ConfirmCounterPaymentRequest,
  CounterPaymentRecord,
  PaymentMethod,
  PaymentReviewDecisionResult,
} from "../models/reservation";
import { CounterPaymentRepository } from "./counterPaymentRepository";

export class CounterPaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CounterPaymentError";
  }
}

export class CounterPaymentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CounterPaymentConflictError";
  }
}

export class CounterPaymentService {
  constructor(
    private readonly counterPaymentRepository: CounterPaymentRepository,
    private readonly nowProvider: () => Date = () => new Date()
  ) {}

  async listActiveKioskPaymentMethods(): Promise<PaymentMethod[]> {
    return this.counterPaymentRepository.listActiveKioskPaymentMethods();
  }

  async getCounterPaymentRecord(paymentAttemptId: string): Promise<CounterPaymentRecord> {
    if (!paymentAttemptId || paymentAttemptId.trim() === "") {
      throw new CounterPaymentError("Payment attempt ID is required.");
    }

    const record = await this.counterPaymentRepository.getCounterPaymentRecord(paymentAttemptId);
    if (!record) {
      throw new CounterPaymentError("Counter payment record was not found.");
    }

    return record;
  }

  async confirmPayment(
    request: ConfirmCounterPaymentRequest
  ): Promise<PaymentReviewDecisionResult> {
    if (!request.paymentAttemptId || request.paymentAttemptId.trim() === "") {
      throw new CounterPaymentError("Payment attempt ID is required.");
    }

    if (!request.actor?.userId || request.actor.userId.trim() === "") {
      throw new CounterPaymentError("Actor user ID is required.");
    }

    if (request.actor.role !== "ADMIN" && request.actor.role !== "STAFF") {
      throw new CounterPaymentConflictError(
        "Only ADMIN or STAFF may confirm kiosk counter payment."
      );
    }

    return this.counterPaymentRepository.confirmCounterPaymentAndAllocate({
      paymentAttemptId: request.paymentAttemptId,
      actorUserId: request.actor.userId,
      processedAt: this.nowProvider().toISOString(),
    });
  }
}

export function createCounterPaymentService(
  counterPaymentRepository: CounterPaymentRepository,
  nowProvider?: () => Date
) {
  return new CounterPaymentService(counterPaymentRepository, nowProvider);
}
