import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { api } from '../services/api';
import { DashboardData, Patient } from '../types';
import { useRealtime } from '../hooks/useRealtime';
import { KpiCard } from '../components/KpiCard';
import { ActiveCaseCard } from '../components/ActiveCaseCard';
import { StatusBadge } from '../components/StatusBadge';
import { SurgeryTypeBadge } from '../components/SurgeryTypeBadge';
import {
  Users, Clock, Droplets, Activity, CheckCircle2, BedDouble,
  RefreshCw, Filter, X, Search, ChevronLeft, ChevronRight, LayoutDashboard, Building2,
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatLensPower(power?: string): string {
  if (!power || power.trim() === '') return '-';
  const clean = power.replace(/D|\(IOL\)|IOL/gi, '').trim();
  return `${clean} D`;
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filterDate, setFilterDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Table controls
  const [tableSearch, setTableSearch] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    const res = await api.getDashboard(filterDate, statusFilter, methodFilter);
    if (res) setData(res);
    const ptList = await api.getPatients({
      surgery_date: filterDate,
      status: statusFilter,
      surgery_method: methodFilter,
    });
    setPatients(ptList);
    setCurrentPage(1); // reset to page 1 when filters change
    setLoading(false);
  }, [filterDate, statusFilter, methodFilter]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  useRealtime(() => { fetchDashboard(); });

  const clearFilters = () => { setMethodFilter(''); setStatusFilter(''); setFilterDate(''); };
  const hasFilter = !!(filterDate || statusFilter || methodFilter);
  const activeFilterCount = [filterDate, statusFilter, methodFilter].filter(Boolean).length;

  // ── Filtered & paginated patients with status priority & queue ASC sorting ───────────
  const filteredPatients = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    let result = patients;
    if (q) {
      result = patients.filter((p) => {
        const fullName = `${p.pname || ''}${p.fname || ''} ${p.lname || ''}`.toLowerCase();
        return (
          fullName.includes(q) ||
          (p.hn || '').toLowerCase().includes(q) ||
          (p.surgery_method || '').toLowerCase().includes(q) ||
          (p.status || '').toLowerCase().includes(q) ||
          (p.surgeon || '').toLowerCase().includes(q) ||
          (p.ward || '').toLowerCase().includes(q) ||
          String(p.id).includes(q) ||
          String(p.queue || '').includes(q)
        );
      });
    }

    const getStatusPriority = (status?: string) => {
      switch (status) {
        case 'กำลังผ่าตัด': return 1;
        case 'เตรียมผ่าตัด':
        case 'เตรียมความพร้อม/หยอดยา': return 2;
        case 'รอผ่าตัด': return 3;
        case 'ผ่าตัดเสร็จสิ้น': return 4;
        case 'ย้ายไปหอผู้ป่วย': return 5;
        default: return 6;
      }
    };

    return [...result].sort((a, b) => {
      const pA = getStatusPriority(a.status);
      const pB = getStatusPriority(b.status);
      if (pA !== pB) return pA - pB;

      const qA = a.queue && a.queue > 0 ? a.queue : 999999;
      const qB = b.queue && b.queue > 0 ? b.queue : 999999;
      if (qA !== qB) return qA - qB;

      return a.id - b.id;
    });
  }, [patients, tableSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedPatients = filteredPatients.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Reset page when search changes
  useEffect(() => { setCurrentPage(1); }, [tableSearch, pageSize]);

  const goPage = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

  // Page number buttons (max 7 visible)
  const pageButtons = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('...');
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
        pages.push(i);
      }
      if (safePage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [safePage, totalPages]);

  // ── Status Donut ─────────────────────────────────────────────────────────────
  const statusLabels = [
    'รอผ่าตัด', 'เตรียมผ่าตัด', 'กำลังผ่าตัด',
    'ผ่าตัดเสร็จสิ้น', 'ย้ายไปหอผู้ป่วย', 'ยกเลิก/เลื่อน',
  ];

  const statusChartSeries = useMemo(() => data ? [
    Number(data.metrics.waiting || 0),
    Number(data.metrics.preop || 0),
    Number(data.metrics.in_surgery || 0),
    Number(data.metrics.postop || 0),
    Number(data.metrics.transferred_ward || 0),
    Number(data.metrics.cancelled || 0),
  ] : [0, 0, 0, 0, 0, 0], [data]);

  const statusChartOptions = useMemo<ApexCharts.ApexOptions>(() => {
    const series = statusChartSeries;
    const grandTotal = series.reduce((a, b) => a + b, 0);
    return {
      chart: { type: 'donut', fontFamily: 'Anuphan, sans-serif', animations: { enabled: true } },
      labels: statusLabels,
      colors: ['#f59e0b', '#6366f1', '#ff7e36', '#10b981', '#14b8a6', '#f43f5e'],
      legend: {
        position: 'bottom', fontSize: '12px',
        markers: { width: 10, height: 10, offsetX: -2 },
        formatter: (seriesName: string, opts: any) => {
          const count = series[opts.seriesIndex];
          return `${seriesName} <b>${count}</b>`;
        },
      },
      dataLabels: {
        enabled: true,
        style: { fontSize: '13px', fontWeight: '700', colors: ['#fff'] },
        dropShadow: { enabled: true, blur: 2, opacity: 0.5 },
        formatter: (_val: number, opts: any) => {
          const count = series[opts.seriesIndex];
          return count > 0 ? String(count) : '';
        },
      },
      tooltip: { y: { formatter: (val: number) => `${val} เคส` } },
      stroke: { width: 2, colors: ['#ffffff'] },
      plotOptions: {
        pie: {
          expandOnClick: true,
          donut: {
            size: '64%',
            labels: {
              show: true,
              name: { show: true, fontSize: '12px', fontFamily: 'Anuphan, sans-serif', fontWeight: 600, color: '#64748b', offsetY: -6 },
              value: { show: true, fontSize: '22px', fontFamily: 'Anuphan, sans-serif', fontWeight: 700, color: '#0f172a', offsetY: 4, formatter: (val: string) => val },
              total: {
                show: true, showAlways: true, label: 'รวมทั้งหมด',
                fontSize: '12px', fontFamily: 'Anuphan, sans-serif', fontWeight: 600, color: '#64748b',
                formatter: () => `${grandTotal} เคส`,
              },
            },
          },
        },
      },
    };
  }, [statusChartSeries]);

  // ── Surgery Type Column Chart ─────────────────────────────────────────────────
  const defaultMethods = ['ECCE/LE/Shift', 'ECCE/RE/Shift', 'Phaco iol/RE', 'Phaco iol/LE', 'ECCE iol LE', 'ECCE iol RE'];

  const { allCategories, categoryCounts } = useMemo(() => {
    const m = new Map<string, number>();
    data?.surgery_types?.forEach((s) => m.set(s.surgery_type, Number(s.cnt)));
    const cats = [...defaultMethods];
    data?.surgery_types?.forEach((s) => { if (!cats.includes(s.surgery_type)) cats.push(s.surgery_type); });
    return { allCategories: cats, categoryCounts: cats.map((c) => m.get(c) || 0) };
  }, [data]);

  // Column chart (vertical bars)
  const surgeryTypeOptions = useMemo<ApexCharts.ApexOptions>(() => ({
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'Anuphan, sans-serif',
    },
    colors: ['#ff7e36'],
    plotOptions: {
      bar: {
        horizontal: false,          // vertical columns
        borderRadius: 6,            // slightly rounded top
        borderRadiusApplication: 'end',
        columnWidth: '58%',
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: {
      enabled: true,
      offsetY: -22,
      style: { fontSize: '14px', fontWeight: '800', colors: ['#ea580c'] },
    },
    xaxis: {
      categories: allCategories,
      labels: {
        rotate: -32,
        style: { fontSize: '10px', fontFamily: 'Anuphan, sans-serif', colors: '#64748b' },
      },
    },
    yaxis: {
      labels: { style: { fontSize: '11px', fontFamily: 'Anuphan, sans-serif', colors: ['#94a3b8'] } },
    },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
    fill: {
      type: 'gradient',
      gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.25, gradientToColors: ['#fbbf24'], stops: [0, 100] },
    },
    tooltip: { y: { formatter: (val: number) => `${val} เคส` } },
  }), [allCategories]);

  const surgeryTypeSeries = useMemo(() => [
    { name: 'จำนวนเคส', data: categoryCounts },
  ], [categoryCounts]);

  // ── Derived Metrics ──────────────────────────────────────────────────────────
  const totalCases = data?.metrics.total || 0;
  const postopTotal = (data?.metrics.postop || 0) + (data?.metrics.transferred_ward || 0);
  const completionRate = totalCases > 0 ? Math.round((postopTotal / totalCases) * 100) : 0;
  const totalWardCount = data?.ward_stats
    ? data.ward_stats.reduce((acc, w) => acc + Number(w.cnt), 0) : 0;
  const wardTransferRate = totalCases > 0 ? Math.round((totalWardCount / totalCases) * 100) : 0;

  // Ward palette: alternating orange-pastel / teal-pastel
  const WARD_PALETTES = [
    { dot: 'bg-orange-500', bar: 'bg-orange-400',  badge: 'bg-orange-50 text-orange-700 border-orange-200',  row: 'hover:bg-orange-50/40 hover:border-orange-200' },
    { dot: 'bg-teal-500',   bar: 'bg-teal-400',    badge: 'bg-teal-50  text-teal-700   border-teal-200',     row: 'hover:bg-teal-50/40   hover:border-teal-200' },
    { dot: 'bg-orange-400', bar: 'bg-orange-300',  badge: 'bg-orange-50 text-orange-700 border-orange-200', row: 'hover:bg-orange-50/40 hover:border-orange-200' },
    { dot: 'bg-teal-400',   bar: 'bg-teal-300',    badge: 'bg-teal-50  text-teal-700   border-teal-200',    row: 'hover:bg-teal-50/40   hover:border-teal-200' },
    { dot: 'bg-amber-400',  bar: 'bg-amber-300',   badge: 'bg-amber-50 text-amber-700  border-amber-200',   row: 'hover:bg-amber-50/40  hover:border-amber-200' },
    { dot: 'bg-sky-400',    bar: 'bg-sky-300',     badge: 'bg-sky-50   text-sky-700    border-sky-200',     row: 'hover:bg-sky-50/40    hover:border-sky-200' },
    { dot: 'bg-violet-400', bar: 'bg-violet-300',  badge: 'bg-violet-50 text-violet-700 border-violet-200', row: 'hover:bg-violet-50/40 hover:border-violet-200' },
  ];

  // ── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-anuphan">
      
      {/* ── Project Title Banner ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-orange-50 to-white px-4 py-3 rounded-md border border-orange-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-extrabold bg-gradient-to-r from-orange-700 to-orange-400 bg-clip-text text-transparent tracking-tight">
            โครงการ “ราษฎรสุขใจ พลานามัยสมบูรณ์ แพทย์พระราชทาน”
          </h1>
          <p className="text-[10px] sm:text-[11px] text-orange-400 font-normal mt-0.5 leading-relaxed">
            โดย สำนักงานพระคลังข้างที่ โรงพยาบาลบ้านแพ้ว (องค์การมหาชน) และแพทย์อาสาฯ
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto bg-white border border-emerald-200 rounded-md px-3 py-1.5 shadow-2xs">
          <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-left">
            <p className="text-[11px] sm:text-xs font-bold text-emerald-700 leading-tight">โรงพยาบาลกมลาไสย</p>
            <p className="text-[9px] sm:text-[10px] text-emerald-500 font-normal leading-tight">จังหวัดกาฬสินธุ์</p>
          </div>
        </div>
      </div>

      {/* ── Banner ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 card-rounded border border-orange-100 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
            <LayoutDashboard className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Dashboards</h2>
            <p className="text-xs text-slate-500 mt-0.5">ภาพรวมการผ่าตัด</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <div className="h-[40px] flex items-center justify-between sm:justify-start gap-2 bg-orange-50 px-3.5 rounded-md border border-orange-200 text-slate-700 text-xs font-semibold w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>วันที่ผ่าตัด:</span>
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent font-bold text-orange-700 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchDashboard}
            className="h-[40px] px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-all flex items-center justify-center shadow-xs cursor-pointer w-full sm:w-auto"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white card-rounded border border-orange-100 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 py-4">
          {/* Left label */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-md bg-orange-100 flex items-center justify-center">
              <Filter className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-800 leading-tight">ตัวกรองข้อมูล</p>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white text-[10px] font-bold tracking-wide">
                    กำลังกรอง {activeFilterCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">เลือกข้อมูลสำหรับการแสดงผลรายงานการผ่าตัด</p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Method filter */}
            <div className={`flex items-center justify-between sm:justify-start gap-2 px-3 py-2 rounded-md border transition-colors w-full sm:w-auto
              ${methodFilter ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-slate-50 hover:border-orange-300'}`}
            >
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">ประเภทผ่าตัด</span>
              <div className="w-px h-4 bg-slate-200" />
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className={`text-xs font-bold bg-transparent focus:outline-none cursor-pointer w-full sm:w-auto sm:min-w-[130px]
                  ${methodFilter ? 'text-orange-700' : 'text-slate-600'}`}
              >
                <option value="">ทุกประเภท</option>
                <option value="Phaco iol/RE">Phaco iol/RE</option>
                <option value="Phaco iol/LE">Phaco iol/LE</option>
                <option value="ECCE/RE/Shift">ECCE/RE/Shift</option>
                <option value="ECCE/LE/Shift">ECCE/LE/Shift</option>
                <option value="ECCE iol RE">ECCE iol RE</option>
                <option value="ECCE iol LE">ECCE iol LE</option>
                <option value="Femtosec Phaco">Femtosec Phaco</option>
                <option value="Secondary IOL">Secondary IOL</option>
                <option value="ICCE">ICCE</option>
              </select>
            </div>

            {/* Status filter */}
            <div className={`flex items-center justify-between sm:justify-start gap-2 px-3 py-2 rounded-md border transition-colors w-full sm:w-auto
              ${statusFilter ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-slate-50 hover:border-orange-300'}`}
            >
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">สถานะ</span>
              <div className="w-px h-4 bg-slate-200" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`text-xs font-bold bg-transparent focus:outline-none cursor-pointer w-full sm:w-auto sm:min-w-[155px]
                  ${statusFilter ? 'text-orange-700' : 'text-slate-600'}`}
              >
                <option value="">ทุกสถานะ</option>
                <option value="รอผ่าตัด">รอผ่าตัด</option>
                <option value="เตรียมผ่าตัด">เตรียมผ่าตัด</option>
                <option value="กำลังผ่าตัด">กำลังผ่าตัด</option>
                <option value="ผ่าตัดเสร็จสิ้น">ผ่าตัดเสร็จสิ้น</option>
                <option value="ย้ายไปหอผู้ป่วย">ย้ายไปหอผู้ป่วย</option>
                <option value="ยกเลิก/เลื่อน">ยกเลิก/เลื่อน</option>
              </select>
            </div>

            {/* Clear */}
            {hasFilter && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-rose-200 bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer w-full sm:w-auto"
              >
                <X className="w-3.5 h-3.5" />
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Grid ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="เคสทั้งหมด" count={data?.metrics.total || 0} subtitle="ผู้รับบริการรวม"
          icon={<Users className="w-5 h-5" />} borderClass="border-l-slate-400" colorClass="text-slate-800" />
        <KpiCard title="รอผ่าตัด" count={data?.metrics.waiting || 0} subtitle="รอเรียกคิว"
          icon={<Clock className="w-5 h-5" />} borderClass="border-l-amber-400" colorClass="text-amber-600" />
        <KpiCard title="เตรียมผ่าตัด" count={data?.metrics.preop || 0} subtitle="หยอดยา/ขยายม่านตา"
          icon={<Droplets className="w-5 h-5" />} borderClass="border-l-indigo-400" colorClass="text-indigo-600" />
        <KpiCard title="กำลังผ่าตัด" count={data?.metrics.in_surgery || 0} subtitle="อยู่ในห้องผ่าตัด"
          icon={<Activity className="w-5 h-5 text-orange-500" />} borderClass="border-l-orange-500 bg-orange-50/20" colorClass="text-orange-600" />
        <KpiCard title="ผ่าตัดเสร็จสิ้น" count={data?.metrics.postop || 0} subtitle="พักฟื้นหลังผ่าตัด"
          icon={<CheckCircle2 className="w-5 h-5" />} borderClass="border-l-emerald-400" colorClass="text-emerald-600" />
        <KpiCard title="ย้ายไปหอผู้ป่วย" count={data?.metrics.transferred_ward || 0} subtitle="ส่งกลับ Ward"
          icon={<BedDouble className="w-5 h-5" />} borderClass="border-l-teal-400" colorClass="text-teal-600" />
      </div>

      {/* ── Active OR + Donut ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <div className="card-rounded p-6 flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3 mb-4 shrink-0">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                เคสกำลังดำเนินการในห้องผ่าตัด
              </h3>
              <span className="text-xs font-semibold text-slate-400">{data?.active_patients.length || 0} เคส</span>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[340px] flex-1 pr-1.5 custom-scrollbar">
              {data && data.active_patients.length > 0
                ? data.active_patients.map((p) => <ActiveCaseCard key={p.id} patient={p} />)
                : (
                  <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/50 rounded-md border border-dashed border-slate-200">
                    <CheckCircle2 className="w-10 h-10 text-slate-300 mb-1" />
                    <p className="text-sm font-medium">ขณะนี้ไม่มีเคสอยู่ในห้องผ่าตัด</p>
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col">
          <div className="card-rounded p-6 flex flex-col h-full justify-between">
            <div className="border-b border-slate-100 pb-3 mb-2 shrink-0">
              <h3 className="text-lg font-bold text-slate-900">สัดส่วนสถานะการผ่าตัด</h3>
            </div>
            <div className="flex-1 flex items-center justify-center py-2">
              <Chart
                key={statusChartSeries.join('-')}
                options={statusChartOptions}
                series={statusChartSeries}
                type="donut"
                height={290}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Surgery Type Column Chart + Ward Distribution ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Surgery Type — vertical column chart */}
        <div className="lg:col-span-6 card-rounded p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">ประเภทการผ่าตัดต้อกระจก</h3>
          <div className="flex items-center justify-between bg-orange-50 border border-orange-200 p-3 rounded-md">
            <span className="text-xs font-semibold text-slate-700">อัตราผ่าตัดเสร็จสิ้นรวม</span>
            <span className="text-xs font-extrabold text-orange-700 bg-white px-2.5 py-1 rounded-md border border-orange-200">
              {completionRate}% ({postopTotal}/{totalCases} เคส)
            </span>
          </div>
          <Chart
            key={categoryCounts.join('-')}
            options={surgeryTypeOptions}
            series={surgeryTypeSeries}
            type="bar"
            height={260}
          />
        </div>

        {/* Ward Distribution — orange + teal alternating */}
        <div className="lg:col-span-6 card-rounded p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">สรุปการกระจายผู้ป่วยตามหอผู้ป่วย</h3>

          {/* Summary Banner */}
          <div className="flex items-center justify-between bg-teal-50 border border-teal-200 p-3 rounded-md">
            <span className="text-xs font-semibold text-slate-700">สัดส่วนส่งย้ายเข้า Ward</span>
            <span className="text-xs font-extrabold text-teal-800 bg-white px-2.5 py-1 rounded-md border border-teal-200">
              {wardTransferRate}% ({totalWardCount}/{totalCases} เคส)
            </span>
          </div>

          {/* Ward rows */}
          <div className="space-y-2">
            {data?.ward_stats && data.ward_stats.length > 0
              ? data.ward_stats.map((w, idx) => {
                  const wShare = totalWardCount > 0 ? Math.round((Number(w.cnt) / totalWardCount) * 100) : 0;
                  const barW = totalWardCount > 0 ? Math.max(3, Math.round((Number(w.cnt) / totalWardCount) * 100)) : 0;
                  const pal = WARD_PALETTES[idx % WARD_PALETTES.length];
                  return (
                    <div
                      key={idx}
                      className={`group flex flex-col gap-1.5 p-3 rounded-md bg-white border border-slate-100 transition-all ${pal.row}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${pal.dot}`} />
                          <span className="text-sm font-semibold text-slate-700">{w.ward_name}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md border ${pal.badge}`}>
                          {w.cnt} คน &nbsp;·&nbsp; {wShare}%
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${pal.bar}`}
                          style={{ width: `${barW}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              : <div className="py-6 text-center text-slate-400 text-sm">ไม่มีข้อมูลหอผู้ป่วย</div>
            }
          </div>
        </div>
      </div>

      {/* ── Patient Table (custom pagination + search) ─────────────────────────── */}
      <div className="card-rounded p-6 space-y-4">

        {/* Table Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-orange-100 pb-4">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-slate-900">ตารางรายงานสรุปเคสผ่าตัด</h3>
            <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 font-bold rounded-md text-xs">
              {filteredPatients.length} เคส
            </span>
          </div>

          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Page size selector */}
            <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-xs w-full sm:w-auto">
              <span className="text-slate-500 font-medium whitespace-nowrap">แสดง</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-slate-500 font-medium">รายการ</span>
            </div>

            {/* Real-time search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 focus-within:border-orange-400 focus-within:bg-white transition-colors w-full sm:w-auto sm:min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="ค้นหา ชื่อ, HN, สถานะ, แพทย์..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none w-full"
              />
              {tableSearch && (
                <button onClick={() => setTableSearch('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">กำลังโหลดข้อมูล...</div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="bg-orange-50/80 text-slate-500 text-[11px] uppercase tracking-wide border-b border-orange-100">
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">#ID</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">คิว</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">วิธีผ่าตัด</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">เลนส์เทียม</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">สถานะผ่าตัด</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">หอผู้ป่วย</th>
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">แพทย์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedPatients.length > 0 ? (
                  pagedPatients.map((p) => (
                    <tr key={p.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-3 px-3 font-mono text-xs text-slate-400 whitespace-nowrap">#{p.id}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {p.queue
                          ? <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-orange-100 text-orange-800 font-bold text-xs border border-orange-200">{p.queue}</span>
                          : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800 leading-snug text-sm">
                          {p.pname || ''}{p.fname || ''} {p.lname || ''}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-orange-50 text-orange-600 rounded-md border border-orange-300 shadow-2xs">H25.9</span>
                          <span>HN: {p.hn || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <SurgeryTypeBadge method={p.surgery_method} />
                      </td>
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        {p.lens_power
                          ? <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 rounded-md border border-amber-200 font-mono">{formatLensPower(p.lens_power)}</span>
                          : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        {p.ward
                          ? <span className="inline-flex items-center px-2.5 py-1 bg-teal-50 text-teal-800 font-semibold rounded-md text-xs border border-teal-200">{p.ward}</span>
                          : <span className="text-slate-300 text-xs">-</span>}
                      </td>
                      <td className="py-3 px-3 text-xs font-medium text-slate-700 align-middle whitespace-nowrap">
                        {p.surgeon || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-400 text-sm">
                      {tableSearch ? `ไม่พบผลลัพธ์สำหรับ "${tableSearch}"` : 'ไม่พบข้อมูลผู้ป่วย'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination Footer ─────────────────────────────────────────────────── */}
        {!loading && filteredPatients.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium">
              แสดง{' '}
              <span className="font-bold text-slate-600">{(safePage - 1) * pageSize + 1}</span>
              {' '}–{' '}
              <span className="font-bold text-slate-600">{Math.min(safePage * pageSize, filteredPatients.length)}</span>
              {' '}จาก{' '}
              <span className="font-bold text-slate-600">{filteredPatients.length}</span>
              {' '}รายการ
              {tableSearch && (
                <span className="ml-1 text-orange-600 font-semibold">(กรองจาก {patients.length} รายการ)</span>
              )}
            </p>

            {/* Page buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goPage(safePage - 1)}
                disabled={safePage === 1}
                className="flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-600 hover:border-orange-400 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {pageButtons.map((p, i) =>
                p === '...'
                  ? <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">…</span>
                  : (
                    <button
                      key={p}
                      onClick={() => goPage(p as number)}
                      className={`w-8 h-8 rounded-md text-xs font-bold transition-all cursor-pointer border
                        ${safePage === p
                          ? 'bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-200'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-orange-400 hover:text-orange-600'
                        }`}
                    >
                      {p}
                    </button>
                  )
              )}

              <button
                onClick={() => goPage(safePage + 1)}
                disabled={safePage === totalPages}
                className="flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-600 hover:border-orange-400 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
