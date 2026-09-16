import React, { useState } from 'react';
import { Eye, Lock, User as UserIcon, LogIn, AlertCircle, ClipboardPaste, ShieldCheck, Monitor, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onSuccess?: () => void;
  onViewTv?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onViewTv }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await login(username, password);
      if (res.success) {
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-anuphan relative">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-md shadow-lg border border-slate-200 overflow-hidden relative z-10">
        
        {/* Header Card - Matched exact Navbar Branding */}
        <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-md bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <Eye className="w-6 h-6 font-bold" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none flex items-center gap-1.5">
                <span>KMLS</span>
                <span className="text-orange-500 font-extrabold">Phaco Report</span>
                <ClipboardPaste className="w-4.5 h-4.5 text-orange-500 stroke-[2.2] ml-0.5" />
              </h1>
              <p className="text-xs text-slate-500 mt-1">ระบบรายงานการผ่าตัดผู้ป่วยโรคต้อกระจก</p>
            </div>
          </div>
          <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0" />
        </div>

        {/* Login Form Body */}
        <div className="p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800">เข้าสู่ระบบ (Sign In)</h2>
            <p className="text-xs text-slate-500 mt-0.5">กรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าใช้งาน</p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="กรอกชื่อผู้ใช้งาน..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium text-slate-800 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium text-slate-800 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-md shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>กำลังตรวจสอบสิทธิ์...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบ</span>
                </>
              )}
            </button>
          </form>

          {/* Public TV Monitor Action Button */}
          {onViewTv && (
            <div className="border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={onViewTv}
                className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 text-amber-800 font-bold text-xs rounded-md shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Monitor className="w-4 h-4 text-amber-600" />
                <span>แสดงหน้าจอ Monitor</span>
              </button>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="bg-slate-50 p-3.5 border-t border-slate-100 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <span>KMLS PhacoReport System &copy; 2026</span>
          <span className="text-slate-300">|</span>
          <span className="inline-flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-orange-500 stroke-[2.5]" />
            <span className="text-orange-500 tracking-wide text-xs font-semibold">wITsaNU</span>
          </span>
        </div>

      </div>
    </div>
  );
};
