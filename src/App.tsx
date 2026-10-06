/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NavTab } from './types';
import { useRealtimeWIB } from './hooks/useRealtimeWIB';
import { useRosterData } from './hooks/useRosterData';
import { SidebarDrawer } from './components/MobileDrawer';
import { Header } from './components/Header';
import { BackgroundView } from './components/BackgroundView';
import { ScheduleView } from './components/ScheduleView/ScheduleView';
import { RosterEditor } from './components/RosterEditor/RosterEditor';
import { SettingsView } from './components/SettingsView/SettingsView';

export default function App() {
  const { timeString, dateString, wibDate, year: wibYear, month: wibMonth, isNight, isWeekend } = useRealtimeWIB();
  const {
    staffList,
    schedules,
    leaves,
    holidays,
    delegations,
    settings,
    isLoaded,
    reloadData,
    addStaff,
    updateStaff,
    deleteStaff,
    reorderStaff,
    saveBatchSchedules,
    saveBatchLeaves,
    addLeave,
    updateLeave,
    deleteLeave,
    addHoliday,
    deleteHoliday,
    addDelegation,
    updateDelegation,
    deleteDelegation,
    toggleDelegationStatus,
    updateSettings,
    resetToSampleData,
  } = useRosterData();

  // Navigation & Drawer State
  const [activeTab, setActiveTab] = useState<NavTab>('jadwal');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Month & Year state for viewing/editing roster (defaults to WIB date: October 2026)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(10); // October 2026

  // Unsaved changes tracker in Roster Editor
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleJumpToday = () => {
    setCurrentYear(wibYear);
    setCurrentMonth(wibMonth);
  };

  // Safe navigation interceptor if unsaved changes exist
  const handleNavigateRequest = (targetTab: NavTab) => {
    if (activeTab === 'editor' && hasUnsavedChanges && targetTab !== 'editor') {
      const confirmLeave = window.confirm(
        'Ada perubahan jadwal yang belum disimpan. Yakin ingin meninggalkan halaman editor?'
      );
      if (!confirmLeave) return;
    }
    setActiveTab(targetTab);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-mono text-sm">
        Memuat data roster NOC...
      </div>
    );
  }

  const todayStr = `${wibYear}-${String(wibMonth).padStart(2, '0')}-${String(wibDate.getDate()).padStart(2, '0')}`;
  const isHolidayToday = holidays.some(h => h.date === todayStr);

  return (
    <div className="min-h-screen flex flex-col text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-200 relative overflow-x-hidden">
      {/* Dynamic Background Slideshow */}
      <BackgroundView
        settings={settings}
        isNight={isNight}
        isWeekend={isWeekend}
        isHoliday={isHolidayToday}
      />

      {/* Universal Translucent Slide-In Sidebar Drawer */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={handleNavigateRequest}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Main Content Full Width Layout */}
      <div className="flex-1 flex flex-col w-full min-w-0">
        {/* Full Transparent Top Bar Header */}
        <Header
          timeString={timeString}
          dateString={dateString}
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsSidebarOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        />

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-y-auto">
          {activeTab === 'jadwal' && (
            <ScheduleView
              currentYear={currentYear}
              currentMonth={currentMonth}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onJumpToday={handleJumpToday}
              wibDate={wibDate}
              staffList={staffList}
              schedules={schedules}
              leaves={leaves}
              holidays={holidays}
              delegations={delegations}
              settings={settings}
              onOpenEditor={() => setActiveTab('editor')}
              onAddDelegation={addDelegation}
              onDeleteDelegation={deleteDelegation}
              onToggleDelegationStatus={toggleDelegationStatus}
            />
          )}

          {activeTab === 'editor' && (
            <RosterEditor
              currentYear={currentYear}
              currentMonth={currentMonth}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onJumpToday={handleJumpToday}
              staffList={staffList}
              schedules={schedules}
              leaves={leaves}
              holidays={holidays}
              settings={settings}
              onSaveSchedules={saveBatchSchedules}
              onSaveLeaves={saveBatchLeaves}
              onAddLeave={addLeave}
              onDeleteLeave={deleteLeave}
              hasUnsavedChanges={hasUnsavedChanges}
              setHasUnsavedChanges={setHasUnsavedChanges}
            />
          )}

          {activeTab === 'pengaturan' && (
            <SettingsView
              staffList={staffList}
              schedules={schedules}
              leaves={leaves}
              holidays={holidays}
              delegations={delegations}
              settings={settings}
              onAddStaff={addStaff}
              onUpdateStaff={updateStaff}
              onDeleteStaff={deleteStaff}
              onReorderStaff={reorderStaff}
              onAddLeave={addLeave}
              onDeleteLeave={deleteLeave}
              onAddHoliday={addHoliday}
              onDeleteHoliday={deleteHoliday}
              onUpdateSettings={updateSettings}
              onResetToSample={resetToSampleData}
              onReloadAll={reloadData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
