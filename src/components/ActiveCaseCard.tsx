import React from 'react';
import { Patient } from '../types';
import { StatusBadge } from './StatusBadge';
import { SurgeryTypeBadge } from './SurgeryTypeBadge';

interface ActiveCaseCardProps {
  patient: Patient;
}

export const ActiveCaseCard: React.FC<ActiveCaseCardProps> = ({ patient }) => {
  const isSurgery = patient.status === 'กำลังผ่าตัด';
  const borderBg = isSurgery
    ? 'border-orange-500 bg-orange-50/60'
    : 'border-indigo-400 bg-indigo-50/40';

  const queueBg = isSurgery
    ? 'bg-orange-500 text-white shadow-orange-500/30'
    : 'bg-indigo-500 text-white shadow-indigo-500/30';

  const dxCode = patient.diagnosis_code || 'H25.9';

  const formatThaiTime = (timeStr?: string) => {
    if (!timeStr || timeStr === '-' || timeStr.trim() === '') return '-';
    const cleanStr = timeStr.trim();
    if (cleanStr.includes('น.')) return cleanStr;
    const parts = cleanStr.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]} น.`;
    }
    return `${cleanStr} น.`;
  };

  return (
    <div className={`p-3.5 rounded-md border ${borderBg} flex flex-col sm:flex-row items-stretch gap-3 sm:gap-3.5 shadow-xs relative w-full`}>
      {/* 1. Queue Badge: Mobile full width bar / Desktop left side full-height */}
      <div
        className={`px-4 py-2 rounded-md font-bold flex flex-row sm:flex-col items-center justify-between sm:justify-center shadow-md whitespace-nowrap shrink-0 tracking-wide ${queueBg} w-full sm:w-auto sm:self-stretch sm:min-w-[76px] text-center`}
      >
        <span className="text-xs font-semibold opacity-90 leading-none sm:mb-1">คิว</span>
        <span className="text-xl font-extrabold leading-none">
          {patient.queue ? patient.queue : `#${patient.id}`}
        </span>
      </div>

      {/* 2. Main Content Info */}
      <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5 gap-2 sm:gap-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h4 className="font-bold text-slate-900 text-base flex flex-wrap items-center gap-1.5 leading-tight">
            <span>{patient.pname || ''}{patient.fname || ''} {patient.lname || ''}</span>
            <span className="text-xs font-normal text-slate-500 whitespace-nowrap">
              ({patient.age || '-'} ปี)
            </span>
          </h4>

          {/* Status Badge at Top Right */}
          <div className="shrink-0 whitespace-nowrap">
            <StatusBadge status={patient.status} />
          </div>
        </div>

        {/* Details row: HN, Surgeon, Start Time in Thai Format */}
        <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>HN: {patient.hn || '-'}</span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span>แพทย์: {patient.surgeon || 'ไม่ระบุ'}</span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span>เริ่ม: {formatThaiTime(patient.surgery_start_time)}</span>
        </p>

        {/* Surgery Type Badge + Badge Dx after it (without "Dx:" prefix) */}
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <SurgeryTypeBadge method={patient.surgery_method} />
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono font-bold bg-orange-50 text-orange-600 rounded-md border border-orange-300 shadow-2xs">
            {dxCode}
          </span>
        </div>
      </div>
    </div>
  );
};
