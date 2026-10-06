import { Staff, ShiftConfig, ShiftType, ScheduleAssignment, Leave, Holiday, WorkRulesSettings, DelegationLog } from '../types';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

const STORAGE_KEYS = {
  STAFF: 'noc_roster_staff_prod_v1',
  SCHEDULES: 'noc_roster_schedules_prod_v1',
  LEAVES: 'noc_roster_leaves_prod_v1',
  HOLIDAYS: 'noc_roster_holidays_prod_v1',
  SETTINGS: 'noc_roster_settings_prod_v1',
  DELEGATIONS: 'noc_roster_delegations_prod_v1',
  INITIALIZED: 'noc_roster_initialized_prod_v1',
};

export const DEFAULT_SHIFTS: Record<ShiftType, ShiftConfig> = {
  pagi: {
    id: 'pagi',
    name: 'Pagi',
    code: 'P',
    color: '#EAB308', // Amber-500
    startTime: '08:00',
    endTime: '16:00',
    durationHours: 8,
  },
  sore: {
    id: 'sore',
    name: 'Sore',
    code: 'S',
    color: '#10B981', // Emerald-500
    startTime: '16:00',
    endTime: '00:00',
    durationHours: 8,
  },
  malam: {
    id: 'malam',
    name: 'Malam',
    code: 'M',
    color: '#0284C7', // Sky-600
    startTime: '00:00',
    endTime: '08:00',
    durationHours: 8,
  },
  setengah_hari: {
    id: 'setengah_hari',
    name: 'Setengah Hari',
    code: 'SH',
    color: '#8B5CF6', // Violet-500
    startTime: '08:00',
    endTime: '13:00',
    durationHours: 5,
  },
};

export const DEFAULT_SETTINGS: WorkRulesSettings = {
  timezone: 'Asia/Jakarta',
  region: 'Jawa Barat',
  targetHoursPerMonth: 168,
  workDaysPerWeek: 5,
  autoCalculateOvertime: true,
  shifts: DEFAULT_SHIFTS,
  backgroundTheme: 'auto',
  bgDarkOverlay: 75,
  bgBlur: 6,
};

export const DEFAULT_STAFF: Staff[] = [
  { id: 'staff-1', name: 'Ramlan', active: true, order: 1, role: 'NOC Lead Engineer', phone: '0812-3456-7801' },
  { id: 'staff-2', name: 'Rafi', active: true, order: 2, role: 'Network Engineer', phone: '0812-3456-7802' },
  { id: 'staff-3', name: 'Tengku', active: true, order: 3, role: 'NOC Specialist', phone: '0812-3456-7803' },
  { id: 'staff-4', name: 'Asep Ryuat', active: true, order: 4, role: 'Infrastructure Tech', phone: '0812-3456-7804' },
  { id: 'staff-5', name: 'Hafidz', active: true, order: 5, role: 'Network Support', phone: '0812-3456-7805' },
  { id: 'staff-6', name: 'Daffa', active: true, order: 6, role: 'NOC Operator', phone: '0812-3456-7806' },
];

export const DEFAULT_HOLIDAYS: Holiday[] = [
  { id: 'hol-1', date: '2026-01-01', name: 'Tahun Baru Masehi', type: 'Nasional', region: 'Nasional' },
  { id: 'hol-2', date: '2026-02-17', name: 'Tahun Baru Imlek 2577', type: 'Nasional', region: 'Nasional' },
  { id: 'hol-3', date: '2026-03-20', name: 'Hari Raya Idul Fitri 1447 H', type: 'Nasional', region: 'Nasional' },
  { id: 'hol-4', date: '2026-03-21', name: 'Hari Raya Idul Fitri 1447 H', type: 'Nasional', region: 'Nasional' },
  { id: 'hol-5', date: '2026-05-01', name: 'Hari Buruh Internasional', type: 'Nasional', region: 'Nasional' },
  { id: 'hol-6', date: '2026-05-14', name: 'Kenaikan Yesus Kristus', type: 'Nasional', region: 'Nasional' },
  { id: 'hol-7', date: '2026-05-27', name: 'Hari Raya Idul Adha 1447 H', type: 'Nasional', region: 'Nasional' },
  { id: 'hol-8', date: '2026-06-01', name: 'Hari Lahir Pancasila', type: 'Nasional', region: 'Nasional' },
  { id: 'hol-9', date: '2026-08-17', name: 'Hari Kemerdekaan RI', type: 'Nasional', region: 'Nasional' },
  { id: 'hol-10', date: '2026-08-19', name: 'Hari Jadi Jawa Barat', type: 'Regional', region: 'Jawa Barat' },
  { id: 'hol-11', date: '2026-10-06', name: 'Hari Jadi Kota Bogor / Bandung (Regional Jabar)', type: 'Regional', region: 'Jawa Barat' },
  { id: 'hol-12', date: '2026-12-25', name: 'Hari Raya Natal', type: 'Nasional', region: 'Nasional' },
];

