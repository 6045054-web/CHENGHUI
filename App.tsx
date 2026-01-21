import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  User, 
  UserRole, 
  Project, 
  Announcement, 
  Report, 
  ReportType, 
  ReportStatus, 
  AttendanceRecord 
} from './types';
import { ShieldCheck, Loader2, AlertCircle, LogOut } from 'lucide-react';
import LoginView from './views/Login';
import Dashboard from './views/Dashboard';
import FieldWorkView from './views/FieldWork';
import LedgerView from './views/Ledger';
import AttendanceView from './views/Attendance';
import AdminView from './views/Admin';
import AnnouncementsView from './views/Announcements';
import Navigation from './components/Navigation';
import { dbService } from './dbService';

const STORAGE_KEY = 'chenghui_session_v4';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('home');
  const [adminSubTab, setAdminSubTab] = useState<'projects' | 'users' | 'ann' | 'attendance' | 'reports'>('reports');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await dbService.fetchAllData();
      setReports(data.reports || []);
      setAnnouncements(data.announcements || []);
      setProjects(data.projects || []);
      setUsers(data.users || []);
      setAttendance(data.attendance || []);
    } catch (e) {
      setErrorMsg("数据同步失败，请检查网络连接");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser, loadAllData]);

  const handleLogin = async (un: string, pw: string) => {
    setIsLoading(true);
    try {
      const user = await dbService.login(un, pw);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        return user;
      }
      return null;
    } catch (e) {
      alert("登录通信失败");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
    setActiveTab('home');
    setShowLogoutConfirm(false);
  };

  const filteredReports = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.LEADER) return reports;
    if (currentUser.role === UserRole.CHIEF) return reports.filter(r => r.projectId === currentUser.projectId);
    return reports.filter(r => r.authorId === currentUser.id);
  }, [reports, currentUser]);

  const stats = useMemo(() => ({
    total: filteredReports.length,
    pending: filteredReports.filter(r => r.status === ReportStatus.PENDING).length,
    important: reports.filter(r => r.isImportant && r.status === ReportStatus.PENDING).length
  }), [filteredReports, reports]);

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  const handleAdminNavigate = (sub: 'projects' | 'users' | 'ann' | 'attendance' | 'reports') => {
    setAdminSubTab(sub);
    setActiveTab('admin');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden select-none">
      <header className="bg-white/90 backdrop-blur-md px-5 py-4 flex justify-between items-center border-b border-slate-100 shrink-0 pt-[calc(14px+env(safe-area-inset-top))] z-50">
        <div className="flex items-center gap-2">
           <div className="bg-blue-600 p-1.5 rounded-xl shadow-lg">
             <ShieldCheck className="w-5 h-5 text-white" />
           </div>
           <div>
             <h1 className="text-sm font-black text-slate-800 tracking-tighter">成汇数字办公</h1>
             <div className="flex items-center gap-1">
               <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-orange-400 animate-pulse' : 'bg-green-500'}`}></span>
               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                 {isLoading ? 'Syncing' : 'Connected'}
               </span>
             </div>
           </div>
        </div>
        <button 
          onClick={() => setShowLogoutConfirm(true)} 
          className="text-[10px] font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-full flex items-center gap-1"
        >
          <LogOut className="w-3 h-3" /> 安全退出
        </button>
      </header>

      {errorMsg && (
        <div className="bg-red-500 text-white px-4 py-2 flex items-center gap-2 text-[10px] font-bold">
          <AlertCircle className="w-3 h-3" />
          {errorMsg}
          <button onClick={loadAllData} className="ml-auto underline">重试</button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto hide-scrollbar pb-24">
        <div className="max-w-md mx-auto">
          {activeTab === 'home' && (
            <Dashboard 
              user={currentUser} 
              projectName={projects.find(p => p.id === currentUser.projectId)?.name} 
              announcements={announcements} 
              onNavigate={setActiveTab}
              onNavigateToAdminSub={handleAdminNavigate}
              stats={stats}
              onUpdatePassword={() => {}}
            />
          )}

          {activeTab === 'announcements' && <AnnouncementsView announcements={announcements} />}

          {activeTab === 'field' && (
            <FieldWorkView 
              user={currentUser} 
              projects={projects} 
              reports={filteredReports}
              onAddReport={async (r) => {
                setIsLoading(true);
                try {
                  await dbService.saveReport(r);
                  setReports(prev => [r, ...prev]);
                } finally {
                  setIsLoading(false);
                }
              }}
              onUpdateReport={async (r) => {
                setIsLoading(true);
                try {
                  await dbService.saveReport(r);
                  setReports(prev => prev.map(it => it.id === r.id ? r : it));
                } finally {
                  setIsLoading(false);
                }
              }}
            />
          )}

          {activeTab === 'ledger' && <LedgerView reports={filteredReports} projects={projects} user={currentUser} />}

          {activeTab === 'attendance' && (
            <AttendanceView 
              user={currentUser} 
              records={attendance} 
              projects={projects}
              onClock={async (rec) => {
                setIsLoading(true);
                try {
                  await dbService.saveAttendance(rec);
                  setAttendance(prev => [rec, ...prev]);
                } finally {
                  setIsLoading(false);
                }
              }}
            />
          )}

          {(activeTab === 'admin' || activeTab === 'audit' || activeTab === 'staff_attendance') && (
            <AdminView 
              initialTab={activeTab === 'audit' ? 'reports' : (activeTab === 'staff_attendance' ? 'attendance' : adminSubTab)}
              projects={projects}
              setProjects={setProjects}
              users={users}
              setUsers={setUsers}
              attendanceSummary={attendance}
              announcements={announcements}
              setAnnouncements={setAnnouncements}
              onPublishAnnouncement={(ann) => setAnnouncements(prev => [ann, ...prev])}
              importantReports={reports.filter(r => r.isImportant && r.status === ReportStatus.PENDING)}
              onUpdateReport={async (r) => {
                setIsLoading(true);
                try {
                  await dbService.saveReport(r);
                  setReports(prev => prev.map(it => it.id === r.id ? r : it));
                } finally {
                  setIsLoading(false);
                }
              }}
            />
          )}
        </div>
      </main>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} role={currentUser.role} />

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xs rounded-[32px] p-8 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-800">退出登录</h3>
              <p className="text-xs font-bold text-slate-400">确定要结束本次办公会话吗？</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">取消</button>
              <button onClick={confirmLogout} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">确定</button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-[1px] z-[999] flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 p-4 rounded-3xl shadow-2xl flex items-center gap-3 border border-slate-100">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">加载中</span>
          </div>
        </div>
      )}
    </div>
  );
}
