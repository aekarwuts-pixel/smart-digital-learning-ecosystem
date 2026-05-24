-- =========================================================================
-- FULL SETUP SCRIPT FOR SMART DIGITAL LEARNING ECOSYSTEM
-- =========================================================================

-- PART 1: SCHEMA
-- Smart Digital Learning Ecosystem
-- MVP database schema for PostgreSQL/Supabase.

create extension if not exists "pgcrypto";

create type user_role as enum ('teacher', 'student', 'parent', 'admin', 'leader');
create type attendance_status as enum ('present', 'late', 'leave', 'absent');
create type assignment_status as enum ('draft', 'published', 'closed');
create type submission_status as enum ('not_submitted', 'submitted', 'reviewed', 'returned');
create type evidence_category as enum (
  'learning_design',
  'learning_activity',
  'student_outcome',
  'student_support',
  'professional_development'
);

create table schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  province text,
  district text,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  school_id uuid references schools(id) on delete cascade,
  role user_role not null,
  full_name text not null,
  email text,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  teacher_code text,
  subject_group text not null default 'Science and Technology',
  position_name text,
  academic_rank text,
  created_at timestamptz not null default now()
);

create table students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles(id) on delete set null,
  school_id uuid not null references schools(id) on delete cascade,
  student_code text not null,
  first_name text not null,
  last_name text not null,
  grade_level text not null,
  room text not null,
  created_at timestamptz not null default now(),
  unique (school_id, student_code)
);