export const DEFAULT_LEAVES: Leave[] = [];

export const DEFAULT_DELEGATIONS: DelegationLog[] = [
  {
    id: 'del-1',
    title: 'Monitoring Link Core Fiber Jkt-Bdg',
    content: 'Tolong pantau fluktuasi latency link metro arah Bandung, ada maintenance provider pkl 01:00 WIB.',
    authorName: 'Ramlan',
    assignedTo: 'Daffa',
    priority: 'important',
    status: 'pending',
    dateStr: '2026-10-06',
    timeStr: '08:30',
    createdAt: '2026-10-06T08:30:00.000Z',
  },
  {
    id: 'del-2',
    title: 'Update Firmware Switch Distribution',
    content: 'Patch security IOS-XE switch agg-02 selesai staging, tunggu verifikasi shift malam.',
    authorName: 'Rafi',
    assignedTo: 'Asep Ryuat',
    priority: 'normal',
    status: 'in_progress',
    dateStr: '2026-10-06',
    timeStr: '11:15',
    createdAt: '2026-10-06T11:15:00.000Z',
  },
  {
    id: 'del-3',
    title: 'Check UPS & Genset Status Room B',
    content: 'Pengecekan rutin parameter voltase & suhu baterai UPS Room B gedung NOC.',
    authorName: 'Tengku',
    assignedTo: 'Hafidz',
    priority: 'normal',
    status: 'done',
    dateStr: '2026-10-06',
    timeStr: '09:00',
    createdAt: '2026-10-06T09:00:00.000Z',
  },
];

/**
 * Generate initial sample schedule following the NOC reference pattern from the user brief
 * - Pagi, Sore, Malam, and Sore+Malam (SM) patterns
 */
