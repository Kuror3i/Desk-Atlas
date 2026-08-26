import { createMapService } from '@deskatlas/domain';
import { SupabaseMapRepository } from './supabaseMapRepository';

let cachedService: ReturnType<typeof createMapService> | null = null;

export function getAdminMapService() {
  cachedService ??= createMapService(new SupabaseMapRepository());
  return cachedService;
}