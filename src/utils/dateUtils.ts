import { ShiftConfig, ShiftType, ScheduleAssignment, Leave, Holiday, WorkRulesSettings, CellStatusInfo, Staff } from '../types';

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDO_DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Returns a Date object adjusted to Asia/Jakarta (WIB, UTC+7)
 */
export function getWIBNow(): Date {
  const now = new Date();
  // Compute UTC timestamp then add +7 hours
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 7));
}

export function formatWIBTime(date: Date, showSeconds = true): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return showSeconds ? `${h}:${m}:${s} WIB` : `${h}:${m} WIB`;
}

export function formatWIBFullDate(date: Date): string {
  const dayName = INDO_DAYS[date.getDay()];
  const day = date.getDate();
  const monthName = INDO_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
}

export function formatMonthYear(year: number, month: number): string {
  return `${INDO_MONTHS[month - 1]} ${year}`;
}

export function formatISODate(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function parseISODate(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m, day: d };
}

export interface DayColumnInfo {
  dateStr: string;
  dayNumber: number;
  dayNameShort: string; // e.g., 'Mo', 'Tu', 'We' or 'Sen', 'Sel'
  dayNameIndo: string;
  dayOfWeek: number;    // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  isWeekend: boolean;
  holiday?: Holiday;
}

export function getDaysInMonthInfo(year: number, month: number, holidays: Holiday[] = []): DayColumnInfo[] {
  const daysCount = new Date(year, month, 0).getDate();
  const list: DayColumnInfo[] = [];

  for (let day = 1; day <= daysCount; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const dateStr = formatISODate(year, month, day);
    const holiday = holidays.find(h => h.date === dateStr);

    list.push({
      dateStr,
      dayNumber: day,
      dayNameShort: INDO_DAYS_SHORT[dayOfWeek],
      dayNameIndo: INDO_DAYS[dayOfWeek],
      dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      holiday,
    });
  }

  return list;
}

/**
 * Calendar Grid matrix (Mon..Sun starting)
 */
export interface CalendarCell {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  holiday?: Holiday;
}

export function getMonthCalendarMatrix(year: number, month: number, holidays: Holiday[] = []): CalendarCell[][] {
  const wibToday = getWIBNow();
  const todayStr = formatISODate(wibToday.getFullYear(), wibToday.getMonth() + 1, wibToday.getDate());

  const firstDayOfMonth = new Date(year, month - 1, 1);
  const daysInCurrentMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  // Convert getDay (0=Sun, 1=Mon...6=Sat) to Monday-based index (0=Mon...6=Sun)
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset === -1) startOffset = 6;

  const cells: CalendarCell[] = [];

  // Previous month padding
  for (let i = startOffset - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const dateStr = formatISODate(prevYear, prevMonth, dayNum);
    const holiday = holidays.find(h => h.date === dateStr);

    cells.push({
      dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      holiday,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dateStr = formatISODate(year, month, day);
    const holiday = holidays.find(h => h.date === dateStr);

    cells.push({
      dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      holiday,
    });
  }

  // Next month padding to fill complete weeks (multiples of 7)
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const dateStr = formatISODate(nextYear, nextMonth, day);
    const holiday = holidays.find(h => h.date === dateStr);

    cells.push({
      dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      holiday,
    });
  }

  // Split into rows of 7
  const matrix: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    matrix.push(cells.slice(i, i + 7));
  }

  return matrix;
}

/**
 * Checks if a specific staff member is on leave on a given date
 */
export function getStaffLeaveOnDate(staffId: string, dateStr: string, leaves: Leave[]): Leave | undefined {
  return leaves.find(l => {
    if (l.staffId !== staffId) return false;
    return dateStr >= l.dateStart && dateStr <= l.dateEnd;
  });
}

/**
 * Derives visual shift status for a staff on a given date
 * RULES:
 * - Has Pagi only -> 'P'
 * - Has Sore only -> 'S'
 * - Has Malam only -> 'M'
 * - Has BOTH Sore AND Malam -> 'SM' (derived!)
 * - On Leave -> 'CUTI'
 * - No assignment & not on leave -> 'LIBUR'
 */
export function deriveCellStatus(
  staffId: string,
  dateStr: string,
  schedules: ScheduleAssignment[],
  leaves: Leave[],
  holidays: Holiday[],
  shiftConfigs: Record<ShiftType, ShiftConfig>
): CellStatusInfo {
  const staffAssignments = schedules.filter(s => s.staffId === staffId && s.date === dateStr);
  const leaveInfo = getStaffLeaveOnDate(staffId, dateStr, leaves);
  const isHoliday = holidays.find(h => h.date === dateStr);

  const hasPagi = staffAssignments.some(s => s.shiftId === 'pagi');
  const hasSore = staffAssignments.some(s => s.shiftId === 'sore');
  const hasMalam = staffAssignments.some(s => s.shiftId === 'malam');
  const hasSetengahHari = staffAssignments.some(s => s.shiftId === 'setengah_hari');

  let totalHours = 0;
  if (hasPagi) totalHours += shiftConfigs.pagi?.durationHours || 8;
  if (hasSore) totalHours += shiftConfigs.sore?.durationHours || 8;
  if (hasMalam) totalHours += shiftConfigs.malam?.durationHours || 8;
  if (hasSetengahHari) totalHours += shiftConfigs.setengah_hari?.durationHours || 5;

  let status: CellStatusInfo['status'] = 'LIBUR';

  if (leaveInfo) {
    status = 'CUTI';
  } else if (hasSore && hasMalam) {
    status = 'SM';
  } else if (hasSetengahHari) {
    status = 'SH';
  } else if (hasPagi) {
    status = 'P';
  } else if (hasSore) {
    status = 'S';
  } else if (hasMalam) {
    status = 'M';
  } else {
    status = 'LIBUR';
  }

  return {
    status,
    hasPagi,
    hasSore,
    hasMalam,
    hasSetengahHari,
    isLeave: !!leaveInfo,
    leaveInfo,
    isHoliday,
    totalHours,
  };
}

