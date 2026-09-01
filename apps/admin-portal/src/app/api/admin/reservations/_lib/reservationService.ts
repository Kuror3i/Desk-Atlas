import { createAdminReservationService, ReservationSupabaseRepository } from "@deskatlas/domain";

export function getAdminReservationService() {
  return createAdminReservationService(new ReservationSupabaseRepository());
}
