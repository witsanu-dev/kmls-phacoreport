import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { Database, Wifi, WifiOff, Save, RefreshCw, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

interface DbConfig {
  DB_HOST: string;
  DB_PORT: string;
  DB_NAME: string;
  DB_USER: string;
  DB_PASS: string;
  DB_CHARSET: string;
}

export const Settings: React.FC = () => {
  const [config, setConfig]       = useState<DbConfig>({ DB_HOST: '', DB_PORT: '3306', DB_NAME: '', DB_USER: '', DB_PASS: '', DB_CHARSET: 'utf8mb4' });
  const [connInfo, setConnInfo]   = useState<{ ok: boolean; version?: string; error?: string } | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [dirty, setDirty]         = useState(false);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await api.getDbConfig();
      if (res.success && res.config) {
        setConfig(res.config as unknown as DbConfig);
        setConnInfo(res.connection ?? null);
        setDirty(false);
      }
    } catch {
      setConnInfo({ ok: false, error: 'ไม่สามารถเชื่อมต่อ API ได้' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadConfig(); }, []);

  const handleChange = (field: keyof DbConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirm = await Swal.fire({
      title: 'ยืนยันการบันทึก Config?',
      html: `ระบบจะทดสอบการเชื่อมต่อกับ<br/><b>${config.DB_NAME}@${config.DB_HOST}</b><br/>ก่อนบันทึก`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ทดสอบ & บันทึก',
      cancelButtonText: 'ยกเลิก',
      customClass: { popup: 'rounded-md', confirmButton: 'rounded-md', cancelButton: 'rounded-md' },
    });
    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const res = await api.saveDbConfig(config as unknown as Record<string, string>);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ!',
          html: `เชื่อมต่อฐานข้อมูลสำเร็จ<br/><span class="text-xs text-slate-500">MySQL ${res.version}</span>`,
          timer: 2500,
          showConfirmButton: false,
          customClass: { popup: 'rounded-md' },
        });
        setDirty(false);
        setConnInfo({ ok: true, version: res.version });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'ไม่สามารถบันทึกได้',
          text: res.message,
          customClass: { popup: 'rounded-md' },
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err?.response?.data?.message ?? String(err),
        customClass: { popup: 'rounded-md' },
      });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all';
  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-anuphan">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-600 to-teal-500 p-6 rounded-md text-white shadow-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Database className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[2] flex-shrink-0" />
            <span>ตั้งค่าการเชื่อมต่อฐานข้อมูล</span>
          </h2>
          <p className="text-teal-100 text-xs mt-1">
            บันทึกการตั้งค่า Database Config อย่างปลอดภัย — ทดสอบการเชื่อมต่อก่อนบันทึกทุกครั้ง
          </p>
        </div>
        <button
          onClick={loadConfig}
          disabled={loading}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-sm font-semibold transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรช
        </button>
      </div>

      {/* Connection Status Card */}
      <div className={`flex items-center gap-4 p-4 rounded-md border ${connInfo?.ok ? 'bg-teal-50 border-teal-200' : 'bg-red-50 border-red-200'}`}>
        {connInfo?.ok ? (
          <Wifi className="w-6 h-6 text-teal-600 flex-shrink-0" />
        ) : (
          <WifiOff className="w-6 h-6 text-red-500 flex-shrink-0" />
        )}
        <div className="flex-1">
          <p className={`text-sm font-bold ${connInfo?.ok ? 'text-teal-800' : 'text-red-800'}`}>
            {connInfo === null ? 'กำลังตรวจสอบ...' : connInfo.ok ? 'เชื่อมต่อฐานข้อมูลสำเร็จ' : 'ไม่สามารถเชื่อมต่อได้'}
          </p>
          <p className={`text-xs mt-0.5 ${connInfo?.ok ? 'text-teal-600' : 'text-red-600'}`}>
            {connInfo?.ok ? `MySQL ${connInfo.version ?? ''} • ${config.DB_NAME}@${config.DB_HOST}` : connInfo?.error}
          </p>
        </div>
        {connInfo?.ok && <ShieldCheck className="w-5 h-5 text-teal-500 flex-shrink-0" />}
      </div>

      {/* Config Form */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
          <Database className="w-5 h-5 text-teal-600" />
          <h3 className="text-base font-bold text-slate-800">Database Connection Parameters</h3>
          {dirty && (
            <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-md border border-amber-300">
              มีการเปลี่ยนแปลง
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">กำลังโหลด config...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Host & Port */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>DB_HOST <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={config.DB_HOST}
                  onChange={(e) => handleChange('DB_HOST', e.target.value)}
                  placeholder="localhost"
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>DB_PORT</label>
                <input
                  type="number"
                  value={config.DB_PORT}
                  onChange={(e) => handleChange('DB_PORT', e.target.value)}
                  placeholder="3306"
                  className={inputCls}
                />
              </div>
            </div>

            {/* DB Name */}
            <div>
              <label className={labelCls}>DB_NAME (Database Name) <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={config.DB_NAME}
                onChange={(e) => handleChange('DB_NAME', e.target.value)}
                placeholder="db_phacoreport"
                required
                className={inputCls}
              />
            </div>

            {/* Username & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>DB_USER (Username) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  autoComplete="off"
                  value={config.DB_USER}
                  onChange={(e) => handleChange('DB_USER', e.target.value)}
                  placeholder="root"
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>DB_PASS (Password)</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={config.DB_PASS}
                    onChange={(e) => handleChange('DB_PASS', e.target.value)}
                    placeholder="ไม่ต้องกรอกถ้ายังใช้รหัสเดิม"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">ปล่อยว่างหรือใส่ •••• = คงรหัสผ่านเดิม</p>
              </div>
            </div>

            {/* Charset */}
            <div>
              <label className={labelCls}>DB_CHARSET</label>
              <select
                value={config.DB_CHARSET}
                onChange={(e) => handleChange('DB_CHARSET', e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="utf8mb4">utf8mb4 (แนะนำ)</option>
                <option value="utf8">utf8</option>
                <option value="latin1">latin1</option>
              </select>
            </div>

            {/* Security notice */}
            <div className="flex gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Config จะถูกบันทึกในไฟล์ <code className="font-mono bg-amber-100 px-1 rounded">config/db.env</code> บนเซิร์ฟเวอร์
                ระบบจะ<strong>ทดสอบการเชื่อมต่อก่อน</strong>ทุกครั้ง — หากเชื่อมต่อไม่ได้จะไม่บันทึก
              </p>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={loadConfig}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-semibold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving || !dirty}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'กำลังทดสอบ & บันทึก...' : 'ทดสอบ & บันทึก Config'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Info card */}
      <div className="bg-teal-50 border border-teal-200 rounded-md p-4 text-xs text-teal-800 space-y-1.5 leading-relaxed">
        <p className="font-bold flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> รายละเอียดความปลอดภัย</p>
        <ul className="list-disc list-inside space-y-1 text-teal-700 pl-1">
          <li>รหัสผ่านไม่ถูก expose ทาง API — แสดงเฉพาะ ••••••</li>
          <li>ทดสอบ connection จริงก่อนบันทึกทุกครั้ง</li>
          <li>บันทึกใน <code className="font-mono bg-teal-100 px-1 rounded">config/db.env</code> — แยกจาก source code</li>
          <li>Endpoint เข้าถึงได้เฉพาะ localhost/127.0.0.1 เท่านั้น</li>
        </ul>
      </div>
    </div>
  );
};
