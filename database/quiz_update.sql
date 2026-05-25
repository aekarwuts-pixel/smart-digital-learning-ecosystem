-- ============================================================
-- Online Quizzes Migration
-- Creates quizzes, quiz_questions, and quiz_attempts tables
-- Enables RLS and sets access policies
-- ============================================================

-- 1. Create Quizzes Table
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  description text,
  max_score numeric(6,2) not null default 10.00,
  time_limit int, -- in minutes, optional
  is_published boolean not null default false,
  created_by uuid not null references teachers(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 2. Create Quiz Questions Table
create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'multiple_choice',
  options text[] not null, -- Array of 4 options
  correct_option_index int not null, -- 0-based index of correct answer
  points numeric(4,2) not null default 1.00,
  sort_order int not null default 0
);

-- 3. Create Quiz Attempts Table
create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  score numeric(6,2) not null,
  submitted_at timestamptz not null default now(),
  answers jsonb not null, -- Array of selected choices e.g., [{"question_id": "...", "selected_index": 0}]
  unique (quiz_id, student_id) -- One attempt per student per quiz
);

-- ============================================================
-- Enable Row Level Security (RLS)
-- ============================================================
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts enable row level security;

-- ============================================================
-- Access Policies
-- ============================================================

-- Quizzes: Teachers can manage own quizzes
create policy "teachers can manage own quizzes"
on quizzes for all
using (created_by = current_teacher_id())
with check (created_by = current_teacher_id());

-- Quizzes: Students can read published quizzes in their courses
create policy "students can read published quizzes"
on quizzes for select
using (
  is_published = true
  and exists (
    select 1
    from classrooms cr
    join classroom_students cs on cs.classroom_id = cr.id
    where cr.course_id = quizzes.course_id
      and cs.student_id = current_student_id()
  )
);

-- Quiz Questions: Teachers can manage own quiz questions
create policy "teachers can manage own quiz questions"
on quiz_questions for all
using (
  exists (
    select 1
    from quizzes q
    where q.id = quiz_questions.quiz_id
      and q.created_by = current_teacher_id()
  )
)
with check (
  exists (
    select 1
    from quizzes q
    where q.id = quiz_questions.quiz_id
      and q.created_by = current_teacher_id()
  )
);

-- Quiz Questions: Students can read quiz questions of published quizzes
create policy "students can read quiz questions"
on quiz_questions for select
using (
  exists (
    select 1
    from quizzes q
    where q.id = quiz_questions.quiz_id
      and q.is_published = true
      and exists (
        select 1
        from classrooms cr
        join classroom_students cs on cs.classroom_id = cr.id
        where cr.course_id = q.course_id
          and cs.student_id = current_student_id()
      )
  )
);

-- Quiz Attempts: Teachers can read all attempts for their quizzes
create policy "teachers can read quiz attempts"
on quiz_attempts for select
using (
  exists (
    select 1
    from quizzes q
    where q.id = quiz_attempts.quiz_id
      and q.created_by = current_teacher_id()
  )
);

-- Quiz Attempts: Students can manage own attempts
create policy "students can manage own attempts"
on quiz_attempts for all
using (student_id = current_student_id())
with check (student_id = current_student_id());
