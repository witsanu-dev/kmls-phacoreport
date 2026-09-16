"""
sync_ovst.py
=============
ตรวจสอบการเปิด Visit ล่วงหน้าในวันที่ 2026-09-18
ดึงข้อมูลจากตาราง hos.ovst (ฐานจริง) มาเก็บไว้ที่ db_phacoreport.ovst
เฉพาะคนไข้ที่มีรายชื่อ (HN) อยู่ในตาราง screen เท่านั้น
"""

import sys
import argparse
import pymysql
import pymysql.cursors
from datetime import datetime

# ─── การตั้งค่าการเชื่อมต่อ ───────────────────────────────────────────────────

HOSXP_DB = dict(
    host    = "10.250.100.200",
    port    = 3306,
    user    = "hxpkt",
    password= "servkt",
    db      = "hos",
    charset = "utf8mb4",
    connect_timeout = 10,
    cursorclass = pymysql.cursors.DictCursor,
)

PHACO_DB = dict(
    host    = "localhost",
    port    = 3306,
    user    = "root",
    password= "password",
    db      = "db_phacoreport",
    charset = "utf8mb4",
    connect_timeout = 10,
    cursorclass = pymysql.cursors.DictCursor,
)

def load_env_password(env_path: str = r"config\db.env") -> str:
    try:
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("DB_PASS="):
                    return line.split("=", 1)[1].strip().strip("\"'")
    except FileNotFoundError:
        pass
    return PHACO_DB["password"]

