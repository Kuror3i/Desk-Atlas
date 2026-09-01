import { CreateStaffInput, StaffMember, UpdateStaffInput } from '../models/staffManagement';

export interface StaffManagementRepository {
  listStaff(actorUserId?: string): Promise<StaffMember[]>;
  createStaff(input: CreateStaffInput): Promise<StaffMember>;
  updateStaff(input: UpdateStaffInput): Promise<StaffMember>;
  getStaffById(id: string): Promise<StaffMember | null>;
}
