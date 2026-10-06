import React from 'react';
import { Staff, ScheduleAssignment, Leave, Holiday, WorkRulesSettings } from '../../types';
import { calculateMonthlyRecap, formatMonthYear } from '../../utils/dateUtils';
import { Calendar, CheckCircle2, Coffee, Clock, Target, TrendingUp, Users } from 'lucide-react';

interface WorkHoursSummaryProps {
  currentYear: number;
  currentMonth: number;
  staffList: Staff[];
  schedules: ScheduleAssignment[];
  leaves: Leave[];
  holidays: Holiday[];
  settings: WorkRulesSettings;
}

export const WorkHoursSummary: React.FC<WorkHoursSummaryProps> = ({
  currentYear,
  currentMonth,
  staffList,
  schedules,
  leaves,
  holidays,
  settings,
}) => {
  const recap = calculateMonthlyRecap(
    currentYear,
    currentMonth,
    staffList,
    schedules,
    leaves,
    holidays,
    settings
  );

  const isOvertimePositive = recap.overtimeHours >= 0;

  return (
    <div className="bg-slate-950/75 backdrop-blur-2xl border border-white/25 rounded-2xl p-5 shadow-2xl text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/15">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50" />
          <h3 className="font-black text-sm sm:text-base text-white tracking-wide font-mono uppercase drop-shadow-md">
            REKAP JAM KERJA · {formatMonthYear(currentYear, currentMonth)}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-200 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/60 font-medium">
          <Users className="w-3.5 h-3.5 text-sky-400" />
          <span>{recap.activeStaffCount} Personel Aktif</span>
        </div>
      </div>

      {/* Grid of Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Hari */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-300 mb-1">
            <span className="text-xs font-bold">Total Hari</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-white tabular-nums">
            {recap.totalDays}
            <span className="text-xs font-normal text-slate-400 ml-1">Hari</span>
          </div>
        </div>

        {/* Hari Efektif */}
        <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-emerald-300 mb-1">
            <span className="text-xs font-bold">Hari Efektif</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-emerald-300 tabular-nums drop-shadow-sm">
            {recap.effectiveDays}
            <span className="text-xs font-normal text-emerald-400/80 ml-1">Hari</span>
          </div>
        </div>

        {/* Libur */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-300 mb-1">
            <span className="text-xs font-bold">Rata2 Libur</span>
            <Coffee className="w-4 h-4 text-slate-400" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-white tabular-nums">
            {recap.totalLiburDays}
            <span className="text-xs font-normal text-slate-400 ml-1">Hari</span>
          </div>
        </div>

        {/* Cuti */}
        <div className="bg-rose-950/80 border border-rose-500/50 rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-rose-300 mb-1">
            <span className="text-xs font-bold">Rata2 Cuti</span>
            <span className="w-2 h-2 rounded bg-rose-400 shadow-sm" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-rose-300 tabular-nums drop-shadow-sm">
            {recap.totalCutiDays}
            <span className="text-xs font-normal text-rose-400/80 ml-1">Hari</span>
          </div>
        </div>

        {/* Target Jam */}
        <div className="bg-amber-950/80 border border-amber-500/50 rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-amber-300 mb-1">
            <span className="text-xs font-bold">Target Jam</span>
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-amber-300 tabular-nums drop-shadow-sm">
            {recap.targetHours}
            <span className="text-xs font-normal text-amber-400/80 ml-1">Jam</span>
          </div>
        </div>

        {/* Terjadwal */}
        <div className="bg-sky-950/80 border border-sky-500/50 rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-sky-300 mb-1">
            <span className="text-xs font-bold">Terjadwal</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-sky-300 tabular-nums drop-shadow-sm">
            {recap.scheduledHours}
            <span className="text-xs font-normal text-sky-400/80 ml-1">Jam</span>
          </div>
        </div>

        {/* Overtime */}
        <div
          className={`rounded-xl p-3 flex flex-col justify-between shadow-md ${
            isOvertimePositive
              ? 'bg-amber-950/80 border border-amber-500/50'
              : 'bg-slate-900/90 border border-slate-700/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-200 mb-1">
            <span className="text-xs font-bold text-amber-300">Overtime</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div
            className={`font-mono text-xl sm:text-2xl font-black tabular-nums drop-shadow-sm ${
              isOvertimePositive ? 'text-amber-300' : 'text-slate-200'
            }`}
          >
            {isOvertimePositive ? `+${recap.overtimeHours}` : recap.overtimeHours}
            <span className="text-xs font-normal text-slate-400 ml-1">Jam</span>
          </div>
        </div>
      </div>
    </div>
  );
};
