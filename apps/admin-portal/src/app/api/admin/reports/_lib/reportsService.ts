import { createReportsService, ReservationSupabaseRepository } from "@deskatlas/domain";

export function getAdminReportsService() {
  return createReportsService(new ReservationSupabaseRepository());
}
