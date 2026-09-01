import { createStaffManagementService, StaffManagementSupabaseRepository } from "@deskatlas/domain";

export function getStaffManagementService() {
  return createStaffManagementService(new StaffManagementSupabaseRepository());
}
