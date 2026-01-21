import React, { Fragment } from 'react';
import { Report, ReportType } from '../types';
import { ArrowLeft, FileText } from 'lucide-react';

interface PrintProps {
  report: Report;
  projectName?: string;
  isPreview?: boolean;
  onClose?: () => void;
}

export function ReportPrintTemplate({ report, projectName, isPreview = false, onClose }: PrintProps) {
  const d = report.details || {};
  const containerClass = isPreview 
    ? "relative p-4 md:p-14 bg-white shadow-2xl mx-auto w-full max-w-[210mm] min-h-[297mm] overflow-hidden" 
    : "print-only p-[20mm] bg-white text-black font-serif w-[210mm] min-h-[297mm] mx-auto text-sm";

  const parts = (report.date || '').split('-');
  const dateStr = `${parts[0] || '202X'}年${parts[1] || 'XX'}月${parts[2] || 'XX'}日`;

  const TableHeader = ({ title }: { title: string }) => (
    <div className="text-center mb-10">
      <h1 className="text-4xl font-bold tracking-[0.3em] mb-4">{title}</h1>
      <div className="flex justify-between items-center text-sm font-bold px-2">
        <div>项目名称：{projectName}</div>
        <div>日期：{dateStr}</div>
      </div>
    </div>
  );

  const tdLabel = "border border-black p-3 w-[120px] font-bold bg-slate-50 text-center";
  const tdContent = "border border-black p-3";

  function renderPhotos() {
    if (!d.images || d.images.length === 0) return null;
    return (
      <div className="mt-8 border-t-2 border-dashed border-slate-300 pt-6 break-inside-avoid">
        <div className="font-bold text-base mb-4 underline">附：现场影像资料记录</div>
        <div className="grid grid-cols-2 gap-4">
          {d.images.map((img: string, idx: number) => (
            <div key={idx} className="border border-slate-200 p-1">
              <img src={img} className="w-full h-[60mm] object-cover" alt="现场照片" />
              <p className="text-[10px] text-center mt-1">现场照片 {idx + 1}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderTableContent() {
    switch (report.type) {
      case ReportType.DAILY_LOG:
        return (
          <Fragment>
            <TableHeader title="监 理 日 志" />
            <table className="w-full border-collapse border-2 border-black">
              <tbody>
                <tr>
                  <td className={tdLabel}>天气/温度</td>
                  <td className={tdContent}>{d.weather || '--'} / {d.temp || '--'}</td>
                  <td className={tdLabel}>记录人</td>
                  <td className={tdContent}>{report.authorName}</td>
                </tr>
                <tr>
                  <td className="border border-black p-4 min-h-[400px] align-top" colSpan={4}>
                    <div className="font-bold underline mb-3">一、施工进展记录 (部位、人员、机具、进度)：</div>
                    <div className="pl-2 whitespace-pre-wrap leading-relaxed">{d.progress || '无'}</div>
                    <div className="mt-8 font-bold underline mb-3">二、监理工作记录 (巡视、验收、质量控制)：</div>
                    <div className="pl-2 whitespace-pre-wrap leading-relaxed">{d.supervision || '无'}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </Fragment>
        );

      case ReportType.SIDE_STATION:
        return (
          <Fragment>
            <TableHeader title="旁 站 监 理 记 录" />
            <table className="w-full border-collapse border-2 border-black">
              <tbody>
                <tr>
                  <td className={tdLabel}>旁站部位</td>
                  <td className={tdContent}>{d.keyPart}</td>
                  <td className={tdLabel}>施工单位</td>
                  <td className={tdContent}>{d.contractor}</td>
                </tr>
                <tr>
                  <td className={tdLabel}>开始时间</td>
                  <td className={tdContent}>{d.startTime || '--'}</td>
                  <td className={tdLabel}>结束时间</td>
                  <td className={tdContent}>{d.endTime || '--'}</td>
                </tr>
                <tr>
                  <td className="border border-black p-6 h-[600px] align-top" colSpan={4}>
                    <div className="font-bold underline mb-4">旁站过程详细记录及质量控制结果：</div>
                    <div className="pl-2 whitespace-pre-wrap leading-loose text-base">{d.processDetail}</div>
                  </td>
                </tr>
                <tr>
                  <td className={tdLabel}>旁站监理人员</td>
                  <td className={tdContent} colSpan={3}>{report.authorName}</td>
                </tr>
              </tbody>
            </table>
          </Fragment>
        );

      case ReportType.NOTICE:
        return (
          <Fragment>
            <TableHeader title="监 理 通 知 单" />
            <table className="w-full border-collapse border-2 border-black">
              <tbody>
                <tr>
                  <td className={tdLabel}>主送单位</td>
                  <td className={tdContent} colSpan={3}>{d.contractor}</td>
                </tr>
                <tr>
                  <td className={tdLabel}>事由</td>
                  <td className={tdContent} colSpan={3} font-bold>{d.noticeTitle}</td>
                </tr>
                <tr>
                  <td className="border border-black p-6 h-[700px] align-top" colSpan={4}>
                    <div className="font-bold underline mb-4">存在问题事实描述：</div>
                    <div className="pl-2 mb-10 whitespace-pre-wrap">{d.findings}</div>
                    <div className="mt-10 border-t-2 border-black pt-6">
                      <div className="font-bold underline text-blue-800 mb-4 italic">监理指令及整改要求：</div>
                      <div className="pl-2 leading-relaxed italic text-blue-900">{d.requirements}</div>
                    </div>
                  </td>
                </tr>
                <tr className="h-24">
                  <td className={tdLabel}>专业监理工程师</td>
                  <td className={tdContent}>{report.authorName}</td>
                  <td className={tdLabel}>签收人</td>
                  <td className={tdContent}></td>
                </tr>
              </tbody>
            </table>
          </Fragment>
        );

      case ReportType.SAFETY_INSPECTION:
        return (
          <Fragment>
            <TableHeader title="安全监理巡视记录表" />
            <table className="w-full border-collapse border-2 border-black">
              <tbody>
                <tr>
                  <td className={tdLabel}>检查部位</td>
                  <td className={tdContent} colSpan={3}>{d.focus}</td>
                </tr>
                <tr>
                  <td className="border border-black p-6 h-[500px] align-top" colSpan={4}>
                    <div className="font-bold underline text-red-700 mb-4">现场安全隐患情况：</div>
                    <div className="pl-2 mb-10 whitespace-pre-wrap">{d.findings}</div>
                    <div className="mt-10 border-t-2 border-black pt-6 bg-red-50/10">
                      <div className="font-bold underline text-red-900 mb-4">安全监理处置指令：</div>
                      <div className="pl-2 leading-relaxed text-red-800">{d.requirements}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={tdLabel}>巡视人</td>
                  <td className={tdContent}>{report.authorName}</td>
                  <td className={tdLabel}>复查情况</td>
                  <td className={tdContent}>待复查</td>
                </tr>
              </tbody>
            </table>
          </Fragment>
        );

      case ReportType.SUPERVISION_RULES:
        return (
          <Fragment>
            <TableHeader title="监理实施细则报审单" />
            <table className="w-full border-collapse border-2 border-black">
              <tbody>
                <tr>
                  <td className={tdLabel}>细则名称</td>
                  <td className={tdContent} colSpan={3} font-bold>{d.ruleTitle}</td>
                </tr>
                <tr>
                  <td className={tdLabel}>专业类别</td>
                  <td className={tdContent} colSpan={3}>{d.ruleCategory}</td>
                </tr>
                <tr>
                  <td className="border border-black p-6 h-[400px] align-top" colSpan={4}>
                    <div className="font-bold underline mb-4">编制摘要及说明：</div>
                    <div className="pl-2 whitespace-pre-wrap leading-relaxed">{d.description}</div>
                  </td>
                </tr>
                <tr>
                  <td className={tdLabel}>上报附件</td>
                  <td className={tdContent} colSpan={3}>
                    {d.files?.map((f:any, i:number) => (
                      <div key={i} className="flex items-center gap-1 text-xs">
                        <FileText className="w-3 h-3"/> {f.name}
                      </div>
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="mt-10 flex justify-between px-4">
              <span className="font-bold">编制人：{report.authorName}</span>
              <span className="font-bold">总监审批意见：__________________</span>
            </div>
          </Fragment>
        );

      case ReportType.MONTHLY:
        return (
          <Fragment>
             <div className="text-center mb-20">
               <h1 className="text-5xl font-black mb-4">监 理 月 报</h1>
               <div className="border-b-4 border-black w-24 mx-auto mb-6"></div>
               <h2 className="text-2xl font-bold">({d.reportMonth?.split('-')[0]}年{d.reportMonth?.split('-')[1]}月)</h2>
             </div>
             <div className="space-y-12 px-2">
                <div>
                   <h3 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-black mb-4">1. 工程进度情况总结</h3>
                   <div className="pl-6 leading-relaxed whitespace-pre-wrap">{d.progressSummary}</div>
                </div>
                <div>
                   <h3 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-black mb-4">2. 工程质量情况总结</h3>
                   <div className="pl-6 leading-relaxed whitespace-pre-wrap">{d.qualitySummary}</div>
                </div>
                <div>
                   <h3 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-black mb-4">3. 安全生产总结</h3>
                   <div className="pl-6 leading-relaxed whitespace-pre-wrap">{d.safetySummary}</div>
                </div>
                <div>
                   <h3 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-black mb-4">4. 下月监理计划</h3>
                   <div className="pl-6 leading-relaxed italic">{d.nextPlan}</div>
                </div>
             </div>
             <div className="mt-32 text-right pr-10 space-y-2">
               <p className="font-bold">项目监理部：__________________</p>
               <p className="font-bold">总监理工程师：__________________</p>
             </div>
          </Fragment>
        );

      case ReportType.EXPENSE_REIMBURSEMENT:
        return (
          <Fragment>
            <h1 className="text-4xl font-black text-center mb-16 tracking-widest">费用报销申请单</h1>
            <table className="w-full border-collapse border-2 border-black">
              <tbody>
                <tr>
                  <td className={tdLabel}>报销人</td>
                  <td className={tdContent}>{report.authorName}</td>
                  <td className={tdLabel}>报销类别</td>
                  <td className={tdContent}>{d.category}</td>
                </tr>
                <tr>
                  <td className={tdLabel}>金额(小写)</td>
                  <td className={tdContent} font-bold text-lg>¥ {Number(d.amount).toLocaleString()}</td>
                  <td className={tdLabel}>金额(大写)</td>
                  <td className={tdContent}>人民币：整</td>
                </tr>
                <tr>
                  <td className="border border-black p-8 h-[300px] align-top" colSpan={4}>
                    <div className="font-bold underline mb-4">报销事由及费用明细说明：</div>
                    <div className="pl-4 leading-relaxed">{d.reimbursementDesc}</div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="mt-16 grid grid-cols-3 gap-10 text-center font-bold">
              <div>部门审核：_________</div>
              <div>财务复核：_________</div>
              <div>总监批准：_________</div>
            </div>
          </Fragment>
        );

      case ReportType.MINUTES:
        return (
          <Fragment>
            <TableHeader title="会 议 纪 要" />
            <table className="w-full border-collapse border-2 border-black">
              <tbody>
                <tr>
                  <td className={tdLabel}>会议主题</td>
                  <td className={tdContent} colSpan={3}>{d.meetingTitle}</td>
                </tr>
                <tr>
                  <td className={tdLabel}>主持人</td>
                  <td className={tdContent}>{d.host}</td>
                  <td className={tdLabel}>记录人</td>
                  <td className={tdContent}>{d.recorder}</td>
                </tr>
                <tr>
                  <td className={tdLabel}>参加单位人员</td>
                  <td className={tdContent} colSpan={3}>{d.attendees}</td>
                </tr>
                <tr>
                  <td className="border border-black p-8 min-h-[500px] align-top" colSpan={4}>
                    <div className="font-bold underline mb-6">会议内容及形成的决议：</div>
                    <div className="pl-2 leading-loose text-base whitespace-pre-wrap">{d.minutesBody}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </Fragment>
        );

      case ReportType.MAJOR_EVENT:
        return (
          <Fragment>
            <div className="text-center mb-10 text-red-600">
              <h1 className="text-4xl font-black tracking-widest mb-4">重大事项直报单</h1>
              <div className="border-b-4 border-red-600 mb-2"></div>
              <div className="flex justify-between px-2 font-bold text-sm">
                <span>类型：{d.eventCategory}</span>
                <span>报告时间：{dateStr}</span>
              </div>
            </div>
            <table className="w-full border-collapse border-2 border-black">
              <tbody>
                <tr>
                  <td className="border border-black p-8 min-h-[400px] align-top" colSpan={4}>
                    <div className="font-bold underline text-red-700 mb-4">一、事件详细经过描述：</div>
                    <div className="pl-2 leading-relaxed">{d.eventDesc}</div>
                    <div className="mt-10 border-t-2 border-black pt-6">
                      <div className="font-bold underline mb-4">二、现场应急处置措施：</div>
                      <div className="pl-2 italic">{d.actionsTaken}</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="mt-10 text-right pr-4 font-bold">报告人：{report.authorName}</div>
          </Fragment>
        );

      case ReportType.DANGEROUS_WORK:
        return (
          <Fragment>
            <TableHeader title="危大工程专项巡视记录" />
            <table className="w-full border-collapse border-2 border-black">
              <tbody>
                <tr>
                  <td className={tdLabel}>部位名称</td>
                  <td className={tdContent}>{d.partName}</td>
                  <td className={tdLabel}>风险等级</td>
                  <td className={tdContent} text-red-600 font-bold>{d.hazardLevel}</td>
                </tr>
                <tr>
                  <td className="border border-black p-8 h-[500px] align-top" colSpan={4}>
                    <div className="font-bold underline mb-4">专项巡视主要内容及发现问题：</div>
                    <div className="pl-2 leading-relaxed">{d.findings}</div>
                    <div className="mt-10 border-t-2 border-black pt-6">
                      <div className="font-bold underline mb-4">监理监控意见：</div>
                      <div className="pl-2 italic">{d.actions}</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </Fragment>
        );

      default:
        return (
          <div className="p-10 border-2 border-black min-h-[500px]">
            <h1 className="text-3xl font-bold mb-8 text-center">{report.type}</h1>
            <div className="font-bold border-b-2 border-black mb-6 pb-2">日期：{dateStr} / 填报人：{report.authorName}</div>
            <div className="whitespace-pre-wrap leading-loose text-base">{report.content || '无详细记录'}</div>
          </div>
        );
    }
  }

  return (
    <div className={containerClass} id={`report-print-area-${report.id}`}>
      {isPreview && onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 bg-slate-800 text-white p-2 rounded-full flex items-center gap-2 px-4 shadow-lg no-print hover:bg-slate-700">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-bold">返回填报</span>
        </button>
      )}
      {renderTableContent()}
      {renderPhotos()}
      <div className="mt-20 text-[10px] text-slate-400 text-center italic border-t pt-4 no-print">
        * 本电子文书由成汇数字监理平台加密生成，具有云端存证效力 *
      </div>
    </div>
  );
}
