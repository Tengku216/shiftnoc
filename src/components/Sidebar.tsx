import React from 'react';
import { NavTab } from '../types';
import { Calendar, CalendarPlus, Settings, Shield, ChevronLeft, Menu } from 'lucide-react';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  hasUnsavedChanges?: boolean;
  onNavigateRequest?: (tab: NavTab) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const GINESIA_LOGO_URL = 'https://res.cloudinary.com/tengku/image/upload/v1784990358/ginesia_merah.png';

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  hasUnsavedChanges,
  onNavigateRequest,
  isCollapsed,
  onToggleCollapse,
}) => {
  const handleNav = (tab: NavTab) => {
    if (onNavigateRequest) {
      onNavigateRequest(tab);
    } else {
      setActiveTab(tab);
    }
  };

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'jadwal',
      label: 'Jadwal',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      id: 'editor',
      label: 'Buat Jadwal',
      icon: <CalendarPlus className="w-5 h-5" />,
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside
      className={`shrink-0 bg-white/10 backdrop-blur-2xl border-r border-white/20 text-white flex flex-col justify-between p-4 min-h-screen transition-all duration-300 shadow-2xl ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header & Logo */}
      <div>
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/15">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <img
                src={GINESIA_LOGO_URL}
                alt="Ginesia Logo"
                referrerPolicy="no-referrer"
                className="h-9 max-w-[140px] object-contain drop-shadow-md"
              />
            </div>
          ) : (
            <div className="mx-auto">
              <img
                src={GINESIA_LOGO_URL}
                alt="Ginesia Logo"
                referrerPolicy="no-referrer"
                className="h-7 w-7 object-contain"
              />
            </div>
          )}

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
              title={isCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
            >
              {isCollapsed ? <Menu className="w-4 h-4 text-white" /> : <ChevronLeft className="w-4 h-4 text-white" />}
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'
                } py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 group text-left ${
                  isActive
                    ? 'bg-white/25 text-white shadow-lg border border-white/30 backdrop-blur-md'
                    : 'text-white/80 hover:text-white hover:bg-white/15'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-amber-300' : 'text-white/80 group-hover:text-white'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && <span>{item.label}</span>}
                </div>

                {!isCollapsed && item.id === 'editor' && hasUnsavedChanges && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" title="Ada perubahan belum disimpan" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      {!isCollapsed ? (
        <div className="px-3 py-3 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md text-xs text-white/80">
          <div className="flex items-center gap-2 mb-1 text-white font-semibold">
            <Shield className="w-3.5 h-3.5 text-emerald-300" />
            <span>NOC Shift System</span>
          </div>
          <p className="text-[11px] leading-relaxed text-white/70">
            Internal Roster · Asia/Jakarta (WIB)
          </p>
        </div>
      ) : (
        <div className="flex justify-center text-white/60">
          <Shield className="w-4 h-4 text-emerald-300" />
        </div>
      )}
    </aside>
  );
};
