-- Smart Digital Learning Ecosystem
-- MVP database schema for PostgreSQL/Supabase.

create extension if not exists "pgcrypto";

create type user_role as enum ('teacher', 'student', 'parent', 'admin', 'leader');
create type approval_status as enum ('pending', 'approved', 'rejected');
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
  approval_status approval_status not null default 'pending',
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
  secret_pin text,
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

