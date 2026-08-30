import {
  CounterPaymentRecord,
  PaymentMethod,
  PaymentReviewDecisionResult,
} from "../models/reservation";

export interface CounterPaymentRepository {
  listActiveKioskPaymentMethods(): Promise<PaymentMethod[]>;
  getCounterPaymentRecord(paymentAttemptId: string): Promise<CounterPaymentRecord | null>;
  getCounterPaymentRecordByCode?(code: string): Promise<CounterPaymentRecord | null>;
  confirmCounterPaymentAndAllocate(input: {
    paymentAttemptId?: string;
    code?: string;
    actorUserId: string;
    processedAt: string;
  }): Promise<PaymentReviewDecisionResult>;
}
