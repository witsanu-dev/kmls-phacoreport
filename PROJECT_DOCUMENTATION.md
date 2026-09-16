# เอกสารสถาปัตยกรรมและหลักการพัฒนาระบบ (PROJECT_DOCUMENTATION.md)
**Phaco Realtime Monitor System (ระบบติดตามสถานะคิวและบันทึกการผ่าตัดสลายต้อกระจก)**

---

## 1. ภาพรวมระบบและวัตถุประสงค์ (System Overview & Purpose)
**Phaco Realtime Monitor System** เป็นระบบเว็บแอปพลิเคชันสำหรับติดตามและบริหารจัดการคิวการผ่าตัดสลายต้อกระจก (Phacoemulsification) แบบ Real-time ภายในห้องผ่าตัดและหอผู้ป่วย 

### วัตถุประสงค์หลัก:
1. **Real-time Queue & TV Monitor**: แสดงสถานะคิวผู้ป่วยผ่าตัดตาบนจอ TV Monitor หน้าห้องผ่าตัด/ห้องพักฟื้น พร้อมระบบอัปเดตแบบเรียลไทม์
2. **Clinical Data Management**: บันทึกและจัดการข้อมูลทางคลินิกอย่างละเอียด ได้แก่ ข้อมูลสายตา (Visual Acuity: VA), ข้อมูลเลนส์แก้วตาเทียม (IOL Power, Lens Type, Serial, Lot, Expiry), ข้างที่ทำการผ่าตัด (RE / LE / BE), ทีมพยาบาลและแพทย์ผ่าตัด, เวลาผ่าตัด และภาวะแทรกซ้อน (Complications)
3. **Automated HOSxP Integration**: ซิงก์ข้อมูลผู้ป่วยและการนัดหมายจากระบบสารสนเทศโรงพยาบาล (HOSxP MySQL Database) ผ่าน Python Daemon Agent อัตโนมัติ
4. **Role-Based Access Control (RBAC) & User Management**: ระบบจัดการผู้ใช้งาน ความปลอดภัย การยืนยันตัวตน (Login/Logout) และการจำกัดสิทธิ์ตามบทบาทงาน (Role Permissions)

---

## 2. โครงสร้างสถาปัตยกรรมและเทคโนโลยี (Architecture & Tech Stack)

| ส่วนประกอบ (Component) | เทคโนโลยีที่ใช้ (Technology Stack) | รายละเอียด (Details) |
|---|---|---|
| **Frontend Framework** | React 18 + TypeScript + Vite | พัฒนาสไตล์ Single Page Application (SPA) พร้อม Type Safety |
| **Styling & UI Components** | TailwindCSS + Lucide Icons | ดีไซน์ Modern Glassmorphism + Responsive Design |
| **Authentication & RBAC** | Session-based / Bcrypt Hashing | สิทธิ์ Admin, Doctor, Nurse, Provider (Read-Only) |
| **Backend API** | PHP 8.x PDO REST APIs | ให้บริการ JSON APIs ประมวลผลรวดเร็ว ปลอดภัยด้วย Prepared Statements |
| **Database Server** | MySQL / MariaDB (`db_phacoreport`) | เก็บข้อมูลการคัดกรอง คิว ข้อมูลการผ่าตัด ผู้ใช้งาน (`users`) และตั้งค่าระบบ |
| **Data Synchronization** | Python 3 (`sync_hosxp.py`) | เชื่อมต่อ HOSxP MySQL เพื่อดึงข้อมูลการนัดหมายผ่าตัดอัตโนมัติ |
| **Production Web Server** | Apache (AppServ) | Path ติดตั้งปลายทาง: `D:\AppServ\www\phacoreport` |

---

## 3. โครงสร้างไดเรกทอรีโปรเจกต์ (Directory Structure)

