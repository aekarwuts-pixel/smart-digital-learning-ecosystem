-- ============================================================
-- Phase 2 Updates: RBAC, Approval Workflow & Admin Setup
-- Run this ONCE after schema.sql has been deployed.
-- ============================================================

-- 1. Create approval_status enum type (skip if already exists)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'approval_status') then
    create type approval_status as enum ('pending', 'approved', 'rejected');
  end if;
end
$$;

-- 2. Add approval_status column to profiles (skip if already exists)
alter table profiles
  add column if not exists approval_status approval_status not null default 'pending';

-- 3. Approve all existing demo profiles (created before this update)
update profiles
set approval_status = 'approved'
where approval_status = 'pending';

-- 4. Add secret_pin column to students table (skip if already exists)
alter table students
  add column if not exists secret_pin text;

-- Set a default PIN for existing demo students (change before production!)
update students
set secret_pin = '1234'
where secret_pin is null;

-- 5. Setup Admin Profile for aekarwuts@gmail.com
-- This upserts based on auth_user_id so it's safe to re-run.
-- NOTE: auth_user_id must match the actual Supabase Auth UID.
-- Run setup_admin.js first to get the correct UID, then use it here.
insert into profiles (id, auth_user_id, school_id, role, full_name, email, approval_status)
values (
  gen_random_uuid(),
  'c32d3ecd-7390-4100-baf3-2a5906f93866', -- ← Supabase Auth UID for aekarwuts@gmail.com
  (select id from schools order by created_at limit 1),
  'admin',
  'ผู้ดูแลระบบ (Aekarwut)',
  'aekarwuts@gmail.com',
  'approved'
)
on conflict (auth_user_id)
do update set
  role = 'admin',
  approval_status = 'approved',
  full_name = 'ผู้ดูแลระบบ (Aekarwut)',
  updated_at = now();

-- 6. Disconnect legacy teacher demo account from Supabase Auth
-- (Prevents login with the old placeholder teacher account)
update profiles
set auth_user_id = null
where email = 'teacher@school.ac.th'
  and auth_user_id is not null;

-- ============================================================
-- Verification Queries (run manually after migration)
-- ============================================================
-- select id, full_name, email, role, approval_status, auth_user_id from profiles order by role;
-- select id, student_code, first_name, secret_pin from students;
