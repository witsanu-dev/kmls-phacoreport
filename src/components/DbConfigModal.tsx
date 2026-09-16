import React, { useState, useEffect } from 'react';
import { Database, Server, CheckCircle2, AlertCircle, RefreshCw, X, HardDrive } from 'lucide-react';
import Swal from 'sweetalert2';

interface DbConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DbConfigModal: React.FC<DbConfigModalProps> = ({ isOpen, onClose }) => {
  const [host, setHost] = useState<string>('localhost');
  const [port, setPort] = useState<string>('3306');
  const [dbname, setDbname] = useState<string>('db_phacoreport');
  const [user, setUser] = useState<string>('root');
  const [pass, setPass] = useState<string>('');

  const [testing, setTesting] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latency_ms?: number;
    mysql_version?: string;
    screen_records?: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch active config from backend API
      fetch('./api/get_db_config.php')
        .then(async (res) => {
          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch {
            return { success: false };
          }
        })
        .then((data) => {
          if (data.success && data.config) {
            setHost(data.config.DB_HOST || 'localhost');
            setPort(data.config.DB_PORT || '3306');
            setDbname(data.config.DB_NAME || 'db_phacoreport');
            setUser(data.config.DB_USER || 'root');
            setPass(data.config.DB_PASS || '');
          }
        })
        .catch((err) => {
          console.error('Error fetching db config:', err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('./api/test_db.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, dbname, user, pass }),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('ได้รับการตอบกลับไม่ถูกต้อง (HTML/404) กรุณาตรวจสอบว่ามีโฟลเดอร์ api บน Web Server');
      }
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ' + err.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('./api/get_db_config.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          DB_HOST: host,
          DB_PORT: port,
          DB_NAME: dbname,
          DB_USER: user,
          DB_PASS: pass,
        }),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('ได้รับการตอบกลับไม่ถูกต้อง (HTML/404) กรุณาตรวจสอบว่ามีโฟลเดอร์ api บน Web Server');
      }
      if (data.success) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'บันทึกการเชื่อมต่อฐานข้อมูลสำเร็จ',
          text: 'บันทึกค่าการตั้งค่าลงฐานข้อมูลเรียบร้อยแล้ว',
          timer: 2500,
          timerProgressBar: true,
          showConfirmButton: false,
          background: '#ffffff',
          iconColor: '#10b981',
          customClass: {
            popup: 'rounded-xl shadow-xl border border-emerald-100 font-anuphan text-slate-800 p-3',
            title: 'text-sm font-bold text-slate-900',
            htmlContainer: 'text-xs text-slate-500 mt-1',
          },
        });
        onClose();
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'ไม่สามารถบันทึกได้',
          text: data.message || 'เกิดข้อผิดพลาดในการบันทึกค่า',
          customClass: { popup: 'rounded-md' },
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถติดต่อ API เพื่อบันทึกค่าได้: ' + err.message,
        customClass: { popup: 'rounded-md' },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn font-anuphan">
      <div className="bg-white w-full max-w-lg rounded-md shadow-2xl border border-orange-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-md">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">ตั้งค่า & ทดสอบการเชื่อมต่อฐานข้อมูล</h3>
              <p className="text-xs text-orange-100">Database Connection Configuration (MySQL/MariaDB)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600">Database Host</label>
              <div className="relative">
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600">Port</label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600">Database Name (DB)</label>
              <input
                type="text"
                value={dbname}
                onChange={(e) => setDbname(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold text-orange-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600">Username</label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-600">Password</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
            <div><strong>Encoding:</strong> utf8mb4</div>
            <div><strong>Timezone:</strong> Asia/Bangkok (+07:00)</div>
          </div>

          {/* Test Connection Status Result */}
          {testResult && (
            <div
              className={`p-3.5 rounded-md border text-xs space-y-1 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
              {testResult.success && (
                <div className="text-[11px] space-y-0.5 pt-1 text-emerald-700 font-mono">
                  <div>Ping Latency: <strong>{testResult.latency_ms} ms</strong></div>
                  <div>MySQL Version: <strong>{testResult.mysql_version}</strong></div>
                  <div>Record Count (Screen): <strong>{testResult.screen_records} เคส</strong></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-white border border-slate-200 text-slate-600 rounded-md text-xs font-semibold hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
