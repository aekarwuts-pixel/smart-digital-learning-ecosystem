/**
 * setup_admin.js
 * Run this script ONCE to initialize the Admin user in Supabase Auth
 * and sync the profiles table.
 *
 * Prerequisites: Fill in .env.local at the project root, then run:
 *   node setup_admin.js
 */
require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl   = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey    = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail    = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminName     = process.env.ADMIN_FULL_NAME ?? 'ผู้ดูแลระบบ';

if (!supabaseUrl || !serviceKey || !adminEmail || !adminPassword) {
  console.error('❌ Missing required env vars. Check .env.local:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  // 1. List all auth users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    return;
  }

  // 2. Delete old teacher demo auth user (if exists)
  const teacherUser = users?.find(u => u.email === 'teacher@school.ac.th');
  if (teacherUser) {
    await supabase.auth.admin.deleteUser(teacherUser.id);
    console.log('✅ Deleted legacy teacher auth user');
  } else {
    console.log('ℹ️  Legacy teacher auth user not found (already removed)');
  }

  // 3. Create or reuse Admin auth user
  let adminId;
  const existingAdmin = users?.find(u => u.email === adminEmail);

  if (existingAdmin) {
    console.log('ℹ️  Admin auth user already exists:', existingAdmin.id);
    adminId = existingAdmin.id;
  } else {
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    });
    if (adminError) {
      console.error('❌ Failed to create admin auth user:', adminError.message);
      return;
    }
    adminId = adminData.user.id;
    console.log('✅ Admin auth user created:', adminId);
  }

  // 4. Get first school id to link admin to a school
  const { data: schools } = await supabase.from('schools').select('id').limit(1);
  const schoolId = schools?.[0]?.id ?? null;
  console.log('ℹ️  Linking admin to school_id:', schoolId ?? '(none found)');

  // 5. Upsert admin profile (idempotent — safe to re-run)
  const { error: profileError } = await supabase.from('profiles').upsert({
    auth_user_id: adminId,
    school_id: schoolId,
    role: 'admin',
    full_name: adminName,
    email: adminEmail,
    approval_status: 'approved'
  }, { onConflict: 'auth_user_id' });

  if (profileError) {
    console.error('❌ Failed to upsert admin profile:', profileError.message);
  } else {
    console.log('✅ Admin profile synced successfully');
  }

  // 6. Disconnect old teacher profile from Supabase Auth
  await supabase
    .from('profiles')
    .update({ auth_user_id: null })
    .eq('email', 'teacher@school.ac.th');
  console.log('✅ Legacy teacher profile disconnected from auth');

  console.log('\n🎉 Setup complete!');
  console.log('   Email   :', adminEmail);
  console.log('   Auth ID :', adminId);
}

run().catch(err => console.error('Unhandled error:', err));
