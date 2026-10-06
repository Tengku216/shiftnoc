export type ShiftType = 'pagi' | 'sore' | 'malam' | 'setengah_hari';

export interface ShiftConfig {
  id: ShiftType;
  name: string;
  code: 'P' | 'S' | 'M' | 'SH';
  color: string;
  startTime: string; // e.g., "08:00"
  endTime: string;   // e.g., "13:00"
  durationHours: number; // e.g., 5
}

export interface Staff {
  id: string;
  name: string;
  active: boolean;
  order: number;
  role?: string;
  phone?: string;
}

export interface ScheduleAssignment {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  shiftId: ShiftType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Leave {
  id: string;
  staffId: string;
  dateStart: string; // YYYY-MM-DD
  dateEnd: string;   // YYYY-MM-DD
  type: 'Tahunan' | 'Sakit' | 'Izin' | 'Cuti Bersama' | 'Lainnya';
  notes?: string;
}

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  type: 'Nasional' | 'Regional' | 'Cuti Bersama';
  region?: string; // e.g., "Jawa Barat" or "Nasional"
}

export type DynamicBgTheme = 'auto' | 'noc_day' | 'noc_night' | 'weekend_day' | 'weekend_night' | 'none';

export interface WorkRulesSettings {
  timezone: string; // "Asia/Jakarta"
  region: string;   // "Jawa Barat"
  targetHoursPerMonth: number; // e.g., 168
  workDaysPerWeek: number;     // e.g., 5 or NOC custom
  autoCalculateOvertime: boolean;
  shifts: Record<ShiftType, ShiftConfig>;
  backgroundTheme: DynamicBgTheme;
  bgDarkOverlay: number; // 0 to 100 percentage
  bgBlur: number;        // 0 to 20 px
}

export type VisualShiftStatus = 'P' | 'S' | 'M' | 'SM' | 'SH' | 'CUTI' | 'LIBUR';

export interface CellStatusInfo {
  status: VisualShiftStatus;
  hasPagi: boolean;
  hasSore: boolean;
  hasMalam: boolean;
  hasSetengahHari: boolean;
  isLeave: boolean;
  leaveInfo?: Leave;
  isHoliday?: Holiday;
  totalHours: number;
}

export interface DelegationLog {
  id: string;
  title: string;
  content: string;
  authorName: string;
  assignedTo?: string;
  priority: 'normal' | 'important' | 'urgent';
  status: 'pending' | 'in_progress' | 'done';
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
  createdAt: string;
}

export type ActiveInputMode = 'pagi' | 'sore' | 'malam' | 'setengah_hari' | 'sore_malam' | 'cuti' | 'libur';

export type NavTab = 'jadwal' | 'editor' | 'pengaturan';
