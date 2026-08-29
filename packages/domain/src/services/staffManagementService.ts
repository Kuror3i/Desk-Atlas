import {
  CreateStaffInput,
  StaffManagementAuthorizationError,
  StaffManagementError,
  StaffManagementActor,
  StaffMember,
  UpdateStaffInput,
} from '../models/staffManagement';
import { StaffManagementRepository } from './staffManagementRepository';

export class StaffManagementService {
  constructor(
    private readonly repository: StaffManagementRepository,
    private readonly nowProvider: () => Date = () => new Date()
  ) {}

  async listStaff(actor?: StaffManagementActor): Promise<StaffMember[]> {
    if (actor && actor.role !== 'ADMIN') {
      throw new StaffManagementAuthorizationError('Only ADMIN profiles may manage staff.');
    }
    return this.repository.listStaff(actor?.userId);
  }

  async getStaffById(id: string): Promise<StaffMember | null> {
    if (!id || !id.trim()) {
      throw new StaffManagementError('Staff ID is required.');
    }
    return this.repository.getStaffById(id.trim());
  }

  async createStaff(input: CreateStaffInput): Promise<StaffMember> {
    if (input.actorRole && input.actorRole !== 'ADMIN') {
      throw new StaffManagementAuthorizationError('Only ADMIN profiles may create staff accounts.');
    }

    const email = input.email ? input.email.trim().toLowerCase() : '';
    if (!email || !email.includes('@')) {
      throw new StaffManagementError('A valid email address is required.');
    }

    const displayName = input.displayName ? input.displayName.trim() : '';
    if (!displayName) {
      throw new StaffManagementError('Display name cannot be blank.');
    }

    if (input.role !== 'ADMIN' && input.role !== 'STAFF') {
      throw new StaffManagementError('Role must be either ADMIN or STAFF.');
    }

    if (input.password !== undefined && input.password.length < 6) {
      throw new StaffManagementError('Password must be at least 6 characters long.');
    }

    return this.repository.createStaff({
      ...input,
      email,
      displayName,
    });
  }

  async updateStaff(input: UpdateStaffInput): Promise<StaffMember> {
    if (input.actorRole && input.actorRole !== 'ADMIN') {
      throw new StaffManagementAuthorizationError('Only ADMIN profiles may update staff accounts.');
    }

    if (!input.staffUserId || !input.staffUserId.trim()) {
      throw new StaffManagementError('Staff user ID is required.');
    }

    if (input.displayName !== undefined && !input.displayName.trim()) {
      throw new StaffManagementError('Display name cannot be blank.');
    }

    if (input.role !== undefined && input.role !== 'ADMIN' && input.role !== 'STAFF') {
      throw new StaffManagementError('Role must be either ADMIN or STAFF.');
    }

    if (input.password !== undefined && input.password.trim().length > 0 && input.password.trim().length < 6) {
      throw new StaffManagementError('Password must be at least 6 characters long.');
    }

    return this.repository.updateStaff(input);
  }

  async deactivateStaff(staffUserId: string, actor: StaffManagementActor): Promise<StaffMember> {
    return this.updateStaff({
      staffUserId,
      isActive: false,
      actorUserId: actor.userId,
      actorRole: actor.role,
    });
  }

  async activateStaff(staffUserId: string, actor: StaffManagementActor): Promise<StaffMember> {
    return this.updateStaff({
      staffUserId,
      isActive: true,
      actorUserId: actor.userId,
      actorRole: actor.role,
    });
  }
}

export function createStaffManagementService(
  repository: StaffManagementRepository,
  nowProvider?: () => Date
): StaffManagementService {
  return new StaffManagementService(repository, nowProvider);
}
