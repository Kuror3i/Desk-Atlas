import type { DeskAtlasUser, AppRole } from '../models/user';

export function createDemoUser(role: AppRole): DeskAtlasUser {
  return {
    id: `user-${role}`,
    name: role.charAt(0).toUpperCase() + role.slice(1),
    role,
  };
}
