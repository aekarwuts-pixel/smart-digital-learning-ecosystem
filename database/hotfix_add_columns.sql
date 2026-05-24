-- ============================================================
-- HOTFIX: Add missing columns to existing database
-- Run this in Supabase SQL Editor if schema.sql was already run
-- without phase2_sql_update.sql
-- ============================================================

-- 1. Create approval_status enum (if not exists)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'approval_status') then
    create type approval_status as enum ('pending', 'approved', 'rejected');
  end if;
end
$$;

-- 2. Add approval_status column to profiles (if not exists)
alter table profiles
  add column if not exists approval_status approval_status not null default 'pending';

-- 3. Add secret_pin column to students (if not exists)
alter table students
  add column if not exists secret_pin text;

-- 4. Approve all existing demo profiles
update profiles
set approval_status = 'approved'
where approval_status = 'pending';

-- 5. Set default PIN for existing students (will be hashed by hash_pins_migration.js)
update students
set secret_pin = '1234'
where secret_pin is null;

-- Verify
select 'profiles columns OK' as check, count(*) as rows from profiles;
select 'students with pin' as check, count(*) as rows from students where secret_pin is not null;
