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
