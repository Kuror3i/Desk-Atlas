import {
  createAdminDashboardService,
  ReservationSupabaseRepository,
} from "@deskatlas/domain";
import { SupabaseWorkspaceRepository } from "../../workspaces/_lib/supabaseWorkspaceRepository";

export function getAdminDashboardService() {
  const reservationRepo = new ReservationSupabaseRepository();
  const workspaceRepo = new SupabaseWorkspaceRepository();
  return createAdminDashboardService(reservationRepo, reservationRepo, workspaceRepo);
}
