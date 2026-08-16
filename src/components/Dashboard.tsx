import React, { useState } from 'react';
import {
  Gamepad2,
  Car,
  Tv,
  CircleDot,
  Plus,
  ShoppingBag,
  Users,
  Flame,
  Clock,
  TrendingUp,
  AlertCircle,
  Play,
  Layers,
  Receipt,
  Banknote,
} from 'lucide-react';
import { Station, StationCategory, WaitlistEntry } from '../types';
import { useCafe } from '../context/CafeContext';
import { StationCard } from './StationCard';
import { StationStartModal } from './StationStartModal';
import { StationDetailModal } from './StationDetailModal';
import { CheckoutModal } from './CheckoutModal';
import { QuickTransferModal } from './QuickTransferModal';
import { SnackPOSModal } from './SnackPOSModal';
import { WaitlistModal } from './WaitlistModal';
import { ShiftReportModal } from './ShiftReportModal';
import { SettingsModal } from './SettingsModal';
import { computeSessionState, formatCurrency } from '../utils/formatters';

interface DashboardProps {
  selectedCategory: string;
  searchQuery: string;
  isPOSOpen: boolean;
  setIsPOSOpen: (open: boolean) => void;
  isWaitlistOpen: boolean;
  setIsWaitlistOpen: (open: boolean) => void;
  isShiftReportOpen: boolean;
  setIsShiftReportOpen: (open: boolean) => void;
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
  isShiftReportOpen,
  setIsShiftReportOpen,
  isSettingsOpen,
  setIsSettingsOpen,
}) => {
  const { stations, waitlist, completedBills, settings, currentTime } = useCafe();

  // Active modals state
  const [selectedStationForStart, setSelectedStationForStart] = useState<Station | null>(null);
  const [selectedStationForDetail, setSelectedStationForDetail] = useState<Station | null>(null);
  const [selectedStationForCheckout, setSelectedStationForCheckout] = useState<Station | null>(null);
  const [selectedStationForTransfer, setSelectedStationForTransfer] = useState<Station | null>(null);
  const [selectedStationForSnackPOS, setSelectedStationForSnackPOS] = useState<Station | null>(null);

  // Compute live floor stats
  const activeStations = stations.filter((s) => s.currentSession);
  const availableStations = stations.filter((s) => !s.currentSession);
  const waitingCount = waitlist.filter((w) => w.status === 'waiting').length;
  const shiftRevenue = completedBills.reduce((sum, b) => sum + b.totalAmount, 0);

  // Filter stations
  const filteredStations = stations.filter((st) => {
    // Category filter
    let matchesCategory = true;
    if (selectedCategory === 'active') {
      matchesCategory = !!st.currentSession;
    } else if (selectedCategory !== 'all') {
      matchesCategory = st.category === selectedCategory;
    }

    // Search filter
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = st.name.toLowerCase().includes(q);
      const matchCategory = st.category.toLowerCase().includes(q);
      const matchSpecs = st.hardwareSpecs.toLowerCase().includes(q);
      const matchCustomer = st.currentSession?.customerName.toLowerCase().includes(q) || false;
      matchesSearch = matchName || matchCategory || matchSpecs || matchCustomer;
    }

    return matchesCategory && matchesSearch;
  });

  // Seat customer from waitlist directly
  const handleSeatCustomerDirectly = (guest: WaitlistEntry, targetStation: Station) => {
    setSelectedStationForStart(targetStation);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Live Floor Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1: Active Occupancy */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex items-center justify-between shadow-lg shadow-black/20">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 tracking-wider">
              Floor Occupancy
            </span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-0.5">
              {activeStations.length}{' '}
              <span className="text-sm font-normal text-zinc-500 font-sans">/ {stations.length} Busy</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium mt-0.5 block">
              {availableStations.length} station(s) available now
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)] shrink-0">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Today's Shift Revenue */}
        <div
          onClick={() => setIsShiftReportOpen(true)}
          className="p-4 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex items-center justify-between shadow-lg shadow-black/20 cursor-pointer group"
          title="Click to view full shift sales & receipt history"
        >
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 tracking-wider flex items-center gap-1">
              <span>Shift Collections</span>
              <span className="text-[9px] text-cyan-400 font-normal group-hover:underline">View Receipts →</span>
            </span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400 mt-0.5">
              {formatCurrency(shiftRevenue, settings.currencySymbol)}
            </div>
            <span className="text-[10px] text-zinc-400 mt-0.5 block font-mono">
              {completedBills.length} completed receipt(s)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)] group-hover:scale-105 transition-transform shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Billiard Tables */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex items-center justify-between shadow-lg shadow-black/20">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 tracking-wider">
              Billiard Tables
            </span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-0.5">
              {stations.filter(s => s.category === 'billiard' && s.currentSession).length}
              <span className="text-sm font-normal text-zinc-500 font-sans"> / 4 Occupied</span>
            </div>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">
              9ft Slate Tournament & VIP
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_12px_rgba(251,191,36,0.15)] shrink-0">
            <CircleDot className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Queue / Waitlist */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex items-center justify-between shadow-lg shadow-black/20">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 tracking-wider">
              Waiting Queue
            </span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-0.5">
              {waitingCount}{' '}
              <span className="text-sm font-normal text-zinc-500 font-sans">Waiting</span>
            </div>
            <span className="text-[10px] text-amber-400 font-medium mt-0.5 block">
              {waitingCount > 0 ? 'Guests in waiting queue' : 'No customers waiting'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.15)] shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Stations Floor Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight font-sans">
              Live Station & Table Grid
            </h2>
            <span className="text-xs font-mono text-zinc-500">
              ({filteredStations.length} {filteredStations.length === 1 ? 'station' : 'stations'} active)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick action buttons for floor staff */}
            <button
              id="dash-quick-pos-btn"
              onClick={() => setIsPOSOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800/80 hover:bg-zinc-700 text-amber-300 border border-zinc-700/70 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Concession / Snack</span>
              <span className="sm:hidden">Snack</span>
            </button>
          </div>
        </div>

        {filteredStations.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-zinc-900/50 border border-dashed border-zinc-800 space-y-2">
            <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400">No stations match the selected filter or search.</p>
            <button
              onClick={() => {}}
              className="text-xs text-cyan-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                onOpenStartModal={(st) => setSelectedStationForStart(st)}
                onOpenDetailModal={(st) => setSelectedStationForDetail(st)}
                onOpenCheckoutModal={(st) => setSelectedStationForCheckout(st)}
                onOpenTransferModal={(st) => setSelectedStationForTransfer(st)}
                onOpenSnackPOSForStation={(st) => setSelectedStationForSnackPOS(st)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Staff Bar for Mobile Floor Management */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-20 bg-zinc-900/95 backdrop-blur-lg border border-zinc-700/80 rounded-2xl p-2 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center justify-around gap-1.5">
        <button
          onClick={() => setIsPOSOpen(true)}
          className="flex-1 py-2 rounded-xl text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Snacks</span>
        </button>

        <button
          onClick={() => setIsWaitlistOpen(true)}
          className="flex-1 py-2 rounded-xl text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex flex-col items-center justify-center gap-0.5 relative active:scale-95 transition-transform"
        >
          <Users className="w-4 h-4" />
          <span>Waitlist</span>
          {waitlist.filter((w) => w.status === 'waiting').length > 0 && (
            <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"></span>
          )}
        </button>

        <button
          onClick={() => setIsShiftReportOpen(true)}
          className="flex-1 py-2 rounded-xl text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Shift</span>
        </button>
      </div>

      {/* Modals & Dialogs */}
      {selectedStationForStart && (
        <StationStartModal
          station={selectedStationForStart}
          onClose={() => setSelectedStationForStart(null)}
        />
      )}

      {selectedStationForDetail && (
        <StationDetailModal
          station={selectedStationForDetail}
          onClose={() => setSelectedStationForDetail(null)}
          onOpenCheckout={(st) => setSelectedStationForCheckout(st)}
          onOpenTransfer={(st) => setSelectedStationForTransfer(st)}
          onOpenSnackPOS={(st) => setSelectedStationForSnackPOS(st)}
        />
      )}

      {selectedStationForCheckout && (
        <CheckoutModal
          station={selectedStationForCheckout}
          onClose={() => setSelectedStationForCheckout(null)}
        />
      )}

      {selectedStationForTransfer && (
        <QuickTransferModal
          sourceStation={selectedStationForTransfer}
          onClose={() => setSelectedStationForTransfer(null)}
        />
      )}

      {(isPOSOpen || selectedStationForSnackPOS) && (
        <SnackPOSModal
          initialStationTarget={selectedStationForSnackPOS}
          onClose={() => {
            setIsPOSOpen(false);
            setSelectedStationForSnackPOS(null);
          }}
        />
      )}

      {isWaitlistOpen && (
        <WaitlistModal
          onClose={() => setIsWaitlistOpen(false)}
          onSeatCustomerDirectly={handleSeatCustomerDirectly}
        />
      )}

      {isShiftReportOpen && (
        <ShiftReportModal
          onClose={() => setIsShiftReportOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

    </main>
  );
};
