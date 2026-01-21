
export enum UserRole {
  ASSISTANT = 'ASSISTANT', // 监理员 (现场填报、日志、打卡)
  ENGINEER = 'ENGINEER',   // 监理工程师 (专业文书、记录)
  CHIEF = 'CHIEF',         // 总监理工程师 (审核、项目管理)
  LEADER = 'LEADER'        // 公司领导 (全景监控、AI预警)
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: UserRole;
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
}

export enum ReportType {
  DAILY_LOG = '监理日志',
  SIDE_STATION = '旁站记录',
  WITNESS = '见证记录',
  NOTICE = '监理通知单',
  MINUTES = '会议纪要',
  MONTHLY = '监理月报',
  MAJOR_EVENT = '重大事件直报',
  DANGEROUS_WORK = '危大工程巡视记录',
  CHIEF_INSPECTION = '总监巡视记录',
  EXPENSE_REIMBURSEMENT = '本月费用报销',
  SAFETY_INSPECTION = '安全监理巡视记录',
  SAFETY_LOG = '安全监理日志',
  JOINT_SAFETY_CHECK = '安全联合检查记录',
  SUPERVISION_RULES = '监理细则上报'
}

export enum ReportStatus {
  PENDING = '待审核',
  APPROVED = '已审核',
  REJECTED = '已驳回'
}

export interface Report {
  id: string;
  type: ReportType;
  projectId: string;
  authorId: string;
  authorName: string;
  content: string; 
  details: Record<string, any>; 
  date: string;
  status: ReportStatus;
  isImportant?: boolean;
  // Optional field to store audit feedback or rejection reasons
  auditComment?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  type: 'CLOCK_IN' | 'CLOCK_OUT';
  time: string;
  location: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  publishDate: string;
  author?: string;
  images?: string[];
}
