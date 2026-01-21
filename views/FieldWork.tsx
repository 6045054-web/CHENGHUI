
import React, { useState, useRef } from 'react';
import { User, UserRole, Report, ReportType, ReportStatus, Project } from '../types';
import { REPORT_ICONS } from '../constants';
// Add FileText to imports from lucide-react
import { X, Loader2, Camera, Check, Eye, Sparkles, Send, Trash2, AlertCircle, FileUp, FileText } from 'lucide-react';
import { generateReportDraft } from '../geminiService';
import { ReportPrintTemplate } from '../components/ReportPrintTemplate';

interface FieldWorkProps {
  user: User;
  projects: Project[];
  reports: Report[];
  onAddReport: (r: Report) => void;
  onUpdateReport: (r: Report) => void;
}

export default function FieldWorkView({ user, projects, reports, onAddReport, onUpdateReport }: FieldWorkProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [editingType, setEditingType] = useState<ReportType | null>(null);
  const [details, setDetails] = useState<Record<string, any>>({ images: [], files: [] });
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [tab, setTab] = useState<'write' | 'review'>(user.role === UserRole.CHIEF ? 'review' : 'write');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const canWrite = (type: ReportType) => {
    // 监理员权限：仅限基础日志和记录
    if (user.role === UserRole.ASSISTANT) {
      return [
        ReportType.DAILY_LOG, 
        ReportType.SAFETY_LOG, 
        ReportType.SAFETY_INSPECTION, 
        ReportType.SIDE_STATION, 
        ReportType.WITNESS
      ].includes(type);
    }
    // 专业监理工程师权限：取消费用报销和总监巡视记录功能
    if (user.role === UserRole.ENGINEER) {
      return type !== ReportType.EXPENSE_REIMBURSEMENT && type !== ReportType.CHIEF_INSPECTION;
    }
    // 总监理工程师权限：取消监理细则上报功能（由专监编制，总监审核）
    if (user.role === UserRole.CHIEF) {
      return type !== ReportType.SUPERVISION_RULES;
    }
    // 公司领导/系统管理员
    return true;
  };

  const handleAISuggest = async () => {
    if (!editingType) return;
    setIsGenerating(true);
    const keywords = JSON.stringify(details);
    const draft = await generateReportDraft(editingType, keywords || "根据现场实际情况填报");
    
    const typeFieldMap: Record<string, string> = {
        [ReportType.DAILY_LOG]: 'supervision',
        [ReportType.SAFETY_LOG]: 'briefing',
        [ReportType.SAFETY_INSPECTION]: 'findings',
        [ReportType.NOTICE]: 'requirements',
        [ReportType.SIDE_STATION]: 'processDetail',
        [ReportType.DANGEROUS_WORK]: 'findings',
        [ReportType.WITNESS]: 'witnessResult',
        [ReportType.CHIEF_INSPECTION]: 'evaluation',
        [ReportType.MAJOR_EVENT]: 'eventDesc',
        [ReportType.JOINT_SAFETY_CHECK]: 'rectification',
        [ReportType.MINUTES]: 'minutesBody',
        [ReportType.MONTHLY]: 'qualitySummary',
        [ReportType.SUPERVISION_RULES]: 'description',
        [ReportType.EXPENSE_REIMBURSEMENT]: 'reimbursementDesc'
    };

    const targetField = typeFieldMap[editingType];
    if (targetField) {
        setDetails(prev => ({ ...prev, [targetField]: draft }));
    } else {
        setContent(draft);
    }
    setIsGenerating(false);
  };

  const updateDetail = (key: string, value: any) => {
    setDetails(prev => ({ ...prev, [key]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDetails(prev => ({
          ...prev,
          images: [...(prev.images || []), reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDetails(prev => ({
          ...prev,
          files: [...(prev.files || []), { name: file.name, size: file.size, type: file.type, data: reader.result as string }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setDetails(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const removeFile = (index: number) => {
    setDetails(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  };

  const handleSubmit = () => {
    if (!editingType) return;
    onAddReport({
      id: `R${Date.now()}`,
      type: editingType,
      projectId: user.projectId || 'P001',
      authorId: user.id,
      authorName: user.name,
      content: content || details.description || details.progress || details.findings || '详见附件',
      details,
      date: new Date().toISOString().split('T')[0],
      status: ReportStatus.PENDING,
      isImportant: [ReportType.MAJOR_EVENT, ReportType.DANGEROUS_WORK, ReportType.NOTICE, ReportType.SUPERVISION_RULES].includes(editingType)
    });
    setShowEditor(false);
    setDetails({ images: [], files: [] });
    setContent('');
  };

  const renderDynamicForm = () => {
    const inputStyles = "w-full p-4 bg-slate-50 rounded-2xl text-sm border border-slate-100 outline-none focus:bg-white focus:border-blue-200 transition-all font-medium";
    const labelStyles = "text-[10px] font-black text-slate-400 ml-2 mb-1 uppercase tracking-wider block";

    switch (editingType) {
      case ReportType.DAILY_LOG:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className={labelStyles}>当日天气</label>
                 <input placeholder="如: 晴" className={inputStyles} value={details.weather || ''} onChange={e => updateDetail('weather', e.target.value)} />
               </div>
               <div>
                 <label className={labelStyles}>平均气温</label>
                 <input placeholder="如: 25℃" className={inputStyles} value={details.temp || ''} onChange={e => updateDetail('temp', e.target.value)} />
               </div>
            </div>
            <div>
              <label className={labelStyles}>今日施工进度记录 (部位、人员、机具)</label>
              <textarea placeholder="描述现场施工情况..." className={`${inputStyles} h-32`} value={details.progress || ''} onChange={e => updateDetail('progress', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>今日监理工作记录 (巡视、验收、签认)</label>
              <textarea placeholder="记录监理履职内容..." className={`${inputStyles} h-32`} value={details.supervision || ''} onChange={e => updateDetail('supervision', e.target.value)} />
            </div>
          </div>
        );
      case ReportType.SIDE_STATION:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className={labelStyles}>旁站关键部位</label>
                 <input placeholder="如: 基础砼浇筑" className={inputStyles} value={details.keyPart || ''} onChange={e => updateDetail('keyPart', e.target.value)} />
               </div>
               <div>
                 <label className={labelStyles}>施工单位</label>
                 <input placeholder="施工企业名称" className={inputStyles} value={details.contractor || ''} onChange={e => updateDetail('contractor', e.target.value)} />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className={labelStyles}>开始时间</label>
                 <input type="time" className={inputStyles} value={details.startTime || ''} onChange={e => updateDetail('startTime', e.target.value)} />
               </div>
               <div>
                 <label className={labelStyles}>结束时间</label>
                 <input type="time" className={inputStyles} value={details.endTime || ''} onChange={e => updateDetail('endTime', e.target.value)} />
               </div>
            </div>
            <div>
              <label className={labelStyles}>旁站过程及质量控制点详细记录</label>
              <textarea placeholder="记录施工工艺是否符合要求，质量控制是否到位..." className={`${inputStyles} h-40`} value={details.processDetail || ''} onChange={e => updateDetail('processDetail', e.target.value)} />
            </div>
          </div>
        );
      case ReportType.WITNESS:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className={labelStyles}>见证项目</label>
                 <input placeholder="如: 钢筋原材取样" className={inputStyles} value={details.witnessItem || ''} onChange={e => updateDetail('witnessItem', e.target.value)} />
               </div>
               <div>
                 <label className={labelStyles}>见证日期</label>
                 <input type="date" className={inputStyles} value={details.witnessDate || ''} onChange={e => updateDetail('witnessDate', e.target.value)} />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className={labelStyles}>部位/位置</label>
                 <input placeholder="具体施工段" className={inputStyles} value={details.part || ''} onChange={e => updateDetail('part', e.target.value)} />
               </div>
               <div>
                 <label className={labelStyles}>规格/数量</label>
                 <input placeholder="样品明细" className={inputStyles} value={details.spec || ''} onChange={e => updateDetail('spec', e.target.value)} />
               </div>
            </div>
            <div>
              <label className={labelStyles}>见证过程及初步结论</label>
              <textarea placeholder="记录取样、封识、送检过程..." className={`${inputStyles} h-32`} value={details.witnessResult || ''} onChange={e => updateDetail('witnessResult', e.target.value)} />
            </div>
          </div>
        );
      case ReportType.NOTICE:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelStyles}>通知单事由/标题</label>
              <input placeholder="简述通知内容" className={`${inputStyles} font-bold`} value={details.noticeTitle || ''} onChange={e => updateDetail('noticeTitle', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>施工单位(主送)</label>
              <input placeholder="接收单位名称" className={inputStyles} value={details.contractor || ''} onChange={e => updateDetail('contractor', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>存在问题事实描述</label>
              <textarea placeholder="详细记录现场违规或不规范事实..." className={`${inputStyles} h-32`} value={details.findings || ''} onChange={e => updateDetail('findings', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>监理指令及整改期限</label>
              <textarea placeholder="明确整改要求及复查时间..." className={`${inputStyles} h-32 bg-blue-50/50`} value={details.requirements || ''} onChange={e => updateDetail('requirements', e.target.value)} />
            </div>
          </div>
        );
      case ReportType.MINUTES:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelStyles}>会议名称/主题</label>
              <input placeholder="如: 第一次工地会议" className={`${inputStyles} font-bold`} value={details.meetingTitle || ''} onChange={e => updateDetail('meetingTitle', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className={labelStyles}>主持人</label>
                 <input className={inputStyles} value={details.host || ''} onChange={e => updateDetail('host', e.target.value)} />
               </div>
               <div>
                 <label className={labelStyles}>记录人</label>
                 <input className={inputStyles} value={details.recorder || ''} onChange={e => updateDetail('recorder', e.target.value)} />
               </div>
            </div>
            <div>
              <label className={labelStyles}>参加单位及人员</label>
              <textarea placeholder="建设、监理、设计、施工等单位人员..." className={`${inputStyles} h-20`} value={details.attendees || ''} onChange={e => updateDetail('attendees', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>会议内容及主要决议</label>
              <textarea placeholder="记录各方发言及最终达成的一致意见..." className={`${inputStyles} h-48`} value={details.minutesBody || ''} onChange={e => updateDetail('minutesBody', e.target.value)} />
            </div>
          </div>
        );
      case ReportType.MONTHLY:
        return (
          <div className="space-y-4">
            <div className="flex gap-4">
               <div className="flex-1">
                 <label className={labelStyles}>报告月份</label>
                 <input type="month" className={inputStyles} value={details.reportMonth || ''} onChange={e => updateDetail('reportMonth', e.target.value)} />
               </div>
            </div>
            <div>
              <label className={labelStyles}>工程进度情况总结</label>
              <textarea placeholder="对比计划进度与实际进度..." className={`${inputStyles} h-32`} value={details.progressSummary || ''} onChange={e => updateDetail('progressSummary', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>工程质量情况总结</label>
              <textarea placeholder="验收合格率、不合格项整改情况..." className={`${inputStyles} h-32`} value={details.qualitySummary || ''} onChange={e => updateDetail('qualitySummary', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>安全文明施工总结</label>
              <textarea placeholder="现场管理及安全隐患闭环情况..." className={`${inputStyles} h-32`} value={details.safetySummary || ''} onChange={e => updateDetail('safetySummary', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>下月监理工作计划</label>
              <textarea placeholder="重点预控事项及验收安排..." className={`${inputStyles} h-32 bg-blue-50/20`} value={details.nextPlan || ''} onChange={e => updateDetail('nextPlan', e.target.value)} />
            </div>
          </div>
        );
      case ReportType.SUPERVISION_RULES:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelStyles}>细则名称</label>
              <input placeholder="如: 幕墙工程监理实施细则" className={`${inputStyles} font-bold`} value={details.ruleTitle || ''} onChange={e => updateDetail('ruleTitle', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>专业分类</label>
              <select className={inputStyles} value={details.ruleCategory || '土建'} onChange={e => updateDetail('ruleCategory', e.target.value)}>
                <option value="土建">土建工程</option>
                <option value="安装">机电安装</option>
                <option value="安全">安全管理</option>
                <option value="交通">交通工程</option>
                <option value="市政">市政园林</option>
              </select>
            </div>
            <div>
              <label className={labelStyles}>编制摘要</label>
              <textarea placeholder="简述细则编制背景、针对性控制措施..." className={`${inputStyles} h-40`} value={details.description || ''} onChange={e => updateDetail('description', e.target.value)} />
            </div>
            <div className="space-y-2">
               <label className={labelStyles}>上传附件 (PDF/Word/图纸)</label>
               <div className="space-y-2">
                 {details.files?.map((f: any, idx: number) => (
                   <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 overflow-hidden">
                         <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                         <span className="text-[10px] font-bold text-slate-700 truncate">{f.name}</span>
                      </div>
                      <button onClick={() => removeFile(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                   </div>
                 ))}
                 <button onClick={() => docInputRef.current?.click()} className="w-full py-5 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 text-xs font-black hover:bg-white hover:border-blue-300 transition-all">
                   <FileUp className="w-5 h-5" /> 点击上传细则电子档
                 </button>
                 <input type="file" ref={docInputRef} onChange={handleDocUpload} className="hidden" />
               </div>
            </div>
          </div>
        );
      case ReportType.EXPENSE_REIMBURSEMENT:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className={labelStyles}>费用类型</label>
                 <select className={inputStyles} value={details.category || '差旅费'} onChange={e => updateDetail('category', e.target.value)}>
                    <option value="差旅费">差旅费</option>
                    <option value="办公费">办公费</option>
                    <option value="通讯费">通讯费</option>
                    <option value="招待费">招待费</option>
                    <option value="交通费">交通费</option>
                 </select>
               </div>
               <div>
                 <label className={labelStyles}>报销金额 (元)</label>
                 <input type="number" placeholder="0.00" className={`${inputStyles} font-black text-lg`} value={details.amount || ''} onChange={e => updateDetail('amount', e.target.value)} />
               </div>
            </div>
            <div>
              <label className={labelStyles}>事由描述</label>
              <textarea placeholder="详细说明支出原因、参与人员等..." className={`${inputStyles} h-40`} value={details.reimbursementDesc || ''} onChange={e => updateDetail('reimbursementDesc', e.target.value)} />
            </div>
          </div>
        );
      case ReportType.SAFETY_INSPECTION:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelStyles}>检查重点/部位</label>
              <input placeholder="如: 脚手架搭设检查" className={inputStyles} value={details.focus || ''} onChange={e => updateDetail('focus', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>发现安全隐患</label>
              <textarea placeholder="如: 扫地杆漏设、连墙件不足等..." className={`${inputStyles} h-32`} value={details.findings || ''} onChange={e => updateDetail('findings', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>现场处置指令</label>
              <textarea placeholder="如: 立即停工整改、加固等..." className={`${inputStyles} h-32 bg-orange-50/30 border-orange-100`} value={details.requirements || ''} onChange={e => updateDetail('requirements', e.target.value)} />
            </div>
          </div>
        );
      case ReportType.SAFETY_LOG:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className={labelStyles}>当日天气</label>
                 <input className={inputStyles} value={details.weather || ''} onChange={e => updateDetail('weather', e.target.value)} />
               </div>
               <div>
                 <label className={labelStyles}>安全状态评价</label>
                 <select className={inputStyles} value={details.safetyStatus || '受控'} onChange={e => updateDetail('safetyStatus', e.target.value)}>
                    <option value="良好">安全：良好</option>
                    <option value="受控">安全：基本受控</option>
                    <option value="有隐患">安全：存在隐患</option>
                    <option value="危急">安全：危急</option>
                 </select>
               </div>
            </div>
            <div>
              <label className={labelStyles}>当日施工安全概况</label>
              <textarea className={`${inputStyles} h-32`} value={details.progress || ''} onChange={e => updateDetail('progress', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>安全工作及教育记录</label>
              <textarea placeholder="记录安全技术交底、人员教育、隐患排查等..." className={`${inputStyles} h-32`} value={details.briefing || ''} onChange={e => updateDetail('briefing', e.target.value)} />
            </div>
          </div>
        );
      case ReportType.JOINT_SAFETY_CHECK:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelStyles}>参加单位及人员</label>
              <textarea placeholder="列出各方参建单位及负责人..." className={`${inputStyles} h-20`} value={details.participants || ''} onChange={e => updateDetail('participants', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>整改截止期限</label>
              <input type="date" className={`${inputStyles} text-red-600 font-bold`} value={details.deadline || ''} onChange={e => updateDetail('deadline', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>检查发现的问题清单</label>
              <textarea placeholder="分条目列出安全违规事实..." className={`${inputStyles} h-40`} value={details.problemList || ''} onChange={e => updateDetail('problemList', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>整改要求及复查安排</label>
              <textarea className={`${inputStyles} h-32`} value={details.rectification || ''} onChange={e => updateDetail('rectification', e.target.value)} />
            </div>
          </div>
        );
      case ReportType.MAJOR_EVENT:
        return (
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-[10px] font-bold text-red-700">重大事件将直接抄送公司总部，请务必如实详细填报。</p>
            </div>
            <div>
              <label className={labelStyles}>事件类型</label>
              <select className={inputStyles} value={details.eventCategory || '安全事故'} onChange={e => updateDetail('eventCategory', e.target.value)}>
                <option value="安全事故">安全生产事故</option>
                <option value="质量事故">质量安全事故</option>
                <option value="突发公共卫生">突发卫生/火灾</option>
                <option value="自然灾害">极端天气/灾害</option>
                <option value="维稳事件">劳资纠纷/维稳</option>
              </select>
            </div>
            <div>
              <label className={labelStyles}>事件详细经过</label>
              <textarea placeholder="发生时间、地点、受损情况、已造成的影响..." className={`${inputStyles} h-48`} value={details.eventDesc || ''} onChange={e => updateDetail('eventDesc', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>已采取的紧急处置措施</label>
              <textarea className={`${inputStyles} h-32`} value={details.actionsTaken || ''} onChange={e => updateDetail('actionsTaken', e.target.value)} />
            </div>
          </div>
        );
      case ReportType.DANGEROUS_WORK:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className={labelStyles}>危大工程部位</label>
                 <input placeholder="如: 深基坑支护" className={inputStyles} value={details.partName || ''} onChange={e => updateDetail('partName', e.target.value)} />
               </div>
               <div>
                 <label className={labelStyles}>风险等级</label>
                 <select className={inputStyles} value={details.hazardLevel || '二级'} onChange={e => updateDetail('hazardLevel', e.target.value)}>
                   <option value="一级">一级(高风险)</option>
                   <option value="二级">二级(中高风险)</option>
                   <option value="三级">三级(一般风险)</option>
                 </select>
               </div>
            </div>
            <div>
              <label className={labelStyles}>专项巡视发现的主要问题</label>
              <textarea placeholder="对照专项方案，列出不符合项..." className={`${inputStyles} h-40`} value={details.findings || ''} onChange={e => updateDetail('findings', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>监理监控意见及指令</label>
              <textarea className={`${inputStyles} h-32`} value={details.actions || ''} onChange={e => updateDetail('actions', e.target.value)} />
            </div>
          </div>
        );
      case ReportType.CHIEF_INSPECTION:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelStyles}>巡视重点关注项</label>
              <input className={inputStyles} value={details.focus || ''} onChange={e => updateDetail('focus', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>对项目现场及监理部的评价</label>
              <textarea placeholder="总监对工程实体的评价，以及对监理部工作质量的点评..." className={`${inputStyles} h-40`} value={details.evaluation || ''} onChange={e => updateDetail('evaluation', e.target.value)} />
            </div>
            <div>
              <label className={labelStyles}>具体管理指令/下一步安排</label>
              <textarea className={`${inputStyles} h-32 bg-blue-50/20`} value={details.instructions || ''} onChange={e => updateDetail('instructions', e.target.value)} />
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <label className={labelStyles}>详细记录内容</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="在此输入通用记录内容..." className={`${inputStyles} h-64`} />
          </div>
        );
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex bg-slate-200/50 p-1.5 rounded-2xl">
        {(user.role === UserRole.CHIEF || user.role === UserRole.LEADER) && (
          <button onClick={() => setTab('review')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${tab === 'review' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>事项审核</button>
        )}
        <button onClick={() => setTab('write')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${tab === 'write' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>现场填报</button>
      </div>

      {tab === 'write' && (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in duration-300">
          {Object.values(ReportType).map(type => canWrite(type) && (
            <button key={type} onClick={() => { setEditingType(type); setDetails({ images: [], files: [] }); setContent(''); setPreviewMode(false); setShowEditor(true); }} className="bg-white p-6 rounded-[32px] border border-slate-100 flex flex-col items-center gap-3 active:scale-95 transition-all shadow-sm">
              <div className="p-4 bg-slate-50 rounded-2xl text-blue-600">{REPORT_ICONS[type]}</div>
              <span className="text-[11px] font-black text-slate-700 text-center leading-tight">{type}</span>
            </button>
          ))}
        </div>
      )}

      {tab === 'review' && (
        <div className="space-y-3">
          {reports.filter(r => r.status === ReportStatus.PENDING).map(r => (
            <div key={r.id} className="bg-white p-5 rounded-[24px] border border-slate-50 flex justify-between items-center group active:scale-[0.98] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">{REPORT_ICONS[r.type]}</div>
                <div>
                  <div className="text-sm font-black text-slate-800">{r.type}</div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase">{r.authorName} · {r.date}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setViewingReport(r)} className="p-3 bg-slate-100 text-slate-500 rounded-xl active:scale-90 transition-all"><Eye className="w-4 h-4" /></button>
                <button onClick={() => onUpdateReport({...r, status: ReportStatus.APPROVED})} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 active:scale-90 transition-all"><Check className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {reports.filter(r => r.status === ReportStatus.PENDING).length === 0 && (
            <div className="text-center py-20 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100">
              <p className="font-black text-slate-300 text-[10px] uppercase tracking-widest">暂无待审核事项</p>
            </div>
          )}
        </div>
      )}

      {showEditor && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 flex flex-col justify-end">
          <div className="bg-white w-full rounded-t-[48px] p-6 space-y-6 max-h-[96vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom-20 duration-300">
            <div className="flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">{editingType && REPORT_ICONS[editingType]}</div>
                 <div>
                   <h3 className="text-lg font-black text-slate-800">{editingType}</h3>
                   <p className="text-[9px] text-slate-400 font-bold uppercase">Supervision Document</p>
                 </div>
              </div>
              <button onClick={() => setShowEditor(false)} className="p-3 bg-slate-100 text-slate-500 rounded-full active:rotate-90 transition-transform"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl shrink-0">
               <button onClick={() => setPreviewMode(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${!previewMode ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>结构化填报</button>
               <button onClick={() => setPreviewMode(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${previewMode ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>A4 预览</button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 hide-scrollbar">
               {previewMode ? (
                 <div className="rounded-[32px] bg-slate-200 p-4 overflow-x-auto flex justify-center shadow-inner">
                    <div className="scale-[0.6] sm:scale-[0.8] origin-top md:scale-100">
                        <ReportPrintTemplate 
                          report={{
                            id: 'TEMP',
                            type: editingType!,
                            projectId: user.projectId || 'P001',
                            authorId: user.id,
                            authorName: user.name,
                            content: '',
                            details: details,
                            date: new Date().toISOString().split('T')[0],
                            status: ReportStatus.PENDING
                          }}
                          projectName={projects.find(p => p.id === user.projectId)?.name || '成汇数字监理项目'}
                          isPreview
                        />
                    </div>
                 </div>
               ) : (
                 <div className="space-y-6 pb-12 animate-in fade-in">
                    {renderDynamicForm()}
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">现场影像资料</label>
                       <div className="grid grid-cols-3 gap-3">
                          {details.images?.map((img: string, idx: number) => (
                             <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                <img src={img} className="w-full h-full object-cover" alt="upload" />
                                <button onClick={() => removePhoto(idx)} className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full shadow-lg"><Trash2 className="w-3 h-3" /></button>
                             </div>
                          ))}
                          <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:bg-slate-50 transition-all active:scale-95">
                             <Camera className="w-6 h-6" />
                             <span className="text-[8px] font-bold">拍摄照片</span>
                          </button>
                          <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" multiple className="hidden" />
                       </div>
                    </div>
                    <button onClick={handleAISuggest} disabled={isGenerating} className="w-full text-blue-600 bg-blue-50 px-4 py-4 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 border border-blue-100 shadow-lg shadow-blue-50 active:scale-95 transition-all">
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI 专家辅助润色内容
                    </button>
                 </div>
               )}
            </div>

            <div className="pt-4 pb-8 bg-white border-t border-slate-50 shrink-0">
              <button onClick={handleSubmit} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all">
                <Send className="w-4 h-4" /> 提交文书并签认
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingReport && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white w-full max-w-2xl h-[90vh] rounded-[48px] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">{REPORT_ICONS[viewingReport.type]}</div>
                    <h4 className="text-sm font-black text-slate-800">审核: {viewingReport.type}</h4>
                 </div>
                 <button onClick={() => setViewingReport(null)} className="p-3 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto bg-slate-100 p-4 flex justify-center shadow-inner">
                 <div className="scale-[0.55] sm:scale-[0.8] origin-top">
                    <ReportPrintTemplate report={viewingReport} projectName={projects.find(p => p.id === viewingReport.projectId)?.name} isPreview />
                 </div>
              </div>
              <div className="p-6 bg-white border-t border-slate-100 flex gap-4">
                  <button onClick={() => { onUpdateReport({...viewingReport, status: ReportStatus.REJECTED}); setViewingReport(null); }} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] active:scale-95 transition-all uppercase tracking-widest">退回修正</button>
                  <button onClick={() => { onUpdateReport({...viewingReport, status: ReportStatus.APPROVED}); setViewingReport(null); }} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] shadow-xl shadow-blue-200 active:scale-95 transition-all uppercase tracking-widest">签认通过</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
