import React, { useState } from 'react';
import { Activity, AlertCircle, Banknote, CircleDot, Gamepad2, ShoppingBag, Users, Zap } from 'lucide-react';
import { Station, WaitlistEntry } from '../types';
import { useCafe } from '../context/CafeContext';
import { StationCard } from './StationCard';
import { StationStartModal } from './StationStartModal';
import { StationDetailModal } from './StationDetailModal';
import { CheckoutModal } from './CheckoutModal';
import { QuickTransferModal } from './QuickTransferModal';
import { SnackPOSModal } from './SnackPOSModal';
import { WaitlistModal } from './WaitlistModal';
import { SettingsModal } from './SettingsModal';
import { formatCurrency } from '../utils/formatters';

interface DashboardProps {
  selectedCategory: string;
  searchQuery: string;
  isPOSOpen: boolean;
  setIsPOSOpen: (open: boolean) => void;
  isWaitlistOpen: boolean;
  setIsWaitlistOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  selectedCategory,
  searchQuery,
  isPOSOpen,
  setIsPOSOpen,
  isWaitlistOpen,
  setIsWaitlistOpen,
  isSettingsOpen,
  setIsSettingsOpen,
}) => {
  const { stations, waitlist, completedBills, settings } = useCafe();
  const [selectedStationForStart, setSelectedStationForStart] = useState<Station | null>(null);
  const [selectedStationForDetail, setSelectedStationForDetail] = useState<Station | null>(null);
  const [selectedStationForCheckout, setSelectedStationForCheckout] = useState<Station | null>(null);
  const [selectedStationForTransfer, setSelectedStationForTransfer] = useState<Station | null>(null);
  const [selectedStationForSnackPOS, setSelectedStationForSnackPOS] = useState<Station | null>(null);

  const activeStations = stations.filter((s) => s.currentSession);
  const availableStations = stations.filter((s) => !s.currentSession);
  const waitingCount = waitlist.filter((w) => w.status === 'waiting').length;
  const totalRevenue = completedBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const billiardActive = stations.filter((s) => s.category === 'billiard' && s.currentSession).length;
  const filteredStations = stations.filter((st) => {
    const matchesCategory = selectedCategory === 'all'
      ? true
      : selectedCategory === 'active'
        ? !!st.currentSession
        : st.category === selectedCategory;

    if (!searchQuery.trim()) return matchesCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      st.name.toLowerCase().includes(q) ||
      st.category.toLowerCase().includes(q) ||
      st.hardwareSpecs.toLowerCase().includes(q) ||
      !!st.currentSession?.customerName.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleSeatCustomerDirectly = (_guest: WaitlistEntry, targetStation: Station) => {
    setSelectedStationForStart(targetStation);
  };

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400 mb-1">Café control center</p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Good to see you.</h2>
          <p className="text-sm text-zinc-500 mt-1">Monitor stations, handle customers and close bills from one place.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Cloud connected
          </span>
          <span className="hidden sm:inline">{activeStations.length} active now</span>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Today's Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><Banknote className="w-4 h-4" /></div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white">{formatCurrency(totalRevenue, settings.currencySymbol)}</div>
          <p className="text-[11px] text-zinc-500 mt-1">{completedBills.length} completed receipt(s)</p>
        </div>

        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Active Sessions</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20"><Gamepad2 className="w-4 h-4" /></div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white">{activeStations.length}</div>
          <p className="text-[11px] text-emerald-400 mt-1">{availableStations.length} station(s) available</p>
        </div>

        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Billiards</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20"><CircleDot className="w-4 h-4" /></div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white">{billiardActive} <span className="text-sm font-normal text-zinc-500">/ 4</span></div>
          <p className="text-[11px] text-zinc-500 mt-1">tables currently occupied</p>
        </div>

        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Waiting Queue</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><Users className="w-4 h-4" /></div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white">{waitingCount}</div>
          <p className={`text-[11px] mt-1 ${waitingCount ? 'text-amber-400' : 'text-zinc-500'}`}>{waitingCount ? 'customer(s) waiting' : 'No customers waiting'}</p>
        </div>
      </section>

      <section className="rounded-2xl bg-zinc-900/70 border border-zinc-800 overflow-hidden shadow-xl shadow-black/20">
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white">Live Stations & Tables</h3>
              <span className="text-xs text-zinc-500">{filteredStations.length} shown</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Start, pause, transfer or checkout directly from a station card.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsWaitlistOpen(true)} className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" /> Waitlist{waitingCount ? ` (${waitingCount})` : ''}
            </button>
            <button onClick={() => setIsPOSOpen(true)} className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center gap-1.5 shadow-[0_0_14px_rgba(16,185,129,0.2)]">
              <ShoppingBag className="w-3.5 h-3.5" /> Snack POS
            </button>
          </div>
        </div>

        {filteredStations.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">No stations match your current filter.</p>
          </div>
        ) : (
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                onOpenStartModal={setSelectedStationForStart}
                onOpenDetailModal={setSelectedStationForDetail}
                onOpenCheckoutModal={setSelectedStationForCheckout}
                onOpenTransferModal={setSelectedStationForTransfer}
                onOpenSnackPOSForStation={setSelectedStationForSnackPOS}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white">Quick Actions</h3>
              <p className="text-xs text-zinc-500 mt-1">Common tasks for floor staff</p>
            </div>
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <button onClick={() => setIsPOSOpen(true)} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/40 text-left transition-colors">
              <ShoppingBag className="w-5 h-5 text-emerald-400 mb-2" /><span className="text-xs font-semibold text-zinc-200">New Snack Sale</span>
            </button>
            <button onClick={() => setIsWaitlistOpen(true)} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 text-left transition-colors">
              <Users className="w-5 h-5 text-amber-400 mb-2" /><span className="text-xs font-semibold text-zinc-200">Manage Waitlist</span>
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-cyan-500/40 text-left transition-colors">
              <Activity className="w-5 h-5 text-cyan-400 mb-2" /><span className="text-xs font-semibold text-zinc-200">Cafe Settings</span>
            </button>
          </div>
        </div>
        <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4 sm:p-5">
          <h3 className="font-bold text-white">System Status</h3>
          <div className="mt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between"><span className="text-zinc-500">Cloud database</span><span className="text-emerald-400 font-semibold">Connected</span></div>
            <div className="flex items-center justify-between"><span className="text-zinc-500">Active stations</span><span className="text-zinc-200 font-mono">{activeStations.length}/{stations.length}</span></div>
            <div className="flex items-center justify-between"><span className="text-zinc-500">Completed receipts</span><span className="text-zinc-200 font-mono">{completedBills.length}</span></div>
          </div>
        </div>
      </section>

      <div className="md:hidden fixed bottom-3 left-3 right-3 z-20 bg-zinc-900/95 backdrop-blur-lg border border-zinc-700/80 rounded-2xl p-2 shadow-2xl flex items-center gap-2">
        <button onClick={() => setIsPOSOpen(true)} className="flex-1 py-2.5 rounded-xl text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex flex-col items-center gap-0.5"><ShoppingBag className="w-4 h-4" /><span>Snacks</span></button>
        <button onClick={() => setIsWaitlistOpen(true)} className="flex-1 py-2.5 rounded-xl text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex flex-col items-center gap-0.5"><Users className="w-4 h-4" /><span>Waitlist</span></button>
        <button onClick={() => setIsSettingsOpen(true)} className="flex-1 py-2.5 rounded-xl text-[11px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 flex flex-col items-center gap-0.5"><Activity className="w-4 h-4" /><span>Settings</span></button>
      </div>

      {selectedStationForStart && <StationStartModal station={selectedStationForStart} onClose={() => setSelectedStationForStart(null)} />}
      {selectedStationForDetail && <StationDetailModal station={selectedStationForDetail} onClose={() => setSelectedStationForDetail(null)} onOpenCheckout={setSelectedStationForCheckout} onOpenTransfer={setSelectedStationForTransfer} onOpenSnackPOS={setSelectedStationForSnackPOS} />}
      {selectedStationForCheckout && <CheckoutModal station={selectedStationForCheckout} onClose={() => setSelectedStationForCheckout(null)} />}
      {selectedStationForTransfer && <QuickTransferModal sourceStation={selectedStationForTransfer} onClose={() => setSelectedStationForTransfer(null)} />}
      {(isPOSOpen || selectedStationForSnackPOS) && <SnackPOSModal initialStationTarget={selectedStationForSnackPOS} onClose={() => { setIsPOSOpen(false); setSelectedStationForSnackPOS(null); }} />}
      {isWaitlistOpen && <WaitlistModal onClose={() => setIsWaitlistOpen(false)} onSeatCustomerDirectly={handleSeatCustomerDirectly} />}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </main>
  );
};
