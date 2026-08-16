import React, { useState } from 'react';
import {
  Users,
  CircleDot,
  Plus,
  Search,
  ChevronRight,
  Clock,
  Flame,
  UserPlus,
  ShoppingBag,
  DollarSign,
  Gamepad2,
} from 'lucide-react';
import { PlayerTab } from '../types';
import { useCafe } from '../context/CafeContext';
import { computeSessionState, formatCurrency } from '../utils/formatters';

interface PlayerTabsSidebarProps {
  onSelectTab: (tab: PlayerTab) => void;
  onOpenQuickRackModal: (preselectedPlayerName?: string) => void;
}

export const PlayerTabsSidebar: React.FC<PlayerTabsSidebarProps> = ({
  onSelectTab,
  onOpenQuickRackModal,
}) => {
  const { playerTabs, stations, settings, currentTime, createPlayerTab } = useCafe();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');

  // Calculate live amount owed for a given tab
  const getTabSummary = (tab: PlayerTab) => {
    // Check if player has an active station session
    let station = stations.find((s) => s.id === tab.activeStationId);
    if (!station) {
      station = stations.find(
        (s) =>
          s.currentSession &&
          s.currentSession.customerName.trim().toLowerCase() === tab.playerName.trim().toLowerCase()
      );
    }

    let gamingTimeCost = 0;
    let elapsedMinutes = 0;
    if (station && station.currentSession) {
      const state = computeSessionState(
        station.currentSession,
        station.hourlyRate,
        currentTime,
        settings.gracePeriodMinutes,
        settings.billingIntervalMinutes,
        settings.taxRatePercent
      );
      gamingTimeCost = state.gamingTimeCost;
      elapsedMinutes = state.elapsedMinutes;
    }

    const rackLossesCost = tab.rackLosses.reduce((sum, r) => sum + r.fee, 0);
    const concessionsCost =
      tab.orders.reduce((sum, o) => sum + o.price * o.quantity, 0) +
      (station?.currentSession?.orders.reduce((sum, o) => sum + o.price * o.quantity, 0) || 0);

    const subtotal = gamingTimeCost + rackLossesCost + concessionsCost;
    const discount =
      tab.discountType === 'percentage'
        ? (subtotal * (tab.discountAmount || 0)) / 100
        : tab.discountAmount || 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = settings.taxRatePercent > 0 ? (taxable * settings.taxRatePercent) / 100 : 0;
    const totalDue = Math.round(taxable + tax);

    return {
      totalDue,
      station,
      elapsedMinutes,
      rackCount: tab.rackLosses.length,
      rackLossesCost,
      concessionsCost,
    };
  };

  const filteredTabs = playerTabs.filter((tab) =>
    tab.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tab.phone && tab.phone.includes(searchTerm))
  );

  const handleCreateNewTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const newTab = createPlayerTab(newPlayerName.trim(), newPlayerPhone.trim() || undefined);
    setNewPlayerName('');
    setNewPlayerPhone('');
    setIsCreatingNew(false);
    onSelectTab(newTab);
  };

  const totalActiveDebt = playerTabs.reduce((acc, tab) => {
    const { totalDue } = getTabSummary(tab);
    return acc + totalDue;
  }, 0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-lg shadow-black/40">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/95 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CircleDot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Player Tabs & Ledger
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {playerTabs.length}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Active rack losses & hourly tabs
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-emerald-400">
            {formatCurrency(totalActiveDebt, settings.currencySymbol)}
          </span>
        </div>

        {/* Action Buttons: Log Rack Loss & New Player Tab */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            id="sidebar-log-rack-loss-btn"
            onClick={() => onOpenQuickRackModal()}
            className="px-2.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
          >
            <CircleDot className="w-3.5 h-3.5" />
            <span>Log Rack Loss</span>
          </button>

          <button
            type="button"
            id="sidebar-new-player-tab-btn"
            onClick={() => setIsCreatingNew(!isCreatingNew)}
            className="px-2.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center gap-1.5 transition-colors border border-zinc-700"
          >
            <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>+ New Tab</span>
          </button>
        </div>

        {/* Inline New Tab Creation Form */}
        {isCreatingNew && (
          <form
            onSubmit={handleCreateNewTab}
            className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 animate-in fade-in"
          >
            <div className="text-[11px] font-bold text-white uppercase tracking-wider">
              Open Player Tab
            </div>
            <input
              type="text"
              required
              autoFocus
              placeholder="Player / Customer Name *"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
            <input
              type="text"
              placeholder="Phone (Optional)"
              value={newPlayerPhone}
              onChange={(e) => setNewPlayerPhone(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 text-zinc-950 hover:bg-amber-400"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Search Filter */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search players by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Player List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredTabs.length === 0 ? (
          <div className="py-8 text-center px-4 space-y-2">
            <Users className="w-8 h-8 text-zinc-600 mx-auto opacity-40" />
            <p className="text-xs text-zinc-400">
              {searchTerm ? 'No matching player tabs found.' : 'No active player tabs.'}
            </p>
            <p className="text-[11px] text-zinc-500">
              Log match/rack losses or open a customer tab to track running debts.
            </p>
          </div>
        ) : (
          filteredTabs.map((tab) => {
            const { totalDue, station, elapsedMinutes, rackCount } = getTabSummary(tab);

            return (
              <div
                key={tab.id}
                id={`player-tab-card-${tab.id}`}
                onClick={() => onSelectTab(tab)}
                className="p-3 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800/90 hover:border-amber-500/40 transition-all cursor-pointer group shadow-sm flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  {/* Name & Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors truncate">
                      {tab.playerName}
                    </span>
                    {rackCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        🎱 {rackCount} {rackCount === 1 ? 'rack' : 'racks'}
                      </span>
                    )}
                  </div>

                  {/* Status / Active Station */}
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 flex-wrap">
                    {station ? (
                      <span className="text-cyan-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {station.name} ({Math.round(elapsedMinutes)}m)
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-[10px]">Tab only</span>
                    )}

                    {tab.orders.length > 0 && (
                      <span className="text-purple-400 text-[10px]">
                        • {tab.orders.length} snacks
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount Owed & Arrow */}
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <span className="font-mono font-bold text-xs text-emerald-400 block">
                      {formatCurrency(totalDue, settings.currencySymbol)}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono uppercase block">
                      Amount Due
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
