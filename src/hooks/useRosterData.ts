import { useState, useEffect, useCallback } from 'react';
import { Staff, ScheduleAssignment, Leave, Holiday, WorkRulesSettings, ShiftType, ActiveInputMode, DelegationLog } from '../types';
import { LocalDB } from '../services/db';

export function useRosterData() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [schedules, setSchedules] = useState<ScheduleAssignment[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [delegations, setDelegations] = useState<DelegationLog[]>([]);
  const [settings, setSettings] = useState<WorkRulesSettings>(LocalDB.getSettings());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load all initial data from local DB
  const reloadData = useCallback(() => {
    LocalDB.init();
    setStaffList(LocalDB.getStaff());
    setSchedules(LocalDB.getSchedules());
    setLeaves(LocalDB.getLeaves());
    setHolidays(LocalDB.getHolidays());
    setDelegations(LocalDB.getDelegations());
    setSettings(LocalDB.getSettings());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // STAFF CRUD
  const addStaff = (name: string, role = 'NOC Engineer', phone = '') => {
    const newStaff: Staff = {
      id: `staff-${Date.now()}`,
      name: name.trim(),
      active: true,
      order: staffList.length + 1,
      role,
      phone,
    };
    const updated = [...staffList, newStaff];
    setStaffList(updated);
    LocalDB.saveStaff(updated);
  };

  const updateStaff = (id: string, updates: Partial<Staff>) => {
    const updated = staffList.map(s => (s.id === id ? { ...s, ...updates } : s));
    setStaffList(updated);
    LocalDB.saveStaff(updated);
  };

  const deleteStaff = (id: string) => {
    const updated = staffList.filter(s => s.id !== id);
    setStaffList(updated);
    LocalDB.saveStaff(updated);
  };

  const reorderStaff = (id: string, direction: 'up' | 'down') => {
    const idx = staffList.findIndex(s => s.id === id);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === staffList.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const copy = [...staffList];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;

    // re-assign order numbers
    const normalized = copy.map((s, i) => ({ ...s, order: i + 1 }));
    setStaffList(normalized);
    LocalDB.saveStaff(normalized);
  };

  // SCHEDULE CRUD
  const saveBatchSchedules = (newSchedules: ScheduleAssignment[]) => {
    setSchedules(newSchedules);
    LocalDB.saveSchedules(newSchedules);
  };

  // LEAVES CRUD
  const saveBatchLeaves = (newLeaves: Leave[]) => {
    setLeaves(newLeaves);
    LocalDB.saveLeaves(newLeaves);
  };

  const addLeave = (leave: Omit<Leave, 'id'>) => {
    const newLeave: Leave = {
      id: `leave-${Date.now()}`,
      ...leave,
    };
    const updated = [...leaves, newLeave];
    setLeaves(updated);
    LocalDB.saveLeaves(updated);
  };

  const updateLeave = (id: string, updates: Partial<Leave>) => {
    const updated = leaves.map(l => (l.id === id ? { ...l, ...updates } : l));
    setLeaves(updated);
    LocalDB.saveLeaves(updated);
  };

  const deleteLeave = (id: string) => {
    const updated = leaves.filter(l => l.id !== id);
    setLeaves(updated);
    LocalDB.saveLeaves(updated);
  };

  // HOLIDAYS CRUD
  const addHoliday = (holiday: Omit<Holiday, 'id'>) => {
    const newHoliday: Holiday = {
      id: `hol-${Date.now()}`,
      ...holiday,
    };
    const updated = [...holidays, newHoliday];
    setHolidays(updated);
    LocalDB.saveHolidays(updated);
  };

  const updateHoliday = (id: string, updates: Partial<Holiday>) => {
    const updated = holidays.map(h => (h.id === id ? { ...h, ...updates } : h));
    setHolidays(updated);
    LocalDB.saveHolidays(updated);
  };

  const deleteHoliday = (id: string) => {
    const updated = holidays.filter(h => h.id !== id);
    setHolidays(updated);
    LocalDB.saveHolidays(updated);
  };

  // DELEGATION LOGS CRUD
  const addDelegation = (
    title: string,
    content: string,
    authorName: string,
    assignedTo = '',
    priority: DelegationLog['priority'] = 'normal',
    dateStr = '',
    timeStr = ''
  ) => {
    const now = new Date();
    const defaultDate = dateStr || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const defaultTime = timeStr || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newLog: DelegationLog = {
      id: `del-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      authorName: authorName.trim() || 'NOC Engineer',
      assignedTo: assignedTo.trim() || undefined,
      priority,
      status: 'pending',
      dateStr: defaultDate,
      timeStr: defaultTime,
      createdAt: now.toISOString(),
    };
    const updated = [newLog, ...delegations];
    setDelegations(updated);
    LocalDB.saveDelegations(updated);
  };

  const updateDelegation = (id: string, updates: Partial<DelegationLog>) => {
    const updated = delegations.map(d => (d.id === id ? { ...d, ...updates } : d));
    setDelegations(updated);
    LocalDB.saveDelegations(updated);
  };

  const deleteDelegation = (id: string) => {
    const updated = delegations.filter(d => d.id !== id);
    setDelegations(updated);
    LocalDB.saveDelegations(updated);
  };

  const toggleDelegationStatus = (id: string) => {
    const updated = delegations.map(d => {
      if (d.id !== id) return d;
      const nextStatus: DelegationLog['status'] =
        d.status === 'pending' ? 'in_progress' : d.status === 'in_progress' ? 'done' : 'pending';
      return { ...d, status: nextStatus };
    });
    setDelegations(updated);
    LocalDB.saveDelegations(updated);
  };

  // SETTINGS
  const updateSettings = (newSettings: Partial<WorkRulesSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    LocalDB.saveSettings(merged);
  };

  // RESET
  const resetToSampleData = () => {
    LocalDB.resetToDefaults();
    reloadData();
  };

  return {
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
    updateHoliday,
    deleteHoliday,
    addDelegation,
    updateDelegation,
    deleteDelegation,
    toggleDelegationStatus,
    updateSettings,
    resetToSampleData,
  };
}
