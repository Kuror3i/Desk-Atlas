import type { DeskAtlasUser, AppRole } from '../models/user';
import { ensureClient } from '../supabaseClient';

export function createDemoUser(role: AppRole): DeskAtlasUser {
  return {
    id: `user-${role}`,
    name: role.charAt(0).toUpperCase() + role.slice(1),
    role,
  };
}

export async function createAndSaveDemoUser(role: AppRole, authUserId?: string): Promise<DeskAtlasUser> {
  const user = createDemoUser(role);
  try {
    const supabase = ensureClient();
    const insertPayload: any = {
      display_name: user.name,
      role: user.role,
    };
    if (authUserId) insertPayload.auth_user_id = authUserId;

    const { data, error } = await supabase
      .from('staff_accounts')
      .insert([insertPayload])
      .select('*')
      .limit(1);

    if (error) {
      console.warn('Supabase insert error (staff_accounts):', error.message ?? error);
      return user;
    }

    if (Array.isArray(data) && data[0]) {
      const row: any = data[0];
      return {
        id: row.staff_account_id ?? user.id,
        name: row.display_name ?? user.name,
        role: row.role ?? user.role,
      };
    }

    return user;
  } catch (err) {
    console.warn('Failed to persist demo user to Supabase:', err);
    return user;
  }
}
