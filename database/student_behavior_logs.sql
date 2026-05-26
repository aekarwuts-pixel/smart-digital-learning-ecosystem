-- ============================================================
-- Student Behavior Logs Setup
-- Creates student_behavior_logs table with parent acknowledgment support,
-- enables RLS, and sets access policies.
-- ============================================================

-- 1. Create table
create table if not exists student_behavior_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  teacher_id uuid not null references teachers(id) on delete cascade,
  category text not null, -- 'positive', 'negative', 'home_visit', 'counseling', 'parent_contact'
  title text not null,
  description text,
  points int not null default 0,
  log_date date not null default current_date,
  is_exported_to_pa boolean not null default false,
  pa_evidence_id uuid references pa_evidences(id) on delete set null,
  parent_acknowledged boolean not null default false,
  parent_acknowledged_at timestamptz,
  parent_comment text,
  created_at timestamptz not null default now()
);

-- 2. Create index for fast lookups
create index if not exists student_behavior_logs_student_idx on student_behavior_logs(student_id);
create index if not exists student_behavior_logs_teacher_idx on student_behavior_logs(teacher_id);

-- 3. Enable RLS
alter table student_behavior_logs enable row level security;

-- 4. Access Policies

-- Teachers can manage their own logs
create policy "teachers can manage own behavior logs"
on student_behavior_logs for all
using (teacher_id = current_teacher_id())
with check (teacher_id = current_teacher_id());

-- Students can read their own logs
create policy "students can read own behavior logs"
on student_behavior_logs for select
using (student_id = current_student_id());

-- Parents can read their children's logs
create policy "parents can read child behavior logs"
on student_behavior_logs for select
using (
  exists (
    select 1
    from parent_students ps
    where ps.student_id = student_behavior_logs.student_id
      and ps.parent_profile_id = current_profile_id()
  )
);

-- Parents can update acknowledgment fields of their children's logs
create policy "parents can update child behavior logs acknowledgment"
on student_behavior_logs for update
using (
  exists (
    select 1
    from parent_students ps
    where ps.student_id = student_behavior_logs.student_id
      and ps.parent_profile_id = current_profile_id()
  )
)
with check (
  exists (
    select 1
    from parent_students ps
    where ps.student_id = student_behavior_logs.student_id
      and ps.parent_profile_id = current_profile_id()
  )
);
