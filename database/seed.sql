-- Demo data for the prototype flow.
-- Run after schema.sql in a local PostgreSQL/Supabase project.

insert into schools (id, name, province, district)
values ('00000000-0000-0000-0000-000000000001', 'โรงเรียนตัวอย่างดิจิทัล', 'กรุงเทพมหานคร', 'เขตตัวอย่าง');

insert into profiles (id, school_id, role, full_name, email, approval_status)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'teacher', 'นางสาวสุนิสา เทคโนโลยี', 'teacher@school.ac.th', 'approved'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'student', 'ด.ช.ปกรณ์ ใจดี', 'pakorn@student.school.ac.th', 'approved'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'student', 'ด.ญ.ณิชา เรียนดี', 'nicha@student.school.ac.th', 'approved'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'parent', 'ผู้ปกครองปกรณ์', 'parent@school.ac.th', 'approved');

insert into teachers (id, profile_id, teacher_code, position_name, academic_rank)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'T001', 'ครู', 'ชำนาญการ');

insert into students (id, profile_id, school_id, student_code, first_name, last_name, grade_level, room, secret_pin)
values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'S001', 'ปกรณ์', 'ใจดี', 'ม.2', '1', '1234'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'S002', 'ณิชา', 'เรียนดี', 'ม.2', '1', '1234');

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

