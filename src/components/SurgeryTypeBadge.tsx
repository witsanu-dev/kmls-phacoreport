import React from 'react';

interface SurgeryTypeBadgeProps {
  method?: string;
}

export const SurgeryTypeBadge: React.FC<SurgeryTypeBadgeProps> = ({ method }) => {
  if (!method || method.trim() === '') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border bg-orange-50 text-orange-700 border-orange-200">
        Phaco iol
      </span>
    );
  }

  const raw = method.trim();
  const rawUpper = raw.toUpperCase();

  // Detect eye side (Left = ตาซ้าย, Right = ตาขวา)
  let eyeLabel = '';
  if (
    rawUpper.includes('/LE') ||
    rawUpper.includes(' LE') ||
    rawUpper.includes('LE/') ||
    rawUpper === 'LE' ||
    rawUpper.includes('LEFT') ||
    rawUpper.includes('ซ้าย')
  ) {
    eyeLabel = 'ตาซ้าย';
  } else if (
    rawUpper.includes('/RE') ||
    rawUpper.includes(' RE') ||
    rawUpper.includes('RE/') ||
    rawUpper === 'RE' ||
    rawUpper.includes('RIGHT') ||
    rawUpper.includes('ขวา')
  ) {
    eyeLabel = 'ตาขวา';
  }

  // Procedure Badge Style based on type
  let bgClass = 'bg-slate-50 text-slate-700 border-slate-200';
  if (rawUpper.includes('PHACO')) {
    bgClass = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (rawUpper.includes('ECCE')) {
    bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (rawUpper.includes('FEMTO')) {
    bgClass = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (rawUpper.includes('ICCE')) {
    bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (rawUpper.includes('SECONDARY')) {
    bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
  }

  // Eye Badge Style (side-by-side badge)
  const eyeBgClass =
    eyeLabel === 'ตาซ้าย'
      ? 'bg-sky-50 text-sky-700 border-sky-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <div className="inline-flex items-center gap-1.5 shrink-0">
      {/* 1. Thai Eye Side Badge (In Front / First) */}
      {eyeLabel && (
        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border ${eyeBgClass}`}>
          {eyeLabel}
        </span>
      )}

      {/* 2. Surgery Procedure Badge */}
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${bgClass}`}>
        {raw}
      </span>
    </div>
  );
};


