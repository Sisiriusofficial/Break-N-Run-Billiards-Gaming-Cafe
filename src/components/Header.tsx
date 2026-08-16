import React from 'react';
import {
  Gamepad2,
  Volume2,
  VolumeX,
  Users,
  ShoppingBag,
  BarChart3,
  Settings,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react';
import { useCafe } from '../context/CafeContext';

interface HeaderProps {
  onOpenPOS: () => void;
  onOpenWaitlist: () => void;
  onOpenShiftReport: () => void;
  onOpenSettings: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPOS,
  onOpenWaitlist,
  onOpenShiftReport,
  onOpenSettings,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
}) => {
  const { stations, waitlist, settings, updateSettings } = useCafe();

  const activeCount = stations.filter((s) => s.currentSession).length;
  const totalCount = stations.length;
  const waitingCount = waitlist.filter((w) => w.status === 'waiting').length;

  const categories = [
    { id: 'all', label: 'All Stations' },
    { id: 'ps4_racing', label: '🏎️ PS4 Racing Rig' },
    { id: 'ps4_standard', label: '🎮 PS4 Consoles' },
    { id: 'pandora_box', label: '🕹️ Pandora Box Arcade' },
    { id: 'billiard', label: '🎱 Billiard Tables' },
    { id: 'active', label: `⚡ Active Only (${activeCount})` },
  ];

  return (
    <header className="bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-30 shadow-xl shadow-black/40">
      {/* Top Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Cafe Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.35)] text-zinc-950 font-black shrink-0">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate font-sans">
                  {settings.cafeName}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)] shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse shadow-[0_0_6px_rgba(52,211,153,1)]"></span>
                  {activeCount}/{totalCount} OCCUPIED
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate hidden sm:block">
                {settings.cafeTagline}
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Bar */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Sound Toggle */}
            <button
              id="sound-alert-toggle-btn"
              onClick={() => updateSettings({ soundAlertsEnabled: !settings.soundAlertsEnabled })}
              title={settings.soundAlertsEnabled ? 'Sound Alerts On' : 'Sound Alerts Muted'}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                settings.soundAlertsEnabled
                  ? 'bg-zinc-800/80 text-zinc-200 border-zinc-700/60 hover:bg-zinc-700 hover:border-zinc-600 shadow-sm'
                  : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
              }`}
            >
              {settings.soundAlertsEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-red-400" />
              )}
              <span className="hidden md:inline font-mono">
                {settings.soundAlertsEnabled ? 'Alerts On' : 'Muted'}
              </span>
            </button>

            {/* Waitlist Button */}
            <button
              id="header-waitlist-btn"
              onClick={onOpenWaitlist}
              className="relative p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium bg-zinc-800/80 text-zinc-200 border border-zinc-700/60 hover:bg-zinc-700 hover:border-amber-500/40 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Waitlist</span>
              {waitingCount > 0 && (
                <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-400 text-zinc-950 font-mono font-bold text-[10px] shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                  {waitingCount}
                </span>
              )}
            </button>

            {/* Concessions / Snack POS Button */}
            <button
              id="header-pos-btn"
              onClick={onOpenPOS}
              className="p-2 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.98]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Snack POS</span>
            </button>

            {/* Shift & Sales Report */}
            <button
              id="header-shift-btn"
              onClick={onOpenShiftReport}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 border border-transparent hover:border-zinc-700/60 transition-colors"
              title="Daily Shift & Revenue Reports"
            >
              <BarChart3 className="w-5 h-5" />
            </button>

            {/* Settings */}
            <button
              id="header-settings-btn"
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 border border-transparent hover:border-zinc-700/60 transition-colors"
              title="Cafe & Hardware Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-t border-zinc-800/60">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                id={`filter-cat-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-zinc-800 text-white border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
                    : 'bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="station-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table, game, or customer..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
