import {
  createAdminSettingsService,
  InMemorySettingsRepository,
  SupabaseSettingsRepository,
} from "@deskatlas/domain";

let serviceInstance: ReturnType<typeof createAdminSettingsService> | null = null;

export function getAdminSettingsService() {
  if (serviceInstance) {
    return serviceInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    serviceInstance = createAdminSettingsService(
      new SupabaseSettingsRepository({ supabaseUrl, serviceRoleKey })
    );
  } else {
    serviceInstance = createAdminSettingsService(new InMemorySettingsRepository());
  }

  return serviceInstance;
}
