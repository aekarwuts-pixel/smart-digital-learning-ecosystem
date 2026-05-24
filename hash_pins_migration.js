/**
 * hash_pins_migration.js
 * One-time migration script: hashes all plain-text secret_pin values
 * in the students table using bcryptjs.
 *
 * Run ONCE after upgrading the login system to use bcrypt comparison:
 *   node hash_pins_migration.js
 *
 * Prerequisites: Fill in .env.local at the project root.
 */
require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const BCRYPT_ROUNDS = 10;

async function run() {
  console.log('🔐 Starting PIN hashing migration...\n');

  // Fetch all students with a non-null secret_pin
  const { data: students, error } = await supabase
    .from('students')
    .select('id, student_code, secret_pin')
    .not('secret_pin', 'is', null);

  if (error) {
    console.error('❌ Failed to fetch students:', error.message);
    return;
  }

  if (!students || students.length === 0) {
    console.log('ℹ️  No students with secret_pin found. Nothing to migrate.');
    return;
  }

  console.log(`Found ${students.length} student(s) to process.\n`);

  let updated = 0;
  let skipped = 0;

  for (const student of students) {
    const pin = student.secret_pin;

    // Skip if already hashed (bcrypt hashes start with $2a$ or $2b$)
    if (pin && (pin.startsWith('$2a$') || pin.startsWith('$2b$'))) {
      console.log(`  ⏭️  [${student.student_code}] Already hashed — skipping`);
      skipped++;
      continue;
    }

    // Hash the plain-text PIN
    const hashedPin = await bcrypt.hash(pin, BCRYPT_ROUNDS);

    const { error: updateError } = await supabase
      .from('students')
      .update({ secret_pin: hashedPin })
      .eq('id', student.id);

    if (updateError) {
      console.error(`  ❌ [${student.student_code}] Failed to update:`, updateError.message);
    } else {
      console.log(`  ✅ [${student.student_code}] PIN hashed successfully`);
      updated++;
    }
  }

  console.log(`\n🎉 Migration complete: ${updated} hashed, ${skipped} already hashed.`);
  console.log('   Students can now log in with their original PIN via bcrypt comparison.');
}

run().catch(err => console.error('Unhandled error:', err));
