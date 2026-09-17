import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { Patient, Ward, SurgeryStatus } from '../types';
import { useRealtime } from '../hooks/useRealtime';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { SurgeryTypeBadge } from '../components/SurgeryTypeBadge';
import { SearchableSelect, SelectOption } from '../components/SearchableSelect';
import { Search, Save, Edit3, RefreshCw, X, Filter, ChevronLeft, ChevronRight, UserCheck, ClipboardEdit, ChevronDown, ChevronUp, Sliders, Clock, User, Eye, Disc, BedDouble, Check, MapPin, Home, Shield, CalendarDays, Hash, Contact, IdCard, Lock } from 'lucide-react';

export const QueueManage: React.FC = () => {
  const { canEdit, isProvider } = useAuth();
  const [wards, setWards] = useState<Ward[]>([]);
  const [surgeons, setSurgeons] = useState<{ id: number; name: string; position?: string }[]>([]);
  const [nurses, setNurses] = useState<{ id: number; name: string; position?: string }[]>([]);
  const [allProviders, setAllProviders] = useState<{ id: number; name: string; position?: string }[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Form & Input Refs for Auto Focus & Smooth Scroll
  const formRef = useRef<HTMLDivElement>(null);
  const queueInputRef = useRef<HTMLInputElement>(null);

  // Table Filter & Search & Pagination States
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // Form State - Default date fixed to 2026-09-18 (18 ก.ย. 2569)
  const [formQueue, setFormQueue] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('2026-09-18');
  const [formStatus, setFormStatus] = useState<SurgeryStatus>('รอผ่าตัด');
  const [formWard, setFormWard] = useState<string>('');
  const [formSurgeon, setFormSurgeon] = useState<string>('');
  const [formMethod, setFormMethod] = useState<string>('Phaco iol/RE');
  const [formStart, setFormStart] = useState<string>('');
  const [formEnd, setFormEnd] = useState<string>('');
  const [formNote, setFormNote] = useState<string>('');

  // Additional Optional Fields State
  const [formVaRight, setFormVaRight] = useState<string>('');
  const [formVaLeft, setFormVaLeft] = useState<string>('');
  const [formLensSerial, setFormLensSerial] = useState<string>('');
  const [formLensLot, setFormLensLot] = useState<string>('');
  const [formLensExpiry, setFormLensExpiry] = useState<string>('');
  const [formLensType, setFormLensType] = useState<string>('');
  const [formComplication, setFormComplication] = useState<string>('');
  const [formScrubNurse, setFormScrubNurse] = useState<string>('');
  const [formCircNurse1, setFormCircNurse1] = useState<string>('');
  const [formCircNurse2, setFormCircNurse2] = useState<string>('');

  // Accordion toggle for additional options form section
  const [showAdditionalFields, setShowAdditionalFields] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch active wards, surgeons, and nurses from provider table
      const [wardList, surgeonList, nurseList, fullProviderList] = await Promise.all([
        api.getWards().catch((err) => { console.error('getWards error:', err); return []; }),
        api.getProviders('SURGEON').catch((err) => { console.error('getProviders SURGEON error:', err); return []; }),
        api.getProviders('NURSE').catch((err) => { console.error('getProviders NURSE error:', err); return []; }),
        api.getProviders().catch((err) => { console.error('getProviders ALL error:', err); return []; }),
      ]);
      setWards(wardList);
      setSurgeons(surgeonList);
      setNurses(nurseList);
      setAllProviders(fullProviderList);

      const patientList = await api.getPatients({ status: filterStatus });
      setPatients(patientList);
    } catch (err) {
      console.error('loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtime(() => {
    loadData();
  });

  // SearchableSelect options
  const wardOptions = useMemo<SelectOption[]>(() => {
    const list: SelectOption[] = [{ value: '', label: 'ไม่ระบุ / ไม่ย้าย' }];
    wards.forEach((w) => {
      list.push({ value: w.ward_name, label: w.ward_name });
    });
    return list;
  }, [wards]);

  const surgeonOptions = useMemo<SelectOption[]>(() => {
    const list: SelectOption[] = [{ value: '', label: 'ไม่ระบุแพทย์' }];
    surgeons.forEach((s) => {
      list.push({ value: s.name, label: s.name, sublabel: s.position || undefined });
    });
    if (formSurgeon && !surgeons.some((s) => s.name === formSurgeon)) {
      list.push({ value: formSurgeon, label: formSurgeon });
    }
    return list;
  }, [surgeons, formSurgeon]);

  // Provider options for Scrub & Circulating Nurses
  const nurseOptions = useMemo<SelectOption[]>(() => {
    const list: SelectOption[] = [{ value: '', label: 'ไม่ระบุพยาบาล' }];
    const pool = nurses.length > 0 ? nurses : allProviders;
    pool.forEach((n) => {
      list.push({ value: n.name, label: n.name, sublabel: n.position || undefined });
    });
    return list;
  }, [nurses, allProviders]);

  const getCustomNurseOptions = (currentVal: string) => {
    const list = [...nurseOptions];
    if (currentVal && !list.some((o) => o.value === currentVal)) {
      list.push({ value: currentVal, label: currentVal });
    }
    return list;
  };

  const statusOptions: SelectOption[] = [
    { value: 'รอผ่าตัด', label: 'รอผ่าตัด (Waiting)' },
    { value: 'เตรียมผ่าตัด', label: 'เตรียมผ่าตัด (Pre-op)' },
    { value: 'กำลังผ่าตัด', label: 'กำลังผ่าตัด (In Surgery)' },
    { value: 'ผ่าตัดเสร็จสิ้น', label: 'ผ่าตัดเสร็จสิ้น (Post-op Recovery)' },
    { value: 'ย้ายไปหอผู้ป่วย', label: 'ย้ายไปหอผู้ป่วย (Transferred to Ward)' },
    { value: 'ยกเลิก/เลื่อน', label: 'ยกเลิก/เลื่อน (Cancelled)' },
  ];

  // Handle Top Search Input Change
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    setHighlightedIndex(-1);
    if (q.trim().length >= 1) {
      const results = await api.searchPatients(q);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  // Keyboard navigation for top search dropdown (ArrowUp, ArrowDown, Enter, Escape)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && searchResults[highlightedIndex]) {
        selectPatientToEdit(searchResults[highlightedIndex].id);
      } else if (searchResults.length > 0) {
        selectPatientToEdit(searchResults[0].id);
      }
      setHighlightedIndex(-1);
    } else if (e.key === 'Escape') {
      setSearchResults([]);
      setHighlightedIndex(-1);
    }
  };

  // Select patient to edit + Smooth Scroll + Auto Focus on Queue Input
  const selectPatientToEdit = async (id: number) => {
    const p = await api.getPatientById(id);
    if (p) {
      setSelectedPatient(p);
      setFormQueue(p.queue ? String(p.queue) : '');
      setFormDate(p.surgery_date || '2026-09-18');
      setFormStatus(p.status || 'รอผ่าตัด');
      setFormWard(p.ward || '');
      setFormSurgeon(p.surgeon || '');
      setFormMethod(p.surgery_method || 'Phaco iol/RE');
      setFormStart(p.surgery_start_time || '');
      setFormEnd(p.surgery_end_time || '');
      setFormNote(p.note || '');

      setFormVaRight(p.va_right_eye || '');
      setFormVaLeft(p.va_left_eye || '');
      setFormLensSerial(p.lens_serial_no || '');
      setFormLensLot(p.lens_lot_no || '');
      setFormLensExpiry(p.lens_expiry_date || '');
      setFormLensType(p.lens_type || '');
      setFormComplication(p.complication || '');
      setFormScrubNurse(p.scrub_nurse || '');
      setFormCircNurse1(p.circulating_nurse_1 || '');
      setFormCircNurse2(p.circulating_nurse_2 || '');

      setSearchResults([]);
      setSearchQuery('');
      setHighlightedIndex(-1);

      // Auto-fill table search with selected patient's name to filter & display immediately in table
      const searchKeyword = `${p.fname || ''} ${p.lname || ''}`.trim() || p.hn || String(p.id);
      setTableSearch(searchKeyword);

      // Show warning/notification dialog with patient details & surgery method colors
      const rawMethod = (p.surgery_method || 'Phaco iol/RE').trim();
      const rawUpper = rawMethod.toUpperCase();
      let badgeStyle = 'background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;'; // Phaco IOL -> Green default
      if (rawUpper.includes('ECCE') && (rawUpper.includes('SHIFT') || rawUpper.includes('/SHIFT'))) {
        badgeStyle = 'background-color: #fefce8; color: #854d0e; border: 1px solid #fde047;'; // ECCE/Shift -> Yellow
      } else if (rawUpper.includes('ECCE')) {
        badgeStyle = 'background-color: #fef2f2; color: #991b1b; border: 1px solid #fca5a5;'; // ECCE IOL -> Red
      } else if (rawUpper.includes('PHACO')) {
        badgeStyle = 'background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;'; // Phaco IOL -> Green
      }

      const fullName = `${p.pname || ''}${p.fname || ''} ${p.lname || ''}`.trim();
      const ageStr = p.age ? `${p.age} ปี` : '-';
      const screeningNo = p.screening_no || '-';

      Swal.fire({
        title: '<div style="font-family: \'Anuphan\', sans-serif; font-size: 20px; font-weight: 700; color: #1e293b;">เลือกข้อมูลผู้มารับบริการเรียบร้อย</div>',
        html: `
          <div style="font-family: 'Anuphan', sans-serif; text-align: left; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin-top: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px dashed #cbd5e1;">
              <span style="color: #475569; font-weight: 600; font-size: 14px;">ลำดับคัดกรอง:</span>
              <span style="font-weight: 800; font-size: 22px; color: #c2410c; background-color: #ffedd5; border: 1.5px solid #fdba74; padding: 4px 14px; border-radius: 8px; font-family: monospace; letter-spacing: 0.5px;">${screeningNo}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="color: #475569; font-weight: 600; font-size: 14px;">ชื่อ-นามสกุล:</span>
              <span style="font-weight: 700; font-size: 16px; color: #0f172a;">${fullName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px dashed #cbd5e1;">
              <span style="color: #475569; font-weight: 600; font-size: 14px;">อายุ:</span>
              <span style="font-weight: 700; font-size: 15px; color: #334155;">${ageStr}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #475569; font-weight: 600; font-size: 14px;">วิธีผ่าตัด:</span>
              <span style="font-weight: 800; font-size: 16px; padding: 6px 14px; border-radius: 8px; ${badgeStyle}">${rawMethod}</span>
            </div>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#f97316',
        showCloseButton: true,
        timer: 30000,
        timerProgressBar: true,
        allowEnterKey: true,
        focusConfirm: true,
        customClass: { popup: 'rounded-xl font-anuphan max-w-md w-full' },
      });

      // Auto Scroll & Auto Focus
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (queueInputRef.current) {
          queueInputRef.current.focus();
          queueInputRef.current.select();
        }
      }, 120);
    }
  };

  const handleCancelEdit = () => {
    setSelectedPatient(null);
    setTableSearch('');
  };

  // Helper function to check if a valid surgeon is specified
  const hasValidSurgeon = (surgeon: string) => {
    const s = surgeon.trim();
    return s !== '' && s !== 'ไม่ระบุ' && s !== 'ไม่ระบุแพทย์';
  };

  // Smart Form Handlers for Auto Status Updates & Rules
  // Rule 1: Queue only (no surgeon or "ไม่ระบุแพทย์") → เตรียมผ่าตัด
  // Rule 2: Queue + Specified Surgeon → กำลังผ่าตัด
  // Rule 3: Ward set → ผ่าตัดเสร็จสิ้น
  const handleQueueChange = (val: string) => {
    setFormQueue(val);
    const qNum = Number(val);
    // Ward already set → status stays ผ่าตัดเสร็จสิ้น, don't override
    if (formWard && formWard.trim() !== '') return;
    if (qNum > 0) {
      if (hasValidSurgeon(formSurgeon)) {
        // Rule 2: Queue + Surgeon
        setFormStatus('กำลังผ่าตัด');
      } else {
        // Rule 1: Queue only
        setFormStatus('เตรียมผ่าตัด');
      }
    }
  };

  const handleSurgeonChange = (val: string) => {
    setFormSurgeon(val);
    const qNum = Number(formQueue);
    // Ward already set → don't override
    if (formWard && formWard.trim() !== '') return;
    if (qNum > 0 && hasValidSurgeon(val)) {
      // Rule 2: Queue + Surgeon
      setFormStatus('กำลังผ่าตัด');
    } else if (qNum > 0) {
      // Surgeon cleared or set to 'ไม่ระบุแพทย์', queue still exists → Rule 1
      setFormStatus('เตรียมผ่าตัด');
    }
  };

  const handleWardChange = (val: string) => {
    setFormWard(val);
    if (val && val.trim() !== '') {
      // Rule 3: Ward set → ผ่าตัดเสร็จสิ้น
      setFormStatus('ผ่าตัดเสร็จสิ้น');
    } else {
      // Ward cleared → revert based on current queue/surgeon state
      const qNum = Number(formQueue);
      if (qNum > 0 && hasValidSurgeon(formSurgeon)) {
        setFormStatus('กำลังผ่าตัด');
      } else if (qNum > 0) {
        setFormStatus('เตรียมผ่าตัด');
      } else {
        setFormStatus('รอผ่าตัด');
      }
    }
  };

  // Submit Form with Duplicate Queue Validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    if (!canEdit) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่มีสิทธิ์บันทึกข้อมูล!',
        text: 'สิทธิ์การเข้าใช้งานของคุณ (Provider) สามารถอ่านและดูข้อมูลได้อย่างเดียว ไม่สามารถแก้ไขหรือบันทึกข้อมูลได้',
        confirmButtonColor: '#ff7e36',
        customClass: { popup: 'rounded-md', confirmButton: 'rounded-md' },
      });
      return;
    }

    // Rule 1: Validate duplicate queue number for today's surgery list
    if (formQueue && Number(formQueue) > 0) {
      const qNum = Number(formQueue);
      const dupPatient = patients.find(
        (p) => p.id !== selectedPatient.id && Number(p.queue) === qNum
      );
      if (dupPatient) {
        const dupName = `${dupPatient.pname || ''}${dupPatient.fname || ''} ${dupPatient.lname || ''}`.trim();
        Swal.fire({
          icon: 'warning',
          title: 'ลำดับคิวผ่าตัดซ้ำ!',
          text: `ลำดับคิวหมายเลข ${qNum} ถูกเปิดใช้งานแล้วโดยผู้ป่วยคุณ "${dupName}" (ID #${dupPatient.id}) กรุณาระบุลำดับคิวใหม่ที่ยังไม่ถูกใช้`,
          confirmButtonColor: '#ff7e36',
          customClass: { popup: 'rounded-md', confirmButton: 'rounded-md' },
        });
        return; // Prevent form submit
      }
    }

    const result = await Swal.fire({
      title: 'ยืนยันการบันทึกข้อมูล?',
      text: `ต้องการอัปเดตสถานะผู้ป่วยเป็น "${formStatus}" หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ff7e36',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'บันทึกข้อมูล',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'rounded-md',
        confirmButton: 'rounded-md',
        cancelButton: 'rounded-md',
      },
    });

    if (result.isConfirmed) {
      const payload: Partial<Patient> = {
        id: selectedPatient.id,
        queue: formQueue ? Number(formQueue) : undefined,
        surgery_date: formDate,
        status: formStatus,
        ward: formWard,
        surgeon: formSurgeon,
        surgery_method: formMethod,
        surgery_start_time: formStart,
        surgery_end_time: formEnd,
        note: formNote,
        va_right_eye: formVaRight,
        va_left_eye: formVaLeft,
        lens_serial_no: formLensSerial,
        lens_lot_no: formLensLot,
        lens_expiry_date: formLensExpiry,
        lens_type: formLensType,
        complication: formComplication,
        scrub_nurse: formScrubNurse,
        circulating_nurse_1: formCircNurse1,
        circulating_nurse_2: formCircNurse2,
      };

      const res = await api.saveQueue(payload);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ!',
          text: res.message,
          timer: 1800,
          showConfirmButton: false,
          customClass: { popup: 'rounded-md' },
        });
        handleCancelEdit();
        loadData();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: res.message,
          customClass: { popup: 'rounded-md' },
        });
      }
    }
  };

  // ── Table Search & Priority Sorting Logic ──────────────────────────────────────────
  const activeFilterCount = (filterStatus ? 1 : 0) + (methodFilter ? 1 : 0) + (tableSearch.trim() ? 1 : 0);

  const filteredPatients = useMemo(() => {
    let result = patients.filter((p) => {
      // Surgery method filter
      if (methodFilter && !(p.surgery_method || '').includes(methodFilter)) return false;

      // Real-time table search
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase().trim();
        const fullName = `${p.pname || ''}${p.fname || ''} ${p.lname || ''}`.toLowerCase();
        const hn = (p.hn || '').toLowerCase();
        const cid = (p.cid || '').toLowerCase();
        const queue = String(p.queue || '');
        const id = String(p.id || '');
        const method = (p.surgery_method || '').toLowerCase();
        const status = (p.status || '').toLowerCase();
        const ward = (p.ward || '').toLowerCase();
        const surgeon = (p.surgeon || '').toLowerCase();
        const note = (p.note || '').toLowerCase();

        const screeningNo = String(p.screening_no || '').toLowerCase();
        const match =
          fullName.includes(q) ||
          hn.includes(q) ||
          cid.includes(q) ||
          screeningNo.includes(q) ||
          queue.includes(q) ||
          id.includes(q) ||
          method.includes(q) ||
          status.includes(q) ||
          ward.includes(q) ||
          surgeon.includes(q) ||
          note.includes(q);

        if (!match) return false;
      }
      return true;
    });

    // Sort: patients WITH queue for the day come first (queue ASC),
    // then no-queue patients ordered by status priority → newest id DESC
    const getStatusPriority = (status?: string) => {
      switch (status) {
        case 'กำลังผ่าตัด': return 1;
        case 'เตรียมผ่าตัด': return 2;
        case 'เตรียมความพร้อม/หยอดยา': return 2; // legacy alias
        case 'รอผ่าตัด': return 3;
        case 'ผ่าตัดเสร็จสิ้น': return 4;
        case 'ย้ายไปหอผู้ป่วย': return 5;
        default: return 6;
      }
    };

    return [...result].sort((a, b) => {
      const hasQueueA = a.queue && Number(a.queue) > 0;
      const hasQueueB = b.queue && Number(b.queue) > 0;

      // Queued patients always appear before non-queued
      if (hasQueueA && !hasQueueB) return -1;
      if (!hasQueueA && hasQueueB) return 1;

      // Both have queue → sort by queue number ASC (1, 2, 3…)
      if (hasQueueA && hasQueueB) return Number(a.queue) - Number(b.queue);

      // Neither has queue → sort by status priority, then newest id first
      const pA = getStatusPriority(a.status);
      const pB = getStatusPriority(b.status);
      if (pA !== pB) return pA - pB;
      return b.id - a.id;
    });
  }, [patients, methodFilter, tableSearch]);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, methodFilter, tableSearch, pageSize]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredPatients.length / pageSize) || 1;
  const pagedPatients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, currentPage, pageSize]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const resetFilters = () => {
    setFilterStatus('');
    setMethodFilter('');
    setTableSearch('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-anuphan">
      {/* Banner - Full Width */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-orange-500 to-amber-500 p-6 rounded-md text-white shadow-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ClipboardEdit className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[2] flex-shrink-0" />
            <span>บันทึกข้อมูลการผ่าตัด</span>
          </h2>
          <p className="text-orange-100 text-xs mt-1">
            ระบบจัดลำดับคิว อัปเดตสถานะผ่าตัด และระบุหอผู้ป่วยหลังผ่าตัด
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-sm font-semibold transition-all backdrop-blur-xs flex items-center gap-2 self-start md:self-auto shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> รีเฟรชข้อมูล
        </button>
      </div>

      {/* Top Search Bar Panel - Elevated z-index to overlay search dropdown above table */}
      <div className="card-rounded p-6 space-y-4 bg-white border border-orange-100 shadow-xs relative z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-orange-500" />
            ค้นหาผู้มารับบริการ
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            ค้นหาข้อมูล
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="กรอกข้อมูลค้นหา..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all"
          />

          {/* Search Results Dropdown with Keyboard Nav & Top Overlay z-50 */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-orange-300 rounded-md shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
              {searchResults.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => selectPatientToEdit(item.id)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`p-3.5 cursor-pointer text-xs transition-colors flex items-center justify-between ${
                    idx === highlightedIndex
                      ? 'bg-orange-100 text-orange-950 font-semibold border-l-4 border-l-orange-500'
                      : 'hover:bg-orange-50 text-slate-800'
                  }`}
                >
                  <div className="font-bold text-sm leading-tight">{item.text}</div>
                  <span
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all shadow-2xs ${
                      idx === highlightedIndex
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-500 hover:text-white'
                    }`}
                  >
                    เลือกเคสนี้
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Form Panel (Appears when selected) */}
      {selectedPatient && (
        <div
          ref={formRef}
          className="card-rounded p-6 space-y-5 bg-white border-l-4 border-l-orange-500 shadow-md border border-orange-100 animate-fadeIn relative z-20 scroll-mt-20"
        >
          {/* ── Patient Identity Header ── */}
          <div className="border-b border-orange-100 pb-4">
            <div className="flex items-start justify-between gap-3">
              {/* Left: name + ID badge */}
              <div className="flex items-start gap-3 min-w-0">
                <span className="shrink-0 text-xs font-bold px-2.5 py-1.5 bg-orange-500 text-white rounded-md shadow-xs mt-0.5">
                  ID #{selectedPatient.id}
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight truncate flex items-center gap-2">
                    <Contact className="w-5 h-5 text-orange-500 shrink-0" />
                    <span>{selectedPatient.pname || ''}{selectedPatient.fname || ''} {selectedPatient.lname || ''}</span>
                  </h3>
                </div>
              </div>
              {/* Close button */}
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Personal Info Grid ── */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {/* CID */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 min-w-0">
                <Hash className="w-3 h-3 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 font-medium leading-none">CID</div>
                  <div className="text-xs font-bold text-slate-700 font-mono truncate">{selectedPatient.cid || '-'}</div>
                </div>
              </div>
              {/* HN */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 min-w-0">
                <User className="w-3 h-3 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 font-medium leading-none">HN</div>
                  <div className="text-xs font-bold text-slate-700 font-mono truncate">{selectedPatient.hn || '-'}</div>
                </div>
              </div>
              {/* อายุ / ปีเกิด */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 min-w-0">
                <CalendarDays className="w-3 h-3 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 font-medium leading-none">อายุ / ปีเกิด</div>
                  <div className="text-xs font-bold text-slate-700 truncate">
                    {selectedPatient.age ? `${selectedPatient.age} ปี` : '-'}
                    {selectedPatient.birth_year ? ` (พ.ศ. ${selectedPatient.birth_year})` : ''}
                  </div>
                </div>
              </div>
              {/* สิทธิการรักษา */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 min-w-0">
                <Shield className="w-3 h-3 text-slate-400 shrink-0" />
                <div className="min-w-0 w-full">
                  <div className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">สิทธิการรักษา</div>
                  <input
                    type="text"
                    readOnly
                    value={selectedPatient.pttype || '-'}
                    className="w-full text-xs font-bold text-slate-700 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none truncate cursor-default"
                    title={selectedPatient.pttype || '-'}
                  />
                </div>
              </div>
              {/* บ้านเลขที่ / หมู่ */}
              {(selectedPatient.house_no || selectedPatient.village_no) && (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 min-w-0">
                  <Home className="w-3 h-3 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-medium leading-none">บ้านเลขที่ / หมู่</div>
                    <div className="text-xs font-bold text-slate-700 truncate">
                      {selectedPatient.house_no ? `${selectedPatient.house_no}` : ''}
                      {selectedPatient.village_no ? ` หมู่ ${selectedPatient.village_no}` : ''}
                    </div>
                  </div>
                </div>
              )}
              {/* ที่อยู่ ตำบล/อำเภอ/จังหวัด */}
              {(selectedPatient.subdistrict || selectedPatient.district || selectedPatient.province) && (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 col-span-2 sm:col-span-2 min-w-0">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-medium leading-none">ที่อยู่</div>
                    <div className="text-xs font-bold text-slate-700 truncate">
                      {[selectedPatient.subdistrict, selectedPatient.district, selectedPatient.province].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── Row 1: Order of Inputs per User Requirement ── */}
            {/* 1. ลำดับการคัดกรอง (Pastel Orange Readonly) | 2. วิธีผ่าตัด | 3. ลำดับคิวผ่าตัดวันนี้ | 4. สถานะผ่าตัด */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-orange-800 mb-1">
                  ลำดับการคัดกรอง
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedPatient.screening_no || '-'}
                  className="w-full px-3 py-2 bg-orange-100/80 border border-orange-300 rounded-md text-sm font-extrabold text-orange-900 cursor-default select-none focus:outline-none shadow-2xs font-mono"
                  title="ลำดับการคัดกรอง (Readonly)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วิธีผ่าตัด (Surgery Method)
                </label>
                {(() => {
                  const mUpper = (formMethod || '').toUpperCase();
                  let methodBgClass = 'bg-slate-100 text-slate-800 border-slate-200';
                  if (mUpper.includes('ECCE') && (mUpper.includes('SHIFT') || mUpper.includes('/SHIFT'))) {
                    methodBgClass = 'bg-yellow-100 text-yellow-800 border-yellow-300 font-extrabold';
                  } else if (mUpper.includes('ECCE')) {
                    methodBgClass = 'bg-red-100 text-red-700 border-red-300 font-extrabold';
                  } else if (mUpper.includes('PHACO')) {
                    methodBgClass = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold';
                  }
                  return (
                    <input
                      type="text"
                      readOnly
                      value={formMethod}
                      className={`w-full px-3 py-2 border rounded-md text-sm cursor-default select-none focus:outline-none ${methodBgClass}`}
                      title="วิธีผ่าตัดไม่สามารถแก้ไขได้"
                    />
                  );
                })()}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ลำดับคิวผ่าตัดวันนี้
                </label>
                <input
                  ref={queueInputRef}
                  type="number"
                  value={formQueue}
                  onChange={(e) => handleQueueChange(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-orange-50 border border-orange-200 rounded-md text-sm font-bold text-orange-700 placeholder-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สถานะการผ่าตัด <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={statusOptions}
                  value={formStatus}
                  onChange={(val) => setFormStatus(val as SurgeryStatus)}
                  placeholder="เลือกสถานะผ่าตัด..."
                  searchPlaceholder="ค้นหาสถานะ..."
                />
              </div>
            </div>

            {/* ── Row 2: 5. หอผู้ป่วยหลังผ่าตัด | 6. แพทย์ผู้ผ่าตัด | 7. หมายเหตุเพิ่มเติม | 8. วันที่ผ่าตัด ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หอผู้ป่วยหลังผ่าตัด (Post-op Ward)
                </label>
                <SearchableSelect
                  options={wardOptions}
                  value={formWard}
                  onChange={handleWardChange}
                  placeholder="เลือกหอผู้ป่วย..."
                  searchPlaceholder="ค้นหาชื่อหอผู้ป่วย..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  แพทย์ผู้ผ่าตัด (Surgeon)
                </label>
                <SearchableSelect
                  options={surgeonOptions}
                  value={formSurgeon}
                  onChange={handleSurgeonChange}
                  placeholder="เลือกแพทย์ผู้ผ่าตัด..."
                  searchPlaceholder="ค้นหารายชื่อแพทย์..."
                  showOrangeDot={true}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเหตุเพิ่มเติม (Note)
                </label>
                <textarea
                  rows={1}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="กรอกข้อความหมายเหตุ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:ring-2 focus:ring-orange-500 focus:bg-white resize-none transition-all h-[38px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่ผ่าตัด
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>
            </div>

            {/* Ward Shortcut Badges — Full Col-12 */}
            {wards.length > 0 && (
              <div className="col-span-full">
                <div className="flex items-center gap-2 mb-2">
                  <BedDouble className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-500">ทางลัดหอผู้ป่วย</span>
                  {formWard && (
                    <button
                      type="button"
                      onClick={() => handleWardChange('')}
                      className="ml-auto flex items-center gap-1 text-[10px] text-rose-500 hover:text-rose-700 font-semibold transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      ล้าง
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 w-full">
                  {wards.map((w) => {
                    const isSelected = formWard === w.ward_name;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => handleWardChange(isSelected ? '' : w.ward_name)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer select-none
                          ${isSelected
                            ? 'bg-teal-500 text-white border-teal-500 shadow-sm shadow-teal-200'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50'
                          }`}
                      >
                        {isSelected && <Check className="w-3 h-3 shrink-0" />}
                        {w.ward_name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Readonly Clinical Information Card - Responsive Grid (4 Items) */}
            <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-md font-anuphan">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-white px-3 py-2 rounded-md border border-slate-200/60 shadow-2xs space-y-0.5">
                  <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wide">วันที่คัดกรอง</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm truncate block">
                    {selectedPatient.screening_date
                      ? (() => {
                          try {
                            const d = new Date(selectedPatient.screening_date!);
                            return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
                          } catch { return selectedPatient.screening_date; }
                        })()
                      : '-'}
                  </span>
                </div>
                <div className="bg-white px-3 py-2 rounded-md border border-slate-200/60 shadow-2xs space-y-0.5">
                  <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wide">กำลังเลนส์</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm font-mono truncate block">{selectedPatient.lens_power || '-'}</span>
                </div>
                <div className="bg-white px-3 py-2 rounded-md border border-slate-200/60 shadow-2xs space-y-0.5">
                  <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wide">Anterior Chamber</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm truncate block">{selectedPatient.anterior_chamber || '-'}</span>
                </div>
                <div className="bg-white px-3 py-2 rounded-md border border-slate-200/60 shadow-2xs space-y-0.5">
                  <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wide">การวินิจฉัย</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm font-mono truncate block">{selectedPatient.diagnosis_code || '-'}</span>
                </div>
              </div>
            </div>

            {/* Additional Optional Fields Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAdditionalFields(!showAdditionalFields)}
                className="w-full py-2 px-3 bg-slate-50 hover:bg-orange-50/60 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:text-orange-700 transition-all flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-orange-500" />
                  <span>รายละเอียดการผ่าตัดเพิ่มเติม</span>
                </span>
                <span className="text-slate-600 hover:text-orange-600 transition-colors p-1">
                  {showAdditionalFields ? <ChevronUp className="w-5 h-5 stroke-[3]" /> : <ChevronDown className="w-5 h-5 stroke-[3]" />}
                </span>
              </button>

              {showAdditionalFields && (
                <div className="mt-3 p-4 bg-slate-50/70 border border-slate-200 rounded-md space-y-4 animate-fadeIn">
                  {/* Group 1: Visual Acuity & Lens Info */}
                  <div>
                    <h4 className="text-xs font-bold text-orange-600 mb-2 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> ข้อมูล Visual Acuity
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">VA ตาขวา (VA RE)</label>
                        <input
                          type="text"
                          value={formVaRight}
                          onChange={(e) => setFormVaRight(e.target.value)}
                          placeholder="เช่น 6/60, CF 1 foot"
                          className="w-full h-[32px] px-2.5 py-0 bg-white border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">VA ตาซ้าย (VA LE)</label>
                        <input
                          type="text"
                          value={formVaLeft}
                          onChange={(e) => setFormVaLeft(e.target.value)}
                          placeholder="เช่น 6/12, HM"
                          className="w-full h-[32px] px-2.5 py-0 bg-white border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">ชนิดเลนส์ (Lens Type)</label>
                        <input
                          type="text"
                          value={formLensType}
                          onChange={(e) => setFormLensType(e.target.value)}
                          placeholder="เช่น Foldable IOL"
                          className="w-full h-[32px] px-2.5 py-0 bg-white border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Serial No. เลนส์</label>
                        <input
                          type="text"
                          value={formLensSerial}
                          onChange={(e) => setFormLensSerial(e.target.value)}
                          placeholder="SN-XXXXX"
                          className="w-full h-[32px] px-2.5 py-0 bg-white border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-orange-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Lot No. เลนส์</label>
                        <input
                          type="text"
                          value={formLensLot}
                          onChange={(e) => setFormLensLot(e.target.value)}
                          placeholder="LOT-XXXXX"
                          className="w-full h-[32px] px-2.5 py-0 bg-white border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-orange-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">วันหมดอายุเลนส์</label>
                        <input
                          type="date"
                          value={formLensExpiry}
                          onChange={(e) => setFormLensExpiry(e.target.value)}
                          className="w-full h-[32px] px-2.5 py-0 bg-white border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-orange-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Group 2: Time, Staff & Complications */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <h4 className="text-xs font-bold text-orange-600 mb-2 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> ข้อมูลการพยาบาล
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">เวลาเริ่มผ่าตัด</label>
                        <input
                          type="time"
                          value={formStart}
                          onChange={(e) => setFormStart(e.target.value)}
                          className="w-full h-[32px] px-2.5 py-0 bg-white border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-orange-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">เวลาสิ้นสุดผ่าตัด</label>
                        <input
                          type="time"
                          value={formEnd}
                          onChange={(e) => setFormEnd(e.target.value)}
                          className="w-full h-[32px] px-2.5 py-0 bg-white border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-orange-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">พยาบาล Scrub</label>
                        <SearchableSelect
                          options={getCustomNurseOptions(formScrubNurse)}
                          value={formScrubNurse}
                          onChange={(val) => setFormScrubNurse(val)}
                          placeholder="เลือกพยาบาล Scrub..."
                          searchPlaceholder="ค้นหาพยาบาล Scrub..."
                          showOrangeDot={true}
                          buttonClassName="h-[32px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">พยาบาล Circulating คนที่ 1</label>
                        <SearchableSelect
                          options={getCustomNurseOptions(formCircNurse1)}
                          value={formCircNurse1}
                          onChange={(val) => setFormCircNurse1(val)}
                          placeholder="เลือกพยาบาล Circulate 1..."
                          searchPlaceholder="ค้นหาพยาบาล Circulate..."
                          showOrangeDot={true}
                          buttonClassName="h-[32px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">พยาบาล Circulating คนที่ 2</label>
                        <SearchableSelect
                          options={getCustomNurseOptions(formCircNurse2)}
                          value={formCircNurse2}
                          onChange={(val) => setFormCircNurse2(val)}
                          placeholder="เลือกพยาบาล Circulate 2..."
                          searchPlaceholder="ค้นหาพยาบาล Circulate..."
                          showOrangeDot={true}
                          buttonClassName="h-[32px]"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">ภาวะแทรกซ้อน (Complications)</label>
                        <input
                          type="text"
                          value={formComplication}
                          onChange={(e) => setFormComplication(e.target.value)}
                          placeholder="เช่น None, PCR, Iris prolapse..."
                          className="w-full h-[32px] px-2.5 py-0 bg-white border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isProvider}
                title={isProvider ? 'สิทธิ์ Provider อ่านข้อมูลได้อย่างเดียว' : 'บันทึกข้อมูล'}
                className={`px-6 py-2 text-white rounded-md text-sm font-semibold shadow-xs flex items-center gap-2 transition-all ${
                  isProvider
                    ? 'bg-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-orange-500 hover:bg-orange-600 cursor-pointer'
                }`}
              >
                {isProvider ? <Lock className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{isProvider ? 'สิทธิ์อ่านข้อมูลเท่านั้น' : 'บันทึกข้อมูล'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Patient Queue Table Panel */}
      <div className="card-rounded p-6 space-y-4 bg-white border border-orange-100 shadow-xs relative z-10">
        {/* Table Toolbar & Filters */}
        <div className="flex flex-col gap-4 border-b border-orange-100 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  รายชื่อผู้ป่วยคิวผ่าตัดต้อกระจก
                </h3>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white text-[10px] font-bold tracking-wide">
                    กำลังกรอง {activeFilterCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                แสดงข้อมูลผู้ป่วยคิวผ่าตัดทั้งหมด ({filteredPatients.length} รายการ)
              </p>
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2 text-xs text-slate-500 self-start md:self-auto">
              <span>แสดง</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value={10}>10 รายการ</option>
                <option value={15}>15 รายการ</option>
                <option value={25}>25 รายการ</option>
                <option value={50}>50 รายการ</option>
                <option value={100}>100 รายการ</option>
              </select>
            </div>
          </div>

          {/* Filter Controls Row - Responsive col-12 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 pt-1 items-center">
            {/* Real-time search in table */}
            <div className="relative md:col-span-6 lg:col-span-5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="กรอกข้อมูลค้นหา (HN, ชื่อ, ลำดับคัดกรอง)..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {tableSearch && (
                <button
                  onClick={() => setTableSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Surgery Method Filter */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors md:col-span-3 lg:col-span-3 ${
                methodFilter ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">วิธีผ่าตัด:</span>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-full"
              >
                <option value="">ทุกประเภทผ่าตัด</option>
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

            {/* Status Filter */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors md:col-span-3 lg:col-span-3 ${
                filterStatus ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">สถานะ:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-full"
              >
                <option value="">ทุกสถานะ</option>
                <option value="รอผ่าตัด">รอผ่าตัด</option>
                <option value="เตรียมความพร้อม/หยอดยา">เตรียมความพร้อม</option>
                <option value="กำลังผ่าตัด">กำลังผ่าตัด</option>
                <option value="ผ่าตัดเสร็จสิ้น">ผ่าตัดเสร็จสิ้น</option>
                <option value="ย้ายไปหอผู้ป่วย">ย้ายไปหอผู้ป่วย</option>
                <option value="ยกเลิก/เลื่อน">ยกเลิก/เลื่อน</option>
              </select>
            </div>

            {/* Clear Filters button */}
            {activeFilterCount > 0 && (
              <div className="md:col-span-12 lg:col-span-1 flex justify-end">
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5" /> ล้างตัวกรอง
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table View - Responsive with custom scrollbar and active patient highlight */}
        <div className="overflow-x-auto custom-scrollbar pt-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">กำลังโหลดข้อมูล...</div>
          ) : (
            <table className="w-full text-sm text-left text-slate-600 whitespace-nowrap">
              <thead>
                <tr className="text-xs uppercase bg-orange-50/60 text-slate-600 border-b border-orange-100">
                  <th className="py-3 px-3.5 whitespace-nowrap">คิว</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">#ID</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">วิธีผ่าตัด & ตา</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">สถานะผ่าตัด</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">หอผู้ป่วย</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">แพทย์</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedPatients.length > 0 ? (
                  pagedPatients.map((p) => {
                    const isSelected = selectedPatient?.id === p.id;
                    return (
                      <tr
                        key={p.id}
                        className={`transition-all ${
                          isSelected
                            ? 'bg-orange-100/90 border-l-4 border-l-orange-500 font-bold text-orange-950 shadow-xs'
                            : 'hover:bg-orange-50/30'
                        }`}
                      >
                        <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                          {p.queue ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-orange-500 text-white font-bold text-xs shadow-xs">
                              {p.queue}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-xs text-slate-900 font-bold align-middle whitespace-nowrap">
                          #{p.id}
                        </td>
                        <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                          <div className="font-bold text-slate-950 text-sm leading-snug flex items-center gap-2">
                            <span>{p.pname || ''}{p.fname || ''} {p.lname || ''}</span>
                            {isSelected && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-600 text-white rounded-md shadow-2xs animate-pulse flex items-center gap-1">
                                <UserCheck className="w-3 h-3" /> กำลังแก้ไข
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-800 font-medium flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-orange-100 text-orange-800 rounded-md border border-orange-300 shadow-2xs">H25.9</span>
                            <span>HN: <strong className="text-slate-950 font-bold">{p.hn || '-'}</strong> | CID: <strong className="text-slate-950 font-bold">{p.cid || '-'}</strong></span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                          <SurgeryTypeBadge method={p.surgery_method} />
                        </td>
                        <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                          {p.ward ? (
                            <span className="inline-flex items-center px-2.5 py-1 bg-teal-50 text-teal-800 font-semibold rounded-md text-xs border border-teal-200">
                              {p.ward}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-xs font-medium text-slate-700 align-middle whitespace-nowrap">
                          {p.surgeon || '-'}
                        </td>
                        <td className="py-3 px-3.5 text-right align-middle whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => selectPatientToEdit(p.id)}
                            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ml-auto border shadow-2xs cursor-pointer ${
                              isSelected
                                ? 'bg-orange-500 text-white border-orange-600 shadow-md'
                                : 'bg-orange-50 text-orange-700 hover:bg-orange-500 hover:text-white border-orange-200'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" /> {isSelected ? 'กำลังแก้ไข' : 'แก้ไขคิว'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      ไม่พบข้อมูลผู้ป่วยที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Custom Pagination Footer */}
        {filteredPatients.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
            <div>
              แสดง {(currentPage - 1) * pageSize + 1} ถึง{' '}
              {Math.min(currentPage * pageSize, filteredPatients.length)} จากทั้งหมด{' '}
              <span className="font-bold text-slate-700">{filteredPatients.length}</span> รายการ
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> ย้อนกลับ
              </button>

              <div className="flex items-center gap-1 px-1">
                {getPageNumbers().map((num, idx) =>
                  typeof num === 'number' ? (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(num)}
                      className={`w-7 h-7 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        currentPage === num
                          ? 'bg-orange-500 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {num}
                    </button>
                  ) : (
                    <span key={idx} className="px-1 text-slate-400 font-bold">
                      ...
                    </span>
                  )
                )}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
              >
                ถัดไป <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
