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

    const record = await this.counterPaymentRepository.getCounterPaymentRecord(paymentAttemptId.trim());
    if (!record) {
      throw new CounterPaymentError("Counter payment record was not found.");
    }

    return record;
  }

  async getCounterPaymentRecordByCode(code: string): Promise<CounterPaymentRecord> {
    if (!code || code.trim() === "") {
      throw new CounterPaymentError("Kiosk confirmation code is required.");
    }

    const trimmed = code.trim();
    let record: CounterPaymentRecord | null = null;
    if (this.counterPaymentRepository.getCounterPaymentRecordByCode) {
      record = await this.counterPaymentRepository.getCounterPaymentRecordByCode(trimmed);
    } else {
      record = await this.counterPaymentRepository.getCounterPaymentRecord(trimmed);
    }

    if (!record) {
      throw new CounterPaymentError("Counter payment record was not found.");
    }

    return record;
  }

  async confirmPayment(
    request: ConfirmCounterPaymentRequest
  ): Promise<PaymentReviewDecisionResult> {
    const paymentAttemptId = request.paymentAttemptId?.trim();
    const code = request.code?.trim();

    if (!paymentAttemptId && !code) {
      throw new CounterPaymentError("Payment attempt ID or code is required.");
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
      paymentAttemptId: paymentAttemptId || undefined,
      code: code || undefined,
      actorUserId: request.actor.userId.trim(),
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
