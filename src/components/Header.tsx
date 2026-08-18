import React from 'react';
import { Gamepad2, Volume2, VolumeX, Users, ShoppingBag, Settings, Search } from 'lucide-react';
import { useCafe } from '../context/CafeContext';

interface HeaderProps {
  onOpenPOS: () => void;
  onOpenWaitlist: () => void;
  onOpenSettings: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPOS,
  onOpenWaitlist,
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
    { id: 'ps4_racing', label: '🏎️ Racing Rig' },
    { id: 'ps4_standard', label: '🎮 PS4' },
    { id: 'pandora_box', label: '🕹️ Arcade' },
    { id: 'billiard', label: '🎱 Billiards' },
    { id: 'active', label: `⚡ Active (${activeCount})` },
  ];

  return (
    <header className="bg-zinc-900/90 backdrop-blur-xl border-b border-zinc-800/80 sticky top-0 z-30 shadow-xl shadow-black/30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-16 gap-3 py-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center text-zinc-950 shadow-[0_0_18px_rgba(16,185,129,0.28)] shrink-0">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate">{settings.cafeName}</h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  {activeCount}/{totalCount} ACTIVE
                </span>
              </div>
              <p className="text-xs text-zinc-500 truncate hidden sm:block">{settings.cafeTagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="sound-alert-toggle-btn"
              onClick={() => updateSettings({ soundAlertsEnabled: !settings.soundAlertsEnabled })}
              title={settings.soundAlertsEnabled ? 'Sound Alerts On' : 'Sound Alerts Muted'}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${settings.soundAlertsEnabled ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
            >
              {settings.soundAlertsEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden lg:inline">{settings.soundAlertsEnabled ? 'Alerts' : 'Muted'}</span>
            </button>

            <button
              id="header-waitlist-btn"
              onClick={onOpenWaitlist}
              className="relative p-2 sm:px-3 rounded-xl text-xs font-medium bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-amber-500/40 transition-all flex items-center gap-1.5"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Waitlist</span>
              {waitingCount > 0 && <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-400 text-zinc-950 font-bold text-[10px]">{waitingCount}</span>}
            </button>

            <button
              id="header-pos-btn"
              onClick={onOpenPOS}
              className="p-2 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-[0.98]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Snack POS</span>
            </button>

            <button
              id="header-settings-btn"
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-colors"
              title="Cafe & Hardware Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="pb-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 border-t border-zinc-800/60 pt-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                id={`filter-cat-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40 ring-1 ring-emerald-500/10' : 'bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="station-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search station or customer..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">✕</button>}
          </div>
        </div>
      </div>
    </header>
  );
};
