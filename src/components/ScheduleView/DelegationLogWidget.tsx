import React, { useState } from 'react';
import { DelegationLog, Staff } from '../../types';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  UserCheck,
  Send,
  X,
  Tag,
  ArrowRight,
} from 'lucide-react';

interface DelegationLogWidgetProps {
  delegations: DelegationLog[];
  staffList: Staff[];
  todayStr: string;
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
  onToggleStatus: (id: string) => void;
}

export const DelegationLogWidget: React.FC<DelegationLogWidgetProps> = ({
  delegations,
  staffList,
  todayStr,
  onAddDelegation,
  onDeleteDelegation,
  onToggleStatus,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<DelegationLog['priority']>('normal');

  const activeStaff = staffList.filter((s) => s.active);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const author = authorName || activeStaff[0]?.name || 'NOC Operator';
    onAddDelegation(title, content, author, assignedTo || undefined, priority, todayStr);

    // Reset Form
    setTitle('');
    setContent('');
    setAssignedTo('');
    setPriority('normal');
    setIsAdding(false);
  };

  const filteredLogs = delegations.filter((log) => {
    if (filter === 'pending') return log.status === 'pending' || log.status === 'in_progress';
    if (filter === 'done') return log.status === 'done';
    return true;
  });

  const pendingCount = delegations.filter((d) => d.status !== 'done').length;

  return (
    <div className="bg-slate-950/75 backdrop-blur-2xl border border-white/25 rounded-2xl p-5 shadow-2xl flex flex-col h-full text-white">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/15">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs">
              <FileText className="w-4 h-4" />
            </span>
            <h2 className="font-black text-base text-white tracking-wide uppercase drop-shadow-md">
              DELEGATION LOG
            </h2>
          </div>
          <p className="text-xs text-slate-300 font-medium mt-0.5 drop-shadow-sm">
            Catatan Serah Terima & Delegasi Task
          </p>
        </div>

        <button
          onClick={() => setIsAdding((prev) => !prev)}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
            isAdding
              ? 'bg-rose-500/30 hover:bg-rose-500/40 text-rose-200 border-rose-500/40'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 font-black'
          }`}
          title={isAdding ? 'Tutup Form' : 'Tambah Catatan Baru'}
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{isAdding ? 'Batal' : '+ Catat'}</span>
        </button>
      </div>

      {/* Filter Chips & Counter */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px]">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white/20 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua ({delegations.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'pending'
                ? 'bg-amber-500/30 text-amber-300 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('done')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'done'
                ? 'bg-emerald-500/30 text-emerald-300 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Selesai
          </button>
        </div>

        {pendingCount > 0 && (
          <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-sm animate-pulse">
            {pendingCount} Aktif
          </span>
        )}
      </div>

      {/* Add New Note Notepad Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 p-3.5 rounded-xl bg-slate-900/95 border border-amber-500/40 shadow-xl space-y-3 animate-in slide-in-from-top-2 duration-200 text-xs"
        >
          <div>
            <label className="block text-slate-300 font-bold mb-1">Judul / Task *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Monitoring Traffic Core Router"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-medium focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Catatan / Detail Handover *</label>
            <textarea
              required
              rows={3}
              placeholder="Tulis instruksi delegasi, update insiden, atau task berikutnya..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-medium focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Dari (Pembuat)</label>
              <select
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs"
              >
                <option value="">Pilih Staff...</option>
                {activeStaff.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Delegasi Ke</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs"
              >
                <option value="">Semua / Shift Berikutnya</option>
                {activeStaff.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Prioritas:</span>
              {(['normal', 'important', 'urgent'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    priority === p
                      ? p === 'urgent'
                        ? 'bg-rose-500 text-white font-black shadow-sm'
                        : p === 'important'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'bg-sky-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simpan</span>
            </button>
          </div>
        </form>
      )}

      {/* Delegation Logs List (Notepad Aesthetic) */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {filteredLogs.map((log) => {
          const isDone = log.status === 'done';
          const isInProgress = log.status === 'in_progress';

          return (
            <div
              key={log.id}
              className={`rounded-xl p-3.5 border transition-all duration-200 shadow-md ${
                isDone
                  ? 'bg-slate-950/60 border-slate-800 opacity-65'
                  : isInProgress
                  ? 'bg-slate-900/90 border-sky-500/40'
                  : 'bg-slate-900/90 border-amber-500/30'
              }`}
            >
              {/* Top Row: Title, Priority, Status, Delete */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Priority Badge */}
                    {log.priority === 'urgent' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black bg-rose-600 text-white shadow-xs uppercase">
                        URGENT
                      </span>
                    )}
                    {log.priority === 'important' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black bg-amber-500 text-slate-950 shadow-xs uppercase">
                        PENTING
                      </span>
                    )}

                    <h4
                      className={`font-black text-sm text-white tracking-wide break-words drop-shadow-sm ${
                        isDone ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {log.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Status Toggle Button */}
                  <button
                    onClick={() => onToggleStatus(log.id)}
                    className={`p-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                        : isInProgress
                        ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30'
                        : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                    }`}
                    title="Klik untuk ubah status (Pending -> In Progress -> Selesai)"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400" />
                    )}
                  </button>

                  <button
                    onClick={() => onDeleteDelegation(log.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Hapus Catatan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Note Content */}
              <p
                className={`text-xs leading-relaxed text-slate-200 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 mb-2 whitespace-pre-wrap break-words ${
                  isDone ? 'text-slate-400' : ''
                }`}
              >
                {log.content}
              </p>

              {/* Footer Row: Meta & Handover Info */}
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 flex-wrap pt-1 border-t border-slate-800/50">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {log.authorName}
                  </span>
                  {log.assignedTo && (
                    <span className="text-amber-300 flex items-center gap-1 font-medium">
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      {log.assignedTo}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                  <span>{log.dateStr}</span>
                  <span>·</span>
                  <span className="text-amber-400/90 font-bold">{log.timeStr} WIB</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="text-center py-8 px-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-slate-400">
            <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-xs font-medium">Belum ada catatan delegasi.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Klik tombol <strong className="text-amber-400">+ Catat</strong> untuk menambahkan log serah terima.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
