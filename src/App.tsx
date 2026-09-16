import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { QueueManage } from './pages/QueueManage';
import { TvMonitor } from './pages/TvMonitor';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Terminal } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'queue' | 'tv' | 'settings'>('dashboard');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // TV Monitor screen can be viewed publicly without login
  if (currentTab === 'tv') {
    return <TvMonitor onBack={() => setCurrentTab('dashboard')} />;
  }

  // Initial Auth checking state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-anuphan">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-300">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</span>
        </div>
      </div>
    );
  }

  // If not logged in and not viewing TV, show Login page
  if (!user || showLoginModal) {
    return (
      <Login
        onSuccess={() => setShowLoginModal(false)}
        onViewTv={() => setCurrentTab('tv')}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 font-anuphan">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      <main className="flex-grow">
        {currentTab === 'dashboard' && <Dashboard />}
        {currentTab === 'queue' && <QueueManage />}
        {currentTab === 'settings' && <Settings />}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-slate-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <strong>KMLS PhacoReport System</strong> &copy; {new Date().getFullYear()}
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-orange-500 stroke-[2.5]" />
              <span className="text-orange-500 tracking-wide text-xs font-semibold">wITsaNU</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> ระบบเชื่อมต่อสมบูรณ์
            </span>
            <span>|</span>
            <span>Asia/Bangkok (GMT+7)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
