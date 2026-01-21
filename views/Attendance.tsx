
import React, { useState, useMemo, useEffect } from 'react';
import { User, AttendanceRecord, Project, UserRole } from '../types';
import { MapPin, Clock, CheckCircle2, Radar, ShieldCheck, Navigation, Loader2 } from 'lucide-react';

interface AttendanceProps {
  user: User;
  records: AttendanceRecord[];
  projects: Project[];
  onClock: (record: AttendanceRecord) => Promise<void>;
}

const AttendanceView: React.FC<AttendanceProps> = ({ user, records, projects, onClock }) => {
  const isLeader = user.role === UserRole.LEADER;
  const [currentLocation, setCurrentLocation] = useState('未获取定位');
  const [locationLocked, setLocationLocked] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [showFeedback, setShowFeedback] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setCurrentLocation('设备不支持定位');
      return;
    }

    setIsLocating(true);
    setLocationLocked(false);
    setCurrentLocation('正在锁定卫星信号...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation(`已锁定: ${longitude.toFixed(4)}E, ${latitude.toFixed(4)}N`);
        setIsLocating(false);
        setLocationLocked(true);
      },
      (error) => {
        setCurrentLocation('定位失败：请开启位置权限');
        setIsLocating(false);
        setLocationLocked(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 修复时区问题：使用本地时间生成 YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const recDate = r.time.split(' ')[0];
      const isToday = recDate === todayStr;
      if (isLeader) return isToday;
      return r.userId === user.id && isToday;
    });
  }, [records, user.id, isLeader, todayStr]);

  const todayStatus = useMemo(() => {
    const userToday = records.filter(r => {
      const recDate = r.time.split(' ')[0];
      return r.userId === user.id && recDate === todayStr;
    });
    
    const clockInRec = userToday.find(r => r.type === 'CLOCK_IN');
    const clockOutRec = userToday.find(r => r.type === 'CLOCK_OUT');

    return {
      hasClockIn: !!clockInRec,
      clockInTime: clockInRec ? clockInRec.time.split(' ')[1] : null,
      hasClockOut: !!clockOutRec,
      clockOutTime: clockOutRec ? clockOutRec.time.split(' ')[1] : null,
    };
  }, [records, user.id, todayStr]);

  const handleClock = async (type: 'CLOCK_IN' | 'CLOCK_OUT') => {
    if (isLeader || isSubmitting) return;
    
    // 二次逻辑校验
    if (type === 'CLOCK_IN' && todayStatus.hasClockIn) return;
    if (type === 'CLOCK_OUT' && (todayStatus.hasClockOut || !todayStatus.hasClockIn)) return;

    if (!locationLocked) {
      alert("请先完成实地定位锁定");
      requestLocation();
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const formattedTime = `${todayStr} ${now.toTimeString().split(' ')[0]}`;

      const newRecord: AttendanceRecord = {
        id: `ATT${Date.now()}`,
        userId: user.id,
        userName: user.name,
        projectId: user.projectId || 'P001',
        projectName: projects.find(p => p.id === (user.projectId || 'P001'))?.name || '未知项目',
        type,
        time: formattedTime,
        location: currentLocation
      };
      
      await onClock(newRecord);
      setShowFeedback(type === 'CLOCK_IN' ? '签到成功' : '签退成功');
      setTimeout(() => setShowFeedback(null), 2500);
    } catch (e) {
      alert("打卡失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      {showFeedback && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-blue-600 text-white px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-black">{showFeedback}</span>
        </div>
      )}

      {!isLeader && (
        <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl shadow-slate-200/30 flex flex-col items-center text-center relative overflow-hidden">
          <div className="relative z-10 w-full">
            <div className="text-5xl font-black text-slate-800 mb-2 font-mono tracking-tighter tabular-nums">{currentTime}</div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-[3px] mb-8">
              {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            
            <button 
              onClick={requestLocation}
              disabled={isLocating || isSubmitting}
              className={`w-full flex items-center justify-center gap-2 text-[10px] px-6 py-4 rounded-full mb-10 border transition-all ${
                locationLocked ? 'bg-green-50 text-green-600 border-green-100' : 
                isLocating ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-100'
              }`}
            >
              {isLocating ? <Radar className="w-4 h-4 animate-spin" /> : (locationLocked ? <CheckCircle2 className="w-4 h-4" /> : <MapPin className="w-4 h-4 text-blue-500" />)}
              <span className="font-black uppercase tracking-wider">{currentLocation}</span>
            </button>

            <div className="flex gap-6 w-full max-w-[300px] mx-auto">
              <button 
                disabled={todayStatus.hasClockIn || isLocating || isSubmitting}
                onClick={() => handleClock('CLOCK_IN')}
                className={`flex-1 aspect-square rounded-[36px] flex flex-col items-center justify-center gap-1 shadow-2xl transition-all active:scale-95 ${
                  todayStatus.hasClockIn ? 'bg-slate-100 text-slate-300 shadow-none' : 'bg-blue-600 text-white shadow-blue-200'
                }`}
              >
                {isSubmitting && !todayStatus.hasClockIn ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <div className="text-xl font-black">{todayStatus.hasClockIn ? '已入场' : '签到'}</div>
                    <div className="text-[9px] opacity-60 font-black uppercase">
                      {todayStatus.clockInTime || 'Start Work'}
                    </div>
                  </>
                )}
              </button>

              <button 
                disabled={todayStatus.hasClockOut || !todayStatus.hasClockIn || isLocating || isSubmitting}
                onClick={() => handleClock('CLOCK_OUT')}
                className={`flex-1 aspect-square rounded-[36px] flex flex-col items-center justify-center gap-1 shadow-2xl transition-all active:scale-95 border-2 ${
                  todayStatus.hasClockOut ? 'bg-slate-50 text-slate-200 border-transparent shadow-none' : 'bg-white border-slate-100 text-slate-900 shadow-slate-100'
                }`}
              >
                {isSubmitting && todayStatus.hasClockIn && !todayStatus.hasClockOut ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <div className="text-xl font-black">{todayStatus.hasClockOut ? '已离场' : '签退'}</div>
                    <div className="text-[9px] opacity-60 font-black uppercase">
                      {todayStatus.clockOutTime || 'End Work'}
                    </div>
                  </>
                )}
              </button>
            </div>
            
            {!todayStatus.hasClockIn && !isLocating && (
              <p className="mt-6 text-[9px] font-bold text-slate-400 animate-pulse">提示：请先锁定定位后点击签到</p>
            )}
          </div>
        </div>
      )}

      {isLeader && (
        <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
              <h3 className="text-2xl font-black flex items-center gap-3 mb-2">
                <ShieldCheck className="w-7 h-7 text-blue-500" /> 考勤实时监控
              </h3>
              <div className="grid grid-cols-2 gap-5 mt-6">
                <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">今日出勤人数</p>
                  <p className="text-4xl font-black text-white">{new Set(filteredRecords.map(a => a.userId)).size}</p>
                </div>
                <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">总计打卡次数</p>
                  <p className="text-4xl font-black text-blue-400">{filteredRecords.length}</p>
                </div>
              </div>
          </div>
        </div>
      )}

      <div className="pb-12">
        <div className="flex items-center gap-2 mb-6 px-1">
            <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">打卡流水</h3>
        </div>
        <div className="space-y-4">
          {filteredRecords.slice().map((rec) => (
            <div key={rec.id} className="bg-white p-6 rounded-[32px] border border-slate-50 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-4">
                <div className={`p-3.5 rounded-2xl ${rec.type === 'CLOCK_IN' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[13px] font-black text-slate-800">
                    {isLeader && <span className="text-blue-600 mr-2">{rec.userName}</span>}
                    {rec.type === 'CLOCK_IN' ? '入场签到' : '完工签退'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-tighter tabular-nums">{rec.time}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="text-[9px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Verified</div>
                {rec.location && (
                  <div className="text-[8px] text-slate-300 flex items-center gap-0.5">
                    <Navigation className="w-2 h-2" />
                    定位已存
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredRecords.length === 0 && (
            <div className="text-center py-20 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100">
              <p className="font-black text-slate-300 text-[10px] uppercase tracking-widest">今日尚无考勤流水</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceView;
