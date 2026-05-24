# Implementation Roadmap

แผนนี้ต่อจาก prototype ระยะที่ 2 ไปสู่ระบบที่ใช้งานจริงได้

## Phase 1: Data Foundation

ผลลัพธ์ที่ต้องได้:

- Supabase project พร้อม database
- ตารางตาม `database/schema.sql`
- RLS policy ตั้งต้นตาม `database/policies.sql`
- ข้อมูลตัวอย่างตาม `database/seed.sql`
- Storage buckets สำหรับสื่อ งานนักเรียน หลักฐาน ว PA และรายงาน

งานที่ต้องทำ:

1. เปิด Supabase project
2. รัน SQL schema
3. รัน RLS policies
4. รัน seed data
5. สร้าง storage buckets

## Phase 2: Convert Prototype to Real App

แนะนำใช้ Next.js + Tailwind CSS + Supabase

โครงสร้างเริ่มต้น:

```text
apps/web/
  app/
    login/
    dashboard/
    classes/
    assignments/
    attendance/
    pa/
  components/
  lib/
    supabase/
    queries/
  styles/
```

ลำดับเชื่อมข้อมูล:

1. Login และ session
2. Dashboard ครู
3. ห้องเรียนและรายชื่อนักเรียน
4. งานและการส่งงาน
5. ตรวจงานและ rubric
6. เพิ่มหลักฐาน ว PA จากงานที่ตรวจ
7. Preview รายงาน ว PA

## Phase 3: School Pilot

ทดลองกับ 1 รายวิชา 1 ห้องเรียนก่อน

ตัวชี้วัดทดลองใช้:

- ครูสร้างงานได้เอง
- นักเรียนส่งงานผ่านมือถือได้
- ครูตรวจงานและให้ feedback ได้
- ระบบสร้างหลักฐาน ว PA จากงานจริงได้
- ผู้ปกครองดูความก้าวหน้าพื้นฐานได้

## Phase 4: PA Innovation Package

เอกสารประกอบนวัตกรรมควรมี:

- ที่มาและความสำคัญ
- วัตถุประสงค์
- กลุ่มเป้าหมาย
- กระบวนการพัฒนา
- วิธีใช้งานระบบ
- ผลลัพธ์ผู้เรียน
- ตัวอย่างหลักฐานก่อนและหลังใช้ระบบ
- ข้อเสนอแนะในการพัฒนาต่อ
