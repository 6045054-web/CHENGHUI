
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

export function exportToExcel(data: any[], fileName: string) {
  // Convert JSON to Worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Create Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");
  
  // Save File
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportToCSV(data: any[], fileName: string) {
  // Convert JSON to Worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Create Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");
  
  // Save as CSV file
  XLSX.writeFile(workbook, `${fileName}.csv`, { bookType: 'csv' });
}

export async function exportToImage(element: HTMLElement, fileName: string) {
  try {
    const canvas = await html2canvas(element, {
      scale: 2, // 提高清晰度
      useCORS: true, // 允许跨域图片渲染
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const image = canvas.toDataURL("image/png", 1.0);
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = image;
    link.click();
  } catch (error) {
    console.error("Export Image Error:", error);
    alert("图片导出失败，请重试");
  }
}

export function formatLedgerForExport(reports: any[]) {
  return reports.map(r => ({
    '日期': r.date,
    '类型': r.type,
    '编写人': r.authorName,
    '所属项目ID': r.projectId,
    '状态': r.status,
    '内容摘要': r.content.substring(0, 50) + (r.content.length > 50 ? '...' : ''),
    '审核意见': r.auditComment || '无'
  }));
}
