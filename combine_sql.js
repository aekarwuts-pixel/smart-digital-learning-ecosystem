const fs = require('fs');
const path = require('path');

const schema = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
const policies = fs.readFileSync(path.join(__dirname, 'database', 'policies.sql'), 'utf8');
const seed = fs.readFileSync(path.join(__dirname, 'database', 'seed.sql'), 'utf8');

const mapping = `
-- 4. Map the newly created auth user ID to the teacher profile
UPDATE profiles
SET auth_user_id = 'eb500f5b-6f0c-4e1c-b845-8392b77a5ca5'
WHERE email = 'teacher@school.ac.th';
`;

const combined = [
  '-- =========================================================================',
  '-- FULL SETUP SCRIPT FOR SMART DIGITAL LEARNING ECOSYSTEM',
  '-- =========================================================================',
  '',
  '-- PART 1: SCHEMA',
  schema,
  '',
  '-- PART 2: POLICIES',
  policies,
  '',
  '-- PART 3: SEED DATA',
  seed,
  '',
  '-- PART 4: AUTH USER MAPPING',
  mapping
].join('\n');

fs.writeFileSync(path.join(__dirname, 'combined_setup.sql'), combined, 'utf8');
console.log('combined_setup.sql created successfully!');
