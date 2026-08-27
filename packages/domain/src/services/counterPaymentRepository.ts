import {
  CounterPaymentRecord,
  PaymentMethod,
  PaymentReviewDecisionResult,
} from "../models/reservation";

export interface CounterPaymentRepository {
  listActiveKioskPaymentMethods(): Promise<PaymentMethod[]>;
  getCounterPaymentRecord(paymentAttemptId: string): Promise<CounterPaymentRecord | null>;
  confirmCounterPaymentAndAllocate(input: {
    paymentAttemptId: string;
    actorUserId: string;
    processedAt: string;
  }): Promise<PaymentReviewDecisionResult>;
}
