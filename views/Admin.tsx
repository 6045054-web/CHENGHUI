import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Project, User, UserRole, Announcement, AttendanceRecord, Report, ReportStatus, ReportType } from '../types';
import { 
  Building2, Users, Megaphone, Plus, Trash2, UserPlus, AlertTriangle, 
  CheckCircle2, ShieldCheck, UserCheck, Zap, MessageCircle, X, Send, 
  PieChart, Save, Loader2, Info, Activity, Database, ChevronRight, Edit3,
  MapPin, Camera, Key, User as UserIcon, Clock, Navigation, ChevronDown, ChevronUp
} from 'lucide-react';
import { dbService } from '../dbService';
import { summarizeSafetyHazards } from '../geminiService';

interface AdminProps {
  initialTab?: 'projects' | 'users' | 'ann' | 'attendance' | 'reports';
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  attendanceSummary: AttendanceRecord[];
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  onPublishAnnouncement: (ann: Announcement) => void;
  importantReports: Report[];
  onUpdateReport: (report: Report) => void;
}

const AdminView: React.FC<AdminProps> = ({ 
  initialTab = 'reports', 
  projects, setProjects, 
  users, setUsers, 
  attendanceSummary, 
  announcements, setAnnouncements, 
  onPublishAnnouncement, 
  importantReports,
  onUpdateReport
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'projects' | 'users' | 'ann' | 'attendance' | 'reports'>(initialTab);
  const [showModal, setShowModal] = useState<'project' | 'user' | 'ann' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // 考勤监控专用状态
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // 表单临时状态
  const [projectForm, setProjectForm] = useState<Partial<Project>>({ name: '', location: '', status: 'IN_PROGRESS' });
  const [userForm, setUserForm] = useState<Partial<User>>({ name: '', username: '', password: '', role: UserRole.ENGINEER, projectId: '' });
  const [annForm, setAnnForm] = useState<Partial<Announcement>>({ title: '', content: '', images: [] });
  
  const annFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    if (initialTab) setActiveSubTab(initialTab); 
  }, [initialTab]);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // 计算考勤汇总数据
  const attendanceByProject = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const stats: Record<string, { 
      projectName: string, 
      location: string,
      presentUsers: Set<string>, 
      records: AttendanceRecord[],
      totalAssigned: number 
    }> = {};

    // 初始化所有项目
    projects.forEach(p => {
      stats[p.id] = {
        projectName: p.name,
        location: p.location,
        presentUsers: new Set(),
        records: [],
        totalAssigned: users.filter(u => u.projectId === p.id).length
      };
    });

    // 填充打卡数据
    attendanceSummary.filter(a => a.time.startsWith(today)).forEach(a => {
      if (stats[a.projectId]) {
        stats[a.projectId].presentUsers.add(a.userId);
        stats[a.projectId].records.push(a);
      }
    });

    return Object.entries(stats).map(([id, data]) => ({
      id,
      ...data,
      count: data.presentUsers.size
    })).sort((a, b) => b.count - a.count);
  }, [projects, users, attendanceSummary]);

  // 保存项目
  const handleSaveProject = async () => {
    if (!projectForm.name || !projectForm.location) {
      alert("请完整填写项目名称和地理位置");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const isEdit = !!projectForm.id;
      const newProj = { ...projectForm, id: projectForm.id || `P${Date.now()}` } as Project;
      await dbService.saveProject(newProj);
      
      setProjects(prev => {
          if (isEdit) return prev.map(p => p.id === newProj.id ? newProj : p);
          return [newProj, ...prev];
      });
      
      showToast(isEdit ? "项目更新成功" : "项目创建成功");
      setShowModal(null);
    } catch (e) {
      alert("保存项目档案失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 保存人员
  const handleSaveUser = async () => {
    if (!userForm.name || !userForm.username || !userForm.password) {
      alert("请填写完整的人员姓名、工号和初始密码");
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = !!userForm.id;
      const newUser = { ...userForm, id: userForm.id || `U${Date.now()}` } as User;
      await dbService.saveUser(newUser);
      
      setUsers(prev => {
          if (isEdit) return prev.map(u => u.id === newUser.id ? newUser : u);
          return [newUser, ...prev];
      });
      
      showToast(isEdit ? "人员信息更新成功" : "人员录入成功");
      setShowModal(null);
    } catch (e) {
      alert("录入人员信息失败，请检查工号是否重复");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 发布公告
  const handleSaveAnn = async () => {
    if (!annForm.title || !annForm.content) {
      alert("请填写公告标题和正文内容");
      return;
    }

    setIsSubmitting(true);
    try {
      const newAnn = { 
          ...annForm, 
          id: `A${Date.now()}`, 
          publishDate: new Date().toISOString().split('T')[0],
          author: '管理总部'
      } as Announcement;
      
      await dbService.saveAnnouncement(newAnn);
      onPublishAnnouncement(newAnn);
      
      showToast("公告已全员同步发布");
      setShowModal(null);
    } catch (e) {
      alert("公告发布失败，请检查网络连接");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 删除公告
  const handleDeleteAnn = async (id: string) => {
    if (window.confirm('确定要永久删除这条公告吗？删除后不可恢复。')) {
      try {
        setIsSubmitting(true);
        await dbService.deleteAnnouncement(id);
        setAnnouncements(prev => prev.filter(ann => ann.id !== id));
        showToast("公告已撤回删除");
      } catch (error: any) {
        alert(`删除失败: ${error.message || '网络问题'}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleAnnPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnnForm(prev => ({
          ...prev,
          images: [...(prev.images || []), reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAnnPhoto = (index: number) => {
    setAnnForm(prev => ({
      ...prev,
      images: (prev.images || []).filter((_: any, i: number) => i !== index)
    }));
  };

  return (
    <div className="p-4 space-y-6 pb-24 animate-in fade-in relative">
      {/* 成功提示 Toast */}
      {successMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-black">{successMsg}</span>
        </div>
      )}

      {/* 顶部决策面板 */}
      <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black flex items-center gap-2 uppercase tracking-widest text-blue-400">
                < Zap className="w-5 h-5" /> 风险预警决策
              </h3>
              <button 
                onClick={async () => {
                    setIsSummarizing(true);
                    const result = await summarizeSafetyHazards(importantReports);
                    setAiSummary(result);
                    setIsSummarizing(false);
                }} 
                disabled={isSummarizing || importantReports.length === 0} 
                className="bg-blue-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-30 flex items-center gap-2 shadow-lg shadow-blue-500/40"
              >
                {isSummarizing ? <Loader2 className="animate-spin w-4 h-4" /> : <><Activity className="w-4 h-4" /> 深度研判</>}
              </button>
            </div>
            {aiSummary ? (
              <div className="bg-white/5 border border-white/10 p-5 rounded-3xl text-xs leading-relaxed font-medium text-slate-300 animate-in fade-in border-l-4 border-l-blue-500">
                {aiSummary}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-slate-500 bg-white/5 p-5 rounded-3xl border border-white/5">
                <Info className="w-5 h-5 text-blue-400" />
                <p className="text-[11px] font-bold">
                  {importantReports.length > 0 
                    ? `检测到 ${importantReports.length} 个项目部重大风险点需立即处理。` 
                    : '当前所有项目运行平稳，暂无重大安全预警。'}
                </p>
              </div>
            )}
        </div>
      </div>

      {/* 模块切换导航 */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 px-1">
        {[
          { id: 'reports', label: '待办审批', icon: CheckCircle2 },
          { id: 'projects', label: '项目档案', icon: Building2 },
          { id: 'users', label: '人员架构', icon: Users },
          { id: 'ann', label: '公告管理', icon: Megaphone },
          { id: 'attendance', label: '考勤监控', icon: PieChart },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 rounded-[24px] text-[11px] font-black transition-all shrink-0 ${
              activeSubTab === tab.id 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' 
                : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="space-y-4">
        {/* 1. 事项审批 */}
        {activeSubTab === 'reports' && (
          <div className="space-y-4">
            {importantReports.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200 opacity-40">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">所有重大事项已办结</p>
                </div>
            )}
            {importantReports.map(r => (
              <div key={r.id} className="bg-white p-6 rounded-[36px] border border-slate-50 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-inner">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-800">{r.type === ReportType.NOTICE ? '监理通知单' : (r.details?.eventCategory || '风险报告')}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{r.authorName} · {r.date}</p>
                    </div>
                  </div>
                  <span className="bg-red-600 text-white text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest">{r.details?.urgency || '特急'}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl italic">"{r.details?.noticeTitle || r.details?.eventDesc || r.content}"</p>
                <div className="flex gap-2">
                  <button onClick={() => onUpdateReport({ ...r, status: ReportStatus.APPROVED })} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">核准指令下达</button>
                  <button onClick={() => onUpdateReport({ ...r, status: ReportStatus.REJECTED, auditComment: '需补充现场照片和具体防范方案' })} className="px-6 bg-slate-100 text-slate-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95">驳回</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. 项目管理 */}
        {activeSubTab === 'projects' && (
          <div className="space-y-4">
            <button onClick={() => { setProjectForm({name: '', location: '', status: 'IN_PROGRESS'}); setShowModal('project'); }} className="w-full bg-blue-50 text-blue-600 py-5 rounded-[24px] border-2 border-dashed border-blue-200 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                <Plus className="w-5 h-5" /> 新增监理项目档案
            </button>
            {projects.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center justify-between group shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-800">{p.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setProjectForm(p); setShowModal('project'); }} className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={async () => { if(confirm('确定注销该项目档案？注销后相关台账将受限。')) { await dbService.deleteProject(p.id); setProjects(prev => prev.filter(it => it.id !== p.id)); } }} className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. 人员管理 */}
        {activeSubTab === 'users' && (
          <div className="space-y-4">
            <button onClick={() => { setUserForm({name:'', username:'', password:'', role: UserRole.ENGINEER, projectId:''}); setShowModal('user'); }} className="w-full bg-emerald-50 text-emerald-600 py-5 rounded-[24px] border-2 border-dashed border-emerald-200 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                <UserPlus className="w-5 h-5" /> 录入新监理人员
            </button>
            {users.map(u => (
              <div key={u.id} className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center justify-between group shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-800">{u.name} <span className="text-[8px] bg-slate-100 px-2 py-0.5 rounded text-slate-400 ml-1 uppercase">{u.role}</span></h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">账号: {u.username} · {projects.find(p=>p.id===u.projectId)?.name || '未分配项目'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setUserForm(u); setShowModal('user'); }} className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={async () => { if(confirm('确定注销此人员？注销后将无法登录系统。')) { await dbService.deleteUser(u.id); setUsers(prev => prev.filter(it => it.id !== u.id)); } }} className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. 考勤监控 (核心升级) */}
        {activeSubTab === 'attendance' && (
          <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">今日出勤总人数</p>
                      <p className="text-4xl font-black text-slate-900 tracking-tighter">
                        {new Set(attendanceSummary.filter(a => a.time.startsWith(new Date().toISOString().split('T')[0])).map(a => a.userId)).size}
                      </p>
                  </div>
                  <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">受监项目总数</p>
                      <p className="text-4xl font-black text-blue-600 tracking-tighter">{projects.length}</p>
                  </div>
              </div>

              <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 px-1">
                      <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                      <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">指派项目考勤概览</h3>
                  </div>
                  
                  {attendanceByProject.map(stat => (
                    <div key={stat.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                        <div 
                          onClick={() => setExpandedProjectId(expandedProjectId === stat.id ? null : stat.id)}
                          className="p-6 flex items-center justify-between active:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${stat.count > 0 ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-300'}`}>
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-800">{stat.projectName}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                            <Users className="w-3 h-3" /> 出勤: {stat.count}/{stat.totalAssigned}
                                        </p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> 流水: {stat.records.length}条
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {stat.count > 0 && (
                                    <div className="flex -space-x-2">
                                        {[...stat.presentUsers].slice(0, 3).map((uid, i) => (
                                            <div key={uid} className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-blue-600">
                                                {users.find(u => u.id === uid)?.name?.charAt(0) || '?'}
                                            </div>
                                        ))}
                                        {stat.presentUsers.size > 3 && (
                                            <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
                                                +{stat.presentUsers.size - 3}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {expandedProjectId === stat.id ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                            </div>
                        </div>

                        {/* 进度条指示器 */}
                        <div className="h-1 bg-slate-50 w-full relative">
                            <div 
                                className={`h-full transition-all duration-1000 ${stat.count === stat.totalAssigned && stat.totalAssigned > 0 ? 'bg-green-500' : 'bg-blue-500'}`} 
                                style={{ width: `${stat.totalAssigned > 0 ? (stat.count / stat.totalAssigned) * 100 : 0}%` }}
                            ></div>
                        </div>

                        {/* 明细展开区域 */}
                        {expandedProjectId === stat.id && (
                            <div className="bg-slate-50/50 p-6 space-y-3 border-t border-slate-50 animate-in slide-in-from-top-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">项目实时打卡明细</p>
                                {stat.records.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase">今日暂无人员到场</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* 按人员分组显示每个人的最新状态 */}
                                        {Array.from(stat.presentUsers).map(uid => {
                                            const userRecords = stat.records.filter(r => r.userId === uid).sort((a,b) => b.time.localeCompare(a.time));
                                            const latest = userRecords[0];
                                            const first = userRecords[userRecords.length - 1];
                                            return (
                                                <div key={uid} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white text-[10px] font-black">
                                                            {latest.userName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h5 className="text-[11px] font-black text-slate-800">{latest.userName}</h5>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${latest.type === 'CLOCK_IN' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                                    {latest.type === 'CLOCK_IN' ? '场内' : '已完工'}
                                                                </span>
                                                                <span className="text-[8px] text-slate-400 font-bold">{latest.time.split(' ')[1]}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-1 text-[8px] text-slate-400 font-bold justify-end">
                                                            <Navigation className="w-2.5 h-2.5" /> {latest.location.split(':')[1]?.substring(0, 15)}...
                                                        </div>
                                                        <div className="text-[8px] text-blue-500 font-black uppercase mt-1">
                                                            首签: {first.time.split(' ')[1]}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                  ))}
              </div>
          </div>
        )}

        {/* 5. 公告管理 */}
        {activeSubTab === 'ann' && (
          <div className="space-y-4">
               <button onClick={() => { setAnnForm({title: '', content: '', images: []}); setShowModal('ann'); }} className="w-full bg-slate-900 text-white py-5 rounded-[24px] shadow-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                  <Megaphone className="w-5 h-5 text-blue-400" /> 发布全员通知
              </button>
              {announcements.map(ann => (
                <div key={ann.id} className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm animate-in fade-in group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 pr-4">
                      <h4 className="text-sm font-black text-slate-800 mb-1">{ann.title}</h4>
                      <div className="flex items-center gap-2 text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>{ann.publishDate}</span>
                        <span>•</span>
                        <span>{ann.author || '管理总部'}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteAnn(ann.id)}
                      disabled={isSubmitting}
                      className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 active:scale-90 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl mb-4">{ann.content}</p>
                  {ann.images && ann.images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {ann.images.map((img, i) => (
                           <img key={i} src={img} className="w-20 h-20 object-cover rounded-2xl border border-slate-100 shadow-sm shrink-0" alt="ann-preview" />
                        ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 项目弹窗 */}
      {showModal === 'project' && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-sm rounded-t-[48px] sm:rounded-[48px] p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom-20">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Building2 className="w-5 h-5" /></div>
                   <h3 className="text-xl font-black text-slate-800">项目档案</h3>
                </div>
                <button onClick={() => setShowModal(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">项目全称</label>
                  <input value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} placeholder="如：成汇数字监理中心" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-blue-100 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">地理位置</label>
                  <input value={projectForm.location} onChange={e => setProjectForm({...projectForm, location: e.target.value})} placeholder="输入项目具体地址" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-blue-100 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">项目状态</label>
                  <select value={projectForm.status} onChange={e => setProjectForm({...projectForm, status: e.target.value as any})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none">
                    <option value="IN_PROGRESS">正在施工</option>
                    <option value="COMPLETED">已竣工</option>
                  </select>
                </div>
              </div>
              <button onClick={handleSaveProject} disabled={isSubmitting} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 确认保存档案
              </button>
           </div>
        </div>
      )}

      {/* 人员弹窗 */}
      {showModal === 'user' && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-sm rounded-t-[48px] sm:rounded-[48px] p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom-20 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><UserCheck className="w-5 h-5" /></div>
                   <h3 className="text-xl font-black text-slate-800">人员档案</h3>
                </div>
                <button onClick={() => setShowModal(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">真实姓名</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} placeholder="请输入人员姓名" className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">登录工号 (Work ID)</label>
                  <input value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} placeholder="输入登录工号，一旦设定不可更改" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none" disabled={!!userForm.id} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">初始密码</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} placeholder="默认 123456" className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">职能角色</label>
                  <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none">
                    <option value={UserRole.ASSISTANT}>监理员 (现场填报)</option>
                    <option value={UserRole.ENGINEER}>专业监理工程师 (专监)</option>
                    <option value={UserRole.CHIEF}>总监理工程师 (总监)</option>
                    <option value={UserRole.LEADER}>公司领导 (决策层)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">派驻项目</label>
                  <select value={userForm.projectId} onChange={e => setUserForm({...userForm, projectId: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none">
                    <option value="">待分配 / 总部直属</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleSaveUser} disabled={isSubmitting} className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 保存录入信息
              </button>
           </div>
        </div>
      )}

      {/* 公告弹窗 */}
      {showModal === 'ann' && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-sm rounded-t-[48px] sm:rounded-[48px] p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom-20 flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-slate-900 text-blue-400 rounded-2xl"><Megaphone className="w-5 h-5" /></div>
                   <h3 className="text-xl font-black text-slate-800">发布通知</h3>
                </div>
                <button onClick={() => setShowModal(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 hide-scrollbar">
                <input value={annForm.title} onChange={e => setAnnForm({...annForm, title: e.target.value})} placeholder="请输入公告标题" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-blue-100" />
                <textarea value={annForm.content} onChange={e => setAnnForm({...annForm, content: e.target.value})} placeholder="在此输入通知详细内容正文..." className="w-full h-40 p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none resize-none border border-transparent focus:border-blue-100" />
                
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">添加配图 (选填)</label>
                    <div className="grid grid-cols-3 gap-3">
                        {annForm.images?.map((img: string, idx: number) => (
                            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                <img src={img} className="w-full h-full object-cover" alt="ann-upload" />
                                <button onClick={() => removeAnnPhoto(idx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-lg"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        ))}
                        <button onClick={() => annFileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:bg-slate-50 transition-all">
                            < Camera className="w-5 h-5" />
                            <span className="text-[8px] font-bold">加图</span>
                        </button>
                        <input type="file" ref={annFileInputRef} onChange={handleAnnPhotoUpload} accept="image/*" multiple className="hidden" />
                    </div>
                </div>
              </div>
              <button onClick={handleSaveAnn} disabled={isSubmitting} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-blue-400" />} 立即全员同步发布
              </button>
           </div>
        </div>
      )}

      <div className="text-center py-6 opacity-20 flex flex-col items-center gap-1">
          <Database className="w-4 h-4" />
          <p className="text-[8px] font-black uppercase tracking-[4px]">Xinjiang Chenghui Data Hub</p>
      </div>
    </div>
  );
};

export default AdminView;