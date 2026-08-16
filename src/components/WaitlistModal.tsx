import React, { useState } from 'react';
import {
  X,
  Users,
  Plus,
  Phone,
  Clock,
  Car,
  Gamepad2,
  Tv,
  CircleDot,
  CheckCircle2,
  Trash2,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { Station, StationCategory, WaitlistEntry } from '../types';
import { useCafe } from '../context/CafeContext';
import { formatDateTime, formatMinutes } from '../utils/formatters';

interface WaitlistModalProps {
  onClose: () => void;
  onSeatCustomerDirectly: (guest: WaitlistEntry, targetStation: Station) => void;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({
  onClose,
  onSeatCustomerDirectly,
}) => {
  const { waitlist, stations, addWaitlist, updateWaitlistStatus, deleteWaitlist } = useCafe();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState<number>(2);
  const [preferredCategory, setPreferredCategory] = useState<StationCategory | 'any'>('any');
  const [notes, setNotes] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const activeWaitlist = waitlist.filter((w) => w.status === 'waiting' || w.status === 'notified');
  const seatedWaitlist = waitlist.filter((w) => w.status === 'seated' || w.status === 'cancelled');

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    addWaitlist({
      customerName: customerName.trim(),
      phone: phone.trim() || '',
      preferredCategory,
      partySize,
      notes: notes.trim() || undefined,
    });

    setCustomerName('');
    setPhone('');
    setNotes('');
    setShowAddForm(false);
  };

  const getCategoryLabel = (cat: StationCategory | 'any') => {
    switch (cat) {
      case 'ps4_racing':
        return '🏎️ PS4 Racing Wheel';
      case 'ps4_standard':
        return '🎮 PS4 Console';
      case 'pandora_box':
        return '🕹️ Pandora Arcade';
      case 'billiard':
        return '🎱 Billiard Table';
      case 'any':
      default:
        return '⚡ Any Available';
    }
  };

  const getAvailableMatchingStations = (cat: StationCategory | 'any') => {
    return stations.filter(
      (s) => !s.currentSession && (cat === 'any' || s.category === cat)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/80 my-4 sm:my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(251,191,36,0.15)]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Customer Queue & Waitlist
              </h2>
              <p className="text-xs text-zinc-400">
                Manage waiting guests for pool tables, the racing rig, or gaming consoles
              </p>
            </div>
          </div>
          <button
            id="close-waitlist-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="text-xs text-zinc-300 font-semibold">
            <span>Active Waiting: </span>
            <span className="text-amber-400 font-bold font-mono">{activeWaitlist.length} group(s)</span>
          </div>

          <button
            id="open-add-waitlist-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(251,191,36,0.25)] flex items-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Cancel' : '+ Add Waiting Guest'}</span>
          </button>
        </div>

        {/* Add Waiting Guest Drawer */}
        {showAddForm && (
          <form
            onSubmit={handleCreateEntry}
            className="p-5 border-b border-zinc-800 bg-zinc-950/95 space-y-3 shrink-0"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Customer / Group Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. David & Sarah"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 234-5678"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Party Size
                </label>
                <select
                  value={partySize}
                  onChange={(e) => setPartySize(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={1}>1 Player (Solo)</option>
                  <option value={2}>2 Players (Duo)</option>
                  <option value={3}>3 Players</option>
                  <option value={4}>4 Players (Full Squad / Doubles)</option>
                  <option value={6}>5-8 Players (Party)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Preferred Station Category
                </label>
                <select
                  value={preferredCategory}
                  onChange={(e) => setPreferredCategory(e.target.value as StationCategory | 'any')}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="any">⚡ Any Available Station</option>
                  <option value="ps4_racing">🏎️ PS4 Racing Sim (Steering Wheel)</option>
                  <option value="billiard">🎱 Billiard Table (Pool)</option>
                  <option value="ps4_standard">🎮 PS4 Standard Console</option>
                  <option value="pandora_box">🕹️ Pandora Box Arcade</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Special Requests / Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Wants Gran Turismo 7, or Table #4 VIP"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-zinc-950 shadow-xs active:scale-[0.98]"
              >
                Add to Queue
              </button>
            </div>
          </form>
        )}

        {/* Waitlist List Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3">
          {activeWaitlist.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 space-y-2">
              <UserCheck className="w-8 h-8 text-zinc-600 mx-auto" />
              <p>No customers currently in the waitlist queue.</p>
              <p className="text-[11px] text-zinc-600">All tables and consoles are open or running smoothly.</p>
            </div>
          ) : (
            activeWaitlist.map((entry, index) => {
              const waitMins = Math.floor((Date.now() - entry.createdAt) / 60000);
              const availableStations = getAvailableMatchingStations(entry.preferredCategory);

              return (
                <div
                  key={entry.id}
                  className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold text-xs items-center justify-center border border-amber-500/30">
                        #{index + 1}
                      </span>
                      <h4 className="font-bold text-sm text-white">{entry.customerName}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono">
                        {entry.partySize} {entry.partySize === 1 ? 'Player' : 'Players'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {getCategoryLabel(entry.preferredCategory)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono">
                      {entry.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          {entry.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-amber-400 font-medium">
                        <Clock className="w-3 h-3" />
                        Waiting {waitMins}m
                      </span>
                      {entry.notes && (
                        <span className="text-zinc-500 italic font-sans">“{entry.notes}”</span>
                      )}
                    </div>
                  </div>

                  {/* Seat Customer Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    {availableStations.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-emerald-400 font-semibold hidden md:inline">
                          {availableStations.length} station ready:
                        </span>
                        <select
                          onChange={(e) => {
                            const target = stations.find((s) => s.id === e.target.value);
                            if (target) {
                              onClose();
                              onSeatCustomerDirectly(entry, target);
                            }
                          }}
                          defaultValue=""
                          className="px-3 py-1.5 text-xs rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-bold focus:outline-none cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                        >
                          <option value="" disabled>
                            ⚡ Seat at Station...
                          </option>
                          {availableStations.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-500 italic">
                        All matching tables busy
                      </span>
                    )}

                    <button
                      onClick={() => deleteWaitlist(entry.id)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors"
                      title="Cancel waitlist entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
