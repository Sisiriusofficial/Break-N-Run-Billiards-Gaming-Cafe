import React, { useState } from 'react';
import {
  X,
  Settings,
  DollarSign,
  Volume2,
  Database,
  Save,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Station, StationCategory } from '../types';
import { useCafe } from '../context/CafeContext';
import { formatCurrency } from '../utils/formatters';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const {
    settings,
    stations,
    updateSettings,
    updateStation,
    addStation,
    deleteStation,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetToDefaults,
  } = useCafe();

  const [cafeName, setCafeName] = useState(settings.cafeName);
  const [cafeTagline, setCafeTagline] = useState(settings.cafeTagline);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [phoneOrContact, setPhoneOrContact] = useState(settings.phoneOrContact);
  const [receiptFooterMessage, setReceiptFooterMessage] = useState(settings.receiptFooterMessage);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(settings.gracePeriodMinutes.toString());
  const [warningAlertThresholdMinutes, setWarningAlertThresholdMinutes] = useState(settings.warningAlertThresholdMinutes.toString());
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(settings.soundAlertsEnabled);

  // New station state
  const [showAddStation, setShowAddStation] = useState(false);
  const [newStName, setNewStName] = useState('');
  const [newStCategory, setNewStCategory] = useState<StationCategory>('ps4_standard');
  const [newStRate, setNewStRate] = useState('200');
  const [newStSpecs, setNewStSpecs] = useState('');

  const [activeTab, setActiveTab] = useState<'rates' | 'general' | 'backup'>('rates');
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      cafeName: cafeName.trim() || 'My Gaming Lounge',
      cafeTagline: cafeTagline.trim(),
      currencySymbol: currencySymbol.trim() || '৳',
      phoneOrContact: phoneOrContact.trim(),
      receiptFooterMessage: receiptFooterMessage.trim(),
      gracePeriodMinutes: parseInt(gracePeriodMinutes, 10) || 0,
      extraControllerHourlyFee: 0,
      warningAlertThresholdMinutes: parseInt(warningAlertThresholdMinutes, 10) || 5,
      soundAlertsEnabled,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleRateChange = (stationId: string, newRateStr: string) => {
    const rate = parseFloat(newRateStr);
    if (!isNaN(rate) && rate >= 0) {
      updateStation(stationId, { hourlyRate: rate });
    }
  };

  const handleCreateStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStName.trim()) return;

    let icon: Station['iconType'] = 'gamepad';
    if (newStCategory === 'ps4_racing') icon = 'racing';
    else if (newStCategory === 'pandora_box') icon = 'arcade';
    else if (newStCategory === 'billiard') icon = 'billiard';

    addStation({
      name: newStName.trim(),
      category: newStCategory,
      hourlyRate: parseFloat(newStRate) || 5.0,
      description: `${newStName.trim()} gaming station`,
      hardwareSpecs: newStSpecs.trim() || 'Ready for play',
      featuredGames: [],
      iconType: icon,
    });

    setNewStName('');
    setNewStSpecs('');
    setShowAddStation(false);
  };

  const handleExportBackup = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GameHub_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportBackup = () => {
    if (!importJsonText.trim()) return;
    const ok = importDatabaseJSON(importJsonText.trim());
    if (ok) {
      setImportStatus('Backup successfully restored!');
      setImportJsonText('');
      setTimeout(() => setImportStatus(''), 3000);
    } else {
      setImportStatus('Invalid JSON backup file format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl shadow-black/80 my-4 sm:my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Settings & Hourly Pricing Configurator
              </h2>
              <p className="text-xs text-zinc-400">
                Customize rates, hardware stations, currency symbol, and sound alerts
              </p>
            </div>
          </div>
          <button
            id="close-settings-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 py-2.5 border-b border-zinc-800/80 flex items-center gap-2 bg-zinc-950/60 shrink-0">
          {[
            { id: 'rates', label: '💰 Station Hourly Rates' },
            { id: 'general', label: '🏢 Cafe Details & Rules' },
            { id: 'backup', label: '💾 Backup & Data Sync' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === t.id
                  ? 'bg-zinc-800 text-cyan-400 border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Station Hourly Rates */}
        {activeTab === 'rates' && (
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Station Hourly Pricing</h3>
                <p className="text-xs text-zinc-400">
                  Update hourly rental rates for each individual console and billiard table:
                </p>
              </div>
              <button
                onClick={() => setShowAddStation(!showAddStation)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-zinc-700 flex items-center gap-1 transition-colors active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddStation ? 'Cancel' : '+ Add Station'}</span>
              </button>
            </div>

            {/* Add New Station Drawer */}
            {showAddStation && (
              <form
                onSubmit={handleCreateStation}
                className="p-4 rounded-xl bg-zinc-950 border border-cyan-500/30 space-y-3"
              >
                <span className="text-xs font-bold text-cyan-400 block">Add New Table or Console</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    required
                    value={newStName}
                    onChange={(e) => setNewStName(e.target.value)}
                    placeholder="Station Name (e.g. PS5 #1 or Table #5)"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                  <select
                    value={newStCategory}
                    onChange={(e) => setNewStCategory(e.target.value as StationCategory)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ps4_standard">PS4 Standard Console</option>
                    <option value="ps4_racing">PS4 Racing Sim Cockpit</option>
                    <option value="pandora_box">Pandora Box Arcade</option>
                    <option value="billiard">Billiard Table (Pool)</option>
                  </select>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newStRate}
                    onChange={(e) => setNewStRate(e.target.value)}
                    placeholder="Hourly Rate (৳/hr)"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-zinc-950 shadow-xs"
                  >
                    Save Station
                  </button>
                </div>
              </form>
            )}

            {/* Stations List with live rate inputs */}
            <div className="space-y-2.5">
              {stations.map((st) => (
                <div
                  key={st.id}
                  className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-white truncate">{st.name}</h4>
                    <p className="text-[11px] text-zinc-400 truncate">{st.hardwareSpecs}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-700">
                      <span className="text-xs font-bold text-zinc-400 font-mono">{settings.currencySymbol}</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        defaultValue={st.hourlyRate}
                        onBlur={(e) => handleRateChange(st.id, e.target.value)}
                        className="w-16 text-xs font-mono font-bold text-emerald-400 bg-transparent text-right focus:outline-none"
                      />
                      <span className="text-xs text-zinc-500">/hr</span>
                    </div>

                    {stations.length > 1 && (
                      <button
                        onClick={() => deleteStation(st.id)}
                        className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                        title="Remove station"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: General Settings */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral} className="p-6 overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Gaming Cafe / Lounge Name
                </label>
                <input
                  type="text"
                  value={cafeName}
                  onChange={(e) => setCafeName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={cafeTagline}
                  onChange={(e) => setCafeTagline(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Currency Symbol (e.g. $, €, £, ৳, ₹)
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Phone / Contact on Receipt
                </label>
                <input
                  type="text"
                  value={phoneOrContact}
                  onChange={(e) => setPhoneOrContact(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Grace Period (Minutes before next billing)
                </label>
                <input
                  type="number"
                  min="0"
                  value={gracePeriodMinutes}
                  onChange={(e) => setGracePeriodMinutes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Receipt Footer Message
              </label>
              <input
                type="text"
                value={receiptFooterMessage}
                onChange={(e) => setReceiptFooterMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Sound Toggle */}
            <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Sound Alerts</span>
                  <span className="text-[10px] text-zinc-400">
                    Play audio chime on 5-minute warnings, expired sessions, and checkouts
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundAlertsEnabled}
                onChange={(e) => setSoundAlertsEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              {savedSuccess ? (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Settings Saved!
                </span>
              ) : (
                <span></span>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98]"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Backup & Restore */}
        {activeTab === 'backup' && (
          <div className="p-6 overflow-y-auto space-y-5">
            <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-xs text-white">Export Local Database Backup</h4>
              </div>
              <p className="text-xs text-zinc-400">
                Download a JSON backup of all stations, custom game lists, inventory products, waitlist, and sales receipts.
              </p>
              <button
                onClick={handleExportBackup}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-zinc-950 shadow-[0_0_15px_rgba(6,182,212,0.25)] flex items-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Download Database JSON</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-xs text-white">Restore Database from JSON</h4>
              </div>
              <textarea
                rows={3}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Paste exported backup JSON here..."
                className="w-full p-2.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono focus:outline-none focus:border-amber-500"
              />
              {importStatus && (
                <p className="text-xs text-emerald-400 font-semibold">{importStatus}</p>
              )}
              <button
                onClick={handleImportBackup}
                disabled={!importJsonText.trim()}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  !importJsonText.trim()
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
                    : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(251,191,36,0.25)] active:scale-[0.98]'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Restore Backup</span>
              </button>
            </div>

            {/* Reset Defaults */}
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="font-bold text-xs">Reset All Data to Factory Default</h4>
              </div>
              <p className="text-[11px] text-red-300/80">
                Reinitializes the 3 PS4s (1 Racing + 2 Arena/Party), 1 Pandora Box, and 4 Billiard tables with default game lists.
              </p>
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors"
                >
                  Reset to Default Setup
                </button>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-red-400 font-bold">Are you sure?</span>
                  <button
                    onClick={() => {
                      resetToDefaults();
                      setShowResetConfirm(false);
                      onClose();
                    }}
                    className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-xs font-bold"
                  >
                    Yes, Reset Everything
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