create table parent_students (
  id uuid primary key default gen_random_uuid(),
  parent_profile_id uuid not null references profiles(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  relationship text not null,
  created_at timestamptz not null default now(),
  unique (parent_profile_id, student_id)
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  teacher_id uuid not null references teachers(id) on delete cascade,
  code text,
  title text not null,
  grade_level text not null,
  semester int not null,
  academic_year int not null,
  description text,
  created_at timestamptz not null default now()
);

create table classrooms (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  name text not null,
  grade_level text not null,
  room text not null,
  created_at timestamptz not null default now()
);

create table classroom_students (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references classrooms(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  number_in_room int,
  created_at timestamptz not null default now(),
  unique (classroom_id, student_id)
);

create table learning_units (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  standard_code text,
  indicator_code text,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references learning_units(id) on delete cascade,
  title text not null,
  objective text,
  activity_summary text,
  lesson_date date,
  created_at timestamptz not null default now()
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  unit_id uuid references learning_units(id) on delete set null,
  lesson_id uuid references lessons(id) on delete set null,
  title text not null,
  description text,
  max_score numeric(6,2) not null default 100,
  due_at timestamptz,
  status assignment_status not null default 'draft',
  created_by uuid not null references teachers(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table rubric_items (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  title text not null,
  max_level int not null default 4,
  weight numeric(5,2) not null default 1,
  sort_order int not null default 0
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  status submission_status not null default 'not_submitted',
  submitted_at timestamptz,
  content text,
  teacher_feedback text,
  total_score numeric(6,2),
  reviewed_at timestamptz,
  reviewed_by uuid references teachers(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create table rubric_scores (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  rubric_item_id uuid not null references rubric_items(id) on delete cascade,
  level_score int not null,
  comment text,
  unique (submission_id, rubric_item_id)
);

create table attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references classrooms(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  teacher_id uuid not null references teachers(id) on delete cascade,
  session_date date not null,
  period_label text,
  note text,
  created_at timestamptz not null default now()
);

create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references attendance_sessions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  status attendance_status not null,
  note text,
  created_at timestamptz not null default now(),
  unique (session_id, student_id)
);

create table files (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references profiles(id) on delete set null,
  bucket_name text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now(),
  unique (bucket_name, storage_path)
);

create table submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  file_id uuid not null references files(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (submission_id, file_id)
);

create table pa_evidences (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  course_id uuid references courses(id) on delete set null,
  assignment_id uuid references assignments(id) on delete set null,
  submission_id uuid references submissions(id) on delete set null,
  lesson_id uuid references lessons(id) on delete set null,
  category evidence_category not null,
  title text not null,
  description text,
  indicator_code text,
  academic_year int not null,
  evidence_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table pa_evidence_files (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references pa_evidences(id) on delete cascade,
  file_id uuid not null references files(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (evidence_id, file_id)
);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  classroom_id uuid references classrooms(id) on delete cascade,
  created_by uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index profiles_school_role_idx on profiles(school_id, role);
create index courses_teacher_year_idx on courses(teacher_id, academic_year, semester);
create index classroom_students_student_idx on classroom_students(student_id);
create index assignments_course_status_idx on assignments(course_id, status);
create index submissions_assignment_status_idx on submissions(assignment_id, status);
create index attendance_records_student_idx on attendance_records(student_id);
create index pa_evidences_teacher_year_idx on pa_evidences(teacher_id, academic_year, category);



-- PART 2: POLICIES
-- Supabase Row Level Security starter policies.
-- These policies assume profiles.auth_user_id stores auth.uid().
-- Review and harden before production use.

alter table schools enable row level security;
alter table profiles enable row level security;
alter table teachers enable row level security;
alter table students enable row level security;
alter table parent_students enable row level security;
alter table courses enable row level security;
alter table classrooms enable row level security;
alter table classroom_students enable row level security;
alter table learning_units enable row level security;
alter table lessons enable row level security;
alter table assignments enable row level security;
alter table rubric_items enable row level security;
alter table submissions enable row level security;
alter table rubric_scores enable row level security;
alter table attendance_sessions enable row level security;
alter table attendance_records enable row level security;
alter table files enable row level security;
alter table submission_files enable row level security;
alter table pa_evidences enable row level security;
alter table pa_evidence_files enable row level security;
alter table announcements enable row level security;

create or replace function current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from profiles where auth_user_id = auth.uid()
$$;

create or replace function current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where auth_user_id = auth.uid()
$$;

create or replace function current_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.id
  from teachers t
  join profiles p on p.id = t.profile_id
  where p.auth_user_id = auth.uid()
$$;

create or replace function current_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select s.id
  from students s
  join profiles p on p.id = s.profile_id
  where p.auth_user_id = auth.uid()
$$;

create policy "profiles can read own profile"
on profiles for select
using (auth_user_id = auth.uid());

create policy "admins can read school profiles"
on profiles for select
using (
  exists (
    select 1
    from profiles me
    where me.auth_user_id = auth.uid()
      and me.school_id = profiles.school_id
      and me.role in ('admin', 'leader')
  )
);

create policy "teachers can read own teacher row"
on teachers for select
using (id = current_teacher_id());

create policy "teachers can read students in their classrooms"
on students for select
using (
  exists (
    select 1
    from classroom_students cs
    join classrooms cr on cr.id = cs.classroom_id
    join courses c on c.id = cr.course_id
    where cs.student_id = students.id
      and c.teacher_id = current_teacher_id()
  )
);

create policy "students can read self"
on students for select
using (id = current_student_id());

create policy "parents can read linked children"
on students for select
using (
  exists (
    select 1
    from parent_students ps
    where ps.student_id = students.id
      and ps.parent_profile_id = current_profile_id()
  )
);

create policy "teachers can manage own courses"
on courses for all
using (teacher_id = current_teacher_id())
with check (teacher_id = current_teacher_id());

create policy "students can read enrolled courses"
on courses for select
using (
  exists (
    select 1
    from classrooms cr
    join classroom_students cs on cs.classroom_id = cr.id
    where cr.course_id = courses.id
      and cs.student_id = current_student_id()
  )
);

create policy "parents can read child courses"
on courses for select
using (
  exists (
    select 1
    from classrooms cr
    join classroom_students cs on cs.classroom_id = cr.id
    join parent_students ps on ps.student_id = cs.student_id
    where cr.course_id = courses.id
      and ps.parent_profile_id = current_profile_id()
  )
);

create policy "teachers can manage classrooms for own courses"
on classrooms for all
using (
  exists (select 1 from courses c where c.id = classrooms.course_id and c.teacher_id = current_teacher_id())
)
with check (
  exists (select 1 from courses c where c.id = classrooms.course_id and c.teacher_id = current_teacher_id())
);

create policy "teachers can manage classroom students for own courses"
on classroom_students for all
using (
  exists (
    select 1
    from classrooms cr
    join courses c on c.id = cr.course_id
    where cr.id = classroom_students.classroom_id
      and c.teacher_id = current_teacher_id()
  )
)
with check (
  exists (
    select 1
    from classrooms cr
    join courses c on c.id = cr.course_id
    where cr.id = classroom_students.classroom_id
      and c.teacher_id = current_teacher_id()
  )
);

create policy "students can read own classroom membership"
on classroom_students for select
using (student_id = current_student_id());

create policy "parents can read child classroom membership"
on classroom_students for select
using (
  exists (
    select 1
    from parent_students ps
    where ps.student_id = classroom_students.student_id
      and ps.parent_profile_id = current_profile_id()
  )
);

create policy "teachers can manage units for own courses"
on learning_units for all
using (
  exists (select 1 from courses c where c.id = learning_units.course_id and c.teacher_id = current_teacher_id())
)
with check (
  exists (select 1 from courses c where c.id = learning_units.course_id and c.teacher_id = current_teacher_id())
);

create policy "teachers can manage lessons for own units"
on lessons for all
using (
  exists (
    select 1
    from learning_units u
    join courses c on c.id = u.course_id
    where u.id = lessons.unit_id
      and c.teacher_id = current_teacher_id()
  )
)
with check (
  exists (
    select 1
    from learning_units u
    join courses c on c.id = u.course_id
    where u.id = lessons.unit_id
      and c.teacher_id = current_teacher_id()
  )
);

create policy "teachers can manage own assignments"
on assignments for all
using (created_by = current_teacher_id())
with check (created_by = current_teacher_id());

create policy "students can read assigned work"
on assignments for select
using (
  exists (
    select 1
    from classrooms cr
    join classroom_students cs on cs.classroom_id = cr.id
    where cr.course_id = assignments.course_id
      and cs.student_id = current_student_id()
  )
);

create policy "teachers can manage rubric items"
on rubric_items for all
using (
  exists (select 1 from assignments a where a.id = rubric_items.assignment_id and a.created_by = current_teacher_id())
)
with check (
  exists (select 1 from assignments a where a.id = rubric_items.assignment_id and a.created_by = current_teacher_id())
);

create policy "students can read rubric items for assigned work"
on rubric_items for select
using (
  exists (
    select 1
    from assignments a
    join classrooms cr on cr.course_id = a.course_id
    join classroom_students cs on cs.classroom_id = cr.id
    where a.id = rubric_items.assignment_id
      and cs.student_id = current_student_id()
  )
);

create policy "teachers can read and update submissions for own assignments"
on submissions for all
using (
  exists (select 1 from assignments a where a.id = submissions.assignment_id and a.created_by = current_teacher_id())
)
with check (
  exists (select 1 from assignments a where a.id = submissions.assignment_id and a.created_by = current_teacher_id())
);

create policy "students can manage own submissions"
on submissions for all
using (student_id = current_student_id())
with check (student_id = current_student_id());

create policy "parents can read child submissions"
on submissions for select
using (
  exists (
    select 1
    from parent_students ps
    where ps.student_id = submissions.student_id
      and ps.parent_profile_id = current_profile_id()
  )
);

create policy "teachers can manage rubric scores for own assignments"
on rubric_scores for all
using (
  exists (
    select 1
    from submissions s
    join assignments a on a.id = s.assignment_id
    where s.id = rubric_scores.submission_id
      and a.created_by = current_teacher_id()
  )
)
with check (
  exists (
    select 1
    from submissions s
    join assignments a on a.id = s.assignment_id
    where s.id = rubric_scores.submission_id
      and a.created_by = current_teacher_id()
  )
);

create policy "students can read own rubric scores"
on rubric_scores for select
using (
  exists (
    select 1
    from submissions s
    where s.id = rubric_scores.submission_id
      and s.student_id = current_student_id()
  )
);

create policy "teachers can manage attendance sessions"
on attendance_sessions for all
using (teacher_id = current_teacher_id())
with check (teacher_id = current_teacher_id());

create policy "teachers can manage attendance records"
on attendance_records for all
using (
  exists (
    select 1
    from attendance_sessions s
    where s.id = attendance_records.session_id
      and s.teacher_id = current_teacher_id()
  )
)
with check (
  exists (
    select 1
    from attendance_sessions s
    where s.id = attendance_records.session_id
      and s.teacher_id = current_teacher_id()
  )
);

create policy "students can read own attendance"
on attendance_records for select
using (student_id = current_student_id());

create policy "parents can read child attendance"
on attendance_records for select
using (
  exists (
    select 1
    from parent_students ps
    where ps.student_id = attendance_records.student_id
      and ps.parent_profile_id = current_profile_id()
  )
);

create policy "teachers can manage own pa evidence"
on pa_evidences for all
using (teacher_id = current_teacher_id())
with check (teacher_id = current_teacher_id());

create policy "leaders can read school pa evidence"
on pa_evidences for select
using (
  exists (
    select 1
    from teachers t
    join profiles teacher_profile on teacher_profile.id = t.profile_id
    join profiles me on me.auth_user_id = auth.uid()
    where t.id = pa_evidences.teacher_id
      and teacher_profile.school_id = me.school_id
      and me.role in ('admin', 'leader')
  )
);

create policy "users can create owned file metadata"
on files for insert
with check (owner_profile_id = current_profile_id());

create policy "users can read owned file metadata"
on files for select
using (owner_profile_id = current_profile_id());

create policy "teachers can read submission file metadata"
on files for select
using (
  exists (
    select 1
    from submission_files sf
    join submissions s on s.id = sf.submission_id
    join assignments a on a.id = s.assignment_id
    where sf.file_id = files.id
      and a.created_by = current_teacher_id()
  )
);

create policy "teachers can read pa evidence file metadata"
on files for select
using (
  exists (
    select 1
    from pa_evidence_files pef
    join pa_evidences pe on pe.id = pef.evidence_id
    where pef.file_id = files.id
      and pe.teacher_id = current_teacher_id()
  )
);

create policy "students can manage own submission files"
on submission_files for all
using (
  exists (
    select 1
    from submissions s
    where s.id = submission_files.submission_id
      and s.student_id = current_student_id()
  )
)
with check (
  exists (
    select 1
    from submissions s
    where s.id = submission_files.submission_id
      and s.student_id = current_student_id()
  )
);

create policy "teachers can read submission file links"
on submission_files for select
using (
  exists (
    select 1
    from submissions s
    join assignments a on a.id = s.assignment_id
    where s.id = submission_files.submission_id
      and a.created_by = current_teacher_id()
  )
);

create policy "teachers can manage pa evidence file links"
on pa_evidence_files for all
using (
  exists (
    select 1
    from pa_evidences pe
    where pe.id = pa_evidence_files.evidence_id
      and pe.teacher_id = current_teacher_id()
  )
)
with check (
  exists (
    select 1
    from pa_evidences pe
    where pe.id = pa_evidence_files.evidence_id
      and pe.teacher_id = current_teacher_id()
  )
);

create policy "course members can read announcements"
on announcements for select
using (
  created_by = current_profile_id()
  or exists (
    select 1
    from courses c
    where c.id = announcements.course_id
      and c.teacher_id = current_teacher_id()
  )
  or exists (
    select 1
    from classrooms cr
    join classroom_students cs on cs.classroom_id = cr.id
    where cr.course_id = announcements.course_id
      and cs.student_id = current_student_id()
  )
);

create policy "teachers can create announcements for own courses"
on announcements for insert
with check (
  created_by = current_profile_id()
  and exists (
    select 1
    from courses c
    where c.id = announcements.course_id
      and c.teacher_id = current_teacher_id()
  )
);


-- PART 3: SEED DATA
-- Demo data for the prototype flow.
-- Run after schema.sql in a local PostgreSQL/Supabase project.

insert into schools (id, name, province, district)
values ('00000000-0000-0000-0000-000000000001', 'โรงเรียนตัวอย่างดิจิทัล', 'กรุงเทพมหานคร', 'เขตตัวอย่าง');

insert into profiles (id, school_id, role, full_name, email)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'teacher', 'นางสาวสุนิสา เทคโนโลยี', 'teacher@school.ac.th'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'student', 'ด.ช.ปกรณ์ ใจดี', 'pakorn@student.school.ac.th'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'student', 'ด.ญ.ณิชา เรียนดี', 'nicha@student.school.ac.th'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'parent', 'ผู้ปกครองปกรณ์', 'parent@school.ac.th');

insert into teachers (id, profile_id, teacher_code, position_name, academic_rank)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'T001', 'ครู', 'ชำนาญการ');

insert into students (id, profile_id, school_id, student_code, first_name, last_name, grade_level, room)
values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'S001', 'ปกรณ์', 'ใจดี', 'ม.2', '1'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'S002', 'ณิชา', 'เรียนดี', 'ม.2', '1');

insert into parent_students (parent_profile_id, student_id, relationship)
values ('10000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'ผู้ปกครอง');

insert into courses (id, school_id, teacher_id, code, title, grade_level, semester, academic_year, description)
values ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'ว22103', 'วิทยาการคำนวณ', 'ม.2', 1, 2569, 'ใช้แนวคิดเชิงคำนวณแก้ปัญหาอย่างเป็นขั้นตอน');

insert into classrooms (id, course_id, name, grade_level, room)
values ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'ม.2/1', 'ม.2', '1');

insert into classroom_students (classroom_id, student_id, number_in_room)
values
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 1),
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 2);

insert into learning_units (id, course_id, title, standard_code, indicator_code, description, sort_order)
values ('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'แนวคิดเชิงคำนวณ', 'ว 4.2', 'ว 4.2 ม.2/1', 'แยกปัญหา ระบุรูปแบบ สร้างขั้นตอน และทดสอบวิธีแก้ปัญหา', 1);

insert into lessons (id, unit_id, title, objective, activity_summary, lesson_date)
values ('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'อัลกอริทึมและการแก้ปัญหา', 'นักเรียนอธิบายขั้นตอนการแก้ปัญหาได้', 'ออกแบบผังงานแก้โจทย์ชีวิตประจำวัน', current_date);

insert into assignments (id, course_id, unit_id, lesson_id, title, description, max_score, due_at, status, created_by)
values ('80000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'ใบงาน: แยกปัญหาเป็นขั้นตอน', 'เลือกปัญหาในชีวิตประจำวันแล้วเขียนขั้นตอนการแก้ปัญหา', 20, now() + interval '1 day', 'published', '20000000-0000-0000-0000-000000000001');

insert into rubric_items (assignment_id, title, max_level, weight, sort_order)
values
  ('80000000-0000-0000-0000-000000000001', 'แยกปัญหาได้ชัดเจน', 4, 1, 1),
  ('80000000-0000-0000-0000-000000000001', 'ลำดับขั้นตอนถูกต้อง', 4, 1, 2),
  ('80000000-0000-0000-0000-000000000001', 'อธิบายเหตุผลได้', 4, 1, 3);

insert into submissions (id, assignment_id, student_id, status, submitted_at, content, total_score, teacher_feedback, reviewed_by, reviewed_at)
values ('90000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'reviewed', now(), 'algorithm_steps_pakorn.pdf', 16, 'ทำได้ดีขึ้น ลองเพิ่มเหตุผลในแต่ละขั้นตอนให้ชัดขึ้นอีกนิด', '20000000-0000-0000-0000-000000000001', now());

insert into pa_evidences (teacher_id, course_id, assignment_id, submission_id, lesson_id, category, title, description, indicator_code, academic_year)
values ('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'student_outcome', 'ผลงานนักเรียน: การแยกปัญหาเป็นขั้นตอน', 'หลักฐานแสดงพัฒนาการด้านแนวคิดเชิงคำนวณ', 'ว 4.2 ม.2/1', 2569);



-- PART 4: AUTH USER MAPPING

-- 4. Map the newly created auth user ID to the teacher profile
UPDATE profiles
SET auth_user_id = 'eb500f5b-6f0c-4e1c-b845-8392b77a5ca5'
WHERE email = 'teacher@school.ac.th';
