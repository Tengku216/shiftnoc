import React from 'react';
import { Staff, ScheduleAssignment, Leave, Holiday, WorkRulesSettings } from '../../types';
import { deriveCellStatus, parseISODate } from '../../utils/dateUtils';
import { X, CalendarPlus, ShieldAlert, Coffee } from 'lucide-react';

interface DateDetailModalProps {
  dateStr: string | null;
  onClose: () => void;
  staffList: Staff[];
  schedules: ScheduleAssignment[];
  leaves: Leave[];
  holidays: Holiday[];
  settings: WorkRulesSettings;
  onOpenEditor: () => void;
}

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DateDetailModal: React.FC<DateDetailModalProps> = ({
  dateStr,
  onClose,
  staffList,
  schedules,
  leaves,
  holidays,
  settings,
  onOpenEditor,
}) => {
  if (!dateStr) return null;

  const { year, month, day } = parseISODate(dateStr);
  const dateObj = new Date(year, month - 1, day);
  const dayName = INDO_DAYS[dateObj.getDay()];
  const formattedDateTitle = `${dayName}, ${day} ${INDO_MONTHS[month - 1]} ${year}`;

  const holiday = holidays.find(h => h.date === dateStr);
  const activeStaff = staffList.filter(s => s.active);

  const pagiStaff: Staff[] = [];
  const shStaff: Staff[] = [];
  const soreStaff: Staff[] = [];
  const malamStaff: Staff[] = [];
  const cutiStaff: { staff: Staff; leaveInfo: Leave }[] = [];
  const liburStaff: Staff[] = [];

  activeStaff.forEach(staff => {
    const statusInfo = deriveCellStatus(staff.id, dateStr, schedules, leaves, holidays, settings.shifts);

    if (statusInfo.isLeave && statusInfo.leaveInfo) {
      cutiStaff.push({ staff, leaveInfo: statusInfo.leaveInfo });
    } else {
      let isAssigned = false;
      if (statusInfo.hasSetengahHari) {
        shStaff.push(staff);
        isAssigned = true;
      }
      if (statusInfo.hasPagi) {
        pagiStaff.push(staff);
        isAssigned = true;
      }
      if (statusInfo.hasSore) {
        soreStaff.push(staff);
        isAssigned = true;
      }
      if (statusInfo.hasMalam) {
        malamStaff.push(staff);
        isAssigned = true;
      }
      if (!isAssigned) {
        liburStaff.push(staff);
      }
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h3 className="text-lg font-bold text-white tracking-wide">
                Detail Piket NOC
              </h3>
            </div>
            <p className="text-sm font-mono text-amber-400/90 font-medium mt-0.5">
              {formattedDateTitle}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Holiday alert if any */}
        {holiday && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold">{holiday.name}</span>
              <span className="text-rose-400/80 ml-1.5">
                ({holiday.type} {holiday.region ? `· ${holiday.region}` : ''})
              </span>
            </div>
          </div>
        )}

        {/* Shifts List */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {/* PAGI */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                  P
                </span>
                <span className="font-bold text-xs uppercase tracking-wider text-amber-300">
                  PAGI
                </span>
              </div>
              <span className="text-xs font-mono text-amber-400/80">
                {settings.shifts.pagi.startTime} - {settings.shifts.pagi.endTime}
              </span>
            </div>

            {pagiStaff.length > 0 ? (
              <div className="space-y-1 pl-1">
                {pagiStaff.map(staff => (
                  <div key={staff.id} className="text-sm text-slate-100 font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{staff.name}</span>
                    {staff.role && <span className="text-xs text-slate-400">· {staff.role}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic pl-1">Tidak ada staff</p>
            )}
          </div>

          {/* SETENGAH HARI (Khusus hari Sabtu atau jika ada penugasan) */}
          {(dateObj.getDay() === 6 || shStaff.length > 0) && (
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/25">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-violet-500 text-white font-bold text-xs flex items-center justify-center">
                    SH
                  </span>
                  <span className="font-bold text-xs uppercase tracking-wider text-violet-300">
                    SETENGAH HARI {dateObj.getDay() === 6 ? '(SABTU)' : ''}
                  </span>
                </div>
                <span className="text-xs font-mono text-violet-400/80">
                  {settings.shifts.setengah_hari?.startTime || '08:00'} - {settings.shifts.setengah_hari?.endTime || '13:00'}
                </span>
              </div>

              {shStaff.length > 0 ? (
                <div className="space-y-1 pl-1">
                  {shStaff.map(staff => (
                    <div key={staff.id} className="text-sm text-slate-100 font-medium flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      <span>{staff.name}</span>
                      {staff.role && <span className="text-xs text-slate-400">· {staff.role}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic pl-1">Tidak ada staff</p>
              )}
            </div>
          )}

          {/* SORE */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                  S
                </span>
                <span className="font-bold text-xs uppercase tracking-wider text-emerald-300">
                  SORE
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-400/80">
                {settings.shifts.sore.startTime} - {settings.shifts.sore.endTime}
              </span>
            </div>

            {soreStaff.length > 0 ? (
              <div className="space-y-1 pl-1">
                {soreStaff.map(staff => (
                  <div key={staff.id} className="text-sm text-slate-100 font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{staff.name}</span>
                    {staff.role && <span className="text-xs text-slate-400">· {staff.role}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic pl-1">Tidak ada staff</p>
            )}
          </div>

          {/* MALAM */}
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/25">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-sky-500 text-white font-bold text-xs flex items-center justify-center">
                  M
                </span>
                <span className="font-bold text-xs uppercase tracking-wider text-sky-300">
                  MALAM
                </span>
              </div>
              <span className="text-xs font-mono text-sky-400/80">
                {settings.shifts.malam.startTime} - {settings.shifts.malam.endTime}
              </span>
            </div>

            {malamStaff.length > 0 ? (
              <div className="space-y-1 pl-1">
                {malamStaff.map(staff => (
                  <div key={staff.id} className="text-sm text-slate-100 font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <span>{staff.name}</span>
                    {staff.role && <span className="text-xs text-slate-400">· {staff.role}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic pl-1">Tidak ada staff</p>
            )}
          </div>

          {/* CUTI */}
          {cutiStaff.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25">
              <span className="font-bold text-xs uppercase tracking-wider text-rose-300 block mb-2">
                CUTI
              </span>
              <div className="space-y-1.5 pl-1">
                {cutiStaff.map(({ staff, leaveInfo }) => (
                  <div key={staff.id} className="text-sm text-slate-200">
                    <div className="font-medium text-rose-200 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <span>{staff.name}</span>
                      <span className="text-xs text-rose-400/80">({leaveInfo.type})</span>
                    </div>
                    {leaveInfo.notes && (
                      <p className="text-xs text-slate-400 pl-3.5 mt-0.5">{leaveInfo.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LIBUR */}
          {liburStaff.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="flex items-center gap-2 mb-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
                <Coffee className="w-3.5 h-3.5 text-slate-400" />
                <span>LIBUR ({liburStaff.length})</span>
              </div>
              <p className="text-xs text-slate-300 pl-1">
                {liburStaff.map(s => s.name).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Tutup
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenEditor();
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shadow-md shadow-amber-500/20"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Edit di Roster</span>
          </button>
        </div>
      </div>
    </div>
  );
};
