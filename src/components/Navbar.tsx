import React, { useState, useEffect, useRef } from 'react';
import { Eye, LayoutDashboard, ClipboardEdit, Monitor, Clock, Database, Menu, X, ClipboardPaste, Users, LogOut, Lock, CreditCard, ChevronDown, Building, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { DbConfigModal } from './DbConfigModal';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: 'dashboard' | 'queue' | 'tv' | 'settings';
  setCurrentTab: (tab: 'dashboard' | 'queue' | 'tv' | 'settings') => void;
  onOpenLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenLogin }) => {
  const { user, logout, isProvider } = useAuth();
  const [timeStr, setTimeStr] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('th-TH', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    const checkDbStatus = async () => {
      try {
        const wards = await api.getWards();
        setIsOnline(Array.isArray(wards));
      } catch {
        setIsOnline(false);
      }
    };
    checkDbStatus();
    const dbInterval = setInterval(checkDbStatus, 15000);

    // Close dropdown on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      clearInterval(dbInterval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <span className="bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md text-[11px] font-bold">Admin</span>;
      case 'doctor':
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md text-[11px] font-bold">Doctor</span>;
      case 'nurse':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px] font-bold">Nurse</span>;
      case 'provider':
        return <span className="bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1"><Lock className="w-3 h-3" /> Provider</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium">Guest</span>;
    }
  };

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-orange-100 sticky top-0 z-40 shadow-xs font-anuphan">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo Branding */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
              <div className="w-10 h-10 rounded-md bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <Eye className="w-6 h-6 font-bold" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none flex items-center gap-1.5">
                  <span>KMLS</span>
                  <span className="text-orange-500 font-extrabold">Phaco Report</span>
                  <ClipboardPaste className="w-4.5 h-4.5 text-orange-500 stroke-[2.2] ml-0.5" />
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">ระบบรายงานการผ่าตัดผู้ป่วยโรคต้อกระจก</p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`px-3.5 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  currentTab === 'dashboard'
                    ? 'bg-orange-50 text-orange-600 font-semibold border border-orange-200'
                    : 'text-slate-600 hover:text-orange-600 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-4.5 h-4.5 stroke-[2]" />
                <span>Dashboards</span>
              </button>

              <button
                onClick={() => setCurrentTab('queue')}
                className={`px-3.5 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  currentTab === 'queue'
                    ? 'bg-orange-50 text-orange-600 font-semibold border border-orange-200'
                    : 'text-slate-600 hover:text-orange-600 hover:bg-slate-50'
                }`}
              >
                <ClipboardEdit className="w-4.5 h-4.5 stroke-[2]" />
                <span>บันทึกการผ่าตัด</span>
              </button>

              <button
                onClick={() => setCurrentTab('tv')}
                className="px-3.5 py-2 rounded-md text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Monitor className="w-4.5 h-4.5 stroke-[1.8]" />
                <span>หน้าจอ Monitor</span>
              </button>
            </nav>

            {/* Desktop Right Panel: User Dropdown, DB Status & Clock */}
            <div className="hidden lg:flex items-center gap-3">

              {/* User Dropdown Component */}
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-2.5 bg-slate-50 hover:bg-orange-50/70 border border-slate-200 hover:border-orange-200 rounded-md p-1.5 pl-2.5 transition-all cursor-pointer shadow-xs"
                  >
                    <div className="w-7 h-7 rounded-md bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="text-left leading-tight">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <span>{user.fullname}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {user.department || user.cid}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserDropdownOpen ? 'rotate-180 text-orange-500' : ''}`} />
                  </button>

                  {/* Dropdown Overlay Panel */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-xl border border-slate-200 p-3.5 z-50 animate-fadeIn space-y-3">
                      <div className="border-b border-slate-100 pb-2.5">
                        <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                          <span>{user.fullname}</span>
                          {getRoleBadge(user.role)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-mono">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.cid}</span>
                        </div>
                        {user.department && (
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>{user.department}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 p-2 rounded-md text-[11px] text-slate-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Username</span>
                          <span className="font-semibold text-slate-800">{user.username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>สิทธิ์การใช้งาน:</span>
                          <span className="font-semibold text-orange-600 capitalize">{user.role}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-md transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>เข้าสู่ระบบ</span>
                </button>
              )}

              {/* DB Status Badge */}
              <button
                onClick={() => setIsDbModalOpen(true)}
                title="ตั้งค่าการเชื่อมต่อฐานข้อมูล"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <Database className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`} />
                <span className="tracking-wider">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </button>

              {/* Digital Clock */}
              <div className="flex items-center text-xs text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-md border border-slate-200 font-mono font-semibold">
                <Clock className="w-4 h-4 text-orange-500 mr-1.5" />
                <span>{timeStr} น.</span>
              </div>
            </div>

            {/* Mobile Menu Button Toggle */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-orange-100 bg-white px-4 pt-3 pb-4 space-y-2 shadow-xl animate-fadeIn">
            {user ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md mb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{user.fullname}</div>
                    <div className="text-[10px] text-slate-500">{user.department || user.cid}</div>
                  </div>
                  {getRoleBadge(user.role)}
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md font-bold transition-all flex items-center justify-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> ออกจากระบบ
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (onOpenLogin) onOpenLogin();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2 bg-orange-500 text-white rounded-md text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" /> เข้าสู่ระบบ
              </button>
            )}

            <button
              onClick={() => {
                setCurrentTab('dashboard');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2.5 cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-orange-50 text-orange-600 font-bold border border-orange-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5 stroke-[2]" />
              <span>Dashboards</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('queue');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${
                currentTab === 'queue'
                  ? 'bg-orange-50 text-orange-600 font-bold border border-orange-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ClipboardEdit className="w-4.5 h-4.5 stroke-[2]" />
                <span>บันทึกการผ่าตัด</span>
              </div>
            </button>

            <button
              onClick={() => {
                setCurrentTab('tv');
                setIsMobileMenuOpen(false);
              }}
              className="w-full px-3.5 py-2.5 rounded-md text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-xs flex items-center gap-2.5 cursor-pointer"
            >
              <Monitor className="w-4.5 h-4.5 stroke-[1.8]" />
              <span>หน้าจอ Monitor</span>
            </button>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setIsDbModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <Database className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`} />
                <span className="tracking-wider">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </button>

              <div className="flex items-center text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 font-mono font-semibold">
                <Clock className="w-4 h-4 text-orange-500 mr-1.5" />
                <span>{timeStr} น.</span>
              </div>
            </div>
          </div>
        )}
      </header>

      <DbConfigModal isOpen={isDbModalOpen} onClose={() => setIsDbModalOpen(false)} />
    </>
  );
};
