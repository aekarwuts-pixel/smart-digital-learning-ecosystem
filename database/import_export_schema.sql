-- Optional extension tables for import/export job tracking.

create table if not exists import_jobs (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  classroom_id uuid references classrooms(id) on delete set null,
  file_name text not null,
  status text not null default 'pending',
  total_rows int not null default 0,
  success_rows int not null default 0,
  error_rows int not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists import_errors (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references import_jobs(id) on delete cascade,
  row_number int not null,
  raw_row text not null,
  reason text not null
);

create table if not exists export_jobs (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  classroom_id uuid references classrooms(id) on delete set null,
  file_name text not null,
  format text not null default 'csv',
  status text not null default 'pending',
  row_count int not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