```
d:\myproject\phacoreport/
├── api/                           # PHP Backend REST APIs
│   ├── auth.php                   # API ระบบยืนยันตัวตน Login, Logout, Check Session
│   ├── init_users.php             # API สร้างตาราง users และเตรียมบัญชีผู้ใช้เริ่มต้น
│   ├── get_dashboard.php          # API สรุปข้อมูล Dashboard และสถิติ
│   ├── get_patients.php           # API ค้นหาและดึงข้อมูลรายชื่อผู้ป่วย
│   ├── get_providers.php          # API ดึงรายชื่อ แพทย์ / พยาบาล
│   ├── get_wards.php              # API ดึงรายชื่อ หอผู้ป่วย
│   ├── save_queue.php             # API บันทึก/อัปเดตข้อมูลคิวและการผ่าตัด (ตรวจสอบสิทธิ์ Write access)
│   ├── get_db_config.php          # API อ่านและบันทึกการตั้งค่าการเชื่อมต่อ DB
│   ├── test_db.php                # API ทดสอบความเร็วและการเชื่อมต่อ DB
│   ├── stream_realtime.php        # API SSE (Server-Sent Events) สำหรับ TV Monitor
│   └── last_update.json           # ตัวระบุเวลาซิงก์ข้อมูลล่าสุด
├── config/                        # คอนฟิกการเชื่อมต่อระบบ
│   ├── database.php               # ฟังก์ชันจัดการ PDO Connection & Session Auth Helpers
│   └── db.env                     # ไฟล์เก็บ Environment Variables ของ DB
├── data/                          # ไดเรกทอรีเก็บไฟล์ข้อมูลระบบ (ห้ามลบ)
├── dist/                          # ผลลัพธ์จากการ Build React Frontend (Production Build)
├── src/                           # Source Code หลักของ React Frontend
│   ├── context/                   # Context Provider
│   │   └── AuthContext.tsx        # Auth State Management & Permission Flags
│   ├── components/                # React Components
│   │   ├── ActiveCaseCard.tsx     # การ์ดแสดงเคสผ่าตัดที่กำลังดำเนินการ
│   │   ├── DbConfigModal.tsx      # Modal ตั้งค่าฐานข้อมูล
│   │   ├── KpiCard.tsx            # การ์ดตัวเลขสรุปสถิติ (KPI)
│   │   ├── Navbar.tsx             # แถบเมนูด้านบนระบบ พร้อมข้อมูลผู้ใช้และป้ายสิทธิ์
│   │   ├── SearchableSelect.tsx   # Dropdown ค้นหาชื่อแพทย์/พยาบาล/หอผู้ป่วย
│   │   ├── StatusBadge.tsx        # ป้ายแสดงสถานะการผ่าตัด
│   │   └── SurgeryTypeBadge.tsx   # ป้ายแสดงข้างที่ทำ (RE / LE / BE)
│   ├── hooks/                     # Custom React Hooks
│   │   └── useRealtime.ts         # Hook ดึงข้อมูลแบบเรียลไทม์
│   ├── pages/                     # หน้าหลักของระบบ
│   │   ├── Dashboard.tsx          # หน้า Dashboard ภาพรวมคิวและสถิติ
│   │   ├── QueueManage.tsx        # หน้าบันทึกและจัดการลำดับคิวการผ่าตัด (มีโหมด Read-Only สำหรับ Provider)
│   │   ├── TvMonitor.tsx          # หน้าจอ TV Monitor แสดงสถานะคิว
│   │   ├── Settings.tsx           # หน้าตั้งค่าการเชื่อมต่อฐานข้อมูล
│   │   └── Login.tsx              # หน้าเข้าสู่ระบบ (Login Page)
│   ├── services/                  # API Service Clients
│   │   └── api.ts                 # Axios/Fetch Wrappers สำหรับเรียก PHP API
│   ├── types/                     # TypeScript Interface Definitions
│   │   └── index.ts               # Data types (User, Patient, DashboardData ฯลฯ)
│   ├── App.tsx                    # Main App Component & Auth Routing Setup
│   ├── index.css                  # Tailwind Base CSS Style Definitions
│   └── main.tsx                   # Vite Application Entry Point
├── sync_hosxp.py                  # Python Script ซิงก์ข้อมูลจาก HOSxP อัตโนมัติ
├── sync_ovst.py                   # Python Script ซิงก์ข้อมูล OVST สำรอง
├── package.json                   # Dependencies และ npm Scripts
├── vite.config.ts                 # Vite Configuration Settings
├── tailwind.config.js             # Tailwind CSS Custom Design Tokens
├── tsconfig.json                  # TypeScript Compiler Configuration
└── PROJECT_DOCUMENTATION.md       # เอกสารสถาปัตยกรรมและหลักการพัฒนาระบบ
```

