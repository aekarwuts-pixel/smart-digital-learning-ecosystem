-- 1) ตรวจ profiles ที่ยังไม่ map กับ auth.users
select id, full_name, email, role, auth_user_id
from profiles
where auth_user_id is null
order by role, full_name;

-- 2) ตัวอย่าง map auth_user_id ด้วยอีเมล
-- แทนค่า YOUR_AUTH_USER_ID และ teacher@school.ac.th ก่อนรัน
update profiles
set auth_user_id = 'YOUR_AUTH_USER_ID'
where email = 'teacher@school.ac.th';

-- 3) ตรวจผลลัพธ์หลัง map
select id, full_name, email, role, auth_user_id
from profiles
where email = 'teacher@school.ac.th';