export function generateSeedSchedule(): ScheduleAssignment[] {
  const assignments: ScheduleAssignment[] = [];
  const year = 2026;
  const month = 10; // October 2026
  const daysInMonth = 31;

  // Pattern sequences for realistic 24/7 NOC coverage
  // Staff: 
  // Ramlan: P P Libur S S M M P P Libur S S M M ...
  // Rafi: P Libur S S M M P P Libur S S M M P ...
  // Tengku: P P P M M M SM S S Libur P P ...
  // Asep Ryuat: Libur S S P P P M SM S Libur ...
  // Hafidz: M M S S P P P SM Libur Libur M M ...
  // Daffa: SM SM M M S S S S Libur P P ...

  const patterns: Record<string, string[]> = {
    'staff-1': ['P', 'P', 'L', 'S', 'S', 'M', 'M', 'P', 'P', 'L', 'S', 'S', 'M', 'M', 'P', 'P', 'L', 'S', 'S', 'M', 'M', 'P', 'P', 'L', 'S', 'S', 'M', 'M', 'P', 'P', 'L'],
    'staff-2': ['P', 'L', 'S', 'S', 'M', 'M', 'P', 'P', 'L', 'S', 'S', 'M', 'M', 'P', 'P', 'L', 'S', 'S', 'M', 'M', 'P', 'P', 'L', 'S', 'S', 'M', 'M', 'P', 'P', 'L', 'S'],
    'staff-3': ['P', 'P', 'P', 'M', 'M', 'M', 'SM', 'S', 'S', 'L', 'P', 'P', 'P', 'M', 'M', 'M', 'SM', 'S', 'S', 'L', 'P', 'P', 'P', 'M', 'M', 'M', 'SM', 'S', 'S', 'L', 'P'],
    'staff-4': ['L', 'S', 'S', 'P', 'P', 'P', 'M', 'SM', 'S', 'L', 'L', 'S', 'S', 'P', 'P', 'P', 'M', 'SM', 'S', 'L', 'L', 'S', 'S', 'P', 'P', 'P', 'M', 'SM', 'S', 'L', 'L'],
    'staff-5': ['M', 'M', 'S', 'S', 'P', 'P', 'P', 'SM', 'L', 'L', 'M', 'M', 'S', 'S', 'P', 'P', 'P', 'SM', 'L', 'L', 'M', 'M', 'S', 'S', 'P', 'P', 'P', 'SM', 'L', 'L', 'M'],
    'staff-6': ['SM', 'SM', 'M', 'M', 'S', 'S', 'S', 'S', 'L', 'P', 'SM', 'SM', 'M', 'M', 'S', 'S', 'S', 'S', 'L', 'P', 'SM', 'SM', 'M', 'M', 'S', 'S', 'S', 'S', 'L', 'P', 'P'],
  };

  let counter = 1;
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;

    for (const [staffId, patternList] of Object.entries(patterns)) {
      const code = patternList[(day - 1) % patternList.length];
      const now = new Date().toISOString();

      if (code === 'P') {
        assignments.push({
          id: `seed-${counter++}`,
          staffId,
          date: dateStr,
          shiftId: 'pagi',
          createdAt: now,
          updatedAt: now,
        });
      } else if (code === 'S') {
        assignments.push({
          id: `seed-${counter++}`,
          staffId,
          date: dateStr,
          shiftId: 'sore',
          createdAt: now,
          updatedAt: now,
        });
      } else if (code === 'M') {
        assignments.push({
          id: `seed-${counter++}`,
          staffId,
          date: dateStr,
          shiftId: 'malam',
          createdAt: now,
          updatedAt: now,
        });
      } else if (code === 'SM') {
        // Sore + Malam are TWO separate database assignments!
        assignments.push({
          id: `seed-${counter++}`,
          staffId,
          date: dateStr,
          shiftId: 'sore',
          createdAt: now,
          updatedAt: now,
        });
        assignments.push({
          id: `seed-${counter++}`,
          staffId,
          date: dateStr,
          shiftId: 'malam',
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  return assignments;
}

// Storage Operations
export const LocalDB = {
  init(): void {
    // Safe Data Migration: If user already has data in previous keys, preserve and migrate it to prod keys!
    try {
      const legacyPairs: [string, string[]][] = [
        [STORAGE_KEYS.STAFF, ['noc_roster_staff_v1']],
        [STORAGE_KEYS.SCHEDULES, ['noc_roster_schedules_v1']],
        [STORAGE_KEYS.LEAVES, ['noc_roster_leaves_v2', 'noc_roster_leaves_v1']],
        [STORAGE_KEYS.HOLIDAYS, ['noc_roster_holidays_v1']],
        [STORAGE_KEYS.SETTINGS, ['noc_roster_settings_v2', 'noc_roster_settings_v1']],
        [STORAGE_KEYS.DELEGATIONS, ['noc_roster_delegations_v1']],
      ];

      for (const [prodKey, oldKeys] of legacyPairs) {
        if (!localStorage.getItem(prodKey)) {
          for (const oldKey of oldKeys) {
            const oldData = localStorage.getItem(oldKey);
            if (oldData) {
              // Safely migrate the user's data to the new key so nothing is lost!
              localStorage.setItem(prodKey, oldData);
              break;
            }
          }
        }
      }
    } catch {
      // ignore storage access errors
    }

    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      if (!localStorage.getItem(STORAGE_KEYS.STAFF)) LocalDB.saveStaff(DEFAULT_STAFF);
      if (!localStorage.getItem(STORAGE_KEYS.SCHEDULES)) LocalDB.saveSchedules(generateSeedSchedule());
      if (!localStorage.getItem(STORAGE_KEYS.LEAVES)) LocalDB.saveLeaves(DEFAULT_LEAVES);
      if (!localStorage.getItem(STORAGE_KEYS.HOLIDAYS)) LocalDB.saveHolidays(DEFAULT_HOLIDAYS);
      if (!localStorage.getItem(STORAGE_KEYS.DELEGATIONS)) LocalDB.saveDelegations(DEFAULT_DELEGATIONS);
      if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) LocalDB.saveSettings(DEFAULT_SETTINGS);
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  },

  clearCacheAndReinit(): void {
    try {
      // Clear all noc_roster related keys
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('noc_roster')) {
          localStorage.removeItem(k);
        }
      });
    } catch {
      // ignore
    }

    LocalDB.saveStaff(DEFAULT_STAFF);
    LocalDB.saveSchedules(generateSeedSchedule());
    LocalDB.saveLeaves(DEFAULT_LEAVES);
    LocalDB.saveHolidays(DEFAULT_HOLIDAYS);
    LocalDB.saveDelegations(DEFAULT_DELEGATIONS);
    LocalDB.saveSettings(DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  },

  resetToDefaults(): void {
    LocalDB.clearCacheAndReinit();
  },

  getStaff(): Staff[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
      if (!raw) return DEFAULT_STAFF;
      const data: Staff[] = JSON.parse(raw);
      return data.sort((a, b) => a.order - b.order);
    } catch {
      return DEFAULT_STAFF;
    }
  },

  saveStaff(staff: Staff[]): void {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
  },

  getSchedules(): ScheduleAssignment[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveSchedules(schedules: ScheduleAssignment[]): void {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  },

  getLeaves(): Leave[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LEAVES);
      if (!raw) return DEFAULT_LEAVES;
      return JSON.parse(raw);
    } catch {
      return DEFAULT_LEAVES;
    }
  },

  saveLeaves(leaves: Leave[]): void {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
  },

  getHolidays(): Holiday[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HOLIDAYS);
      if (!raw) return DEFAULT_HOLIDAYS;
      return JSON.parse(raw);
    } catch {
      return DEFAULT_HOLIDAYS;
    }
  },

  saveHolidays(holidays: Holiday[]): void {
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(holidays));
  },

  getSettings(): WorkRulesSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        shifts: {
          ...DEFAULT_SHIFTS,
          ...(parsed.shifts || {}),
        },
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: WorkRulesSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getDelegations(): DelegationLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DELEGATIONS);
      if (!raw) return DEFAULT_DELEGATIONS;
      return JSON.parse(raw);
    } catch {
      return DEFAULT_DELEGATIONS;
    }
  },

  saveDelegations(delegations: DelegationLog[]): void {
    localStorage.setItem(STORAGE_KEYS.DELEGATIONS, JSON.stringify(delegations));
  },

  exportDatabase(): string {
    const backup = {
      staff: LocalDB.getStaff(),
      schedules: LocalDB.getSchedules(),
      leaves: LocalDB.getLeaves(),
      holidays: LocalDB.getHolidays(),
      settings: LocalDB.getSettings(),
      delegations: LocalDB.getDelegations(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    return JSON.stringify(backup, null, 2);
  },

  importDatabase(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.staff && Array.isArray(parsed.staff)) LocalDB.saveStaff(parsed.staff);
      if (parsed.schedules && Array.isArray(parsed.schedules)) LocalDB.saveSchedules(parsed.schedules);
      if (parsed.leaves && Array.isArray(parsed.leaves)) LocalDB.saveLeaves(parsed.leaves);
      if (parsed.holidays && Array.isArray(parsed.holidays)) LocalDB.saveHolidays(parsed.holidays);
      if (parsed.settings) LocalDB.saveSettings(parsed.settings);
      if (parsed.delegations && Array.isArray(parsed.delegations)) LocalDB.saveDelegations(parsed.delegations);
      return true;
    } catch (err) {
      console.error('Import database error:', err);
      return false;
    }
  },
};