---

## 4. โครงสร้างฐานข้อมูลหลัก (Database Schema)

### 4.1 ตารางผู้ใช้งานและสิทธิ์ระบบ (`users`)

| ชื่อ ฟิลด์ (Field Name) | ประเภทข้อมูล (Type) | คำอธิบาย (Description) |
|---|---|---|
| `id` | INT AUTO_INCREMENT PRIMARY KEY | ไอดีอ้างอิงผู้ใช้งาน |
| `username` | VARCHAR(50) UNIQUE NOT NULL | ชื่อผู้ใช้งานสำหรับเข้าสู่ระบบ |
| `password_hash` | VARCHAR(255) NOT NULL | รหัสผ่านแฮชด้วย `password_hash()` (Bcrypt) |
| `fullname` | VARCHAR(150) NOT NULL | ชื่อ-นามสกุล บุคลากร |
| `cid` | VARCHAR(13) NOT NULL | เลขประจำตัวประชาชน 13 หลัก |
| `role` | ENUM('admin', 'doctor', 'nurse', 'provider') | สิทธิ์การใช้งานระบบ |
| `department` | VARCHAR(100) NULL | แผนก / หน่วยงานสังกัด |
| `is_active` | TINYINT(1) DEFAULT 1 | สถานะเปิดใช้งาน (1 = ใช้งานปกติ, 0 = ระงับ) |
| `created_at` | DATETIME | เวลาสร้างบัญชี |
| `updated_at` | DATETIME | เวลาอัปเดตล่าสุด |

### 4.2 ตารางข้อมูลการผ่าตัด (`screen`)

| ชื่อ ฟิลด์ (Field Name) | ประเภทข้อมูล (Type) | คำอธิบาย (Description) |
|---|---|---|
| `id` | INT AUTO_INCREMENT PRIMARY KEY | ไอดีอ้างอิงลำดับรายการ |
| `hn` | VARCHAR(20) | เลขประจำตัวผู้ป่วย (HN) |
| `vn` | VARCHAR(20) | เลขการรับบริการ (VN) |
| `screening_no` | INT | เลขที่การคัดกรอง |
| `surgery_no` | INT | เลขที่บันทึกผ่าตัด |
| `surgery_date` | DATE | วันที่ทำการผ่าตัด (YYYY-MM-DD) |
| `pname`, `fname`, `lname` | VARCHAR(50) | คำนำหน้า, ชื่อ, นามสกุล ผู้ป่วย |
| `age` | INT | อายุผู้ป่วย (ปี) |
| `pttype` | VARCHAR(10) | รหัสสิทธิการรักษา |
| `pttype_name` | VARCHAR(255) | ชื่อสิทธิการรักษา (แสดงผลใน UI) |
| `ward` / `ward_name` | VARCHAR(255) | ชื่อหอผู้ป่วย |
| `va_right_eye` | VARCHAR(50) | ค่า Visual Acuity ตาขวา (VA RE) |
| `va_left_eye` | VARCHAR(50) | ค่า Visual Acuity ตาซ้าย (VA LE) |
| `lens_power` | VARCHAR(50) | กำลังเลนส์แก้วตาเทียม (IOL Power) |
| `lens_type` | VARCHAR(100) | ชนิด/รุ่นเลนส์แก้วตาเทียม |
| `lens_serial_no` | VARCHAR(100) | Serial Number ของเลนส์ |
| `lens_lot_no` | VARCHAR(100) | Lot Number ของเลนส์ |
| `lens_expiry_date` | DATE | วันหมดอายุของเลนส์ |
| `surgery_method` | VARCHAR(100) | ข้างและประเภทผ่าตัด (เช่น RE Phaco + IOL, LE Phaco + IOL, BE) |
| `surgeon` | VARCHAR(150) | ชื่อแพทย์ผู้ทำการผ่าตัด |
| `scrub_nurse` | VARCHAR(150) | ชื่อพยาบาล Scrub Nurse |
| `circulating_nurse_1` | VARCHAR(150) | ชื่อพยาบาล Circulating Nurse 1 |
| `circulating_nurse_2` | VARCHAR(150) | ชื่อพยาบาล Circulating Nurse 2 |
| `surgery_start_time` | TIME | เวลาเริ่มต้นผ่าตัด |
| `surgery_end_time` | TIME | เวลาสิ้นสุดผ่าตัด |
| `complication` | VARCHAR(255) | ภาวะแทรกซ้อน |
| `status` | ENUM | สถานะ ('รอผ่าตัด', 'เตรียมผ่าตัด', 'เตรียมความพร้อม/หยอดยา', 'กำลังผ่าตัด', 'ผ่าตัดเสร็จสิ้น', 'ย้ายไปหอผู้ป่วย', 'ยกเลิก/เลื่อน') |
| `queue` | INT | ลำดับคิวผ่าตัดประจำวัน |
| `note` | TEXT | หมายเหตุเพิ่มเติม |

