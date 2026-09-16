"""
sync_hosxp.py
=============
ซิงค์ข้อมูลผู้ป่วยจาก HosXP (hos.person + hos.patient)
เข้าตาราง db_phacoreport.screen โดยใช้ cid เป็นตัวเชื่อม

ฟิลด์ที่เติม / อัปเดต:
  - hn             (จาก patient.hn)
  - pname          (จาก person.pname)
  - fname          (จาก person.fname)
  - lname          (จาก person.lname)
  - birth_year     (จาก person.birthday -> ปีพ.ศ.)
  - age            (คำนวณจาก person.birthday)
  - pttype         (จาก patient.pttype)

ใช้งาน:
  python sync_hosxp.py                  # Dry-run (แสดงผล ไม่บันทึก)
  python sync_hosxp.py --apply           # บันทึกจริงลงฐานข้อมูล
  python sync_hosxp.py --apply --verbose # บันทึกจริง + แสดงรายละเอียด
"""

import sys
import argparse
from datetime import date, datetime

try:
    import pymysql
    import pymysql.cursors
except ImportError:
    print("[X] ไม่พบ pymysql กรุณาติดตั้ง: pip install pymysql")
    sys.exit(1)

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
    password= "password",        # <- แก้ให้ตรงกับ config/db.env
    db      = "db_phacoreport",
    charset = "utf8mb4",
    connect_timeout = 10,
    cursorclass = pymysql.cursors.DictCursor,
)

# ─── ฟังก์ชันช่วย ────────────────────────────────────────────────────────────

def calc_age(birthday) -> int | None:
    """คำนวณอายุปัจจุบันจากวันเกิด (date / str)"""
    if not birthday:
        return None
    try:
        if isinstance(birthday, str):
            birthday = datetime.strptime(birthday, "%Y-%m-%d").date()
        today = date.today()
        return today.year - birthday.year - (
            (today.month, today.day) < (birthday.month, birthday.day)
        )
    except Exception:
        return None


def to_thai_year(birthday) -> int | None:
    """แปลง birthday -> ปีพ.ศ. (birth_year)"""
    if not birthday:
        return None
    try:
        if isinstance(birthday, str):
            birthday = datetime.strptime(birthday, "%Y-%m-%d").date()
        return birthday.year + 543
    except Exception:
        return None


def load_env_password(env_path: str = r"config\db.env") -> str:
    """อ่าน DB_PASS จาก config/db.env (ถ้ามี)"""
    try:
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("DB_PASS="):
                    return line.split("=", 1)[1].strip().strip("\"'")
    except FileNotFoundError:
        pass
    return PHACO_DB["password"]


