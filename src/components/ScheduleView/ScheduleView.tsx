import React, { useState, useRef, useEffect } from 'react';
import { Staff, ScheduleAssignment, Leave, Holiday, WorkRulesSettings, DelegationLog } from '../../types';
import { PiketToday } from './PiketToday';
import { MonthlyCalendar } from './MonthlyCalendar';
import { DelegationLogWidget } from './DelegationLogWidget';
import { WorkHoursSummary } from './WorkHoursSummary';
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
  onOpenEditor: _onOpenEditor,
  onAddDelegation,
  onDeleteDelegation,
  onToggleDelegationStatus,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const todayStr = formatISODate(wibDate.getFullYear(), wibDate.getMonth() + 1, wibDate.getDate());

  // Handle clicking a date cell in the calendar
  const handleSelectDate = (dateStr: string) => {
    // Clear any pending auto-reset timer
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    if (dateStr === todayStr) {
      setSelectedDate(null);
      return;
    }

    // Set the clicked date to display its shift in the left widget
    setSelectedDate(dateStr);

    // Automatically reset back to today after 10 seconds silently
    resetTimerRef.current = setTimeout(() => {
      setSelectedDate(null);
      resetTimerRef.current = null;
    }, 10000);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto">
      {/* Top 3-Column Layout: Left (Piket Hari Ini) | Center (Monthly Calendar) | Right (Delegation Log) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Piket Hari Ini / Tanggal Terpilih (3 cols - fixed matching height) */}
        <div className="xl:col-span-3 w-full h-[520px] sm:h-[580px] xl:h-[640px] flex flex-col min-h-0">
          <PiketToday
            todayStr={todayStr}
            wibDate={wibDate}
            selectedDateStr={selectedDate}
            staffList={staffList}
            schedules={schedules}
            leaves={leaves}
            holidays={holidays}
            settings={settings}
          />
        </div>

        {/* Center Column: Monthly Calendar (6 cols - natural unconstrained height, immune to side widget growth) */}
        <div className="xl:col-span-6 w-full flex flex-col min-h-0">
          <MonthlyCalendar
            currentYear={currentYear}
            currentMonth={currentMonth}
            onPrevMonth={onPrevMonth}
            onNextMonth={onNextMonth}
            onJumpToday={() => {
              if (resetTimerRef.current) {
                clearTimeout(resetTimerRef.current);
                resetTimerRef.current = null;
              }
              setSelectedDate(null);
              onJumpToday();
            }}
            staffList={staffList}
            schedules={schedules}
            leaves={leaves}
            holidays={holidays}
            settings={settings}
            selectedDate={selectedDate || todayStr}
            onSelectDate={handleSelectDate}
          />
        </div>

        {/* Right Column: DELEGATION LOG (3 cols - identical size to Piket Hari Ini with internal scrolling) */}
        <div className="xl:col-span-3 w-full h-[520px] sm:h-[580px] xl:h-[640px] flex flex-col min-h-0">
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
    </div>
  );
};