CREATE_OVST_SQL = """
CREATE TABLE IF NOT EXISTS `ovst` (
  `hos_guid` varchar(38) NOT NULL,
  `vn` varchar(13) DEFAULT NULL,
  `hn` varchar(9) DEFAULT NULL,
  `an` varchar(9) DEFAULT NULL,
  `vstdate` date DEFAULT NULL,
  `vsttime` time DEFAULT NULL,
  `doctor` varchar(7) DEFAULT NULL,
  `hospmain` varchar(9) DEFAULT NULL,
  `hospsub` varchar(9) DEFAULT NULL,
  `oqueue` int(11) DEFAULT NULL,
  `ovstist` char(2) DEFAULT NULL,
  `ovstost` varchar(4) DEFAULT NULL,
  `pttype` char(2) DEFAULT NULL,
  `pttypeno` varchar(50) DEFAULT NULL,
  `rfrics` char(1) DEFAULT NULL,
  `rfrilct` varchar(9) DEFAULT NULL,
  `rfrocs` char(1) DEFAULT NULL,
  `rfrolct` varchar(9) DEFAULT NULL,
  `spclty` char(2) DEFAULT NULL,
  `rcpt_disease` varchar(100) DEFAULT NULL,
  `hcode` varchar(5) DEFAULT NULL,
  `cur_dep` char(3) DEFAULT NULL,
  `cur_dep_busy` char(1) DEFAULT NULL,
  `last_dep` char(3) DEFAULT NULL,
  `cur_dep_time` time DEFAULT NULL,
  `rx_queue` int(11) DEFAULT NULL,
  `diag_text` varchar(250) DEFAULT NULL,
  `pt_subtype` tinyint(4) DEFAULT NULL,
  `main_dep` char(3) DEFAULT NULL,
  `main_dep_queue` int(11) DEFAULT NULL,
  `finance_summary_date` date DEFAULT NULL,
  `visit_type` char(1) DEFAULT NULL,
  `node_id` char(1) DEFAULT NULL,
  `contract_id` int(11) DEFAULT NULL,
  `waiting` char(1) DEFAULT NULL,
  `rfri_icd10` varchar(6) DEFAULT NULL,
  `o_refer_number` int(11) DEFAULT NULL,
  `has_insurance` char(1) DEFAULT NULL,
  `i_refer_number` varchar(25) DEFAULT NULL,
  `refer_type` char(1) DEFAULT NULL,
  `o_refer_dep` varchar(5) DEFAULT NULL,
  `staff` varchar(25) DEFAULT NULL,
  `command_doctor` varchar(6) DEFAULT NULL,
  `send_person` varchar(150) DEFAULT NULL,
  `pt_priority` int(11) DEFAULT NULL,
  `finance_lock` char(1) DEFAULT NULL,
  `oldcode` varchar(20) DEFAULT NULL,
  `sign_doctor` varchar(10) DEFAULT NULL,
  `anonymous_visit` char(1) DEFAULT NULL,
  `anonymous_vn` varchar(12) DEFAULT NULL,
  `pt_capability_type_id` int(11) DEFAULT NULL,
  `at_hospital` char(1) DEFAULT NULL,
  `ovst_key` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`hos_guid`),
  UNIQUE KEY `ix_vn_unique` (`vn`),
  KEY `ix_hn` (`hn`),
  KEY `ix_vstdate` (`vstdate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

def main():
    PHACO_DB["password"] = load_env_password()
    TARGET_DATE = "2026-09-18"

    print("=" * 65)
    print(f"  ตรวจสอบการเปิด Visit วันที่: {TARGET_DATE}")
    print("=" * 65)

    try:
        phaco_conn = pymysql.connect(**PHACO_DB)
    except Exception as e:
        print(f"❌ ไม่สามารถเชื่อมต่อ db_phacoreport: {e}")
        sys.exit(1)

    try:
        hosxp_conn = pymysql.connect(**HOSXP_DB)
    except Exception as e:
        print(f"❌ ไม่สามารถเชื่อมต่อ HosXP: {e}")
        phaco_conn.close()
        sys.exit(1)

    try:
        # สร้างตาราง ovst ใน phacoreport
        with phaco_conn.cursor() as cur:
            cur.execute(CREATE_OVST_SQL)
            phaco_conn.commit()

        # ดึง HN จาก screen
        with phaco_conn.cursor() as cur:
            cur.execute("SELECT DISTINCT hn FROM screen WHERE hn IS NOT NULL AND hn != ''")
            screen_hns = [r["hn"] for r in cur.fetchall()]

        if not screen_hns:
            print("✅ ไม่มีข้อมูล HN ในตาราง screen")
            return
            
        print(f"📋 พบ HN ในตาราง screen: {len(screen_hns)} คน")

        # ดึงข้อมูล Visit จาก HosXP
        placeholders = ", ".join(["%s"] * len(screen_hns))
        query_params = [TARGET_DATE] + screen_hns
        
        hosxp_sql = f"""
            SELECT *
            FROM hos.ovst
            WHERE vstdate = %s AND hn IN ({placeholders})
        """
        
        with hosxp_conn.cursor() as hcur:
            hcur.execute(hosxp_sql, query_params)
            ovst_rows = hcur.fetchall()

        found_hns = set(r["hn"] for r in ovst_rows)
        not_found_count = len(screen_hns) - len(found_hns)
        
        print(f"🔍 พบการเปิด Visit ในวันที่ {TARGET_DATE} : {len(found_hns)} คน (รวม {len(ovst_rows)} visits)")
        
        # บันทึกข้อมูลลงฐานข้อมูลตัวเอง
        if ovst_rows:
            with phaco_conn.cursor() as cur:
                columns = ovst_rows[0].keys()
                col_names = ", ".join([f"`{c}`" for c in columns])
                val_placeholders = ", ".join(["%s"] * len(columns))
                update_placeholders = ", ".join([f"`{c}` = VALUES(`{c}`)" for c in columns if c != 'hos_guid'])
                
                insert_sql = f"""
                    INSERT INTO ovst ({col_names})
                    VALUES ({val_placeholders})
                    ON DUPLICATE KEY UPDATE {update_placeholders}
                """
                
                inserted = 0
                for row in ovst_rows:
                    values = tuple(row[c] for c in columns)
                    cur.execute(insert_sql, values)
                    inserted += 1
                
                phaco_conn.commit()
                print(f"💾 นำเข้าข้อมูล ovst เก็บลงฐานข้อมูลสำเร็จ: {inserted} records")

        print("\n" + "-" * 65)
        print("  📊 สรุปผลการตรวจสอบ Visit")
        print(f"     ผู้ป่วยทั้งหมดที่นำมาตรวจสอบ (มี HN) : {len(screen_hns)} คน")
        print(f"     ✅ พบว่ามีการเปิด Visit แล้ว       : {len(found_hns)} คน")
        print(f"     ❌ ยังไม่มีการเปิด Visit           : {not_found_count} คน")
        print("-" * 65)

    finally:
        phaco_conn.close()
        hosxp_conn.close()
        print("\n🔌 ดำเนินการตรวจสอบเสร็จสิ้น ปิดการเชื่อมต่อเรียบร้อย")

if __name__ == "__main__":
    main()
