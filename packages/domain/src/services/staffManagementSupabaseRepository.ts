import {
  CreateStaffInput,
  formatRelativeTime,
  getInitials,
  StaffManagementConflictError,
  StaffManagementError,
  StaffMember,
  UpdateStaffInput,
} from '../models/staffManagement';
import { StaffManagementRepository } from './staffManagementRepository';

export class StaffManagementSupabaseRepository implements StaffManagementRepository {
  private readonly restUrl: string;
  private readonly authAdminUrl: string;
  private readonly serviceRoleKey: string;

  constructor(
    options?: { supabaseUrl?: string; serviceRoleKey?: string },
    private readonly nowProvider: () => Date = () => new Date()
  ) {
    const supabaseUrl =
      options?.supabaseUrl ?? process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = options?.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required for staff routes');
    }

    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for staff routes');
    }

    const cleanBase = supabaseUrl.replace(/\/$/, '');
    this.restUrl = `${cleanBase}/rest/v1`;
    this.authAdminUrl = `${cleanBase}/auth/v1/admin`;
    this.serviceRoleKey = serviceRoleKey;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('apikey', this.serviceRoleKey);
    headers.set('Authorization', `Bearer ${this.serviceRoleKey}`);
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${this.restUrl}${path}`, {
      ...options,
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const detail = await response.text();
      let errorMsg = `Supabase request failed (${response.status}): ${detail}`;
      try {
        const parsed = JSON.parse(detail);
        if (parsed.message) errorMsg = parsed.message;
        if (parsed.error) errorMsg = parsed.error;
      } catch {
        // ignore
      }

      if (response.status === 409 || errorMsg.toLowerCase().includes('already exists')) {
        throw new StaffManagementConflictError(errorMsg);
      }
      throw new StaffManagementError(errorMsg);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  private mapRowToStaffMember(row: any): StaffMember {
    const now = this.nowProvider();
    const isActive = Boolean(row.is_active);
    const displayName = row.display_name ?? 'Unnamed Staff';
    const roleUpper = (row.role ?? 'STAFF').toUpperCase();
    const isRoleAdmin = roleUpper === 'ADMIN';

    return {
      id: row.id ?? row.user_id,
      email: row.email ?? 'unknown@deskatlas.com',
      name: displayName,
      role: isRoleAdmin ? 'Admin' : 'Staff',
      rawRole: isRoleAdmin ? 'ADMIN' : 'STAFF',
      isActive,
      initials: getInitials(displayName),
      status: isActive ? 'Active' : 'Inactive',
      statusStyle: isActive
        ? { background: 'var(--da-info)', color: 'var(--da-brand-dark)' }
        : { background: 'var(--da-soft)', color: 'var(--da-brand-dark)' },
      mark: isActive ? '✓' : '!',
      lastActive: formatRelativeTime(row.last_sign_in_at ?? row.updated_at ?? row.created_at, now),
      createdAt: row.created_at ?? now.toISOString(),
      updatedAt: row.updated_at ?? now.toISOString(),
    };
  }

  async listStaff(actorUserId?: string): Promise<StaffMember[]> {
    try {
      // 1. Try RPC first
      const rows = await this.request<any[]>('/rpc/admin_list_staff', {
        method: 'POST',
        body: JSON.stringify({
          p_actor_user_id: actorUserId ?? null,
        }),
      });

      return rows.map((r) => this.mapRowToStaffMember(r));
    } catch (rpcErr) {
      // 2. Fallback to direct REST table queries
      const profiles = await this.request<any[]>('/staff_profiles?select=*&order=created_at.asc');

      // Fetch users from auth admin if available
      let usersMap = new Map<string, { email?: string; last_sign_in_at?: string }>();
      try {
        const authRes = await fetch(`${this.authAdminUrl}/users?page=1&per_page=1000`, {
          headers: {
            apikey: this.serviceRoleKey,
            Authorization: `Bearer ${this.serviceRoleKey}`,
          },
          cache: 'no-store',
        });
        if (authRes.ok) {
          const authData = await authRes.json();
          const users = authData.users ?? [];
          for (const u of users) {
            usersMap.set(u.id, { email: u.email, last_sign_in_at: u.last_sign_in_at });
          }
        }
      } catch {
        // auth admin fallback ignore
      }

      return profiles.map((p) => {
        const authUser = usersMap.get(p.user_id);
        return this.mapRowToStaffMember({
          id: p.user_id,
          email: authUser?.email,
          role: p.role,
          display_name: p.display_name,
          is_active: p.is_active,
          created_at: p.created_at,
          updated_at: p.updated_at,
          last_sign_in_at: authUser?.last_sign_in_at,
        });
      });
    }
  }

  async createStaff(input: CreateStaffInput): Promise<StaffMember> {
    try {
      // 1. Try RPC first
      const rows = await this.request<any[]>('/rpc/admin_create_staff', {
        method: 'POST',
        body: JSON.stringify({
          p_actor_user_id: input.actorUserId ?? null,
          p_email: input.email,
          p_password: input.password || 'DeskAtlas123!',
          p_display_name: input.displayName,
          p_role: input.role,
        }),
      });

      if (!rows || rows.length === 0) {
        throw new StaffManagementError('Failed to create staff account');
      }

      return this.mapRowToStaffMember(rows[0]);
    } catch (err: any) {
      if (err instanceof StaffManagementConflictError) {
        throw err;
      }

      // 2. Fallback to Supabase GoTrue admin API + staff_profiles insert
      const trimmedEmail = input.email.toLowerCase().trim();
      const authRes = await fetch(`${this.authAdminUrl}/users`, {
        method: 'POST',
        headers: {
          apikey: this.serviceRoleKey,
          Authorization: `Bearer ${this.serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: input.password || 'DeskAtlas123!',
          email_confirm: true,
          user_metadata: {
            display_name: input.displayName.trim(),
            role: input.role,
          },
        }),
      });

      if (!authRes.ok) {
        const authErr = await authRes.json().catch(() => ({}));
        const msg = authErr.msg || authErr.message || authErr.error_description || 'Failed to create user in auth';
        if (authRes.status === 422 || msg.toLowerCase().includes('already exists')) {
          throw new StaffManagementConflictError(`A user with email ${trimmedEmail} already exists`);
        }
        throw new StaffManagementError(msg);
      }

      const createdAuthUser = await authRes.json();
      const userId = createdAuthUser.id;

      // Insert staff profile
      const profiles = await this.request<any[]>('/staff_profiles', {
        method: 'POST',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          user_id: userId,
          role: input.role,
          display_name: input.displayName.trim(),
          is_active: true,
        }),
      });

      // Insert audit log
      if (input.actorUserId) {
        await this.request('/audit_logs', {
          method: 'POST',
          body: JSON.stringify({
            actor_user_id: input.actorUserId,
            actor_role: input.actorRole ?? 'ADMIN',
            action: 'CREATE_STAFF_ACCOUNT',
            entity_type: 'staff_profiles',
            entity_id: userId,
            metadata: {
              email: trimmedEmail,
              role: input.role,
              display_name: input.displayName.trim(),
            },
          }),
        }).catch(() => {});
      }

      return this.mapRowToStaffMember({
        ...profiles[0],
        email: trimmedEmail,
      });
    }
  }

  async updateStaff(input: UpdateStaffInput): Promise<StaffMember> {
    try {
      // 1. Try RPC first
      const rows = await this.request<any[]>('/rpc/admin_update_staff', {
        method: 'POST',
        body: JSON.stringify({
          p_actor_user_id: input.actorUserId ?? null,
          p_target_user_id: input.staffUserId,
          p_display_name: input.displayName ?? null,
          p_role: input.role ?? null,
          p_is_active: input.isActive ?? null,
          p_new_password: input.password ?? null,
        }),
      });

      if (!rows || rows.length === 0) {
        throw new StaffManagementError('Failed to update staff account');
      }

      return this.mapRowToStaffMember(rows[0]);
    } catch (err: any) {
      // 2. Fallback
      const patchBody: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (input.displayName !== undefined) patchBody.display_name = input.displayName.trim();
      if (input.role !== undefined) patchBody.role = input.role;
      if (input.isActive !== undefined) patchBody.is_active = input.isActive;

      const profiles = await this.request<any[]>(`/staff_profiles?user_id=eq.${encodeURIComponent(input.staffUserId)}`, {
        method: 'PATCH',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify(patchBody),
      });

      if (!profiles || profiles.length === 0) {
        throw new StaffManagementError('Staff profile not found for update');
      }

      // If password is provided, update via auth admin
      if (input.password && input.password.trim().length >= 6) {
        await fetch(`${this.authAdminUrl}/users/${encodeURIComponent(input.staffUserId)}`, {
          method: 'PUT',
          headers: {
            apikey: this.serviceRoleKey,
            Authorization: `Bearer ${this.serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: input.password,
          }),
        }).catch(() => {});
      }

      // Log audit
      if (input.actorUserId) {
        const action = input.isActive === false ? 'DEACTIVATE_STAFF_ACCOUNT' : input.isActive === true ? 'REACTIVATE_STAFF_ACCOUNT' : 'UPDATE_STAFF_ACCOUNT';
        await this.request('/audit_logs', {
          method: 'POST',
          body: JSON.stringify({
            actor_user_id: input.actorUserId,
            actor_role: input.actorRole ?? 'ADMIN',
            action,
            entity_type: 'staff_profiles',
            entity_id: input.staffUserId,
            metadata: {
              role: input.role,
              display_name: input.displayName,
              is_active: input.isActive,
            },
          }),
        }).catch(() => {});
      }

      return this.mapRowToStaffMember(profiles[0]);
    }
  }

  async getStaffById(id: string): Promise<StaffMember | null> {
    const list = await this.listStaff();
    const found = list.find((s) => s.id === id);
    return found ?? null;
  }
}
