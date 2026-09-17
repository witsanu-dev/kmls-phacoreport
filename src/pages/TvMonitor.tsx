import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Patient } from '../types';
import { useRealtime } from '../hooks/useRealtime';
import { SurgeryTypeBadge } from '../components/SurgeryTypeBadge';
import { Monitor, Droplets, Activity, CheckCircle2, Maximize2, BedDouble, LayoutDashboard, Terminal } from 'lucide-react';

interface TvMonitorProps {
  onBack?: () => void;
}

export const TvMonitor: React.FC<TvMonitorProps> = ({ onBack }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  const fetchBoardData = useCallback(async () => {
    const list = await api.getPatients();

    // Sort patients by Queue ASC (1, 2, 3...)
    const sorted = [...list].sort((a, b) => {
      const qA = a.queue && a.queue > 0 ? a.queue : 999999;
      const qB = b.queue && b.queue > 0 ? b.queue : 999999;
      return qA - qB;
    });

    setPatients(sorted);
  }, []);

  useEffect(() => {
    fetchBoardData();

    const updateClock = () => {
      const now = new Date();
      const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      setDateStr(`${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear() + 543}`);
      setTimeStr(now.toLocaleTimeString('th-TH', { hour12: false }));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [fetchBoardData]);

  useRealtime(() => {
    fetchBoardData();
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Fullscreen error: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const preopCases = patients.filter((p) => p.status === 'เตรียมความพร้อม/หยอดยา' || p.status === 'เตรียมผ่าตัด');
  const inSurgeryCases = patients.filter((p) => p.status === 'กำลังผ่าตัด');
  const postopCases = patients.filter((p) => p.status === 'ผ่าตัดเสร็จสิ้น' || p.status === 'ย้ายไปหอผู้ป่วย');

  const getPdpaName = (p: Patient) => {
    const prefix = p.pname?.trim() || 'คุณ';
    const fullFirst = p.fname?.trim() || '';
    const maskedLast = p.lname && p.lname.trim() !== ''
      ? p.lname.trim().slice(0, 4) + 'XXX'
      : '';
    if (fullFirst || maskedLast) {
      return `${prefix} ${fullFirst} ${maskedLast}`.trim();
    }
    return 'ผู้รับบริการ';
  };

  return (
    <div className="w-full h-screen max-h-screen bg-slate-950 text-white flex flex-col select-none font-anuphan overflow-hidden">

      {/* ── Header (Full Responsive Col-12) ── */}
      <header className="bg-slate-900 border-b border-slate-800 shadow-2xl px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3">

          {/* Left: Icon + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
              <Monitor className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black tracking-tight text-white leading-tight truncate">
                กระดานติดตามการผ่าตัดต้อกระจก
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-xs sm:text-sm text-slate-300 font-medium truncate">
                  ตารางแสดงสถานะเคสผ่าตัดสำหรับผู้รับบริการและญาติ
                </p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40 flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-orange-400 mr-1.5 animate-pulse"></span>
                  MONITOR BOARD
                </span>
              </div>
            </div>
          </div>

          {/* Right: Clock + Dashboard/Fullscreen Buttons */}
          <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-slate-800/80">
            <div className="text-left md:text-right">
              <div className="text-[10px] sm:text-xs text-orange-400 font-bold tracking-wider">{dateStr}</div>
              <div className="text-lg sm:text-2xl md:text-3xl font-mono font-black text-white tracking-widest leading-none mt-0.5">
                {timeStr}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2.5 sm:p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-all border border-orange-400 shadow-md flex items-center justify-center cursor-pointer"
                  title="กลับหน้า Dashboards"
                >
                  <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5] text-white" />
                </button>
              )}

              <button
                onClick={toggleFullscreen}
                className="p-2.5 sm:p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-all border border-slate-700 cursor-pointer flex items-center justify-center"
                title="เต็มหน้าจอ"
              >
                <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-200" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── 3 Columns Grid ── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 p-3 sm:p-4 lg:p-5 overflow-hidden">

        {/* Col 1: Pre-Op */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 sm:p-4 flex flex-col min-h-0 h-full shadow-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3 mb-3 flex-shrink-0">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-indigo-300 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <span>1. เตรียมผ่าตัด</span>
            </h2>
            <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 font-bold rounded-md text-xs border border-indigo-500/40 flex-shrink-0 ml-2">
              {preopCases.length} เคส
            </span>
          </div>

          <div className="space-y-2 sm:space-y-3 overflow-y-auto flex-1 min-h-0 pr-1.5 custom-tv-scrollbar">
            {preopCases.length > 0 ? (
              preopCases.map((p) => (
                <div
                  key={p.id}
                  className="p-3 sm:p-4 rounded-lg bg-slate-800 border-l-4 border-l-indigo-400 flex items-center justify-between gap-3 sm:gap-4 shadow-md"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-sm sm:text-lg shadow-md shadow-indigo-600/30 flex-shrink-0">
                      {p.queue || `#${p.id}`}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-sm sm:text-base md:text-lg text-white leading-tight truncate">
                        {getPdpaName(p)}
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-400 truncate mt-0.5">
                        HN: {p.hn || '-'} | แพทย์: {p.surgeon || 'ไม่ระบุ'}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <SurgeryTypeBadge method={p.surgery_method} />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-slate-500 text-sm">ไม่มีเคสเตรียมผ่าตัด</div>
            )}
          </div>
        </div>

        {/* Col 2: In Surgery */}
        <div className="bg-orange-950/20 border-2 border-orange-500/50 rounded-lg p-3 sm:p-4 flex flex-col min-h-0 h-full shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-orange-500/40 pb-3 mb-3 flex-shrink-0">
            <h2 className="text-sm sm:text-base md:text-xl font-extrabold text-orange-400 flex items-center gap-2">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 flex-shrink-0" />
              <span>2. กำลังผ่าตัด</span>
            </h2>
            <span className="px-2.5 py-1 bg-orange-500 text-slate-950 font-black rounded-md text-xs shadow-md flex-shrink-0 ml-2">
              {inSurgeryCases.length} เคส
            </span>
          </div>

          <div className="space-y-2 sm:space-y-3.5 overflow-y-auto flex-1 min-h-0 pr-1.5 custom-tv-scrollbar">
            {inSurgeryCases.length > 0 ? (
              inSurgeryCases.map((p) => (
                <div
                  key={p.id}
                  className="p-3 sm:p-4 rounded-lg bg-orange-950/40 border-l-4 border-l-orange-500 border border-orange-500/30 flex items-center justify-between gap-3 sm:gap-4 shadow-xl"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-500 text-slate-950 font-black flex items-center justify-center text-base sm:text-xl shadow-lg shadow-orange-500/30 flex-shrink-0">
                      {p.queue || `#${p.id}`}
                    </span>
                    <div className="min-w-0">
                      <div className="font-black text-base sm:text-lg md:text-xl text-orange-300 leading-tight truncate">
                        {getPdpaName(p)}
                      </div>
                      <div className="text-[10px] sm:text-xs text-orange-200/80 truncate mt-0.5">
                        เริ่ม: {p.surgery_start_time || '-'} น. | แพทย์: {p.surgeon || 'ไม่ระบุ'}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-orange-500/30 text-orange-400 font-bold rounded-md text-[10px] sm:text-xs border border-orange-500/50 flex items-center gap-1 flex-shrink-0">
                    <Activity className="w-3.5 h-3.5" /> ผ่าตัดอยู่
                  </span>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-slate-500 text-sm">ไม่มีเคสกำลังผ่าตัด</div>
            )}
          </div>
        </div>

        {/* Col 3: Post-Op & Ward Transferred */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 sm:p-4 flex flex-col min-h-0 h-full shadow-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-teal-500/30 pb-3 mb-3 flex-shrink-0">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-teal-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
              <span>3. ผ่าตัดเสร็จ / ย้ายหอผู้ป่วย</span>
            </h2>
            <span className="px-2.5 py-1 bg-teal-500/20 text-teal-300 font-bold rounded-md text-xs border border-teal-500/40 flex-shrink-0 ml-2">
              {postopCases.length} เคส
            </span>
          </div>

          <div className="space-y-2 sm:space-y-3 overflow-y-auto flex-1 min-h-0 pr-1.5 custom-tv-scrollbar">
            {postopCases.length > 0 ? (
              postopCases.map((p) => (
                <div
                  key={p.id}
                  className="p-3 sm:p-4 rounded-lg bg-slate-800/80 border-l-4 border-l-teal-400 flex items-center justify-between gap-3 sm:gap-4 shadow-md"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-teal-600 text-white font-black flex items-center justify-center text-sm sm:text-lg shadow-md shadow-teal-600/30 flex-shrink-0">
                      {p.queue || `#${p.id}`}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-sm sm:text-base md:text-lg text-slate-200 leading-tight truncate">
                        {getPdpaName(p)}
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{p.status}</div>
                    </div>
                  </div>
                  {p.status === 'ย้ายไปหอผู้ป่วย' || p.ward ? (
                    <span className="px-2.5 py-1 bg-teal-500/20 text-teal-300 font-semibold rounded-md text-[10px] sm:text-xs border border-teal-500/30 flex items-center gap-1 flex-shrink-0">
                      <BedDouble className="w-3.5 h-3.5 text-teal-300" /> {p.ward || 'ย้ายหอผู้ป่วย'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-teal-500/20 text-teal-300 font-semibold rounded-md text-[10px] sm:text-xs border border-teal-500/30 flex items-center gap-1 flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> ผ่าตัดเสร็จสิ้น
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-slate-500 text-sm">ไม่มีเคสผ่าตัดเสร็จแล้ว</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 border-t border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-center gap-2 text-xs text-slate-400 flex-shrink-0">
        <span>KMLS PhacoReport System &copy; 2026</span>
        <span className="text-slate-700">|</span>
        <span className="inline-flex items-center gap-1">
          <Terminal className="w-3.5 h-3.5 text-orange-500 stroke-[2.5]" />
          <span className="text-orange-500 tracking-wide text-xs font-semibold">wITsaNU</span>
        </span>
      </footer>
    </div>
  );
};
