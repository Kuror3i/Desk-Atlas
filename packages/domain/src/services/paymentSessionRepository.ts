import {
  PaymentMethod,
  PaymentProofSubmissionResult,
  PaymentSessionRecord,
} from "../models/reservation";

export interface CreateWebPaymentSessionInput {
  tokenHash: string;
  expiresAt: string;
}

export interface ReservationPaymentRepository {
  getPaymentExpiryMinutes(): Promise<number>;
  listActiveWebPaymentMethods(): Promise<PaymentMethod[]>;
  listActiveKioskPaymentMethods(): Promise<PaymentMethod[]>;
  findPaymentSessionByTokenHash(tokenHash: string): Promise<PaymentSessionRecord | null>;
  expirePaymentSession(tokenHash: string, expiredAt: string): Promise<boolean>;
  submitPaymentProof(input: {
    tokenHash: string;
    paymentMethodId: string;
    proofStoragePath: string;
    proofSubmittedAt: string;
  }): Promise<PaymentProofSubmissionResult>;
}
