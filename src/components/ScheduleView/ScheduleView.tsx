import React, { useState } from 'react';
import { Staff, ScheduleAssignment, Leave, Holiday, WorkRulesSettings, DelegationLog } from '../../types';
import { PiketToday } from './PiketToday';
import { MonthlyCalendar } from './MonthlyCalendar';
import { DelegationLogWidget } from './DelegationLogWidget';
import { WorkHoursSummary } from './WorkHoursSummary';
import { DateDetailModal } from './DateDetailModal';
import { formatISODate } from '../../utils/dateUtils';

interface ScheduleViewProps {
  currentYear: number;
  currentMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToday: () => void;
  wibDate: Date;
  staffList: Staff[];
  schedules: ScheduleAssignment[];
  leaves: Leave[];
  holidays: Holiday[];
  delegations: DelegationLog[];
  settings: WorkRulesSettings;
  onOpenEditor: () => void;
  onAddDelegation: (
    title: string,
    content: string,
    authorName: string,
    assignedTo?: string,
    priority?: DelegationLog['priority'],
    dateStr?: string,
    timeStr?: string
  ) => void;
  onDeleteDelegation: (id: string) => void;
  onToggleDelegationStatus: (id: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  currentYear,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onJumpToday,
  wibDate,
  staffList,
  schedules,
  leaves,
  holidays,
  delegations,
  settings,
  onOpenEditor,
  onAddDelegation,
  onDeleteDelegation,
  onToggleDelegationStatus,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todayStr = formatISODate(wibDate.getFullYear(), wibDate.getMonth() + 1, wibDate.getDate());

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto">
      {/* Top 3-Column Layout: Left (Piket Hari Ini) | Center (Monthly Calendar) | Right (Delegation Log) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Piket Hari Ini (3 cols) */}
        <div className="xl:col-span-3 h-full min-h-[460px]">
          <PiketToday
            todayStr={todayStr}
            wibDate={wibDate}
            staffList={staffList}
            schedules={schedules}
            leaves={leaves}
            holidays={holidays}
            settings={settings}
            onSelectDateDetail={setSelectedDate}
          />
        </div>

        {/* Center Column: Monthly Calendar (6 cols) */}
        <div className="xl:col-span-6 h-full min-h-[460px]">
          <MonthlyCalendar
            currentYear={currentYear}
            currentMonth={currentMonth}
            onPrevMonth={onPrevMonth}
            onNextMonth={onNextMonth}
            onJumpToday={onJumpToday}
            staffList={staffList}
            schedules={schedules}
            leaves={leaves}
            holidays={holidays}
            settings={settings}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* Right Column: DELEGATION LOG (3 cols - identical size to Piket Hari Ini) */}
        <div className="xl:col-span-3 h-full min-h-[460px]">
          <DelegationLogWidget
            delegations={delegations}
            staffList={staffList}
            todayStr={todayStr}
            onAddDelegation={onAddDelegation}
            onDeleteDelegation={onDeleteDelegation}
            onToggleStatus={onToggleDelegationStatus}
          />
        </div>
      </div>

      {/* Bottom Layout: Rekap Jam Kerja */}
      <WorkHoursSummary
        currentYear={currentYear}
        currentMonth={currentMonth}
        staffList={staffList}
        schedules={schedules}
        leaves={leaves}
        holidays={holidays}
        settings={settings}
      />

      {/* Date Detail Modal */}
      <DateDetailModal
        dateStr={selectedDate}
        onClose={() => setSelectedDate(null)}
        staffList={staffList}
        schedules={schedules}
        leaves={leaves}
        holidays={holidays}
        settings={settings}
        onOpenEditor={onOpenEditor}
      />
    </div>
  );
};

