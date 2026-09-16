import React from 'react';
import { SurgeryStatus } from '../types';
import { Clock, Droplets, Activity, CheckCircle2, BedDouble, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: SurgeryStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let badgeClass = 'badge-waiting';
  let icon = <Clock className="w-4 h-4" />;

  switch (status) {
    case 'รอผ่าตัด':
      badgeClass = 'badge-waiting';
      icon = <Clock className="w-4 h-4 text-amber-600" />;
      break;
    case 'เตรียมผ่าตัด':
    case 'เตรียมความพร้อม/หยอดยา':
      badgeClass = 'badge-preop';
      icon = <Droplets className="w-4 h-4 text-indigo-600" />;
      break;
    case 'กำลังผ่าตัด':
      badgeClass = 'badge-in_surgery';
      icon = <Activity className="w-4 h-4 text-orange-600" />;
      break;
    case 'ผ่าตัดเสร็จสิ้น':
      badgeClass = 'badge-postop';
      icon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      break;
    case 'ย้ายไปหอผู้ป่วย':
      badgeClass = 'badge-transferred';
      icon = <BedDouble className="w-4 h-4 text-teal-600" />;
      break;
    case 'ยกเลิก/เลื่อน':
      badgeClass = 'badge-cancelled';
      icon = <XCircle className="w-4 h-4 text-rose-600" />;
      break;
  }

  const labelText = status === 'เตรียมความพร้อม/หยอดยา' ? 'เตรียมผ่าตัด' : status;

  return (
    <span className={`badge-status ${badgeClass}`}>
      {icon}
      <span>{labelText}</span>
    </span>
  );
};