# ─── โปรแกรมหลัก ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="ซิงค์ข้อมูลผู้ป่วยจาก HosXP -> db_phacoreport.screen"
    )
    parser.add_argument("--apply",   action="store_true",
                        help="บันทึกลงฐานข้อมูลจริง (ถ้าไม่ใส่ flag นี้จะเป็น dry-run)")
    parser.add_argument("--verbose", action="store_true",
                        help="แสดงรายละเอียดทุกแถว")
    parser.add_argument("--limit",   type=int, default=0,
                        help="จำกัดจำนวน CID ที่ประมวลผล (0 = ไม่จำกัด)")
    args = parser.parse_args()

    is_apply  = args.apply
    verbose   = args.verbose
    limit_rows = args.limit

    # โหลดรหัสผ่านจาก db.env
    PHACO_DB["password"] = load_env_password()

    print("=" * 65)
    print("  HosXP -> PhacoReport  Patient Sync")
    print(f"  Mode : {'🟢 APPLY (บันทึกจริง)' if is_apply else '🟡 DRY-RUN (ไม่บันทึก)'}")
    print(f"  Time : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 65)

    # ─── เชื่อมต่อ db_phacoreport ─────────────────────────────────────────
    print("\n🔗 เชื่อมต่อ db_phacoreport...", end=" ")
    try:
        phaco_conn = pymysql.connect(**PHACO_DB)
        print("✅ สำเร็จ")
    except Exception as e:
        print(f"\n❌ ไม่สามารถเชื่อมต่อ db_phacoreport: {e}")
        sys.exit(1)

    # ─── เชื่อมต่อ HosXP ──────────────────────────────────────────────────
    print("🔗 เชื่อมต่อ HosXP (hos)...", end=" ")
    try:
        hosxp_conn = pymysql.connect(**HOSXP_DB)
        print("✅ สำเร็จ")
    except Exception as e:
        print(f"\n❌ ไม่สามารถเชื่อมต่อ HosXP: {e}")
        phaco_conn.close()
        sys.exit(1)

    try:
        # โหลด cid ที่ต้องซิงค์จาก screen
        with phaco_conn.cursor() as cur:
            # เลือกทุกแถวที่มี cid เพื่อตรวจสอบและอัปเดตข้อมูลให้สมบูรณ์
            cur.execute("""
                SELECT id, cid, hn, pname, fname, lname,
                       birth_year, age, pttype,
                       house_no, village_no, subdistrict, district, province
                FROM screen
                WHERE cid IS NOT NULL AND cid != ''
                ORDER BY id ASC
            """)
            screen_rows = cur.fetchall()

        if limit_rows > 0:
            screen_rows = screen_rows[:limit_rows]

        total = len(screen_rows)
        print(f"\n📋 พบรายการที่ต้องตรวจสอบ: {total} รายการ")

        if total == 0:
            print("✅ ไม่มีรายการที่มี CID สำหรับการตรวจสอบ")
            return

        # ─── Query HosXP แบบ Batch โดยใช้ IN (cid list) ──────────────────
        cid_list = [r["cid"] for r in screen_rows if r["cid"]]
        placeholders = ", ".join(["%s"] * len(cid_list))

        hosxp_sql = f"""
            SELECT
                pa.cid,
                pa.hn,
                pa.pname,
                pa.fname,
                pa.lname,
                pa.birthday,
                pt.name AS pttype_name,
                pa.addrpart AS house_no,
                pa.moopart AS village_no,
                tmb.name AS subdistrict,
                amp.name AS district,
                chw.name AS province
            FROM hos.patient pa
            LEFT JOIN hos.pttype pt ON pt.pttype = pa.pttype
            LEFT JOIN hos.thaiaddress tmb ON tmb.chwpart = pa.chwpart AND tmb.amppart = pa.amppart AND tmb.tmbpart = pa.tmbpart
            LEFT JOIN hos.thaiaddress amp ON amp.chwpart = pa.chwpart AND amp.amppart = pa.amppart AND amp.tmbpart = '00'
            LEFT JOIN hos.thaiaddress chw ON chw.chwpart = pa.chwpart AND chw.amppart = '00' AND chw.tmbpart = '00'
            WHERE pa.cid IN ({placeholders})
        """
        with hosxp_conn.cursor() as hcur:
            hcur.execute(hosxp_sql, cid_list)
            hosxp_rows = hcur.fetchall()

        # สร้าง dict cid -> hosxp record
        hosxp_map = {r["cid"]: r for r in hosxp_rows}

        print(f"[*] พบข้อมูลใน HosXP: {len(hosxp_map)} รายการ")

        # ─── อัปเดตทีละแถว ───────────────────────────────────────────────
        updated = 0
        not_found = 0
        skipped = 0

        with phaco_conn.cursor() as cur:
            not_found_list = []
            for row in screen_rows:
                cid = row["cid"]
                hx  = hosxp_map.get(cid)

                if not hx:
                    not_found_list.append(row)
                    continue

                # คำนวณค่าใหม่
                new_hn        = (hx["hn"]    or "").strip() or None
                new_pname     = (hx["pname"] or "").strip() or None
                new_fname     = (hx["fname"] or "").strip() or None
                new_lname     = (hx["lname"] or "").strip() or None
                new_pttype    = (hx["pttype_name"] or "").strip() or None
                new_house_no  = (hx["house_no"] or "").strip() or None
                new_village_no= (hx["village_no"] or "").strip() or None
                new_subdist   = (hx["subdistrict"] or "").strip() or None
                new_district  = (hx["district"] or "").strip() or None
                new_province  = (hx["province"] or "").strip() or None
                new_age       = calc_age(hx["birthday"])
                new_birth_year= to_thai_year(hx["birthday"])

                # ตรวจสอบว่ามีอะไรเปลี่ยนไหม
                fields_to_update = {}

                if new_hn and (not row["hn"] or row["hn"].strip() == ""):
                    fields_to_update["hn"] = new_hn
                if new_pname and (not row["pname"] or row["pname"].strip() == ""):
                    fields_to_update["pname"] = new_pname
                if new_fname and (not row["fname"] or row["fname"].strip() == ""):
                    fields_to_update["fname"] = new_fname
                if new_lname and (not row["lname"] or row["lname"].strip() == ""):
                    fields_to_update["lname"] = new_lname
                
                if new_pttype and row["pttype"] != new_pttype:
                    fields_to_update["pttype"] = new_pttype
                if new_house_no and row["house_no"] != new_house_no:
                    fields_to_update["house_no"] = new_house_no
                if new_village_no and row["village_no"] != new_village_no:
                    fields_to_update["village_no"] = new_village_no
                if new_subdist and row["subdistrict"] != new_subdist:
                    fields_to_update["subdistrict"] = new_subdist
                if new_district and row["district"] != new_district:
                    fields_to_update["district"] = new_district
                if new_province and row["province"] != new_province:
                    fields_to_update["province"] = new_province
                    
                if new_age is not None and not row["age"]:
                    fields_to_update["age"] = new_age
                if new_birth_year is not None and not row["birth_year"]:
                    fields_to_update["birth_year"] = new_birth_year

                if not fields_to_update:
                    skipped += 1
                    if verbose:
                        print(f"  [-] ID {row['id']} CID {cid} -- ไม่มีฟิลด์ที่ต้องอัปเดต")
                    continue

                # สร้าง SET clause
                set_clause = ", ".join([f"{k} = %s" for k in fields_to_update])
                values     = list(fields_to_update.values()) + [row["id"]]
                update_sql = f"UPDATE screen SET {set_clause} WHERE id = %s"

                if verbose:
                    name_str = f"{new_pname or ''}{new_fname or ''} {new_lname or ''}".strip()
                    print(f"  [*] ID {row['id']} CID {cid} ({name_str})")
                    for k, v in fields_to_update.items():
                        old_val = row.get(k) or "-ว่าง-"
                        print(f"       {k}: {old_val!r} -> {v!r}")

                if is_apply:
                    cur.execute(update_sql, values)

                updated += 1

            # ─── Fallback สำหรับคนที่หา CID ไม่เจอ ให้หาจากชื่อ-นามสกุล ───────────────
            fallback_updated = 0
            if not_found_list:
                print(f"\n🔍 กำลังค้นหาข้อมูลจากชื่อ-นามสกุล จำนวน {len(not_found_list)} รายการที่ไม่มีใน HosXP (CID ไม่ตรง)...")
                fallback_sql = """
                    SELECT
                        pa.cid,
                        pa.hn,
                        pa.pname,
                        pa.fname,
                        pa.lname,
                        pa.birthday,
                        pt.name AS pttype_name,
                        pa.addrpart AS house_no,
                        pa.moopart AS village_no,
                        tmb.name AS subdistrict,
                        amp.name AS district,
                        chw.name AS province
                    FROM hos.patient pa
                    LEFT JOIN hos.pttype pt ON pt.pttype = pa.pttype
                    LEFT JOIN hos.thaiaddress tmb ON tmb.chwpart = pa.chwpart AND tmb.amppart = pa.amppart AND tmb.tmbpart = pa.tmbpart
                    LEFT JOIN hos.thaiaddress amp ON amp.chwpart = pa.chwpart AND amp.amppart = pa.amppart AND amp.tmbpart = '00'
                    LEFT JOIN hos.thaiaddress chw ON chw.chwpart = pa.chwpart AND chw.amppart = '00' AND chw.tmbpart = '00'
                    WHERE pa.fname = %s AND pa.lname = %s
                    LIMIT 1
                """
                with hosxp_conn.cursor() as hcur:
                    for row in not_found_list:
                        fname = (row.get("fname") or "").strip()
                        lname = (row.get("lname") or "").strip()
                        
                        if not fname or not lname:
                            not_found += 1
                            continue
                            
                        hcur.execute(fallback_sql, (fname, lname))
                        hx = hcur.fetchone()
                        
                        if not hx:
                            not_found += 1
                            if verbose:
                                print(f"  [!] ไม่พบชื่อ {fname} {lname} ใน HosXP")
                            continue
                            
                        # เจอข้อมูลจากชื่อ-นามสกุล ทำการอัปเดตเหมือนกัน
                        new_hn        = (hx["hn"]    or "").strip() or None
                        new_cid       = (hx["cid"]   or "").strip() or None
                        new_pname     = (hx["pname"] or "").strip() or None
                        new_fname     = (hx["fname"] or "").strip() or None
                        new_lname     = (hx["lname"] or "").strip() or None
                        new_pttype    = (hx["pttype_name"] or "").strip() or None
                        new_house_no  = (hx["house_no"] or "").strip() or None
                        new_village_no= (hx["village_no"] or "").strip() or None
                        new_subdist   = (hx["subdistrict"] or "").strip() or None
                        new_district  = (hx["district"] or "").strip() or None
                        new_province  = (hx["province"] or "").strip() or None
                        new_age       = calc_age(hx["birthday"])
                        new_birth_year= to_thai_year(hx["birthday"])

                        fields_to_update = {}
                        if new_cid and row["cid"] != new_cid:
                            fields_to_update["cid"] = new_cid
                        if new_hn and (not row["hn"] or row["hn"].strip() == ""):
                            fields_to_update["hn"] = new_hn
                        if new_pname and (not row["pname"] or row["pname"].strip() == ""):
                            fields_to_update["pname"] = new_pname
                        
                        if new_pttype and row["pttype"] != new_pttype:
                            fields_to_update["pttype"] = new_pttype
                        if new_house_no and row["house_no"] != new_house_no:
                            fields_to_update["house_no"] = new_house_no
                        if new_village_no and row["village_no"] != new_village_no:
                            fields_to_update["village_no"] = new_village_no
                        if new_subdist and row["subdistrict"] != new_subdist:
                            fields_to_update["subdistrict"] = new_subdist
                        if new_district and row["district"] != new_district:
                            fields_to_update["district"] = new_district
                        if new_province and row["province"] != new_province:
                            fields_to_update["province"] = new_province
                            
                        if new_age is not None and not row["age"]:
                            fields_to_update["age"] = new_age
                        if new_birth_year is not None and not row["birth_year"]:
                            fields_to_update["birth_year"] = new_birth_year

                        if not fields_to_update:
                            skipped += 1
                            continue

                        set_clause = ", ".join([f"{k} = %s" for k in fields_to_update])
                        values     = list(fields_to_update.values()) + [row["id"]]
                        update_sql = f"UPDATE screen SET {set_clause} WHERE id = %s"

                        if verbose:
                            print(f"  [*] MATCHED NAME -> ID {row['id']} ({fname} {lname})")
                            
                        if is_apply:
                            cur.execute(update_sql, values)

                        updated += 1
                        fallback_updated += 1
                        
            if is_apply:
                phaco_conn.commit()

        # ─── สรุปผล ────────────────────────────────────────────────────────
        print("\n" + "-" * 65)
        print(f"  📊 สรุปผลการซิงค์")
        print(f"     รายการที่ต้องเติม  : {total:>6}")
        print(f"     พบด้วย CID        : {len(hosxp_map):>6}")
        print(f"     พบด้วย ชื่อ-สกุล    : {fallback_updated:>6}")
        print(f"     อัปเดตสำเร็จ       : {updated:>6}  {'(บันทึกแล้ว)' if is_apply else '(dry-run)'}")
        print(f"     ข้ามได้ (ครบแล้ว)  : {skipped:>6}")
        print(f"     ไม่พบใน HosXP     : {not_found:>6}")
        print("-" * 65)

        if not is_apply and updated > 0:
            print("\n💡 เรียกใช้ด้วย  --apply  เพื่อบันทึกจริงลงฐานข้อมูล")
            print("   python sync_hosxp.py --apply")

    finally:
        phaco_conn.close()
        hosxp_conn.close()
        print("\n🔌 ปิดการเชื่อมต่อทั้งหมดเรียบร้อย")


if __name__ == "__main__":
    main()
