
import React from 'react';
import { 
  Home, 
  FileText, 
  Settings,
  Briefcase,
  Users,
  ClipboardCheck,
  Activity
} from 'lucide-react';
import { UserRole } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, role }) => {
  const getTabs = () => {
    if (role === UserRole.LEADER) {
      return [
        { id: 'home', label: '控制台', icon: Home },
        { id: 'audit', label: '事项审核', icon: ClipboardCheck },
        { id: 'ledger', label: '数字台账', icon: FileText },
        { id: 'staff_attendance', label: '考勤监控', icon: Users },
        { id: 'admin', label: '管理', icon: Settings },
      ];
    }
    
    return [
      { id: 'home', label: '主页', icon: Home },
      { id: 'field', label: '现场办公', icon: Briefcase },
      { id: 'ledger', label: '台账', icon: FileText },
      { id: 'attendance', label: '打卡', icon: Activity },
    ];
  };

  const tabs = getTabs();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center pt-3 pb-[calc(10px+env(safe-area-inset-bottom))] px-3 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] transition-all">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center space-y-1.5 transition-all flex-1 py-1 relative ${
              isActive ? 'text-blue-600' : 'text-slate-300 hover:text-slate-400'
            }`}
          >
            <div className={`p-1.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-blue-50 scale-110 shadow-inner' : 'bg-transparent'}`}>
              <Icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'rotate-[360deg]' : ''}`} />
            </div>
            <span className={`text-[10px] font-black tracking-tight uppercase ${isActive ? 'opacity-100' : 'opacity-60'}`}>
              {tab.label}
            </span>
            {isActive && (
              <div className="absolute top-0 w-8 h-1 bg-blue-600 rounded-full animate-in zoom-in -translate-y-4"></div>
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;
