import React from 'react';
import { Staff, ScheduleAssignment, Leave, Holiday, WorkRulesSettings } from '../../types';
import { deriveCellStatus, formatWIBFullDate } from '../../utils/dateUtils';
import { Sun, Sunset, Moon, ShieldAlert, Coffee } from 'lucide-react';

interface PiketTodayProps {
  todayStr: string;
  wibDate: Date;
  staffList: Staff[];
  schedules: ScheduleAssignment[];
  leaves: Leave[];
  holidays: Holiday[];
  settings: WorkRulesSettings;
  onSelectDateDetail: (dateStr: string) => void;
}

export const PiketToday: React.FC<PiketTodayProps> = ({
  todayStr,
  wibDate,
  staffList,
  schedules,
  leaves,
  holidays,
  settings,
  onSelectDateDetail,
}) => {
  const activeStaff = staffList.filter(s => s.active);

  // Group staff assignments for today
  const pagiStaff: { staff: Staff; isDual: boolean }[] = [];
  const soreStaff: { staff: Staff; isDual: boolean }[] = [];
  const malamStaff: { staff: Staff; isDual: boolean }[] = [];
  const shStaff: { staff: Staff }[] = [];
  const cutiStaff: { staff: Staff; leaveInfo?: Leave }[] = [];
  const liburStaff: Staff[] = [];

  activeStaff.forEach(staff => {
    const statusInfo = deriveCellStatus(staff.id, todayStr, schedules, leaves, holidays, settings.shifts);

    if (statusInfo.isLeave) {
      cutiStaff.push({ staff, leaveInfo: statusInfo.leaveInfo });
    } else {
      let assignedAny = false;
      if (statusInfo.hasSetengahHari) {
        shStaff.push({ staff });
        assignedAny = true;
      }
      if (statusInfo.hasPagi) {
        pagiStaff.push({ staff, isDual: false });
        assignedAny = true;
      }
      if (statusInfo.hasSore) {
        soreStaff.push({ staff, isDual: statusInfo.hasMalam });
        assignedAny = true;
      }
      if (statusInfo.hasMalam) {
        malamStaff.push({ staff, isDual: statusInfo.hasSore });
        assignedAny = true;
      }
      if (!assignedAny) {
        liburStaff.push(staff);
      }
    }
  });

  const todayHoliday = holidays.find(h => h.date === todayStr);

  return (
    <div className="bg-slate-950/75 backdrop-blur-2xl border border-white/25 rounded-2xl p-5 shadow-2xl flex flex-col h-full text-white">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/15">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
            <h2 className="font-bold text-base text-white tracking-wide drop-shadow-md">PIKET HARI INI</h2>
          </div>
          <p className="text-xs text-slate-300 font-medium mt-0.5 drop-shadow-sm">{formatWIBFullDate(wibDate)}</p>
        </div>

        <button
          onClick={() => onSelectDateDetail(todayStr)}
          className="text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 shadow-md cursor-pointer"
        >
          Detail
        </button>
      </div>

      {todayHoliday && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/90 border border-rose-500/60 flex items-center gap-2.5 text-xs text-rose-100 shadow-md">
          <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-rose-400" />
          <div>
            <span className="font-bold text-white">{todayHoliday.name}</span>
            <span className="text-rose-300 ml-1.5 font-medium">({todayHoliday.type} {todayHoliday.region ? `· ${todayHoliday.region}` : ''})</span>
          </div>
        </div>
      )}

      {/* Shifts Stack */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {/* PAGI */}
        <div className="rounded-xl p-3 bg-slate-900/90 border border-amber-500/40 shadow-md transition-all">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-sm">
                P
              </div>
              <span className="font-bold text-xs uppercase tracking-wider text-amber-400 drop-shadow-sm">
                PAGI
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
              {settings.shifts.pagi.startTime} - {settings.shifts.pagi.endTime}
            </span>
          </div>

          {pagiStaff.length > 0 ? (
            <ul className="space-y-1.5 pl-1">
              {pagiStaff.map(({ staff }) => (
                <li key={staff.id} className="flex items-center gap-2 text-sm text-white font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="drop-shadow-sm">{staff.name}</span>
                  {staff.role && <span className="text-xs text-slate-300 font-normal">· {staff.role}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic pl-1">Belum ada staff terjadwal</p>
          )}
        </div>

        {/* SETENGAH HARI */}
        <div className="rounded-xl p-3 bg-slate-900/90 border border-violet-500/40 shadow-md transition-all">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-violet-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
                SH
              </div>
              <span className="font-bold text-xs uppercase tracking-wider text-violet-300 drop-shadow-sm">
                SETENGAH HARI
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-violet-300 bg-violet-950/80 px-2 py-0.5 rounded border border-violet-500/40">
              {settings.shifts.setengah_hari?.startTime || '08:00'} - {settings.shifts.setengah_hari?.endTime || '13:00'}
            </span>
          </div>

          {shStaff.length > 0 ? (
            <ul className="space-y-1.5 pl-1">
              {shStaff.map(({ staff }) => (
                <li key={staff.id} className="flex items-center gap-2 text-sm text-white font-semibold">
                  <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                  <span className="drop-shadow-sm">{staff.name}</span>
                  {staff.role && <span className="text-xs text-slate-300 font-normal">· {staff.role}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic pl-1">Belum ada staff terjadwal</p>
          )}
        </div>

        {/* SORE */}
        <div className="rounded-xl p-3 bg-slate-900/90 border border-emerald-500/40 shadow-md transition-all">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
                S
              </div>
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-300 drop-shadow-sm">
                SORE
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
              {settings.shifts.sore.startTime} - {settings.shifts.sore.endTime}
            </span>
          </div>

          {soreStaff.length > 0 ? (
            <ul className="space-y-1.5 pl-1">
              {soreStaff.map(({ staff, isDual }) => (
                <li key={staff.id} className="flex items-center justify-between text-sm text-white font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="drop-shadow-sm">{staff.name}</span>
                    {staff.role && <span className="text-xs text-slate-300 font-normal">· {staff.role}</span>}
                  </div>
                  {isDual && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-xs">
                      SM
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic pl-1">Belum ada staff terjadwal</p>
          )}
        </div>

        {/* MALAM */}
        <div className="rounded-xl p-3 bg-slate-900/90 border border-sky-500/40 shadow-md transition-all">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-sky-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
                M
              </div>
              <span className="font-bold text-xs uppercase tracking-wider text-sky-300 drop-shadow-sm">
                MALAM
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-500/40">
              {settings.shifts.malam.startTime} - {settings.shifts.malam.endTime}
            </span>
          </div>

          {malamStaff.length > 0 ? (
            <ul className="space-y-1.5 pl-1">
              {malamStaff.map(({ staff, isDual }) => (
                <li key={staff.id} className="flex items-center justify-between text-sm text-white font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                    <span className="drop-shadow-sm">{staff.name}</span>
                    {staff.role && <span className="text-xs text-slate-300 font-normal">· {staff.role}</span>}
                  </div>
                  {isDual && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-xs">
                      SM
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic pl-1">Belum ada staff terjadwal</p>
          )}
        </div>

        {/* CUTI & LIBUR Today Summary */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2 text-xs">
          {cutiStaff.length > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-rose-950/90 border border-rose-500/40 text-rose-200 flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded bg-rose-500 shrink-0" />
              <span className="font-bold text-white">Cuti ({cutiStaff.length}):</span>
              <span className="text-rose-100">{cutiStaff.map(c => c.staff.name).join(', ')}</span>
            </div>
          )}
          {liburStaff.length > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/60 text-slate-300 flex items-center gap-2 shadow-sm">
              <Coffee className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-bold text-white">Libur ({liburStaff.length}):</span>
              <span className="text-slate-200">{liburStaff.map(s => s.name).join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
