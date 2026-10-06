import React from 'react';
import { Clock, Calendar as CalendarIcon, Menu } from 'lucide-react';
import { NavTab } from '../types';
import { GINESIA_LOGO_URL } from './Sidebar';

interface HeaderProps {
  timeString: string;
  dateString: string;
  activeTab: NavTab;
  onOpenMobileMenu: () => void;
  onToggleSidebar?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  timeString,
  dateString,
  activeTab,
  onOpenMobileMenu,
  onToggleSidebar,
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'jadwal':
        return 'Jadwal Roster NOC';
      case 'editor':
        return 'Editor Roster NOC';
      case 'pengaturan':
        return 'Pengaturan Sistem';
      default:
        return 'NOC Shift Roster';
    }
  };

  const handleMenuClick = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      onOpenMobileMenu();
    }
  };

  return (
    <header className="h-18 px-4 sm:px-8 bg-transparent flex items-center justify-between sticky top-0 z-30 transition-all select-none">
      {/* Left: Hamburger Garis 3 Putih & Ginesia Logo / Title */}
      <div className="flex items-center gap-3.5">
        {/* Hamburger Icon Garis 3 Putih Translucent */}
        <button
          onClick={handleMenuClick}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 backdrop-blur-md transition-all shadow-lg flex items-center justify-center cursor-pointer group"
          aria-label="Buka / Tutup Sidebar"
          title="Buka / Tutup Sidebar"
        >
          <Menu className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
        </button>

        <div className="flex items-center gap-3 bg-slate-950/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 shadow-md">
          <img
            src={GINESIA_LOGO_URL}
            alt="Ginesia Logo"
            referrerPolicy="no-referrer"
            className="h-7 sm:h-8 max-w-[130px] object-contain drop-shadow"
          />
          <span className="hidden sm:inline-block w-px h-5 bg-white/20" />
          <h1 className="text-sm sm:text-base font-bold text-white tracking-wide drop-shadow-sm">
            {getTabTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Cloud Sync Status & Realtime WIB Clock & Date */}
      <div className="flex items-center gap-2.5 sm:gap-4 text-right">
        {/* Subtle Cloud Sync Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/15 shadow-md text-xs font-mono text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Cloud Sync Aktif</span>
        </div>

        <div className="bg-slate-950/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 shadow-md">
          <div className="flex items-center justify-end gap-2 text-amber-300 font-mono font-bold text-base sm:text-lg tabular-nums tracking-tight drop-shadow-sm">
            <Clock className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300 shrink-0" />
            <span>{timeString}</span>
          </div>
          <div className="flex items-center justify-end gap-1.5 text-xs text-slate-300 font-medium">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            <span>{dateString}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
