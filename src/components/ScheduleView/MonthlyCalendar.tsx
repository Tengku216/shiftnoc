import React from 'react';
import { Staff, ScheduleAssignment, Leave, Holiday, WorkRulesSettings } from '../../types';
import { getMonthCalendarMatrix, formatMonthYear, deriveCellStatus, parseISODate } from '../../utils/dateUtils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';

interface MonthlyCalendarProps {
  currentYear: number;
  currentMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToday: () => void;
  staffList: Staff[];
  schedules: ScheduleAssignment[];
  leaves: Leave[];
  holidays: Holiday[];
  settings: WorkRulesSettings;
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
}

const WEEKDAY_NAMES = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  currentYear,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onJumpToday,
  staffList,
  schedules,
  leaves,
  holidays,
  settings,
  selectedDate,
  onSelectDate,
}) => {
  const activeStaff = staffList.filter(s => s.active);
  const matrix = getMonthCalendarMatrix(currentYear, currentMonth, holidays);

  return (
    <div className="bg-slate-950/75 backdrop-blur-2xl border border-white/25 rounded-2xl p-5 shadow-2xl flex flex-col h-full text-white">
      {/* Calendar Header with Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/15">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 shadow-sm">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase font-mono drop-shadow-md">
              {formatMonthYear(currentYear, currentMonth)}
            </h2>
            <p className="text-xs text-slate-300 font-medium">Jadwal Shift & Distribusi Piket</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onJumpToday}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-colors shadow-sm cursor-pointer"
          >
            Hari Ini
          </button>
          <div className="flex items-center rounded-lg bg-slate-900 border border-white/20 p-0.5 shadow-sm">
            <button
              onClick={onPrevMonth}
              className="p-1.5 rounded-md hover:bg-white/15 text-white transition-colors cursor-pointer"
              aria-label="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNextMonth}
              className="p-1.5 rounded-md hover:bg-white/15 text-white transition-colors cursor-pointer"
              aria-label="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekdays Header */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {WEEKDAY_NAMES.map((name, index) => {
          const isWeekend = index === 5 || index === 6;
          return (
            <div
              key={name}
              className={`text-center font-black text-[11px] sm:text-xs py-2 tracking-wider rounded-lg border shadow-xs ${
                isWeekend
                  ? 'text-rose-300 bg-rose-950/60 border-rose-500/30'
                  : 'text-slate-100 bg-slate-900/80 border-slate-700/60'
              }`}
            >
              {name}
            </div>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1 auto-rows-fr">
        {matrix.flat().map((cell, idx) => {
          const isSelected = selectedDate === cell.dateStr;

          // Count assignments for this day
          let pagiCount = 0;
          let soreCount = 0;
          let malamCount = 0;
          let smCount = 0;
          let shCount = 0;
          let cutiCount = 0;

          activeStaff.forEach(staff => {
            const statusInfo = deriveCellStatus(staff.id, cell.dateStr, schedules, leaves, holidays, settings.shifts);
            if (statusInfo.status === 'SM') smCount++;
            else if (statusInfo.status === 'SH') shCount++;
            else if (statusInfo.status === 'P') pagiCount++;
            else if (statusInfo.status === 'S') soreCount++;
            else if (statusInfo.status === 'M') malamCount++;
            else if (statusInfo.status === 'CUTI') cutiCount++;
          });

          return (
            <button
              key={`${cell.dateStr}-${idx}`}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`min-h-[72px] sm:min-h-[90px] p-1.5 sm:p-2 rounded-xl text-left transition-all duration-200 flex flex-col justify-between group relative border cursor-pointer ${
                cell.isCurrentMonth
                  ? 'bg-slate-900/85 hover:bg-slate-900 border-slate-700/80 shadow-md backdrop-blur-sm'
                  : 'bg-slate-950/60 opacity-40 hover:opacity-75 border-slate-800'
              } ${
                cell.isToday
                  ? 'ring-2 ring-amber-400 border-amber-300 bg-amber-950/70 shadow-lg shadow-amber-400/20'
                  : ''
              } ${
                isSelected
                  ? 'ring-2 ring-sky-300 border-sky-300 bg-sky-950/70'
                  : ''
              }`}
            >
              {/* Top Row: Date Number & Holiday/Today indicator */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`font-mono text-xs sm:text-sm font-black tabular-nums drop-shadow-sm ${
                    cell.isToday
                      ? 'text-amber-300'
                      : cell.holiday
                      ? 'text-rose-400'
                      : cell.isCurrentMonth
                      ? 'text-white'
                      : 'text-slate-400'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {cell.isToday && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 shadow-sm">
                    Hari Ini
                  </span>
                )}

                {cell.holiday && !cell.isToday && (
                  <span
                    className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"
                    title={cell.holiday.name}
                  />
                )}
              </div>

              {/* Middle / Holiday Name if exists */}
              {cell.holiday && (
                <div className="text-[10px] text-rose-200 truncate font-bold max-w-full my-0.5 bg-rose-950/80 px-1 py-0.5 rounded border border-rose-500/30">
                  {cell.holiday.name}
                </div>
              )}

              {/* Bottom: Shift Badge Pills (High Contrast Solid Badges) */}
              <div className="flex flex-wrap gap-1 mt-auto pt-1">
                {pagiCount > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-amber-500 text-slate-950 shadow-sm"
                    title={`${pagiCount} Pagi`}
                  >
                    {pagiCount}P
                  </span>
                )}
                {shCount > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-violet-600 text-white shadow-sm"
                    title={`${shCount} Setengah Hari (08.00-13.00)`}
                  >
                    {shCount}SH
                  </span>
                )}
                {soreCount > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-emerald-500 text-slate-950 shadow-sm"
                    title={`${soreCount} Sore`}
                  >
                    {soreCount}S
                  </span>
                )}
                {malamCount > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-sky-500 text-slate-950 shadow-sm"
                    title={`${malamCount} Malam`}
                  >
                    {malamCount}M
                  </span>
                )}
                {smCount > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-gradient-to-r from-emerald-500 to-sky-500 text-slate-950 shadow-sm"
                    title={`${smCount} Sore-Malam (SM)`}
                  >
                    {smCount}SM
                  </span>
                )}
                {cutiCount > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-rose-600 text-white shadow-sm"
                    title={`${cutiCount} Cuti`}
                  >
                    {cutiCount}C
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