// ==========================================
// Firestore Cloud Persistent Database
// ==========================================

export const FirestoreDB = {
  async initCloudData(): Promise<void> {
    const staffColPath = 'roster_staff';
    try {
      const snap = await getDocs(collection(db, staffColPath));
      if (!snap.empty) {
        // Cloud database is already populated
        return;
      }
    } catch (err) {
      console.warn('Initial cloud staff check failed, will attempt fallback seed:', err);
    }

    // First time cloud initialization:
    // Migrate existing local data (so user's current modifications are kept) or defaults
    const localStaff = LocalDB.getStaff();
    const localSchedules = LocalDB.getSchedules();
    const localLeaves = LocalDB.getLeaves();
    const localHolidays = LocalDB.getHolidays();
    const localDelegations = LocalDB.getDelegations();
    const localSettings = LocalDB.getSettings();

    const staffToSeed = localStaff.length > 0 ? localStaff : DEFAULT_STAFF;
    const schedulesToSeed = localSchedules.length > 0 ? localSchedules : generateSeedSchedule();
    const leavesToSeed = localLeaves.length > 0 ? localLeaves : DEFAULT_LEAVES;
    const holidaysToSeed = localHolidays.length > 0 ? localHolidays : DEFAULT_HOLIDAYS;
    const delegationsToSeed = localDelegations.length > 0 ? localDelegations : DEFAULT_DELEGATIONS;
    const settingsToSeed = localSettings || DEFAULT_SETTINGS;

    try {
      // 1. Seed Staff
      const staffBatch = writeBatch(db);
      for (const s of staffToSeed) {
        staffBatch.set(doc(db, 'roster_staff', s.id), {
          id: s.id,
          name: s.name,
          active: s.active,
          order: s.order,
          role: s.role || 'NOC Engineer',
          phone: s.phone || '',
        });
      }
      await staffBatch.commit();

      // 2. Seed Settings
      await setDoc(doc(db, 'roster_settings', 'global'), {
        id: 'global',
        timezone: settingsToSeed.timezone || 'Asia/Jakarta',
        region: settingsToSeed.region || 'Jawa Barat',
        targetHoursPerMonth: settingsToSeed.targetHoursPerMonth || 168,
        workDaysPerWeek: settingsToSeed.workDaysPerWeek || 5,
        autoCalculateOvertime: settingsToSeed.autoCalculateOvertime ?? true,
        backgroundTheme: settingsToSeed.backgroundTheme || 'auto',
        bgDarkOverlay: settingsToSeed.bgDarkOverlay ?? 75,
        bgBlur: settingsToSeed.bgBlur ?? 6,
        shifts: settingsToSeed.shifts || DEFAULT_SHIFTS,
      });

      // 3. Seed Holidays
      const holidayBatch = writeBatch(db);
      for (const h of holidaysToSeed) {
        holidayBatch.set(doc(db, 'roster_holidays', h.id), {
          id: h.id,
          date: h.date,
          name: h.name,
          type: h.type,
          region: h.region,
        });
      }
      await holidayBatch.commit();

      // 4. Seed Delegations
      const delBatch = writeBatch(db);
      for (const d of delegationsToSeed) {
        delBatch.set(doc(db, 'roster_delegations', d.id), {
          id: d.id,
          title: d.title,
          content: d.content,
          authorName: d.authorName,
          assignedTo: d.assignedTo || '',
          priority: d.priority,
          status: d.status,
          dateStr: d.dateStr,
          timeStr: d.timeStr,
          createdAt: d.createdAt,
        });
      }
      await delBatch.commit();

      // 5. Seed Leaves
      if (leavesToSeed.length > 0) {
        const leaveBatch = writeBatch(db);
        for (const l of leavesToSeed) {
          leaveBatch.set(doc(db, 'roster_leaves', l.id), {
            id: l.id,
            staffId: l.staffId,
            dateStart: l.dateStart,
            dateEnd: l.dateEnd,
            type: l.type,
            notes: l.notes || '',
          });
        }
        await leaveBatch.commit();
      }

      // 6. Seed Schedules (in chunks of 200 for batch limit)
      const chunkSize = 200;
      for (let i = 0; i < schedulesToSeed.length; i += chunkSize) {
        const chunk = schedulesToSeed.slice(i, i + chunkSize);
        const schedBatch = writeBatch(db);
        for (const sc of chunk) {
          schedBatch.set(doc(db, 'roster_schedules', sc.id), {
            id: sc.id,
            staffId: sc.staffId,
            date: sc.date,
            shiftId: sc.shiftId,
            createdAt: sc.createdAt || new Date().toISOString(),
            updatedAt: sc.updatedAt || new Date().toISOString(),
          });
        }
        await schedBatch.commit();
      }
    } catch (err) {
      console.error('Error during initial cloud database seeding:', err);
    }
  },

  subscribeStaff(onData: (staff: Staff[]) => void): Unsubscribe {
    const colPath = 'roster_staff';
    return onSnapshot(
      collection(db, colPath),
      snapshot => {
        const list: Staff[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as Staff);
        });
        list.sort((a, b) => a.order - b.order);
        if (list.length > 0) {
          onData(list);
          LocalDB.saveStaff(list);
        }
      },
      error => {
        console.warn(`Firestore snapshot sync warning on ${colPath}:`, error);
      }
    );
  },

  subscribeSchedules(onData: (schedules: ScheduleAssignment[]) => void): Unsubscribe {
    const colPath = 'roster_schedules';
    return onSnapshot(
      collection(db, colPath),
      snapshot => {
        const list: ScheduleAssignment[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as ScheduleAssignment);
        });
        if (list.length > 0) {
          onData(list);
          LocalDB.saveSchedules(list);
        }
      },
      error => {
        console.warn(`Firestore snapshot sync warning on ${colPath}:`, error);
      }
    );
  },

  subscribeLeaves(onData: (leaves: Leave[]) => void): Unsubscribe {
    const colPath = 'roster_leaves';
    return onSnapshot(
      collection(db, colPath),
      snapshot => {
        const list: Leave[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as Leave);
        });
        onData(list);
        LocalDB.saveLeaves(list);
      },
      error => {
        console.warn(`Firestore snapshot sync warning on ${colPath}:`, error);
      }
    );
  },

  subscribeHolidays(onData: (holidays: Holiday[]) => void): Unsubscribe {
    const colPath = 'roster_holidays';
    return onSnapshot(
      collection(db, colPath),
      snapshot => {
        const list: Holiday[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as Holiday);
        });
        if (list.length > 0) {
          onData(list);
          LocalDB.saveHolidays(list);
        }
      },
      error => {
        console.warn(`Firestore snapshot sync warning on ${colPath}:`, error);
      }
    );
  },

  subscribeDelegations(onData: (delegations: DelegationLog[]) => void): Unsubscribe {
    const colPath = 'roster_delegations';
    return onSnapshot(
      collection(db, colPath),
      snapshot => {
        const list: DelegationLog[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as DelegationLog);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onData(list);
        LocalDB.saveDelegations(list);
      },
      error => {
        console.warn(`Firestore snapshot sync warning on ${colPath}:`, error);
      }
    );
  },

  subscribeSettings(onData: (settings: WorkRulesSettings) => void): Unsubscribe {
    const docPath = 'roster_settings/global';
    return onSnapshot(
      doc(db, 'roster_settings', 'global'),
      docSnap => {
        if (docSnap.exists()) {
          const cloudSettings = docSnap.data() as WorkRulesSettings;
          const merged: WorkRulesSettings = {
            ...DEFAULT_SETTINGS,
            ...cloudSettings,
            shifts: {
              ...DEFAULT_SHIFTS,
              ...(cloudSettings.shifts || {}),
            },
          };
          onData(merged);
          LocalDB.saveSettings(merged);
        }
      },
      error => {
        console.warn(`Firestore snapshot sync warning on ${docPath}:`, error);
      }
    );
  },

  async saveStaff(staff: Staff): Promise<void> {
    const docPath = `roster_staff/${staff.id}`;
    try {
      await setDoc(doc(db, 'roster_staff', staff.id), {
        id: staff.id,
        name: staff.name,
        active: staff.active,
        order: staff.order,
        role: staff.role || 'NOC Engineer',
        phone: staff.phone || '',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  },

  async saveStaffList(staffList: Staff[]): Promise<void> {
    const colPath = 'roster_staff';
    try {
      const existingSnap = await getDocs(collection(db, colPath));
      const newIds = new Set(staffList.map(s => s.id));
      const batch = writeBatch(db);
      existingSnap.forEach(d => {
        if (!newIds.has(d.id)) {
          batch.delete(d.ref);
        }
      });
      for (const s of staffList) {
        batch.set(doc(db, 'roster_staff', s.id), {
          id: s.id,
          name: s.name,
          active: s.active,
          order: s.order,
          role: s.role || 'NOC Engineer',
          phone: s.phone || '',
        });
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, colPath);
    }
  },

  async deleteStaff(id: string): Promise<void> {
    const docPath = `roster_staff/${id}`;
    try {
      await deleteDoc(doc(db, 'roster_staff', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  },

  async saveSchedules(schedules: ScheduleAssignment[]): Promise<void> {
    const colPath = 'roster_schedules';
    try {
      const existingSnap = await getDocs(collection(db, colPath));
      const newIds = new Set(schedules.map(s => s.id));
      const toDeleteIds: string[] = [];
      existingSnap.forEach(d => {
        if (!newIds.has(d.id)) {
          toDeleteIds.push(d.id);
        }
      });

      // 1. Delete removed schedules in batches
      const delChunkSize = 200;
      for (let i = 0; i < toDeleteIds.length; i += delChunkSize) {
        const chunk = toDeleteIds.slice(i, i + delChunkSize);
        const batch = writeBatch(db);
        for (const id of chunk) {
          batch.delete(doc(db, colPath, id));
        }
        await batch.commit();
      }

      // 2. Write new / updated schedules in batches
      const writeChunkSize = 200;
      for (let i = 0; i < schedules.length; i += writeChunkSize) {
        const chunk = schedules.slice(i, i + writeChunkSize);
        const batch = writeBatch(db);
        for (const sc of chunk) {
          batch.set(doc(db, colPath, sc.id), {
            id: sc.id,
            staffId: sc.staffId,
            date: sc.date,
            shiftId: sc.shiftId,
            createdAt: sc.createdAt || new Date().toISOString(),
            updatedAt: sc.updatedAt || new Date().toISOString(),
          });
        }
        await batch.commit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, colPath);
    }
  },

  async deleteSchedule(id: string): Promise<void> {
    const docPath = `roster_schedules/${id}`;
    try {
      await deleteDoc(doc(db, 'roster_schedules', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  },

  async saveLeave(leave: Leave): Promise<void> {
    const docPath = `roster_leaves/${leave.id}`;
    try {
      await setDoc(doc(db, 'roster_leaves', leave.id), {
        id: leave.id,
        staffId: leave.staffId,
        dateStart: leave.dateStart,
        dateEnd: leave.dateEnd,
        type: leave.type,
        notes: leave.notes || '',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  },

  async saveLeavesBatch(leaves: Leave[]): Promise<void> {
    const colPath = 'roster_leaves';
    try {
      const batch = writeBatch(db);
      for (const l of leaves) {
        batch.set(doc(db, 'roster_leaves', l.id), {
          id: l.id,
          staffId: l.staffId,
          dateStart: l.dateStart,
          dateEnd: l.dateEnd,
          type: l.type,
          notes: l.notes || '',
        });
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, colPath);
    }
  },

  async deleteLeave(id: string): Promise<void> {
    const docPath = `roster_leaves/${id}`;
    try {
      await deleteDoc(doc(db, 'roster_leaves', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  },

  async saveHoliday(holiday: Holiday): Promise<void> {
    const docPath = `roster_holidays/${holiday.id}`;
    try {
      await setDoc(doc(db, 'roster_holidays', holiday.id), {
        id: holiday.id,
        date: holiday.date,
        name: holiday.name,
        type: holiday.type,
        region: holiday.region,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  },

  async deleteHoliday(id: string): Promise<void> {
    const docPath = `roster_holidays/${id}`;
    try {
      await deleteDoc(doc(db, 'roster_holidays', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  },

  async saveDelegation(delegation: DelegationLog): Promise<void> {
    const docPath = `roster_delegations/${delegation.id}`;
    try {
      await setDoc(doc(db, 'roster_delegations', delegation.id), {
        id: delegation.id,
        title: delegation.title,
        content: delegation.content,
        authorName: delegation.authorName,
        assignedTo: delegation.assignedTo || '',
        priority: delegation.priority,
        status: delegation.status,
        dateStr: delegation.dateStr,
        timeStr: delegation.timeStr,
        createdAt: delegation.createdAt,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  },

  async deleteDelegation(id: string): Promise<void> {
    const docPath = `roster_delegations/${id}`;
    try {
      await deleteDoc(doc(db, 'roster_delegations', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  },

  async saveSettings(settings: WorkRulesSettings): Promise<void> {
    const docPath = 'roster_settings/global';
    try {
      await setDoc(doc(db, 'roster_settings', 'global'), {
        id: 'global',
        timezone: settings.timezone || 'Asia/Jakarta',
        region: settings.region || 'Jawa Barat',
        targetHoursPerMonth: settings.targetHoursPerMonth || 168,
        workDaysPerWeek: settings.workDaysPerWeek || 5,
        autoCalculateOvertime: settings.autoCalculateOvertime ?? true,
        backgroundTheme: settings.backgroundTheme || 'auto',
        bgDarkOverlay: settings.bgDarkOverlay ?? 75,
        bgBlur: settings.bgBlur ?? 6,
        shifts: settings.shifts || DEFAULT_SHIFTS,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  },

  async importDatabase(jsonStr: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') return false;

      const staff: Staff[] = Array.isArray(parsed.staff) ? parsed.staff : [];
      const schedules: ScheduleAssignment[] = Array.isArray(parsed.schedules) ? parsed.schedules : [];
      const leaves: Leave[] = Array.isArray(parsed.leaves) ? parsed.leaves : [];
      const holidays: Holiday[] = Array.isArray(parsed.holidays) ? parsed.holidays : [];
      const delegations: DelegationLog[] = Array.isArray(parsed.delegations) ? parsed.delegations : [];
      const settings: WorkRulesSettings = parsed.settings || DEFAULT_SETTINGS;

      // 1. Reconcile / replace Staff in Firestore
      if (staff.length > 0) {
        await FirestoreDB.saveStaffList(staff);
      }

      // 2. Reconcile / replace Schedules in Firestore
      await FirestoreDB.saveSchedules(schedules);

      // 3. Reconcile / replace Leaves in Firestore
      await FirestoreDB.saveLeavesBatch(leaves);

      // 4. Reconcile / replace Holidays in Firestore
      if (holidays.length > 0) {
        const hSnap = await getDocs(collection(db, 'roster_holidays'));
        const hNewIds = new Set(holidays.map(h => h.id));
        const hBatch = writeBatch(db);
        hSnap.forEach(d => {
          if (!hNewIds.has(d.id)) hBatch.delete(d.ref);
        });
        for (const h of holidays) {
          hBatch.set(doc(db, 'roster_holidays', h.id), {
            id: h.id,
            date: h.date,
            name: h.name,
            type: h.type,
            region: h.region || 'Nasional',
          });
        }
        await hBatch.commit();
      }

      // 5. Reconcile / replace Delegations in Firestore
      if (delegations.length > 0) {
        const dSnap = await getDocs(collection(db, 'roster_delegations'));
        const dNewIds = new Set(delegations.map(d => d.id));
        const dBatch = writeBatch(db);
        dSnap.forEach(d => {
          if (!dNewIds.has(d.id)) dBatch.delete(d.ref);
        });
        for (const d of delegations) {
          dBatch.set(doc(db, 'roster_delegations', d.id), {
            id: d.id,
            title: d.title,
            content: d.content,
            authorName: d.authorName,
            assignedTo: d.assignedTo || '',
            priority: d.priority || 'normal',
            status: d.status || 'pending',
            dateStr: d.dateStr,
            timeStr: d.timeStr,
            createdAt: d.createdAt || new Date().toISOString(),
          });
        }
        await dBatch.commit();
      }

      // 6. Save Settings in Firestore
      await FirestoreDB.saveSettings(settings);

      // 7. Also update LocalDB cache
      LocalDB.importDatabase(jsonStr);

      return true;
    } catch (err) {
      console.error('FirestoreDB.importDatabase error:', err);
      return false;
    }
  },

  async clearCloudDatabase(): Promise<void> {
    const collections = ['roster_staff', 'roster_schedules', 'roster_leaves', 'roster_holidays', 'roster_delegations'];
    for (const colName of collections) {
      const snap = await getDocs(collection(db, colName));
      const batch = writeBatch(db);
      snap.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  },
};