---

## 5. สิทธิ์การใช้งานระบบ (Roles Access Control & Permissions Matrix)

| บทบาทสิทธิ์ (Role) | สิทธิ์บันทึก/แก้ไขคิว (`save_queue.php`) | ตั้งค่าฐานข้อมูล | ดู Dashboards & TV Monitor | คำอธิบาย |
|---|:---:|:---:|:---:|---|
| **Admin** | ✅ อนุญาต | ✅ อนุญาต | ✅ อนุญาต | สิทธิ์เต็ม จัดการผู้ใช้และตั้งค่าระบบ |
| **Doctor** | ✅ อนุญาต | ❌ ปิด | ✅ อนุญาต | แพทย์ผ่าตัด บันทึกข้อมูลคลินิกและคิว |
| **Nurse** | ✅ อนุญาต | ❌ ปิด | ✅ อนุญาต | พยาบาลห้องผ่าตัด บันทึกข้อมูลการพยาบาล |
| **Provider** | **❌ ปิด (Read-Only)** | ❌ ปิด | ✅ อนุญาต | **อ่านข้อมูลได้อย่างเดียว ไม่สามารถบันทึกหรือแก้ไขได้** |

---

## 6. กฎการออกแบบ UI/UX และการกำหนดธีม (UI Design System Standards)

### 1) การเน้นฟิลด์ข้อมูลเฉพาะ (Custom Input Highlighting Rules):
* **สิทธิการรักษา (pttype)**: 
  - แสดงผลในรูปแบบ `input readonly` 
  - ใช้สีส้มสดใสสะดุดตา อ่านง่าย: `bg-orange-500/10 text-orange-600 font-semibold border-orange-300`
  - มีไอคอน `CreditCard` หน้าชื่อสิทธิการรักษา
* **ลำดับคิวผ่าตัดวันนี้ (Queue Number)**: 
  - แสดงผลในรูปแบบ `input` สีส้มพาสเทลสดใส 
  - ผู้ใช้งานที่มีสิทธิ์เขียนสามารถพิมพ์/คีย์แก้ไขลำดับคิวได้โดยตรง: `bg-amber-50 text-amber-900 border-amber-300 font-bold focus:ring-amber-500`

### 2) การจัดหมวดหมู่กลุ่มข้อมูลฟอร์มในหน้า Queue Management:
จัดเรียงข้อมูลออกเป็น 3 หมวดหมู่หลักอย่างเป็นระเบียบ:
1. **ข้อมูลผู้ป่วยและคิว (Patient & Queue Info)**:
   - ลำดับคิว, HN, ชื่อ-นามสกุล, สิทธิการรักษา (สีส้มสดใส), หอผู้ป่วย, สถานะการผ่าตัด
2. **ข้อมูล Visual Acuity (VA & Lens Info)**:
   - ค่า Visual Acuity ตาขวา (VA RE), ตาซ้าย (VA LE)
   - ข้อมูลเลนส์แก้วตาเทียม (IOL Power, Lens Type, Serial No, Lot No, Expiry Date)
