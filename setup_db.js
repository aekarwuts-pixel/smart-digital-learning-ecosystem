require('dotenv').config({ path: './.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const dbUrl = process.env.DATABASE_URL || `postgresql://postgres:${encodeURIComponent('Smart Digital Learning Ecosystem')}@db.qafbsdacvqusgtpzjxtb.supabase.co:5432/postgres`;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const pgClient = new Client({ connectionString: dbUrl });
  try {
    await pgClient.connect();
    console.log('Connected to DB');

    // 1. Run SQL files
    const files = ['schema.sql', 'policies.sql', 'seed.sql'];
    for (const file of files) {
      console.log(`Executing ${file}...`);
      const sql = fs.readFileSync(path.join(__dirname, 'database', file), 'utf8');
      await pgClient.query(sql);
      console.log(`Executed ${file} successfully.`);
    }

    // 2. Create Auth User using Supabase Admin API
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Creating auth user teacher@school.ac.th...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'teacher@school.ac.th',
      password: '12345678',
      email_confirm: true
    });

    let authUserId;
    if (authError) {
      if (authError.message.includes('already exists')) {
        console.log('User already exists. Looking up user...');
        // We can't just look them up easily unless we list users, let's just do it
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw new Error('Failed to list users: ' + listError.message);
        const existing = users.find(u => u.email === 'teacher@school.ac.th');
        if (!existing) throw new Error('User already exists error but not found in list.');
        authUserId = existing.id;
      } else {
        throw new Error('Auth creation failed: ' + authError.message);
      }
    } else {
      authUserId = authData.user.id;
      console.log('Auth user created with ID:', authUserId);
    }

    // 3. Map auth_user_id to profiles
    console.log('Mapping auth_user_id to profile for teacher...');
    const updateQuery = `
      UPDATE profiles
      SET auth_user_id = $1
      WHERE email = $2
    `;
    await pgClient.query(updateQuery, [authUserId, 'teacher@school.ac.th']);
    console.log('Mapping successful.');
  } catch (err) {
    console.error('Error during setup:', err);
    process.exit(1);
  } finally {
    await pgClient.end();
  }
}

run();
