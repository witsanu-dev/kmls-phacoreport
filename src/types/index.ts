export type SurgeryStatus = 
  | 'รอผ่าตัด' 
  | 'เตรียมผ่าตัด'
  | 'เตรียมความพร้อม/หยอดยา' 
  | 'กำลังผ่าตัด' 
  | 'ผ่าตัดเสร็จสิ้น' 
  | 'ย้ายไปหอผู้ป่วย' 
  | 'ยกเลิก/เลื่อน';

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'provider';

export interface User {
  id: number;
  username: string;
  fullname: string;
  cid: string;
  role: UserRole;
  department?: string;
}

export interface Patient {
  id: number;
  cid?: string;
  screening_no?: number;
  surgery_no?: number;
  screening_date?: string;
  pname?: string;
  fname?: string;
  lname?: string;
  birth_year?: number;
  age?: number;
  pttype?: string;
  house_no?: string;
  village_no?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  va_right_eye?: string;
  va_left_eye?: string;
  lens_power?: string;
  anterior_chamber?: string;
  lens_type?: string;
  lens_serial_no?: string;
  lens_lot_no?: string;
  lens_expiry_date?: string;
  hn?: string;
  surgery_method?: string;
  complication?: string;
  diagnosis_code?: string;
  surgeon?: string;
  scrub_nurse?: string;
  circulating_nurse_1?: string;
  circulating_nurse_2?: string;
  surgery_start_time?: string;
  surgery_end_time?: string;
  surgery_date?: string;
  status: SurgeryStatus;
  queue?: number;
  ward?: string;
  note?: string;
}

export interface Ward {
  id: number;
  ward_code: string;
  ward_name: string;
  ward_type: string;
  bed_count: number;
}

export interface DashboardMetrics {
  total: number;
  waiting: number;
  preop: number;
  in_surgery: number;
  postop: number;
  transferred_ward: number;
  cancelled: number;
}

export interface WardStat {
  ward_name: string;
  cnt: number;
}

export interface SurgeryTypeStat {
  surgery_type: string;
  cnt: number;
}

export interface DashboardData {
  success: boolean;
  timestamp: number;
  metrics: DashboardMetrics;
  status_counts: Record<string, number>;
  ward_stats: WardStat[];
  surgery_types: SurgeryTypeStat[];
  active_patients: Patient[];
}
