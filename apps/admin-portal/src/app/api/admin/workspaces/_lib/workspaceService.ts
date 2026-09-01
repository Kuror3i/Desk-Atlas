import { createWorkspaceService } from '@deskatlas/domain';
import { SupabaseWorkspaceRepository } from './supabaseWorkspaceRepository';

export function getAdminWorkspaceService() {
  return createWorkspaceService(new SupabaseWorkspaceRepository());
}
