import React, { useState } from 'react';
import { Staff, Leave, Holiday, WorkRulesSettings, DynamicBgTheme, ShiftType } from '../../types';
import { LocalDB } from '../../services/db';
import {
  Users,
  Clock,
  CalendarOff,
  Palmtree,
  Sliders,
  Image as ImageIcon,
  Database,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Check,
  Download,
  Upload,
  RotateCcw,
} from 'lucide-react';

interface SettingsViewProps {
  staffList: Staff[];
  leaves: Leave[];
  holidays: Holiday[];
  settings: WorkRulesSettings;
  onAddStaff: (name: string, role?: string, phone?: string) => void;
  onUpdateStaff: (id: string, updates: Partial<Staff>) => void;
  onDeleteStaff: (id: string) => void;
  onReorderStaff: (id: string, direction: 'up' | 'down') => void;
  onAddLeave: (leave: Omit<Leave, 'id'>) => void;
  onDeleteLeave: (id: string) => void;
  onAddHoliday: (holiday: Omit<Holiday, 'id'>) => void;
  onDeleteHoliday: (id: string) => void;
  onUpdateSettings: (newSettings: Partial<WorkRulesSettings>) => void;
  onResetToSample: () => void;
  onReloadAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  staffList,
  leaves,
  holidays,
  settings,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onReorderStaff,
  onAddLeave,
  onDeleteLeave,
  onAddHoliday,
  onDeleteHoliday,
  onUpdateSettings,
  onResetToSample,
  onReloadAll,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'staff' | 'shifts' | 'leaves' | 'holidays' | 'rules' | 'appearance' | 'database'>('staff');

