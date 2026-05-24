require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('Creating auth user teacher@school.ac.th...');
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'teacher@school.ac.th',
    password: '12345678',
    email_confirm: true
  });

  if (authError) {
    if (authError.message.includes('already exists')) {
      console.log('User already exists. Skipping.');
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (!listError) {
        const existing = users.find(u => u.email === 'teacher@school.ac.th');
        if (existing) console.log('User ID is:', existing.id);
      }
    } else {
      console.error('Auth creation failed:', authError.message);
    }
  } else {
    console.log('Auth user created successfully with ID:', authData.user.id);
  }
}

run();
