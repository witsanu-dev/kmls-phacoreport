import React from 'react';

interface KpiCardProps {
  title: string;
  count: number;
  subtitle: string;
  icon: React.ReactNode;
  borderClass: string;
  colorClass: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  count,
  subtitle,
  icon,
  borderClass,
  colorClass,
}) => {
  return (
    <div className={`card-rounded card-rounded-hover p-4 border-l-4 ${borderClass}`}>
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>{title}</span>
        <div className={colorClass}>{icon}</div>
      </div>
      <div className={`text-2xl sm:text-3xl font-bold mt-2 ${colorClass}`}>
        {count}
      </div>
      <div className="text-[11px] text-slate-400 mt-1">{subtitle}</div>
    </div>
  );
};
