require('dotenv').config({ path: './.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const dbUrl = process.env.DATABASE_URL || `postgresql://postgres:${encodeURIComponent('Smart Digital Learning Ecosystem')}@db.qafbsdacvqusgtpzjxtb.supabase.co:5432/postgres`;

async function run() {
  console.log('Connecting to database...');
  const pgClient = new Client({ connectionString: dbUrl });
  
  try {
    await pgClient.connect();
    console.log('Connected successfully!');

    const sqlPath = path.join(__dirname, 'database', 'quiz_update.sql');
    console.log(`Reading SQL file from ${sqlPath}...`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running quiz database migrations...');
    await pgClient.query(sql);
    console.log('Quiz migrations applied successfully! 🎉');
  } catch (err) {
    console.error('❌ Error applying migrations:', err.message);
    process.exit(1);
  } finally {
    await pgClient.end();
    console.log('Connection closed.');
  }
}

run();
