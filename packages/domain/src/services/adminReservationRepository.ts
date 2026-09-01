import { AdminReservationDetail, AdminReservationSummary } from "../models/reservation";

export interface AdminReservationRepository {
  listAdminReservations(): Promise<AdminReservationSummary[]>;
  getAdminReservationDetail(idOrReferenceCode: string): Promise<AdminReservationDetail | null>;
}
