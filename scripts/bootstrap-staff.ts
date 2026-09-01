import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------------------
// 1. Helper to load .env.local or .env if present
// ----------------------------------------------------------------------------
function loadEnv() {
  const envFiles = ['.env.local', '.env', 'apps/staff-dashboard/.env.local', 'apps/admin-portal/.env.local'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

// ----------------------------------------------------------------------------
// 2. Parse CLI arguments
// ----------------------------------------------------------------------------
function parseArgs() {
  const args = process.argv.slice(2);
  const options: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (key.includes('=')) {
        const [k, v] = key.split('=');
        options[k] = v;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        options[key] = args[i + 1];
        i++;
      } else {
        options[key] = 'true';
      }
    }
  }

  return options;
}

// ----------------------------------------------------------------------------
// 3. Main Staff Bootstrap Logic
// ----------------------------------------------------------------------------
async function main() {
  loadEnv();
  const cliArgs = parseArgs();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Error: Missing required environment variables.');
    console.error('   Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }

  const email = (cliArgs.email || process.env.STAFF_EMAIL || 'staff@deskatlas.com').toLowerCase().trim();
  const password = cliArgs.password || process.env.STAFF_PASSWORD || 'StaffPassword123!';
  const displayName = cliArgs.name || process.env.STAFF_DISPLAY_NAME || 'Front Desk Staff';

  console.log('🚀 Bootstrapping DeskAtlas Staff Account...');
  console.log(`   Supabase URL : ${supabaseUrl}`);
  console.log(`   Staff Email  : ${email}`);
  console.log(`   Display Name : ${displayName}`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Step 1: Check if user already exists in auth
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Failed to query auth users:', listError.message);
    process.exit(1);
  }

  const existingUser = usersData.users.find((u) => u.email?.toLowerCase() === email);
  let userId: string;

  if (existingUser) {
    console.log(`ℹ️ User ${email} already exists in auth.users (ID: ${existingUser.id}). Updating password and metadata...`);
    userId = existingUser.id;

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        role: 'STAFF',
      },
    });

    if (updateError) {
      console.error('❌ Failed to update auth user:', updateError.message);
      process.exit(1);
    }
  } else {
    console.log(`✨ Creating new auth user for ${email}...`);
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        role: 'STAFF',
      },
    });

    if (createError || !createData.user) {
      console.error('❌ Failed to create auth user:', createError?.message);
      process.exit(1);
    }

    userId = createData.user.id;
  }

  // Step 2: Upsert public.staff_profiles record
  console.log(`🔒 Configuring public.staff_profiles for user ID ${userId}...`);
  const { error: profileError } = await supabase
    .from('staff_profiles')
    .upsert({
      user_id: userId,
      role: 'STAFF',
      display_name: displayName,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (profileError) {
    console.error('❌ Failed to upsert staff_profiles:', profileError.message);
    process.exit(1);
  }

  console.log('\n============================================================');
  console.log('✅ Staff bootstrap completed successfully!');
  console.log(`   Email    : ${email}`);
  console.log(`   Password : ${password}`);
  console.log(`   Role     : STAFF`);
  console.log('============================================================\n');
}

main().catch((err) => {
  console.error('❌ Unexpected error during bootstrap:', err);
  process.exit(1);
});
