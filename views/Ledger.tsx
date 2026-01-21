
import React, { useState } from 'react';
import { Report, User, UserRole, ReportStatus, Project } from '../types';
import { Download, Search, Filter, ChevronRight, FileSpreadsheet, Printer, Eye, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { REPORT_ICONS } from '../constants';
import { exportToExcel, exportToCSV, formatLedgerForExport, exportToImage } from '../exportUtils';
import { ReportPrintTemplate } from '../components/ReportPrintTemplate';

interface LedgerProps {
  reports: Report[];
  projects: Project[];
  user: User;
}

const LedgerView: React.FC<LedgerProps> = ({ reports, projects, user }) => {
  const [printingReport, setPrintingReport] = useState<Report | null>(null);
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const [isExportingImage, setIsExportingImage] = useState(false);

  const handleExportExcel = () => {
    const data = formatLedgerForExport(reports);
    exportToExcel(data, `监理台账_${user.name}_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportCSV = () => {
    const data = formatLedgerForExport(reports);
    exportToCSV(data, `监理台账_${user.name}_${new Date().toISOString().split('T')[0]}`);
  };

  const handlePrintAction = (report: Report) => {
    setPrintingReport(report);
    setTimeout(() => {
      window.print();
      setPrintingReport(null);
    }, 500);
  };

  const openPreview = (report: Report) => {
    setPreviewReport(report);
  };

  const handleImageExport = async (report: Report) => {
    const element = document.getElementById(`report-print-area-${report.id}`);
    if (!element) return;
    
    setIsExportingImage(true);
    await exportToImage(element, `${report.type}_${report.date}_${report.authorName}`);
    setIsExportingImage(false);
  };

  const getProjectName = (id: string) => {
    return projects.find(p => p.id === id)?.name || id;
  };

  return (
    <div className="p-4 flex flex-col h-full space-y-4">
      {/* 打印专用的隐藏模版 */}
      {printingReport && (
        <ReportPrintTemplate 
          report={printingReport} 
          projectName={getProjectName(printingReport.projectId)} 
        />
      )}
      
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-xl font-black text-slate-800">监理台账</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="bg-slate-100 text-slate-600 px-4 py-2.5 rounded-2xl text-[10px] font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button 
            onClick={handleExportExcel}
            className="bg-green-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-green-100 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      <div className="relative shrink-0">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="搜索关键词、日期、编写人..." 
          className="w-full pl-12 pr-5 py-4 bg-white border border-slate-100 rounded-[20px] shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-300">
            <FileSpreadsheet className="w-20 h-20 mb-4 opacity-10" />
            <p className="font-bold">尚无录入数据</p>
          </div>
        ) : (
          reports.map((report) => (
            <div 
              key={report.id} 
              onClick={() => openPreview(report)}
              className="bg-white p-5 rounded-[24px] border border-slate-50 shadow-sm flex items-center gap-4 hover:border-blue-100 transition-all cursor-pointer group active:scale-[0.98]"
            >
              <div className="p-3.5 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                {REPORT_ICONS[report.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-black text-slate-800">{report.type}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold ${
                    report.status === ReportStatus.APPROVED ? 'bg-green-100 text-green-600' :
                    report.status === ReportStatus.PENDING ? 'bg-orange-100 text-orange-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {report.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-bold flex items-center gap-2 uppercase">
                  <span>{report.authorName}</span>
                  <span className="text-slate-200">/</span>
                  <span>{report.date}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); openPreview(report); }}
                  className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-200 transition-all"
                  title="预览"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePrintAction(report); }}
                  className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  title="打印"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 预览模态框 */}
      {previewReport && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex items-center justify-center p-0 md:p-4 overflow-hidden">
          <div className="bg-white w-full max-w-5xl rounded-none md:rounded-[40px] shadow-2xl flex flex-col h-full md:h-[90vh] overflow-hidden">
             <div className="p-4 md:p-6 border-b flex justify-between items-center shrink-0 bg-slate-50">
                <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm md:text-base">
                  <Eye className="w-5 h-5 text-blue-600" /> 台账文书预览
                </h3>
                <div className="flex gap-2 md:gap-3">
                   <button 
                     onClick={() => handleImageExport(previewReport)}
                     disabled={isExportingImage}
                     className="bg-indigo-600 text-white px-4 md:px-6 py-2 rounded-full text-[10px] md:text-xs font-black shadow-lg shadow-indigo-200 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                   >
                     {isExportingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                     导出图片
                   </button>
                   <button 
                     onClick={() => handlePrintAction(previewReport)}
                     className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded-full text-[10px] md:text-xs font-black shadow-lg shadow-blue-200 active:scale-95"
                   >
                     立即打印
                   </button>
                   <button 
                     onClick={() => setPreviewReport(null)}
                     className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition-colors"
                   >
                     <X className="w-5 h-5 text-slate-500" />
                   </button>
                </div>
             </div>
             <div className="flex-1 overflow-auto bg-slate-200 p-4 md:p-8 flex justify-start md:justify-center">
                <div className="min-w-fit md:min-w-0">
                   <ReportPrintTemplate 
                    report={previewReport} 
                    projectName={getProjectName(previewReport.projectId)}
                    isPreview 
                    onClose={() => setPreviewReport(null)} 
                   />
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerView;
