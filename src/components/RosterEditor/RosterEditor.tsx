import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Staff,
  ScheduleAssignment,
  Leave,
  Holiday,
  WorkRulesSettings,
  ActiveInputMode,
  VisualShiftStatus,
  ShiftType,
} from '../../types';
import {
  getDaysInMonthInfo,
  formatMonthYear,
  formatISODate,
  deriveCellStatus,
  calculateStaffMonthlyRecap,
} from '../../utils/dateUtils';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Sparkles,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';

interface RosterEditorProps {
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
  onSaveSchedules: (newSchedules: ScheduleAssignment[]) => void;
  onSaveLeaves: (newLeaves: Leave[]) => void;
  onAddLeave: (leave: Omit<Leave, 'id'>) => void;
  onDeleteLeave: (id: string) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (val: boolean) => void;
}

export const RosterEditor: React.FC<RosterEditorProps> = ({
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
  onSaveSchedules,
  onSaveLeaves,
  hasUnsavedChanges,
  setHasUnsavedChanges,
}) => {
  const activeStaff = useMemo(() => staffList.filter(s => s.active), [staffList]);
  const daysInMonth = useMemo(
    () => getDaysInMonthInfo(currentYear, currentMonth, holidays),
    [currentYear, currentMonth, holidays]
  );

  // Local working copy of schedules for staging batch edits
  const [stagedSchedules, setStagedSchedules] = useState<ScheduleAssignment[]>(schedules);
  const [stagedLeaves, setStagedLeaves] = useState<Leave[]>(leaves);
  const [activeShiftMode, setActiveShiftMode] = useState<ActiveInputMode>('pagi');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Sync staged with parent schedules when year/month changes or when parent updates from outside
  useEffect(() => {
    setStagedSchedules(schedules);
    setStagedLeaves(leaves);
  }, [schedules, leaves, currentYear, currentMonth]);

  // Calculate number of unsaved modifications
  const unsavedCount = useMemo(() => {
    // Check differences in schedules
    const originalMap = new Map<string, string>();
    schedules.forEach(s => originalMap.set(`${s.staffId}_${s.date}_${s.shiftId}`, s.id));

    const stagedMap = new Map<string, string>();
    stagedSchedules.forEach(s => stagedMap.set(`${s.staffId}_${s.date}_${s.shiftId}`, s.id));

    let diff = 0;
    stagedMap.forEach((_, key) => {
      if (!originalMap.has(key)) diff++;
    });
    originalMap.forEach((_, key) => {
      if (!stagedMap.has(key)) diff++;
    });

    return diff;
  }, [schedules, stagedSchedules]);

  useEffect(() => {
    setHasUnsavedChanges(unsavedCount > 0);
  }, [unsavedCount, setHasUnsavedChanges]);

  // Handle Cell Click interaction
  const handleCellClick = useCallback(
    (staffId: string, dateStr: string) => {
      const cell = deriveCellStatus(staffId, dateStr, stagedSchedules, stagedLeaves, holidays, settings.shifts);

      if (activeShiftMode === 'cuti') {
        // Toggle Cuti
        if (cell.isLeave) {
          // Remove any leave covering this staff and date
          setStagedLeaves(prev =>
            prev.filter(l => !(l.staffId === staffId && dateStr >= l.dateStart && dateStr <= l.dateEnd))
          );
        } else {
          // Add single-day leave
          const newLeave: Leave = {
            id: `leave-temp-${Date.now()}-${Math.random()}`,
            staffId,
            dateStart: dateStr,
            dateEnd: dateStr,
            type: 'Tahunan',
            notes: 'Cuti via Roster Editor',
          };
          setStagedLeaves(prev => [...prev, newLeave]);
          // Also clear any shift assignments on this date
          setStagedSchedules(prev => prev.filter(s => !(s.staffId === staffId && s.date === dateStr)));
        }
        return;
      }

      // If cell currently has Cuti, clicking any shift/libur will clear the cuti on this date
      if (cell.isLeave) {
        setStagedLeaves(prev =>
          prev.filter(l => !(l.staffId === staffId && dateStr >= l.dateStart && dateStr <= l.dateEnd))
        );
      }

      const now = new Date().toISOString();

      if (activeShiftMode === 'libur') {
        // Clear all shifts for this staff on this date
        setStagedSchedules(prev => prev.filter(s => !(s.staffId === staffId && s.date === dateStr)));
        return;
      }

      if (activeShiftMode === 'sore_malam') {
        // Shortcut: Sore + Malam
        if (cell.hasSore && cell.hasMalam) {
          // Toggle off both -> becomes Libur
          setStagedSchedules(prev =>
            prev.filter(s => !(s.staffId === staffId && s.date === dateStr && (s.shiftId === 'sore' || s.shiftId === 'malam')))
          );
        } else {
          // Assign both Sore & Malam
          const withoutBoth = stagedSchedules.filter(
            s => !(s.staffId === staffId && s.date === dateStr && (s.shiftId === 'sore' || s.shiftId === 'malam'))
          );
          const newSore: ScheduleAssignment = {
            id: `sch-${Date.now()}-s-${Math.random()}`,
            staffId,
            date: dateStr,
            shiftId: 'sore',
            createdAt: now,
            updatedAt: now,
          };
          const newMalam: ScheduleAssignment = {
            id: `sch-${Date.now()}-m-${Math.random()}`,
            staffId,
            date: dateStr,
            shiftId: 'malam',
            createdAt: now,
            updatedAt: now,
          };
          setStagedSchedules([...withoutBoth, newSore, newMalam]);
        }
        return;
      }

      // Single Shift Mode (Pagi / Setengah Hari / Sore / Malam)
      const targetShift: ShiftType = activeShiftMode;
      const alreadyHasTarget = stagedSchedules.some(
        s => s.staffId === staffId && s.date === dateStr && s.shiftId === targetShift
      );

      if (alreadyHasTarget) {
        // Toggle OFF -> removes this shift
        setStagedSchedules(prev =>
          prev.filter(s => !(s.staffId === staffId && s.date === dateStr && s.shiftId === targetShift))
        );
      } else {
        // Toggle ON -> adds this shift
        const newAssignment: ScheduleAssignment = {
          id: `sch-${Date.now()}-${targetShift}-${Math.random()}`,
          staffId,
          date: dateStr,
          shiftId: targetShift,
          createdAt: now,
          updatedAt: now,
        };
        setStagedSchedules(prev => [...prev, newAssignment]);
      }
    },
    [activeShiftMode, stagedSchedules, stagedLeaves, holidays, settings.shifts]
  );

  // Batch Save Action
  const handleBatchSave = () => {
    onSaveSchedules(stagedSchedules);
    onSaveLeaves(stagedLeaves);
    setSaveToast('Jadwal berhasil disimpan ke database lokal!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Revert / Cancel Changes
  const handleRevert = () => {
    setStagedSchedules(schedules);
    setStagedLeaves(leaves);
    setSaveToast('Perubahan dibatalkan');
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Quick fill pattern helper for NOC 24/7 (P P L S S M M)
  const applyStandardNocPattern = () => {
    const pattern = ['P', 'P', 'L', 'S', 'S', 'M', 'M'];
    const newAss: ScheduleAssignment[] = stagedSchedules.filter(s => {
      const monthPrefix = formatISODate(currentYear, currentMonth, 1).slice(0, 7);
      return !s.date.startsWith(monthPrefix);
    });

    const now = new Date().toISOString();

    activeStaff.forEach((staff, staffIdx) => {
      daysInMonth.forEach((dayInfo, dayIdx) => {
        // Shift the pattern per staff for staggered coverage
        const code = pattern[(dayIdx + staffIdx * 2) % pattern.length];
        if (code === 'P') {
          newAss.push({
            id: `gen-${Date.now()}-${staff.id}-${dayInfo.dateStr}-p`,
            staffId: staff.id,
            date: dayInfo.dateStr,
            shiftId: 'pagi',
            createdAt: now,
            updatedAt: now,
          });
        } else if (code === 'S') {
          newAss.push({
            id: `gen-${Date.now()}-${staff.id}-${dayInfo.dateStr}-s`,
            staffId: staff.id,
            date: dayInfo.dateStr,
            shiftId: 'sore',
            createdAt: now,
            updatedAt: now,
          });
        } else if (code === 'M') {
          newAss.push({
            id: `gen-${Date.now()}-${staff.id}-${dayInfo.dateStr}-m`,
            staffId: staff.id,
            date: dayInfo.dateStr,
            shiftId: 'malam',
            createdAt: now,
            updatedAt: now,
          });
        }
      });
    });

    setStagedSchedules(newAss);
    setSaveToast('Pola rotasi 24/7 diterapkan pada bulan ini.');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const clearCurrentMonth = () => {
    const monthPrefix = formatISODate(currentYear, currentMonth, 1).slice(0, 7);
    setStagedSchedules(prev => prev.filter(s => !s.date.startsWith(monthPrefix)));
    setStagedLeaves(prev => prev.filter(l => !l.dateStart.startsWith(monthPrefix)));
    setSaveToast('Jadwal bulan ini telah dikosongkan.');
    setTimeout(() => setSaveToast(null), 3000);
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/50 text-white shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{saveToast}</span>
        </div>
      )}

      {/* Top Controls & Shift Selector Toolbar */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* Row 1: Title, Month Jump, and Batch Save Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase font-mono">
                SHIFT WORK NOC · {formatMonthYear(currentYear, currentMonth)}
              </h2>
              <p className="text-xs text-slate-400">
                Mode spreadsheet: Klik cell untuk assign / toggle shift
              </p>
            </div>
          </div>

          {/* Month Navigation & Batch Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Nav */}
            <div className="flex items-center rounded-lg bg-slate-800/90 border border-slate-700/60 p-0.5">
              <button
                onClick={onPrevMonth}
                className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onJumpToday}
                className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Hari Ini
              </button>
              <button
                onClick={onNextMonth}
                className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Unsaved changes indicator & buttons */}
            {unsavedCount > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{unsavedCount} Perubahan Belum Disimpan</span>
                </span>
                <button
                  onClick={handleRevert}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Batalkan</span>
                </button>
                <button
                  onClick={handleBatchSave}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20 animate-pulse"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Jadwal</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400 px-2.5 py-1.5 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Semua perubahan tersimpan</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Shift Selector Mode Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              SHIFT AKTIF:
            </span>

            {/* PAGI */}
            <button
              onClick={() => setActiveShiftMode('pagi')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeShiftMode === 'pagi'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
              }`}
            >
              <span className="w-4 h-4 rounded bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                P
              </span>
              <span>PAGI</span>
            </button>

            {/* SETENGAH HARI */}
            <button
              onClick={() => setActiveShiftMode('setengah_hari')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeShiftMode === 'setengah_hari'
                  ? 'bg-violet-600 text-white ring-2 ring-violet-400 ring-offset-2 ring-offset-slate-950 shadow-md shadow-violet-500/20'
                  : 'bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 border border-violet-500/30'
              }`}
              title="Shift Stengah Hari (08.00-13.00)"
            >
              <span className="w-5 h-4 rounded bg-violet-600 text-white font-black text-[10px] flex items-center justify-center">
                SH
              </span>
              <span>STENGAH HARI</span>
            </button>

            {/* SORE */}
            <button
              onClick={() => setActiveShiftMode('sore')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeShiftMode === 'sore'
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
              }`}
            >
              <span className="w-4 h-4 rounded bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center">
                S
              </span>
              <span>SORE</span>
            </button>

            {/* MALAM */}
            <button
              onClick={() => setActiveShiftMode('malam')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeShiftMode === 'malam'
                  ? 'bg-sky-500 text-white ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950 shadow-md shadow-sky-500/20'
                  : 'bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 border border-sky-500/30'
              }`}
            >
              <span className="w-4 h-4 rounded bg-sky-500 text-white font-black text-[10px] flex items-center justify-center">
                M
              </span>
              <span>MALAM</span>
            </button>

            {/* SORE MALAM SHORTCUT */}
            <button
              onClick={() => setActiveShiftMode('sore_malam')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeShiftMode === 'sore_malam'
                  ? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 shadow-md shadow-sky-500/20'
                  : 'bg-gradient-to-r from-emerald-500/15 to-sky-500/15 text-emerald-200 hover:from-emerald-500/25 hover:to-sky-500/25 border border-emerald-500/40'
              }`}
              title="Shortcut: Menyimpan 2 assignment (Sore + Malam)"
            >
              <span className="px-1 py-0.5 rounded bg-slate-950/80 font-black text-[10px] text-emerald-300 font-mono">
                SM
              </span>
              <span>SORE MALAM</span>
            </button>

            {/* CUTI */}
            <button
              onClick={() => setActiveShiftMode('cuti')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeShiftMode === 'cuti'
                  ? 'bg-rose-500 text-white ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-950 shadow-md shadow-rose-500/20'
                  : 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded bg-rose-500" />
              <span>CUTI</span>
            </button>

            {/* LIBUR / CLEAR */}
            <button
              onClick={() => setActiveShiftMode('libur')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeShiftMode === 'libur'
                  ? 'bg-slate-700 text-white ring-2 ring-slate-400 ring-offset-2 ring-offset-slate-950'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60'
              }`}
            >
              <span>⬜ LIBUR / HAPUS</span>
            </button>
          </div>

          {/* Quick Rotation Template */}
          <div className="flex items-center gap-2">
            <button
              onClick={applyStandardNocPattern}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              title="Terapkan pola rotasi 24/7 otomatis untuk bulan ini"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Auto Pola 24/7</span>
            </button>
            <button
              onClick={clearCurrentMonth}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/60 transition-colors"
              title="Kosongkan jadwal bulan ini"
            >
              Kosongkan
            </button>
          </div>
        </div>
      </div>

      {/* Spreadsheet Roster Table Container with Horizontal Scroll */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar max-w-full">
          <table className="w-full text-left border-collapse select-none min-w-[950px]">
            {/* Table Header: Dates and Weekdays */}
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70">
                {/* Sticky Team Column Header */}
                <th className="sticky left-0 z-20 bg-slate-950/95 backdrop-blur-md px-4 py-3 font-mono font-bold text-xs uppercase text-slate-300 tracking-wider border-r border-slate-800 w-44 min-w-[176px] shadow-sm">
                  <div className="flex items-center justify-between">
                    <span>TEAM ({activeStaff.length})</span>
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>

                {/* Date Columns */}
                {daysInMonth.map((day) => {
                  return (
                    <th
                      key={day.dateStr}
                      className={`text-center py-2 px-1 font-mono text-xs border-r border-slate-800/50 min-w-[36px] w-[36px] ${
                        day.isWeekend
                          ? 'bg-rose-500/5'
                          : day.holiday
                          ? 'bg-rose-500/10'
                          : ''
                      }`}
                      title={day.holiday ? `${day.dayNameIndo}: ${day.holiday.name}` : day.dayNameIndo}
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className={`font-bold text-xs leading-none tabular-nums ${
                            day.holiday
                              ? 'text-rose-400'
                              : day.isWeekend
                              ? 'text-rose-300/80'
                              : 'text-slate-200'
                          }`}
                        >
                          {day.dayNumber}
                        </span>
                        <span
                          className={`text-[10px] font-medium mt-0.5 uppercase ${
                            day.isWeekend || day.holiday ? 'text-rose-400/80' : 'text-slate-400'
                          }`}
                        >
                          {day.dayNameShort}
                        </span>
                      </div>
                    </th>
                  );
                })}

                {/* Shift Summary Columns */}
                <th className="px-3 py-2 text-center font-mono text-[11px] font-bold text-amber-400 bg-slate-950/80 border-r border-slate-800/60 min-w-[36px]">
                  P
                </th>
                <th className="px-3 py-2 text-center font-mono text-[11px] font-bold text-violet-400 bg-slate-950/80 border-r border-slate-800/60 min-w-[36px]">
                  SH
                </th>
                <th className="px-3 py-2 text-center font-mono text-[11px] font-bold text-emerald-400 bg-slate-950/80 border-r border-slate-800/60 min-w-[36px]">
                  S
                </th>
                <th className="px-3 py-2 text-center font-mono text-[11px] font-bold text-sky-400 bg-slate-950/80 border-r border-slate-800/60 min-w-[36px]">
                  M
                </th>
                <th className="px-3 py-2 text-center font-mono text-[11px] font-bold text-teal-300 bg-slate-950/80 border-r border-slate-800/60 min-w-[36px]">
                  SM
                </th>
                <th className="px-3 py-2 text-center font-mono text-[11px] font-bold text-rose-400 bg-slate-950/80 border-r border-slate-800/60 min-w-[36px]">
                  C
                </th>
                <th className="px-3 py-2 text-center font-mono text-[11px] font-bold text-slate-300 bg-slate-950/80 border-r border-slate-800/60 min-w-[36px]">
                  L
                </th>
                <th className="px-3 py-2 text-center font-mono text-[11px] font-bold text-white bg-slate-950/90 min-w-[64px]">
                  Jam
                </th>
              </tr>
            </thead>

            {/* Table Body: Staff Rows */}
            <tbody className="divide-y divide-slate-800/60">
              {activeStaff.map((staff) => {
                const recap = calculateStaffMonthlyRecap(
                  staff,
                  currentYear,
                  currentMonth,
                  stagedSchedules,
                  stagedLeaves,
                  holidays,
                  settings
                );

                return (
                  <tr key={staff.id} className="hover:bg-slate-800/30 transition-colors group">
                    {/* Sticky Staff Name Cell */}
                    <td className="sticky left-0 z-10 bg-slate-900/95 group-hover:bg-slate-850 backdrop-blur-md px-4 py-2.5 border-r border-slate-800 shadow-sm">
                      <div className="font-semibold text-sm text-slate-100 truncate flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="truncate">{staff.name}</span>
                      </div>
                      {staff.role && (
                        <span className="text-[11px] text-slate-400 font-normal truncate block pl-4">
                          {staff.role}
                        </span>
                      )}
                    </td>

                    {/* Day Cells */}
                    {daysInMonth.map((day) => {
                      const cell = deriveCellStatus(
                        staff.id,
                        day.dateStr,
                        stagedSchedules,
                        stagedLeaves,
                        holidays,
                        settings.shifts
                      );

                      return (
                        <td
                          key={day.dateStr}
                          onClick={() => handleCellClick(staff.id, day.dateStr)}
                          className={`p-0.5 text-center border-r border-slate-800/40 cursor-pointer transition-all duration-150 hover:brightness-125 ${
                            day.isWeekend ? 'bg-slate-950/20' : ''
                          }`}
                        >
                          <div
                            className={`w-full h-8 sm:h-9 rounded-md flex items-center justify-center font-mono text-xs font-bold transition-all shadow-xs ${
                              cell.status === 'P'
                                ? 'bg-amber-500 text-slate-950 font-black shadow-amber-500/20'
                                : cell.status === 'SH'
                                ? 'bg-violet-600 text-white font-black shadow-violet-600/20'
                                : cell.status === 'S'
                                ? 'bg-emerald-500 text-white font-black shadow-emerald-500/20'
                                : cell.status === 'M'
                                ? 'bg-sky-600 text-white font-black shadow-sky-600/20'
                                : cell.status === 'SM'
                                ? 'bg-gradient-to-br from-emerald-500 to-sky-600 text-white font-black shadow-emerald-500/20'
                                : cell.status === 'CUTI'
                                ? 'bg-rose-500 text-white font-bold'
                                : 'bg-slate-800/40 text-slate-400 hover:bg-slate-700/60 font-medium'
                            }`}
                            title={`${staff.name} - ${day.dayNumber} ${formatMonthYear(currentYear, currentMonth)}: ${
                              cell.status === 'SM'
                                ? 'Sore & Malam (SM)'
                                : cell.status === 'SH'
                                ? 'Stengah Hari (08.00-13.00)'
                                : cell.status === 'P'
                                ? 'Pagi'
                                : cell.status === 'S'
                                ? 'Sore'
                                : cell.status === 'M'
                                ? 'Malam'
                                : cell.status === 'CUTI'
                                ? `Cuti: ${cell.leaveInfo?.type || ''}`
                                : 'Libur'
                            }`}
                          >
                            {cell.status === 'LIBUR' ? '' : cell.status}
                          </div>
                        </td>
                      );
                    })}

                    {/* Summary Columns */}
                    <td className="px-2 py-2 text-center font-mono text-xs font-bold text-amber-300 bg-slate-950/40 border-r border-slate-800/60 tabular-nums">
                      {recap.pagiCount || '-'}
                    </td>
                    <td className="px-2 py-2 text-center font-mono text-xs font-bold text-violet-300 bg-slate-950/40 border-r border-slate-800/60 tabular-nums">
                      {recap.shCount || '-'}
                    </td>
                    <td className="px-2 py-2 text-center font-mono text-xs font-bold text-emerald-300 bg-slate-950/40 border-r border-slate-800/60 tabular-nums">
                      {recap.soreCount || '-'}
                    </td>
                    <td className="px-2 py-2 text-center font-mono text-xs font-bold text-sky-300 bg-slate-950/40 border-r border-slate-800/60 tabular-nums">
                      {recap.malamCount || '-'}
                    </td>
                    <td className="px-2 py-2 text-center font-mono text-xs font-bold text-teal-300 bg-slate-950/40 border-r border-slate-800/60 tabular-nums">
                      {recap.smCount || '-'}
                    </td>
                    <td className="px-2 py-2 text-center font-mono text-xs font-bold text-rose-300 bg-slate-950/40 border-r border-slate-800/60 tabular-nums">
                      {recap.cutiCount || '-'}
                    </td>
                    <td className="px-2 py-2 text-center font-mono text-xs font-bold text-slate-400 bg-slate-950/40 border-r border-slate-800/60 tabular-nums">
                      {recap.liburCount || '-'}
                    </td>
                    <td className="px-2 py-2 text-center font-mono text-xs font-bold bg-slate-950/70 tabular-nums text-white">
                      {recap.totalHours}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend Bar */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-400 uppercase tracking-wider">LEGEND:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[10px]">
                P
              </span>
              <span className="text-slate-300 font-medium">Pagi (08:00-16:00)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 h-5 rounded bg-violet-600 text-white font-black flex items-center justify-center text-[10px]">
                SH
              </span>
              <span className="text-slate-300 font-medium">Stengah Hari 08.00-13.00</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-emerald-500 text-white font-black flex items-center justify-center text-[10px]">
                S
              </span>
              <span className="text-slate-300 font-medium">Sore (16:00-00:00)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-sky-600 text-white font-black flex items-center justify-center text-[10px]">
                M
              </span>
              <span className="text-slate-300 font-medium">Malam (00:00-08:00)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 h-5 rounded bg-gradient-to-r from-emerald-500 to-sky-600 text-white font-black flex items-center justify-center text-[10px]">
                SM
              </span>
              <span className="text-slate-300 font-medium">Sore Malam 16.00-08.00</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-slate-800/80 border border-slate-700 text-slate-400 font-bold flex items-center justify-center text-[10px]">
                -
              </span>
              <span className="text-slate-300 font-medium">Libur</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 h-5 rounded bg-rose-500 text-white font-bold flex items-center justify-center text-[10px]">
                CUTI
              </span>
              <span className="text-slate-300 font-medium">Cuti</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Klik sekali untuk assign, klik lagi pada cell yang sama untuk kembali Libur.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