  // Staff Form State
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('NOC Engineer');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffRole, setEditStaffRole] = useState('');

  // Leave Form State
  const [newLeaveStaffId, setNewLeaveStaffId] = useState(staffList[0]?.id || '');
  const [newLeaveDateStart, setNewLeaveDateStart] = useState('2026-10-15');
  const [newLeaveDateEnd, setNewLeaveDateEnd] = useState('2026-10-16');
  const [newLeaveType, setNewLeaveType] = useState<Leave['type']>('Tahunan');
  const [newLeaveNotes, setNewLeaveNotes] = useState('');

  // Holiday Form State
  const [newHolDate, setNewHolDate] = useState('2026-10-06');
  const [newHolName, setNewHolName] = useState('');
  const [newHolType, setNewHolType] = useState<Holiday['type']>('Nasional');
  const [newHolRegion, setNewHolRegion] = useState('Jawa Barat');

  // Toast
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Staff Actions
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    onAddStaff(newStaffName, newStaffRole, newStaffPhone);
    setNewStaffName('');
    setNewStaffPhone('');
    showFeedback('Staff berhasil ditambahkan');
  };

  const handleSaveEditStaff = (id: string) => {
    if (!editStaffName.trim()) return;
    onUpdateStaff(id, { name: editStaffName.trim(), role: editStaffRole.trim() });
    setEditingStaffId(null);
    showFeedback('Data staff diperbarui');
  };

  // Leave Actions
  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveStaffId || !newLeaveDateStart || !newLeaveDateEnd) return;
    onAddLeave({
      staffId: newLeaveStaffId,
      dateStart: newLeaveDateStart,
      dateEnd: newLeaveDateEnd,
      type: newLeaveType,
      notes: newLeaveNotes,
    });
    setNewLeaveNotes('');
    showFeedback('Pengajuan cuti disimpan');
  };

  // Holiday Actions
  const handleCreateHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolDate || !newHolName.trim()) return;
    onAddHoliday({
      date: newHolDate,
      name: newHolName.trim(),
      type: newHolType,
      region: newHolType === 'Regional' ? newHolRegion : 'Nasional',
    });
    setNewHolName('');
    showFeedback('Hari libur berhasil ditambahkan');
  };

  // Export / Import JSON
  const handleExport = () => {
    const jsonStr = LocalDB.exportDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `noc_roster_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    showFeedback('Data roster berhasil diexport!');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = LocalDB.importDatabase(content);
      if (success) {
        onReloadAll();
        showFeedback('Data roster berhasil diimpor!');
      } else {
        showFeedback('Gagal mengimpor file backup.');
      }
    };
    reader.readAsText(file);
  };

  const subTabs: { id: typeof activeSubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'staff', label: 'Team NOC', icon: <Users className="w-4 h-4" /> },
    { id: 'shifts', label: 'Konfigurasi Shift', icon: <Clock className="w-4 h-4" /> },
    { id: 'leaves', label: 'Kelola Cuti', icon: <CalendarOff className="w-4 h-4" /> },
    { id: 'holidays', label: 'Hari Libur', icon: <Palmtree className="w-4 h-4" /> },
    { id: 'rules', label: 'Aturan Jam Kerja', icon: <Sliders className="w-4 h-4" /> },
    { id: 'appearance', label: 'Tampilan & Background', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'database', label: 'Backup & Database', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {feedback && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500 text-white shadow-2xl flex items-center gap-3 animate-in fade-in duration-200">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-2 shadow-xl flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeSubTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SUBTAB CONTENT */}

      {/* 1. TEAM NOC */}
      {activeSubTab === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Staff Form */}
          <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Tambah Personel NOC</span>
            </h3>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={newStaffName}
                  onChange={e => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Jabatan / Role</label>
                <input
                  type="text"
                  placeholder="Contoh: NOC Engineer, Network Specialist"
                  value={newStaffRole}
                  onChange={e => setNewStaffRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Nomor Kontak / WhatsApp (Opsional)</label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={newStaffPhone}
                  onChange={e => setNewStaffPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
              >
                Tambah ke Daftar Staff
              </button>
            </form>
          </div>

          {/* Staff List & Ordering */}
          <div className="lg:col-span-7 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Daftar Personel Aktif ({staffList.length})</span>
              </h3>
              <span className="text-xs text-slate-400">Gunakan panah untuk mengatur urutan baris</span>
            </div>

            <div className="space-y-2">
              {staffList.map((staff, idx) => (
                <div
                  key={staff.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    staff.active
                      ? 'bg-slate-950/40 border-slate-800'
                      : 'bg-slate-950/20 border-slate-800/40 opacity-50'
                  }`}
                >
                  {editingStaffId === staff.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editStaffName}
                        onChange={e => setEditStaffName(e.target.value)}
                        className="px-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white"
                      />
                      <input
                        type="text"
                        value={editStaffRole}
                        onChange={e => setEditStaffRole(e.target.value)}
                        className="px-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white"
                      />
                      <button
                        onClick={() => handleSaveEditStaff(staff.id)}
                        className="px-2 py-1 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setEditingStaffId(null)}
                        className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-400 font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{staff.name}</span>
                          {!staff.active && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {staff.role || 'NOC Engineer'} {staff.phone ? `· ${staff.phone}` : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onReorderStaff(staff.id, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                      title="Geser ke Atas"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onReorderStaff(staff.id, 'down')}
                      disabled={idx === staffList.length - 1}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                      title="Geser ke Bawah"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingStaffId(staff.id);
                        setEditStaffName(staff.name);
                        setEditStaffRole(staff.role || '');
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateStaff(staff.id, { active: !staff.active })}
                      className={`px-2 py-1 text-[11px] font-semibold rounded-lg ${
                        staff.active
                          ? 'bg-slate-800 text-slate-400 hover:text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                      title={staff.active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {staff.active ? 'Matikan' : 'Aktifkan'}
                    </button>
                    <button
                      onClick={() => onDeleteStaff(staff.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. SHIFT CONFIGURATION */}
      {activeSubTab === 'shifts' && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="font-bold text-base text-white">Konfigurasi Jam & Durasi Shift</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Atur jam kerja standar operasional NOC 24/7 (Pagi, Sore, Malam).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* PAGI */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    P
                  </span>
                  <span className="font-bold text-sm text-amber-300 uppercase">SHIFT PAGI</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={settings.shifts.pagi.startTime}
                    onChange={e =>
                      onUpdateSettings({
                        shifts: {
                          ...settings.shifts,
                          pagi: { ...settings.shifts.pagi, startTime: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={settings.shifts.pagi.endTime}
                    onChange={e =>
                      onUpdateSettings({
                        shifts: {
                          ...settings.shifts,
                          pagi: { ...settings.shifts.pagi, endTime: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Durasi Kerja (Jam)</label>
                  <input
                    type="number"
                    value={settings.shifts.pagi.durationHours}
                    onChange={e =>
                      onUpdateSettings({
                        shifts: {
                          ...settings.shifts,
                          pagi: { ...settings.shifts.pagi, durationHours: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SETENGAH HARI */}
            <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-violet-500 text-white font-black text-xs flex items-center justify-center">
                    SH
                  </span>
                  <span className="font-bold text-sm text-violet-300 uppercase">STENGAH HARI</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={settings.shifts.setengah_hari?.startTime || '08:00'}
                    onChange={e =>
                      onUpdateSettings({
                        shifts: {
                          ...settings.shifts,
                          setengah_hari: {
                            ...(settings.shifts.setengah_hari || {
                              id: 'setengah_hari',
                              name: 'Setengah Hari',
                              code: 'SH',
                              color: '#8B5CF6',
                              startTime: '08:00',
                              endTime: '13:00',
                              durationHours: 5,
                            }),
                            startTime: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={settings.shifts.setengah_hari?.endTime || '13:00'}
                    onChange={e =>
                      onUpdateSettings({
                        shifts: {
                          ...settings.shifts,
                          setengah_hari: {
                            ...(settings.shifts.setengah_hari || {
                              id: 'setengah_hari',
                              name: 'Setengah Hari',
                              code: 'SH',
                              color: '#8B5CF6',
                              startTime: '08:00',
                              endTime: '13:00',
                              durationHours: 5,
                            }),
                            endTime: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Durasi Kerja (Jam)</label>
                  <input
                    type="number"
                    value={settings.shifts.setengah_hari?.durationHours ?? 5}
                    onChange={e =>
                      onUpdateSettings({
                        shifts: {
                          ...settings.shifts,
                          setengah_hari: {
                            ...(settings.shifts.setengah_hari || {
                              id: 'setengah_hari',
                              name: 'Setengah Hari',
                              code: 'SH',
                              color: '#8B5CF6',
                              startTime: '08:00',
                              endTime: '13:00',
                              durationHours: 5,
                            }),
                            durationHours: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SORE */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                    S
                  </span>
                  <span className="font-bold text-sm text-emerald-300 uppercase">SHIFT SORE</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={settings.shifts.sore.startTime}
                    onChange={e =>
                      onUpdateSettings({
                        shifts: {
                          ...settings.shifts,
                          sore: { ...settings.shifts.sore, startTime: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={settings.shifts.sore.endTime}
                    onChange={e =>
                      onUpdateSettings({
                        shifts: {
                          ...settings.shifts,
                          sore: { ...settings.shifts.sore, endTime: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Durasi Kerja (Jam)</label>
                  <input
                    type="number"
                    value={settings.shifts.sore.durationHours}
                    onChange={e =>
                      onUpdateSettings({
                        shifts: {
                          ...settings.shifts,
                          sore: { ...settings.shifts.sore, durationHours: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* MALAM */}
            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-sky-500 text-white font-black text-xs flex items-center justify-center">
                    M
                  </span>
                  <span className="font-bold text-sm text-sky-300 uppercase">SHIFT MALAM</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={settings.shifts.malam.startTime}
                    onChange={e =>
                      onUpdateSettings({
                        shifts: {
                          ...settings.shifts,
                          malam: { ...settings.shifts.malam, startTime: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={settings.shifts.malam.endTime}
                    onChange={e =>
                      onUpdateSettings({
                        shifts: {
                          ...settings.shifts,
                          malam: { ...settings.shifts.malam, endTime: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Durasi Kerja (Jam)</label>
                  <input
                    type="number"
                    value={settings.shifts.malam.durationHours}
                    onChange={e =>
                      onUpdateSettings({
                        shifts: {
                          ...settings.shifts,
                          malam: { ...settings.shifts.malam, durationHours: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. KELOLA CUTI */}
      {activeSubTab === 'leaves' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Leave Form */}
          <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <CalendarOff className="w-4 h-4 text-rose-400" />
              <span>Input Pengajuan Cuti</span>
            </h3>

            <form onSubmit={handleCreateLeave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Pilih Personel</label>
                <select
                  value={newLeaveStaffId}
                  onChange={e => setNewLeaveStaffId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={newLeaveDateStart}
                    onChange={e => setNewLeaveDateStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={newLeaveDateEnd}
                    onChange={e => setNewLeaveDateEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Jenis Cuti</label>
                <select
                  value={newLeaveType}
                  onChange={e => setNewLeaveType(e.target.value as Leave['type'])}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Tahunan">Cuti Tahunan</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin / Urusan Penting</option>
                  <option value="Cuti Bersama">Cuti Bersama</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Keterangan / Alasan</label>
                <input
                  type="text"
                  placeholder="Keterangan singkat..."
                  value={newLeaveNotes}
                  onChange={e => setNewLeaveNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold transition-all shadow-md shadow-rose-500/20"
              >
                Simpan Cuti
              </button>
            </form>
          </div>

          {/* Leaves List */}
          <div className="lg:col-span-7 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center justify-between pb-3 border-b border-slate-800">
              <span>Riwayat Cuti Terdaftar ({leaves.length})</span>
            </h3>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {leaves.map(leave => {
                const staff = staffList.find(s => s.id === leave.staffId);
                return (
                  <div
                    key={leave.id}
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-rose-300">
                          {staff?.name || 'Unknown'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-semibold">
                          {leave.type}
                        </span>
                      </div>
                      <p className="text-slate-400 font-mono mt-0.5">
                        {leave.dateStart} s/d {leave.dateEnd}
                      </p>
                      {leave.notes && <p className="text-slate-400 italic mt-0.5">{leave.notes}</p>}
                    </div>

                    <button
                      onClick={() => onDeleteLeave(leave.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      title="Hapus Cuti"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {leaves.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  Belum ada data cuti terdaftar.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. HARI LIBUR */}
      {activeSubTab === 'holidays' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Holiday Form */}
          <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-rose-400" />
              <span>Tambah Hari Libur</span>
            </h3>

            <form onSubmit={handleCreateHoliday} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  value={newHolDate}
                  onChange={e => setNewHolDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Nama Hari Libur</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hari Kemerdekaan RI, HUT Kota"
                  value={newHolName}
                  onChange={e => setNewHolName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Jenis Libur</label>
                <select
                  value={newHolType}
                  onChange={e => setNewHolType(e.target.value as Holiday['type'])}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Nasional">Hari Libur Nasional</option>
                  <option value="Regional">Hari Libur Regional (Jawa Barat)</option>
                  <option value="Cuti Bersama">Cuti Bersama</option>
                </select>
              </div>

              {newHolType === 'Regional' && (
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Wilayah / Daerah</label>
                  <input
                    type="text"
                    value={newHolRegion}
                    onChange={e => setNewHolRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold transition-all shadow-md shadow-rose-500/20"
              >
                Simpan Hari Libur
              </button>
            </form>
          </div>

          {/* Holiday List */}
          <div className="lg:col-span-7 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center justify-between pb-3 border-b border-slate-800">
              <span>Daftar Hari Libur Nasional & Jawa Barat ({holidays.length})</span>
            </h3>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {holidays
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(hol => (
                  <div
                    key={hol.id}
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{hol.name}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                            hol.type === 'Regional'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {hol.type} {hol.region ? `· ${hol.region}` : ''}
                        </span>
                      </div>
                      <p className="text-slate-400 font-mono mt-0.5">{hol.date}</p>
                    </div>

                    <button
                      onClick={() => onDeleteHoliday(hol.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. ATURAN JAM KERJA */}
      {activeSubTab === 'rules' && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="font-bold text-base text-white">Aturan Jam Kerja & Perhitungan Overtime</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Parameter untuk menghitung target jam kerja bulanan dan selisih lembur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Target Jam Kerja Per Bulan (Default)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.targetHoursPerMonth}
                    onChange={e => onUpdateSettings({ targetHoursPerMonth: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm"
                  />
                  <span className="text-slate-400 font-medium">Jam</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Standar umum: 168 Jam (21 hari kerja × 8 jam)
                </p>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Pola Basis Hari Kerja Mingguan
                </label>
                <select
                  value={settings.workDaysPerWeek}
                  onChange={e => onUpdateSettings({ workDaysPerWeek: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value={5}>5 Hari Kerja (Senin - Jumat)</option>
                  <option value={6}>6 Hari Kerja (Senin - Sabtu)</option>
                  <option value={7}>7 Hari Kalender (Rotasi 24/7 Penuh)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Wilayah Regional Roster
                </label>
                <input
                  type="text"
                  value={settings.region}
                  onChange={e => onUpdateSettings({ region: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Timezone Standard
                </label>
                <input
                  type="text"
                  disabled
                  value="Asia/Jakarta (WIB / UTC+7)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAMPILAN & BACKGROUND */}
      {activeSubTab === 'appearance' && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="font-bold text-base text-white">Tampilan Visual & Background Dinamis</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sesuaikan background photorealistic ambient, kegelapan overlay, dan blur agar kalender tetap menjadi fokus utama.
            </p>
          </div>

          <div className="space-y-6 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-2">Mode Background Ambient</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'auto', label: 'Otomatis (WIB Realtime)', desc: 'Menyesuaikan siang/malam/weekend' },
                  { id: 'noc_day', label: 'NOC Office Day', desc: 'Suasana NOC siang hari' },
                  { id: 'noc_night', label: 'NOC Control Night', desc: 'Dark ambient server room' },
                  { id: 'weekend_day', label: 'Weekend Natural', desc: 'Suasana santai daylight' },
                  { id: 'weekend_night', label: 'Weekend Night Lounge', desc: 'Aesthetic cozy ambience' },
                  { id: 'none', label: 'Solid Minimalis', desc: 'Slate murni tanpa background' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => onUpdateSettings({ backgroundTheme: opt.id as DynamicBgTheme })}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      settings.backgroundTheme === opt.id
                        ? 'bg-amber-500/10 border-amber-500/50 text-white ring-1 ring-amber-500/30'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-100">{opt.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400 font-medium">Dark Overlay Opacity</label>
                  <span className="font-mono text-amber-400 font-bold">{settings.bgDarkOverlay ?? 0}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={settings.bgDarkOverlay ?? 0}
                  onChange={e => onUpdateSettings({ bgDarkOverlay: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                {/* Quick Opacity Presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[0, 25, 50, 75].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onUpdateSettings({ bgDarkOverlay: val })}
                      className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold transition-all ${
                        (settings.bgDarkOverlay ?? 0) === val
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-white/10 hover:bg-white/20 text-white/80 border border-white/15'
                      }`}
                    >
                      {val === 0 ? '0% (Jernih)' : `${val}%`}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Bisa diatur mulai dari 0% (gambar asli tanpa overlay gelap) hingga 100%.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400 font-medium">Background Blur</label>
                  <span className="font-mono text-amber-400 font-bold">{settings.bgBlur}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={settings.bgBlur}
                  onChange={e => onUpdateSettings({ bgBlur: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                {/* Quick Blur Presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[0, 4, 8, 12].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onUpdateSettings({ bgBlur: val })}
                      className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold transition-all ${
                        (settings.bgBlur ?? 0) === val
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-white/10 hover:bg-white/20 text-white/80 border border-white/15'
                      }`}
                    >
                      {val === 0 ? '0px (Tajam)' : `${val}px`}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Memberikan efek depth of field halus di belakang panel.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. DATABASE & BACKUP */}
      {activeSubTab === 'database' && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="font-bold text-base text-white">Database Lokal & Cadangan Data</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Semua data disimpan di media penyimpanan lokal peramban. Anda dapat mencadangkan atau memulihkan data kapan saja.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Export */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                <Download className="w-4 h-4" />
                <span>Export Backup (JSON)</span>
              </div>
              <p className="text-xs text-slate-400">
                Unduh seluruh data staff, shift, jadwal, cuti, dan holiday dalam format JSON.
              </p>
              <button
                onClick={handleExport}
                className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Unduh Backup
              </button>
            </div>

            {/* Import */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Upload className="w-4 h-4" />
                <span>Import Backup</span>
              </div>
              <p className="text-xs text-slate-400">
                Pulihkan data dari file JSON cadangan yang pernah Anda simpan sebelumnya.
              </p>
              <label className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center cursor-pointer text-center">
                Pilih File JSON
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>

            {/* Reset */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <RotateCcw className="w-4 h-4" />
                <span>Bersihkan Cache & Reset</span>
              </div>
              <p className="text-xs text-slate-400">
                Bersihkan cache lama peramban dan inisialisasi ulang database bersih untuk deployment.
              </p>
              <button
                onClick={() => {
                  if (confirm('Bersihkan seluruh cache browser dan inisialisasi ulang database NOC bersih?')) {
                    LocalDB.clearCacheAndReinit();
                    onReloadAll();
                    showFeedback('Cache browser berhasil dibersihkan & database diinisialisasi ulang');
                  }
                }}
                className="w-full py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 transition-colors cursor-pointer"
              >
                Bersihkan Cache & Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
