import React, { useState } from 'react';
import { CafeProvider } from './context/CafeContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';

function AppContent() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950 pb-16 md:pb-6 relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.10),rgba(255,255,255,0))] z-0" />
      <div className="fixed bottom-0 right-0 pointer-events-none w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl z-0" />
      <div className="fixed top-1/3 left-0 pointer-events-none w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl z-0" />

      <div className="relative z-10">
        <Header
          onOpenPOS={() => setIsPOSOpen(true)}
          onOpenWaitlist={() => setIsWaitlistOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      </div>

      <div className="flex-1 relative z-10">
        <Dashboard
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          isPOSOpen={isPOSOpen}
          setIsPOSOpen={setIsPOSOpen}
          isWaitlistOpen={isWaitlistOpen}
          setIsWaitlistOpen={setIsWaitlistOpen}
          isSettingsOpen={isSettingsOpen}
          setIsSettingsOpen={setIsSettingsOpen}
        />
      </div>

      <footer className="relative z-10 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md py-3.5 px-4 text-center text-xs text-zinc-500 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            <span className="text-zinc-400 font-semibold tracking-wide">CLOUD DATABASE: ONLINE</span>
          </div>
          <p className="text-zinc-500 tracking-wider">TOUCH OPTIMIZED • LIVE CAFÉ MANAGEMENT</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <CafeProvider>
      <AppContent />
    </CafeProvider>
  );
}
