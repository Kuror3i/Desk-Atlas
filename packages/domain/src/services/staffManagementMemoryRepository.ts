import {
  CreateStaffInput,
  formatRelativeTime,
  getInitials,
  StaffManagementConflictError,
  StaffManagementError,
  StaffMember,
  StaffRole,
  UpdateStaffInput,
} from '../models/staffManagement';
import { StaffManagementRepository } from './staffManagementRepository';

export interface MemoryAuditLog {
  id: string;
  actorUserId: string | null;
  actorRole: 'ADMIN' | 'STAFF' | 'SYSTEM';
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, any>;
  createdAt: string;
}

interface MemoryStaffRecord {
  id: string;
  email: string;
  password?: string;
  displayName: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastSignInAt?: string;
}

export class StaffManagementMemoryRepository implements StaffManagementRepository {
  private records: Map<string, MemoryStaffRecord> = new Map();
  public auditLogs: MemoryAuditLog[] = [];

  constructor(
    initialRecords?: Array<{
      id: string;
      email: string;
      password?: string;
      displayName: string;
      role: StaffRole;
      isActive: boolean;
      createdAt?: string;
      updatedAt?: string;
      lastSignInAt?: string;
    }>,
    private readonly nowProvider: () => Date = () => new Date()
  ) {
    if (initialRecords) {
      for (const rec of initialRecords) {
        const nowIso = this.nowProvider().toISOString();
        this.records.set(rec.id, {
          id: rec.id,
          email: rec.email.toLowerCase().trim(),
          password: rec.password,
          displayName: rec.displayName.trim(),
          role: rec.role,
          isActive: rec.isActive,
          createdAt: rec.createdAt ?? nowIso,
          updatedAt: rec.updatedAt ?? nowIso,
          lastSignInAt: rec.lastSignInAt,
        });
      }
    }
  }

  private mapToStaffMember(rec: MemoryStaffRecord): StaffMember {
    const now = this.nowProvider();
    return {
      id: rec.id,
      email: rec.email,
      name: rec.displayName,
      role: rec.role === 'ADMIN' ? 'Admin' : 'Staff',
      rawRole: rec.role,
      isActive: rec.isActive,
      initials: getInitials(rec.displayName),
      status: rec.isActive ? 'Active' : 'Inactive',
      statusStyle: rec.isActive
        ? { background: 'var(--da-info)', color: 'var(--da-brand-dark)' }
        : { background: 'var(--da-soft)', color: 'var(--da-brand-dark)' },
      mark: rec.isActive ? '✓' : '!',
      lastActive: formatRelativeTime(rec.lastSignInAt ?? rec.updatedAt, now),
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    };
  }

  async listStaff(actorUserId?: string): Promise<StaffMember[]> {
    if (actorUserId && this.records.has(actorUserId)) {
      const actor = this.records.get(actorUserId)!;
      if (actor.role !== 'ADMIN' || !actor.isActive) {
        throw new StaffManagementError('Only active ADMIN profiles may view staff management');
      }
    }

    return Array.from(this.records.values())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((rec) => this.mapToStaffMember(rec));
  }

  async getStaffById(id: string): Promise<StaffMember | null> {
    const rec = this.records.get(id);
    return rec ? this.mapToStaffMember(rec) : null;
  }

  async createStaff(input: CreateStaffInput): Promise<StaffMember> {
    const trimmedEmail = input.email.toLowerCase().trim();
    const trimmedName = input.displayName.trim();
    const nowIso = this.nowProvider().toISOString();

    for (const rec of this.records.values()) {
      if (rec.email === trimmedEmail) {
        throw new StaffManagementConflictError(`A user with email ${trimmedEmail} already exists`);
      }
    }

    const newId = `staff-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const record: MemoryStaffRecord = {
      id: newId,
      email: trimmedEmail,
      password: input.password,
      displayName: trimmedName,
      role: input.role,
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.records.set(newId, record);

    if (input.actorUserId) {
      this.auditLogs.push({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        actorUserId: input.actorUserId,
        actorRole: input.actorRole ?? 'ADMIN',
        action: 'CREATE_STAFF_ACCOUNT',
        entityType: 'staff_profiles',
        entityId: newId,
        metadata: {
          email: trimmedEmail,
          role: input.role,
          displayName: trimmedName,
        },
        createdAt: nowIso,
      });
    }

    return this.mapToStaffMember(record);
  }

  async updateStaff(input: UpdateStaffInput): Promise<StaffMember> {
    const current = this.records.get(input.staffUserId);
    if (!current) {
      throw new StaffManagementError('Staff member not found');
    }

    const nowIso = this.nowProvider().toISOString();
    let action = 'UPDATE_STAFF_ACCOUNT';

    if (input.isActive !== undefined && input.isActive !== current.isActive) {
      action = input.isActive ? 'REACTIVATE_STAFF_ACCOUNT' : 'DEACTIVATE_STAFF_ACCOUNT';
    }

    const updated: MemoryStaffRecord = {
      ...current,
      displayName: input.displayName ? input.displayName.trim() : current.displayName,
      role: input.role ?? current.role,
      isActive: input.isActive !== undefined ? input.isActive : current.isActive,
      password: input.password ? input.password : current.password,
      updatedAt: nowIso,
    };

    this.records.set(input.staffUserId, updated);

    if (input.actorUserId) {
      this.auditLogs.push({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        actorUserId: input.actorUserId,
        actorRole: input.actorRole ?? 'ADMIN',
        action,
        entityType: 'staff_profiles',
        entityId: input.staffUserId,
        metadata: {
          previousRole: current.role,
          newRole: updated.role,
          previousDisplayName: current.displayName,
          newDisplayName: updated.displayName,
          previousIsActive: current.isActive,
          newIsActive: updated.isActive,
          passwordChanged: !!input.password,
        },
        createdAt: nowIso,
      });
    }

    return this.mapToStaffMember(updated);
  }
}
