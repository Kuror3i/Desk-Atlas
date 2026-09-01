import { createPaymentReviewService } from "@deskatlas/domain";
import { ReservationSupabaseRepository } from "@deskatlas/domain";

export function getAdminPaymentReviewService() {
  return createPaymentReviewService(new ReservationSupabaseRepository());
}
