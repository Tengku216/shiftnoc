import React, { useEffect } from 'react';
import { NavTab } from '../types';
import { Calendar, CalendarPlus, Settings, X, Shield } from 'lucide-react';
import { GINESIA_LOGO_URL } from './Sidebar';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  hasUnsavedChanges?: boolean;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  hasUnsavedChanges,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex transition-all duration-300">
      {/* Translucent Backdrop (click outside to close) */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-label="Tutup Sidebar"
      />

      {/* Drawer Panel in White Translucent Frosted Glass */}
      <div className="relative w-80 max-w-[85vw] bg-slate-950/85 sm:bg-slate-900/90 border-r border-white/20 p-6 flex flex-col justify-between h-full z-10 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-left duration-300 text-white">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/15">
            <div className="flex items-center gap-2">
              <img
                src={GINESIA_LOGO_URL}
                alt="Ginesia Logo"
                referrerPolicy="no-referrer"
                className="h-9 max-w-[140px] object-contain drop-shadow"
              />
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 active:scale-95 border border-white/15 transition-all cursor-pointer"
              title="Tutup Menu (Esc)"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2.5">
            {[
              { id: 'jadwal', label: 'Jadwal Roster', icon: <Calendar className="w-5 h-5" /> },
              { id: 'editor', label: 'Buat Jadwal', icon: <CalendarPlus className="w-5 h-5" /> },
              { id: 'pengaturan', label: 'Pengaturan', icon: <Settings className="w-5 h-5" /> },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id as NavTab)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 text-left cursor-pointer group ${
                    isActive
                      ? 'bg-white/25 text-white border border-white/30 shadow-lg backdrop-blur-md'
                      : 'text-white/80 hover:text-white hover:bg-white/15 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`transition-colors ${
                        isActive ? 'text-amber-300' : 'text-white/80 group-hover:text-white'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="tracking-wide">{item.label}</span>
                  </div>

                  {item.id === 'editor' && hasUnsavedChanges && (
                    <span
                      className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"
                      title="Ada perubahan belum disimpan"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="p-4 rounded-xl bg-white/10 border border-white/15 text-xs text-white/80 backdrop-blur-md shadow-inner">
          <div className="flex items-center gap-2 mb-1 text-white font-semibold">
            <Shield className="w-4 h-4 text-emerald-300" />
            <span>NOC Shift Schedule</span>
          </div>
          <p className="text-[11px] leading-relaxed text-white/70">
            Internal Operations · Asia/Jakarta (WIB)
          </p>
        </div>
      </div>
    </div>
  );
};
export { SidebarDrawer as MobileDrawer };

