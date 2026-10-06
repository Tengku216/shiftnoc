import { useState, useEffect, useCallback } from 'react';
import { Staff, ScheduleAssignment, Leave, Holiday, WorkRulesSettings, DelegationLog } from '../types';
import { LocalDB, FirestoreDB } from '../services/db';

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
    // 1. Initial fast local load
    reloadData();

    // 2. Initialize or migrate cloud data in the background
    FirestoreDB.initCloudData().catch(err => {
      console.warn('Firestore cloud sync init:', err);
    });

    // 3. Realtime subscriptions across all clients & browsers
    const unsubStaff = FirestoreDB.subscribeStaff(cloudStaff => {
      if (cloudStaff && cloudStaff.length > 0) {
        setStaffList(cloudStaff);
      }
    });

    const unsubSchedules = FirestoreDB.subscribeSchedules(cloudSchedules => {
      if (cloudSchedules && cloudSchedules.length > 0) {
        setSchedules(cloudSchedules);
      }
    });

    const unsubLeaves = FirestoreDB.subscribeLeaves(cloudLeaves => {
      setLeaves(cloudLeaves);
    });

    const unsubHolidays = FirestoreDB.subscribeHolidays(cloudHolidays => {
      if (cloudHolidays && cloudHolidays.length > 0) {
        setHolidays(cloudHolidays);
      }
    });

    const unsubDelegations = FirestoreDB.subscribeDelegations(cloudDelegations => {
      setDelegations(cloudDelegations);
    });

    const unsubSettings = FirestoreDB.subscribeSettings(cloudSettings => {
      if (cloudSettings) {
        setSettings(cloudSettings);
      }
    });

    return () => {
      unsubStaff();
      unsubSchedules();
      unsubLeaves();
      unsubHolidays();
      unsubDelegations();
      unsubSettings();
    };
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
    FirestoreDB.saveStaff(newStaff).catch(console.error);
  };

  const updateStaff = (id: string, updates: Partial<Staff>) => {
    const updated = staffList.map(s => (s.id === id ? { ...s, ...updates } : s));
    setStaffList(updated);
    LocalDB.saveStaff(updated);
    const target = updated.find(s => s.id === id);
    if (target) {
      FirestoreDB.saveStaff(target).catch(console.error);
    }
  };

  const deleteStaff = (id: string) => {
    const updated = staffList.filter(s => s.id !== id);
    setStaffList(updated);
    LocalDB.saveStaff(updated);
    FirestoreDB.deleteStaff(id).catch(console.error);
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
    FirestoreDB.saveStaffList(normalized).catch(console.error);
  };

  // SCHEDULE CRUD
  const saveBatchSchedules = (newSchedules: ScheduleAssignment[]) => {
    setSchedules(newSchedules);
    LocalDB.saveSchedules(newSchedules);
    FirestoreDB.saveSchedules(newSchedules).catch(console.error);
  };

  // LEAVES CRUD
  const saveBatchLeaves = (newLeaves: Leave[]) => {
    setLeaves(newLeaves);
    LocalDB.saveLeaves(newLeaves);
    FirestoreDB.saveLeavesBatch(newLeaves).catch(console.error);
  };

  const addLeave = (leave: Omit<Leave, 'id'>) => {
    const newLeave: Leave = {
      id: `leave-${Date.now()}`,
      ...leave,
    };
    const updated = [...leaves, newLeave];
    setLeaves(updated);
    LocalDB.saveLeaves(updated);
    FirestoreDB.saveLeave(newLeave).catch(console.error);
  };

  const updateLeave = (id: string, updates: Partial<Leave>) => {
    const updated = leaves.map(l => (l.id === id ? { ...l, ...updates } : l));
    setLeaves(updated);
    LocalDB.saveLeaves(updated);
    const target = updated.find(l => l.id === id);
    if (target) {
      FirestoreDB.saveLeave(target).catch(console.error);
    }
  };

  const deleteLeave = (id: string) => {
    const updated = leaves.filter(l => l.id !== id);
    setLeaves(updated);
    LocalDB.saveLeaves(updated);
    FirestoreDB.deleteLeave(id).catch(console.error);
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
    FirestoreDB.saveHoliday(newHoliday).catch(console.error);
  };

  const updateHoliday = (id: string, updates: Partial<Holiday>) => {
    const updated = holidays.map(h => (h.id === id ? { ...h, ...updates } : h));
    setHolidays(updated);
    LocalDB.saveHolidays(updated);
    const target = updated.find(h => h.id === id);
    if (target) {
      FirestoreDB.saveHoliday(target).catch(console.error);
    }
  };

  const deleteHoliday = (id: string) => {
    const updated = holidays.filter(h => h.id !== id);
    setHolidays(updated);
    LocalDB.saveHolidays(updated);
    FirestoreDB.deleteHoliday(id).catch(console.error);
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
    const defaultDate =
      dateStr ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const defaultTime =
      timeStr ||
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

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
    FirestoreDB.saveDelegation(newLog).catch(console.error);
  };

  const updateDelegation = (id: string, updates: Partial<DelegationLog>) => {
    const updated = delegations.map(d => (d.id === id ? { ...d, ...updates } : d));
    setDelegations(updated);
    LocalDB.saveDelegations(updated);
    const target = updated.find(d => d.id === id);
    if (target) {
      FirestoreDB.saveDelegation(target).catch(console.error);
    }
  };

  const deleteDelegation = (id: string) => {
    const updated = delegations.filter(d => d.id !== id);
    setDelegations(updated);
    LocalDB.saveDelegations(updated);
    FirestoreDB.deleteDelegation(id).catch(console.error);
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
    const target = updated.find(d => d.id === id);
    if (target) {
      FirestoreDB.saveDelegation(target).catch(console.error);
    }
  };

  // SETTINGS
  const updateSettings = (newSettings: Partial<WorkRulesSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    LocalDB.saveSettings(merged);
    FirestoreDB.saveSettings(merged).catch(console.error);
  };

  // RESET
  const resetToSampleData = () => {
    LocalDB.resetToDefaults();
    FirestoreDB.initCloudData().catch(console.error);
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
