# Next.js App

โฟลเดอร์ `apps/web` คือแอปจริงที่เริ่มย้ายจาก static prototype มาเป็น Next.js แล้ว

## วิธีรัน

ติดตั้ง dependencies:

```bash
npm install
```

เปิด dev server:

```bash
npm run dev
```

URL เริ่มต้น:

```text
http://127.0.0.1:3000
```

## ไฟล์สำคัญ

| ไฟล์ | หน้าที่ |
| --- | --- |
| `apps/web/app/page.tsx` | หน้าแรกของแอป |
| `apps/web/app/login/page.tsx` | หน้า Login |
| `apps/web/app/login/actions.ts` | Server actions สำหรับ sign in/sign out |
| `apps/web/middleware.ts` | Refresh Supabase session ระหว่าง request |
| `apps/web/components/dashboard-prototype.tsx` | React component ของ mobile dashboard |
| `apps/web/app/globals.css` | CSS สำหรับ mobile app |
| `apps/web/lib/database.types.ts` | TypeScript types ที่อิงจาก database schema |
| `apps/web/lib/demo-data.ts` | ข้อมูล fallback เมื่อยังไม่ได้ต่อ Supabase |
| `apps/web/lib/supabase/client.ts` | Supabase browser client |
| `apps/web/lib/supabase/server.ts` | Supabase server client |
| `apps/web/lib/queries/*` | Query/demo data layer |

## สถานะตอนนี้

- Build ผ่านแล้ว
- Typecheck ผ่านแล้ว
- หน้า Dashboard, ห้องเรียน, งาน และ ว PA ย้ายมาเป็น React component แล้ว
- มีหน้า Login และ Supabase auth actions แล้ว
- ถ้ายังไม่ตั้ง `.env.local` ระบบจะใช้ demo mode อัตโนมัติ
- ถ้าตั้ง Supabase env แล้ว query layer จะพยายามอ่านข้อมูลจริงจาก Supabase และ fallback เป็น demo เมื่อยังไม่มีข้อมูล

## ขั้นตอนถัดไป

1. สร้าง Supabase project
2. รัน `database/schema.sql`
3. รัน `database/policies.sql`
4. รัน `database/seed.sql`
5. ใส่ค่า `.env.local` จาก `.env.example`
6. สร้างผู้ใช้ใน Supabase Auth ให้ `auth_user_id` ตรงกับ `profiles.auth_user_id`
7. ทดสอบ Login ด้วยบัญชีจริง
8. เชื่อมหน้า งาน, ตรวจงาน, เช็กชื่อ และเพิ่มหลักฐานเป็น route แยกทีละหน้า

## Supabase Auth Note

หลังจากสร้าง user ใน Supabase Auth แล้ว ให้ update `profiles.auth_user_id` ของผู้ใช้ให้ตรงกับ `auth.users.id` เช่น:

```sql
update profiles
set auth_user_id = 'AUTH_USER_ID_FROM_SUPABASE'
where email = 'teacher@school.ac.th';
```