export interface MonthlyRecapSummary {
  totalDays: number;
  effectiveDays: number;
  totalLiburDays: number;
  totalCutiDays: number;
  targetHours: number;
  scheduledHours: number;
  overtimeHours: number;
  activeStaffCount: number;
}

export function calculateMonthlyRecap(
  year: number,
  month: number,
  staffList: Staff[],
  schedules: ScheduleAssignment[],
  leaves: Leave[],
  holidays: Holiday[],
  settings: WorkRulesSettings
): MonthlyRecapSummary {
  const daysInMonth = new Date(year, month, 0).getDate();
  const activeStaff = staffList.filter(s => s.active);
  const activeStaffCount = activeStaff.length || 1;

  let totalScheduledHours = 0;
  let totalCutiCount = 0;
  let totalLiburCount = 0;
  let holidaysInMonthCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatISODate(year, month, d);
    const isHoliday = holidays.some(h => h.date === dateStr);
    if (isHoliday) holidaysInMonthCount++;

    for (const staff of activeStaff) {
      const cell = deriveCellStatus(staff.id, dateStr, schedules, leaves, holidays, settings.shifts);
      totalScheduledHours += cell.totalHours;
      if (cell.status === 'CUTI') totalCutiCount++;
      if (cell.status === 'LIBUR') totalLiburCount++;
    }
  }

  // Work days calculation based on business days or target rules
  let regularWorkdays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    // Monday-Friday (5 days) or full month depending on settings
    if (settings.workDaysPerWeek === 5) {
      if (dayOfWeek !== 0 && dayOfWeek !== 6) regularWorkdays++;
    } else {
      regularWorkdays++;
    }
  }

  const effectiveDays = Math.max(0, regularWorkdays - holidaysInMonthCount);
  const targetPerPerson = settings.targetHoursPerMonth || (effectiveDays * 8);
  const totalTargetHours = targetPerPerson * activeStaffCount;
  const overtimeHours = totalScheduledHours - totalTargetHours;

  return {
    totalDays: daysInMonth,
    effectiveDays,
    totalLiburDays: Math.round(totalLiburCount / activeStaffCount),
    totalCutiDays: Math.round(totalCutiCount / activeStaffCount),
    targetHours: totalTargetHours,
    scheduledHours: totalScheduledHours,
    overtimeHours,
    activeStaffCount,
  };
}

export interface StaffIndividualRecap {
  staffId: string;
  name: string;
  pagiCount: number;
  soreCount: number;
  malamCount: number;
  shCount: number;
  smCount: number;
  cutiCount: number;
  liburCount: number;
  totalShifts: number;
  totalHours: number;
  targetHours: number;
  overtimeHours: number;
}

export function calculateStaffMonthlyRecap(
  staff: Staff,
  year: number,
  month: number,
  schedules: ScheduleAssignment[],
  leaves: Leave[],
  holidays: Holiday[],
  settings: WorkRulesSettings
): StaffIndividualRecap {
  const daysInMonth = new Date(year, month, 0).getDate();
  let pagiCount = 0;
  let soreCount = 0;
  let malamCount = 0;
  let shCount = 0;
  let smCount = 0;
  let cutiCount = 0;
  let liburCount = 0;
  let totalHours = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatISODate(year, month, d);
    const cell = deriveCellStatus(staff.id, dateStr, schedules, leaves, holidays, settings.shifts);

    if (cell.status === 'SM') {
      smCount++;
    } else if (cell.status === 'SH') {
      shCount++;
    } else if (cell.status === 'P') {
      pagiCount++;
    } else if (cell.status === 'S') {
      soreCount++;
    } else if (cell.status === 'M') {
      malamCount++;
    } else if (cell.status === 'CUTI') {
      cutiCount++;
    } else {
      liburCount++;
    }

    totalHours += cell.totalHours;
  }

  const targetHours = settings.targetHoursPerMonth || 168;
  const overtimeHours = totalHours - targetHours;
  const totalShifts = pagiCount + soreCount + malamCount + shCount + (smCount * 2);

  return {
    staffId: staff.id,
    name: staff.name,
    pagiCount,
    soreCount,
    malamCount,
    shCount,
    smCount,
    cutiCount,
    liburCount,
    totalShifts,
    totalHours,
    targetHours,
    overtimeHours,
  };
}