3. **ข้อมูลการพยาบาล (Nursing, Timing & Complications)**:
   - ทีมผู้ผ่าตัด (แพทย์ผ่าตัด, Scrub Nurse, Circulating Nurse)
   - เวลาผ่าตัด (เวลาเริ่มผ่าตัด - เวลาสิ้นสุดผ่าตัด)
   - ภาวะแทรกซ้อน (Complications)

---

## 7. ขั้นตอนการซิงก์ข้อมูลจาก HOSxP (Data Synchronization Mechanism)

สคริปต์ `sync_hosxp.py` เป็น Python Daemon ที่ทำงานอัตโนมัติ:
1. ดึงการเชื่อมต่อ HOSxP Database (MySQL Port 3306 หรือตามที่กำหนด)
2. Query ข้อมูลการนัดหมายผ่าตัดต้อกระจกประจำวัน (`surgery_date = CURRENT_DATE`) จากตารางนัดหมาย/ผ่าตัดของ HOSxP
3. ทำการ Upsert (INSERT ON DUPLICATE KEY UPDATE) ลงในตาราง `screen` ของระบบ Phaco Report
4. ปรับอัปเดตไฟล์ `api/last_update.json` เพื่อให้ Frontend รับรู้ว่ามีการเปลี่ยนข้อมูลเรียลไทม์

---

## 8. คู่มือการ Build และ Deploy ไปยัง Web Server (Build & Deployment Guide)

เมื่อมีการพัฒนาโค้ดหรือแก้ไขส่วนต่างๆ ให้ดำเนินการตามขั้นตอนต่อไปนี้เสมอ:

### 1) การ Build React Frontend:
```powershell
# รันคำสั่ง Build React Vite ในไดเรกทอรีโปรเจกต์
npm run build
```

### 2) การคัดลอก Sync ไฟล์ไปยัง Production Web Server (`D:\AppServ\www\phacoreport`):
```powershell
# 1. คัดลอกไฟล์ Build dist
Copy-Item -Path 'd:\myproject\phacoreport\dist\*' -Destination 'D:\AppServ\www\phacoreport' -Recurse -Force

# 2. คัดลอกไฟล์ Backend APIs & Config
Copy-Item -Path 'd:\myproject\phacoreport\api\*' -Destination 'D:\AppServ\www\phacoreport\api' -Recurse -Force
Copy-Item -Path 'd:\myproject\phacoreport\config\*' -Destination 'D:\AppServ\www\phacoreport\config' -Recurse -Force

# 3. คัดลอกไฟล์สคริปต์ Python และเอกสาร
Copy-Item -Path 'd:\myproject\phacoreport\*.py' -Destination 'D:\AppServ\www\phacoreport\' -Force
Copy-Item -Path 'd:\myproject\phacoreport\PROJECT_DOCUMENTATION.md' -Destination 'D:\AppServ\www\phacoreport\' -Force
```

---

## 9. แนวทางและข้อตกลงในการเปิด New Conversation (Standards for Continuation)

เมื่อต้องการเริ่มสนทนาใหม่ (New Conversation) ให้แจ้ง AI เอเยนต์ดังนี้:
1. **ใช้อ้างอิงไฟล์เอกสารนี้**: กำหนดให้ AI อ่านและยึดถือข้อกำหนดใน `PROJECT_DOCUMENTATION.md` เป็นหลัก
2. **รักษาโครงสร้างและมาตรฐาน**:
   - ห้ามลบไดเรกทอรี `data/`
   - รักษากฎสี UI/UX (Input สิทธิการรักษา = สีส้มสดใส `readonly`, Input ลำดับคิว = สีส้มพาสเทลแก้ไขได้)
   - คงโครงสร้างกลุ่มฟอร์ม 3 ส่วน (ข้อมูลผู้ป่วย, ข้อมูล Visual Acuity, ข้อมูลการพยาบาล)
   - คงระบบยืนยันตัวตน และสิทธิ์ **Provider = Read-Only** ห้ามแก้ไขข้อมูลคิว
   - หลังทำการแก้ไขโค้ด จะต้องรัน `npm run build` และทำการ Sync ไฟล์ไปยัง `D:\AppServ\www\phacoreport` ทุกครั้ง

---
*เอกสารนี้สร้างขึ้นและปรับปรุงล่าสุดเมื่อ: 16 กันยายน 2026*
