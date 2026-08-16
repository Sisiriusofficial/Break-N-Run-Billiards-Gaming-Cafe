import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  AppSettings,
  BilliardMatch,
  CompletedBill,
  GameItem,
  PaymentMethod,
  PlayerRackLoss,
  PlayerTab,
  Product,
  Station,
  StationSession,
  TabOrderItem,
  WaitlistEntry,
} from '../types';
import {
  DEFAULT_SETTINGS,
  INITIAL_BILLS,
  INITIAL_GAMES,
  INITIAL_PLAYER_TABS,
  INITIAL_PRODUCTS,
  INITIAL_STATIONS,
  INITIAL_WAITLIST,
} from '../data/initialData';
import { soundManager } from '../utils/audioAlert';
import { computeSessionState } from '../utils/formatters';

interface CafeContextType {
  stations: Station[];
  games: GameItem[];
  products: Product[];
  waitlist: WaitlistEntry[];
  completedBills: CompletedBill[];
  playerTabs: PlayerTab[];
  settings: AppSettings;
  currentTime: number;
  
  // Session Actions
  startSession: (
    stationId: string,
    data: {
      customerName: string;
      customerPhone?: string;
      billingMode: 'prepaid' | 'open_ended';
      allocatedMinutes?: number;
      extraControllersCount?: number;
      notes?: string;
      billiardMatch?: BilliardMatch;
      initialOrders?: TabOrderItem[];
    }
  ) => void;
  updateBilliardScore: (stationId: string, player: 'player1' | 'player2', delta: number) => void;
  setBilliardWinner: (stationId: string, winner: 'player1' | 'player2' | undefined) => void;
  setBilliardPayer: (
    stationId: string,
    payer: 'loser' | 'player1' | 'player2' | 'split' | 'custom',
    payerName?: string
  ) => void;
  addMinutesToSession: (stationId: string, minutes: number) => void;
  togglePauseSession: (stationId: string) => void;
  addOrderToSession: (stationId: string, product: Product, quantity: number) => void;
  removeOrderFromSession: (stationId: string, orderId: string) => void;
  updateSessionDiscount: (stationId: string, amount: number, type: 'fixed' | 'percentage') => void;
  transferSession: (sourceStationId: string, targetStationId: string) => boolean;
  completeAndCheckoutSession: (
    stationId: string,
    paymentMethod: PaymentMethod,
    cashReceived?: number,
    notes?: string,
    paymentDetails?: {
      customPaymentName?: string;
      trxId?: string;
      senderNumber?: string;
      payerNameOverride?: string;
    }
  ) => CompletedBill | null;
  cancelSession: (stationId: string) => void;

  // Player Tabs & Racking Ledger
  createPlayerTab: (playerName: string, phone?: string, notes?: string, activeStationId?: string) => PlayerTab;
  addRackLossToPlayer: (
    tabIdOrPlayerName: string,
    lossData: {
      tableId?: string;
      tableName: string;
      opponentName: string;
      gameType?: string;
      fee?: number;
      notes?: string;
    }
  ) => void;
  removeRackLoss: (tabId: string, rackLossId: string) => void;
  addOrderToPlayerTab: (tabId: string, product: Product, quantity: number) => void;
  removeOrderFromPlayerTab: (tabId: string, orderId: string) => void;
  updatePlayerTabDiscount: (tabId: string, amount: number, type: 'fixed' | 'percentage') => void;
  deletePlayerTab: (tabId: string) => void;
  checkoutPlayerTab: (
    tabId: string,
    paymentMethod: PaymentMethod,
    cashReceived?: number,
    notes?: string,
    paymentDetails?: {
      customPaymentName?: string;
      trxId?: string;
      senderNumber?: string;
    }
  ) => CompletedBill | null;

  // Direct Concession POS
  directConcessionCheckout: (
    items: { product: Product; quantity: number }[],
    paymentMethod: PaymentMethod,
    customerName?: string,
    cashReceived?: number,
    paymentDetails?: {
      customPaymentName?: string;
      trxId?: string;
      senderNumber?: string;
    }
  ) => CompletedBill | null;

  // Catalog & Inventory
  addGame: (game: Omit<GameItem, 'id'>) => void;
  updateGame: (id: string, updates: Partial<GameItem>) => void;
  deleteGame: (id: string) => void;
  
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Waitlist
  addWaitlist: (entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'status'>) => void;
  updateWaitlistStatus: (id: string, status: WaitlistEntry['status']) => void;
  deleteWaitlist: (id: string) => void;

  // Stations & Settings
  updateStation: (id: string, updates: Partial<Station>) => void;
  addStation: (station: Omit<Station, 'id'>) => void;
  deleteStation: (id: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  // Backup & Reset
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;
  resetToDefaults: () => void;
}

const STORAGE_KEYS = {
  STATIONS: 'gamehub_stations_bdt_v2',
  GAMES: 'gamehub_games_bdt_v2',
  PRODUCTS: 'gamehub_products_bdt_v2',
  WAITLIST: 'gamehub_waitlist_bdt_v2',
  BILLS: 'gamehub_bills_bdt_v2',
  SETTINGS: 'gamehub_settings_bdt_v2',
  PLAYER_TABS: 'gamehub_player_tabs_bdt_v2',
};

const CafeContext = createContext<CafeContextType | undefined>(undefined);

export const CafeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage or defaults
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.currencySymbol || parsed.currencySymbol === '$') {
          parsed.currencySymbol = '৳';
          parsed.currencyCode = 'BDT';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [stations, setStations] = useState<Station[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STATIONS);
      if (saved) {
        const parsed: Station[] = JSON.parse(saved);
        // If loaded with old single-digit rates from previous version, refresh to BDT defaults
        if (parsed.length > 0 && parsed.some((s) => s.hourlyRate <= 20)) {
          return INITIAL_STATIONS;
        }
        return parsed;
      }
      return INITIAL_STATIONS;
    } catch {
      return INITIAL_STATIONS;
    }
  });

  const [games, setGames] = useState<GameItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GAMES);
      return saved ? JSON.parse(saved) : INITIAL_GAMES;
    } catch {
      return INITIAL_GAMES;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        // If old single-digit prices, refresh to BDT defaults
        if (parsed.length > 0 && parsed.some((p) => p.price <= 10)) {
          return INITIAL_PRODUCTS;
        }
        return parsed;
      }
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WAITLIST);
      return saved ? JSON.parse(saved) : INITIAL_WAITLIST;
    } catch {
      return INITIAL_WAITLIST;
    }
  });

  const [completedBills, setCompletedBills] = useState<CompletedBill[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BILLS);
      return saved ? JSON.parse(saved) : INITIAL_BILLS;
    } catch {
      return INITIAL_BILLS;
    }
  });

  const [playerTabs, setPlayerTabs] = useState<PlayerTab[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYER_TABS);
      return saved ? JSON.parse(saved) : INITIAL_PLAYER_TABS;
    } catch {
      return INITIAL_PLAYER_TABS;
    }
  });

  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const triggeredAlertsRef = useRef<{ [sessionId: string]: { warning?: boolean; expired?: boolean } }>({});

  // Sync sound manager toggle
  useEffect(() => {
    soundManager.setEnabled(settings.soundAlertsEnabled);
  }, [settings.soundAlertsEnabled]);

  // Persistent storage writers
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(stations));
  }, [stations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
  }, [games]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WAITLIST, JSON.stringify(waitlist));
  }, [waitlist]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(completedBills));
  }, [completedBills]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLAYER_TABS, JSON.stringify(playerTabs));
  }, [playerTabs]);

  // Master Clock & Audio Trigger Loop (Every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      // Check active stations for alerts
      stations.forEach((st) => {
        if (!st.currentSession) return;
        const session = st.currentSession;
        const state = computeSessionState(session, st.hourlyRate, settings, now);

        const alertRecord = triggeredAlertsRef.current[session.id] || {};

        if (state.isWarning && !state.isExpired && !alertRecord.warning) {
          soundManager.playWarningAlert();
          alertRecord.warning = true;
          triggeredAlertsRef.current[session.id] = alertRecord;
        }

        if (state.isExpired && !alertRecord.expired) {
          soundManager.playExpiredAlert();
          alertRecord.expired = true;
          triggeredAlertsRef.current[session.id] = alertRecord;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stations, settings]);

  // Action: Start Session
  const startSession = useCallback(
    (
      stationId: string,
      data: {
        customerName: string;
        customerPhone?: string;
        billingMode: 'prepaid' | 'open_ended';
        allocatedMinutes?: number;
        extraControllersCount?: number;
        notes?: string;
        billiardMatch?: BilliardMatch;
        initialOrders?: TabOrderItem[];
      }
    ) => {
      const now = Date.now();
      const newSession: StationSession = {
        id: `sess-${now}-${Math.random().toString(36).substr(2, 5)}`,
        stationId,
        customerName: data.customerName.trim() || 'Guest Customer',
        customerPhone: data.customerPhone?.trim(),
        billingMode: data.billingMode,
        startTime: now,
        allocatedMinutes: data.billingMode === 'prepaid' ? data.allocatedMinutes || 60 : undefined,
        totalPausedDurationMs: 0,
        notes: data.notes,
        extraControllersCount: 0,
        extraControllerFee: 0,
        billiardMatch: data.billiardMatch,
        orders: data.initialOrders || [],
        discountAmount: 0,
        discountType: 'fixed',
      };

      setStations((prev) =>
        prev.map((s) => (s.id === stationId ? { ...s, currentSession: newSession } : s))
      );

      soundManager.playStartChime();
    },
    []
  );

  // Action: Update Billiard Match Score (+ / - Racks)
  const updateBilliardScore = useCallback(
    (stationId: string, player: 'player1' | 'player2', delta: number) => {
      setStations((prev) =>
        prev.map((s) => {
          if (s.id !== stationId || !s.currentSession || !s.currentSession.billiardMatch) return s;
          const match = s.currentSession.billiardMatch;
          const newP1Score = player === 'player1' ? Math.max(0, match.player1Score + delta) : match.player1Score;
          const newP2Score = player === 'player2' ? Math.max(0, match.player2Score + delta) : match.player2Score;

          let winner = match.winner;
          let payer = match.payer || 'loser';
          let payerName = match.payerName;

          // Check if race target reached
          if (match.raceTo && match.raceTo > 0) {
            if (newP1Score >= match.raceTo && newP1Score > newP2Score) {
              winner = 'player1';
              if (match.loserPays) {
                payer = 'loser';
                payerName = `${match.player2Name || 'Player 2'} (Loser - Race to ${match.raceTo})`;
              }
            } else if (newP2Score >= match.raceTo && newP2Score > newP1Score) {
              winner = 'player2';
              if (match.loserPays) {
                payer = 'loser';
                payerName = `${match.player1Name || 'Player 1'} (Loser - Race to ${match.raceTo})`;
              }
            } else if (winner) {
              // Score dropped below race
              winner = undefined;
            }
          }

          return {
            ...s,
            currentSession: {
              ...s.currentSession,
              billiardMatch: {
                ...match,
                player1Score: newP1Score,
                player2Score: newP2Score,
                winner,
                payer,
                payerName,
              },
            },
          };
        })
      );
    },
    []
  );

  // Action: Set Billiard Winner
  const setBilliardWinner = useCallback((stationId: string, winner: 'player1' | 'player2' | undefined) => {
    setStations((prev) =>
      prev.map((s) => {
        if (s.id !== stationId || !s.currentSession || !s.currentSession.billiardMatch) return s;
        const match = s.currentSession.billiardMatch;
        let payer = match.payer || 'loser';
        let payerName = match.payerName;

        if (winner === 'player1') {
          if (match.loserPays) {
            payer = 'loser';
            payerName = `${match.player2Name || 'Player 2'} (Loser)`;
          }
        } else if (winner === 'player2') {
          if (match.loserPays) {
            payer = 'loser';
            payerName = `${match.player1Name || 'Player 1'} (Loser)`;
          }
        }

        return {
          ...s,
          currentSession: {
            ...s.currentSession,
            billiardMatch: {
              ...match,
              winner,
              payer,
              payerName,
            },
          },
        };
      })
    );
  }, []);

  // Action: Set Billiard Payer
  const setBilliardPayer = useCallback(
    (
      stationId: string,
      payer: 'loser' | 'player1' | 'player2' | 'split' | 'custom',
      customPayerName?: string
    ) => {
      setStations((prev) =>
        prev.map((s) => {
          if (s.id !== stationId || !s.currentSession || !s.currentSession.billiardMatch) return s;
          const match = s.currentSession.billiardMatch;
          let calculatedName = customPayerName;

          if (!calculatedName) {
            if (payer === 'loser') {
              if (match.winner === 'player1') calculatedName = `${match.player2Name || 'Player 2'} (Loser)`;
              else if (match.winner === 'player2') calculatedName = `${match.player1Name || 'Player 1'} (Loser)`;
              else calculatedName = 'Loser (Pending Match Result)';
            } else if (payer === 'player1') {
              calculatedName = match.player1Name || 'Player 1';
            } else if (payer === 'player2') {
              calculatedName = match.player2Name || 'Player 2';
            } else if (payer === 'split') {
              calculatedName = `${match.player1Name || 'P1'} & ${match.player2Name || 'P2'} (Split 50/50)`;
            }
          }

          return {
            ...s,
            currentSession: {
              ...s.currentSession,
              billiardMatch: {
                ...match,
                payer,
                payerName: calculatedName,
              },
            },
          };
        })
      );
    },
    []
  );

  // Action: Add Minutes to Prepaid Session
  const addMinutesToSession = useCallback((stationId: string, minutes: number) => {
    setStations((prev) =>
      prev.map((s) => {
        if (s.id !== stationId || !s.currentSession) return s;
        const cur = s.currentSession;
        const currentAllocated = cur.allocatedMinutes || 60;
        const newAllocated = Math.max(15, currentAllocated + minutes);

        // Reset triggered expiry alert if time added
        if (triggeredAlertsRef.current[cur.id]) {
          triggeredAlertsRef.current[cur.id] = { warning: false, expired: false };
        }

        return {
          ...s,
          currentSession: {
            ...cur,
            allocatedMinutes: newAllocated,
          },
        };
      })
    );
    soundManager.playStartChime();
  }, []);

  // Action: Pause / Resume Session
  const togglePauseSession = useCallback((stationId: string) => {
    const now = Date.now();
    setStations((prev) =>
      prev.map((s) => {
        if (s.id !== stationId || !s.currentSession) return s;
        const cur = s.currentSession;
        const isCurrentlyPaused = typeof cur.pausedAt === 'number' && cur.pausedAt > 0;

        if (isCurrentlyPaused) {
          // Resume: add pause duration to accumulated pause time
          const pauseSpan = now - cur.pausedAt!;
          return {
            ...s,
            currentSession: {
              ...cur,
              pausedAt: undefined,
              totalPausedDurationMs: cur.totalPausedDurationMs + pauseSpan,
            },
          };
        } else {
          // Pause now
          return {
            ...s,
            currentSession: {
              ...cur,
              pausedAt: now,
            },
          };
        }
      })
    );
  }, []);

  // Action: Add Concession/Product order to session
  const addOrderToSession = useCallback((stationId: string, product: Product, quantity: number) => {
    if (quantity <= 0) return;

    setStations((prev) =>
      prev.map((s) => {
        if (s.id !== stationId || !s.currentSession) return s;
        const cur = s.currentSession;
        const existingIdx = cur.orders.findIndex((o) => o.productId === product.id);
        let updatedOrders = [...cur.orders];

        if (existingIdx >= 0) {
          updatedOrders[existingIdx] = {
            ...updatedOrders[existingIdx],
            quantity: updatedOrders[existingIdx].quantity + quantity,
          };
        } else {
          const newOrder: TabOrderItem = {
            id: `ord-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            category: product.category,
            timestamp: Date.now(),
          };
          updatedOrders.push(newOrder);
        }

        return {
          ...s,
          currentSession: {
            ...cur,
            orders: updatedOrders,
          },
        };
      })
    );

    // Deduct stock
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: Math.max(0, p.stock - quantity) } : p))
    );
  }, []);

  // Action: Remove order item
  const removeOrderFromSession = useCallback((stationId: string, orderId: string) => {
    setStations((prev) =>
      prev.map((s) => {
        if (s.id !== stationId || !s.currentSession) return s;
        const cur = s.currentSession;
        const targetOrder = cur.orders.find((o) => o.id === orderId);

        // Restore stock
        if (targetOrder) {
          setProducts((prodList) =>
            prodList.map((p) =>
              p.id === targetOrder.productId ? { ...p, stock: p.stock + targetOrder.quantity } : p
            )
          );
        }

        return {
          ...s,
          currentSession: {
            ...cur,
            orders: cur.orders.filter((o) => o.id !== orderId),
          },
        };
      })
    );
  }, []);

  // Action: Update Discount
  const updateSessionDiscount = useCallback(
    (stationId: string, amount: number, type: 'fixed' | 'percentage') => {
      setStations((prev) =>
        prev.map((s) => {
          if (s.id !== stationId || !s.currentSession) return s;
          return {
            ...s,
            currentSession: {
              ...s.currentSession,
              discountAmount: Math.max(0, amount),
              discountType: type,
            },
          };
        })
      );
    },
    []
  );

  // Action: Transfer Session to another Station
  const transferSession = useCallback(
    (sourceStationId: string, targetStationId: string): boolean => {
      const source = stations.find((s) => s.id === sourceStationId);
      const target = stations.find((s) => s.id === targetStationId);

      if (!source || !source.currentSession || !target || target.currentSession) {
        return false;
      }

      const sessionToMove = {
        ...source.currentSession,
        stationId: targetStationId,
      };

      setStations((prev) =>
        prev.map((s) => {
          if (s.id === sourceStationId) {
            return { ...s, currentSession: undefined };
          }
          if (s.id === targetStationId) {
            return { ...s, currentSession: sessionToMove };
          }
          return s;
        })
      );

      soundManager.playStartChime();
      return true;
    },
    [stations]
  );

  // Action: Complete & Checkout Session
  const completeAndCheckoutSession = useCallback(
    (
      stationId: string,
      paymentMethod: PaymentMethod,
      cashReceived?: number,
      notes?: string,
      paymentDetails?: {
        customPaymentName?: string;
        trxId?: string;
        senderNumber?: string;
        payerNameOverride?: string;
      }
    ): CompletedBill | null => {
      const station = stations.find((s) => s.id === stationId);
      if (!station || !station.currentSession) return null;

      const session = station.currentSession;
      const now = Date.now();
      const state = computeSessionState(session, station.hourlyRate, settings, now);

      const customerDisplayName =
        paymentDetails?.payerNameOverride ||
        session.billiardMatch?.payerName ||
        session.customerName;

      const bill: CompletedBill = {
        id: `bill-${now}-${Math.random().toString(36).substr(2, 4)}`,
        receiptNumber: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        stationId: station.id,
        stationName: station.name,
        stationCategory: station.category,
        customerName: customerDisplayName,
        customerPhone: session.customerPhone,
        billingMode: session.billingMode,
        allocatedMinutes: session.allocatedMinutes,
        pausedDurationMs: session.totalPausedDurationMs,
        startTime: session.startTime,
        endTime: now,
        durationMinutes: Math.round(state.elapsedMinutes),
        hourlyRate: station.hourlyRate,
        gamingTimeCost: state.gamingTimeCost,
        extraControllersCost: 0,
        billiardMatch: session.billiardMatch,
        concessionsCost: state.concessionsCost,
        orders: [...session.orders],
        discountAmount: state.discountValue,
        discountType: session.discountType,
        discountValue: session.discountAmount,
        taxAmount: state.taxValue,
        totalAmount: state.grandTotal,
        paymentMethod: paymentMethod,
        customPaymentName: paymentDetails?.customPaymentName,
        trxId: paymentDetails?.trxId,
        senderNumber: paymentDetails?.senderNumber,
        cashReceived: cashReceived,
        cashChange: cashReceived ? Math.max(0, cashReceived - state.grandTotal) : undefined,
        notes: notes || session.notes,
        createdAt: now,
      };

      // Save bill
      setCompletedBills((prev) => [bill, ...prev]);

      // Free station
      setStations((prev) =>
        prev.map((s) => (s.id === stationId ? { ...s, currentSession: undefined } : s))
      );

      // Clean alert ref
      delete triggeredAlertsRef.current[session.id];

      soundManager.playCashRegisterSound();
      return bill;
    },
    [stations, settings]
  );

  // Action: Cancel Session
  const cancelSession = useCallback((stationId: string) => {
    setStations((prev) =>
      prev.map((s) => (s.id === stationId ? { ...s, currentSession: undefined } : s))
    );
  }, []);

  // Action: Direct Concession POS checkout (Walk-in snacks/drinks)
  const directConcessionCheckout = useCallback(
    (
      items: { product: Product; quantity: number }[],
      paymentMethod: PaymentMethod,
      customerName: string = 'Walk-in Customer',
      cashReceived?: number,
      paymentDetails?: {
        customPaymentName?: string;
        trxId?: string;
        senderNumber?: string;
      }
    ): CompletedBill | null => {
      if (items.length === 0) return null;

      const now = Date.now();
      const orders: TabOrderItem[] = items.map(({ product, quantity }) => ({
        id: `pos-${now}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        category: product.category,
        timestamp: now,
      }));

      const totalConcessions = orders.reduce((sum, o) => sum + o.price * o.quantity, 0);
      const tax = settings.taxRatePercent > 0 ? (totalConcessions * settings.taxRatePercent) / 100 : 0;
      const grandTotal = totalConcessions + tax;

      const bill: CompletedBill = {
        id: `bill-pos-${now}`,
        receiptNumber: `POS-${Math.floor(100000 + Math.random() * 900000)}`,
        stationId: 'pos-direct',
        stationName: 'Direct Concessions Store',
        stationCategory: 'ps4_standard',
        customerName: customerName.trim() || 'Walk-in Customer',
        startTime: now,
        endTime: now,
        durationMinutes: 0,
        hourlyRate: 0,
        gamingTimeCost: 0,
        extraControllersCost: 0,
        concessionsCost: totalConcessions,
        orders: orders,
        discountAmount: 0,
        taxAmount: tax,
        totalAmount: grandTotal,
        paymentMethod: paymentMethod,
        customPaymentName: paymentDetails?.customPaymentName,
        trxId: paymentDetails?.trxId,
        senderNumber: paymentDetails?.senderNumber,
        cashReceived: cashReceived,
        cashChange: cashReceived ? Math.max(0, cashReceived - grandTotal) : undefined,
        createdAt: now,
      };

      // Deduct inventory
      setProducts((prev) =>
        prev.map((p) => {
          const item = items.find((i) => i.product.id === p.id);
          if (item) {
            return { ...p, stock: Math.max(0, p.stock - item.quantity) };
          }
          return p;
        })
      );

      setCompletedBills((prev) => [bill, ...prev]);
      soundManager.playCashRegisterSound();
      return bill;
    },
    [settings.taxRatePercent]
  );

  // Action: Create Player Tab
  const createPlayerTab = useCallback(
    (playerName: string, phone?: string, notes?: string, activeStationId?: string): PlayerTab => {
      const newTab: PlayerTab = {
        id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        playerName: playerName.trim(),
        phone: phone?.trim(),
        createdAt: Date.now(),
        activeStationId,
        rackLosses: [],
        orders: [],
        discountAmount: 0,
        discountType: 'fixed',
        notes: notes?.trim(),
      };
      setPlayerTabs((prev) => [newTab, ...prev]);
      soundManager.playStartChime();
      return newTab;
    },
    []
  );

  // Action: Add Rack Loss to Player (or create tab if not existing)
  const addRackLossToPlayer = useCallback(
    (
      tabIdOrPlayerName: string,
      lossData: {
        tableId?: string;
        tableName: string;
        opponentName: string;
        gameType?: string;
        fee?: number;
        notes?: string;
      }
    ) => {
      const fee = lossData.fee ?? settings.defaultRackFee ?? 50;
      const newRackLoss: PlayerRackLoss = {
        id: `rl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        tableId: lossData.tableId,
        tableName: lossData.tableName,
        opponentName: lossData.opponentName,
        gameType: lossData.gameType || '8-Ball Rack',
        fee: fee,
        timestamp: Date.now(),
        notes: lossData.notes,
      };

      setPlayerTabs((prev) => {
        // Try to find tab by id or by name (case-insensitive)
        const tabIndex = prev.findIndex(
          (t) =>
            t.id === tabIdOrPlayerName ||
            t.playerName.toLowerCase() === tabIdOrPlayerName.toLowerCase()
        );

        if (tabIndex >= 0) {
          const updated = [...prev];
          updated[tabIndex] = {
            ...updated[tabIndex],
            rackLosses: [...updated[tabIndex].rackLosses, newRackLoss],
          };
          return updated;
        } else {
          // Create new tab for this player
          const newTab: PlayerTab = {
            id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            playerName: tabIdOrPlayerName.trim(),
            createdAt: Date.now(),
            rackLosses: [newRackLoss],
            orders: [],
            discountAmount: 0,
            discountType: 'fixed',
          };
          return [newTab, ...prev];
        }
      });
      soundManager.playAlertBeep();
    },
    [settings.defaultRackFee]
  );

  // Action: Remove Rack Loss from Player Tab
  const removeRackLoss = useCallback((tabId: string, rackLossId: string) => {
    setPlayerTabs((prev) =>
      prev.map((t) =>
        t.id === tabId
          ? { ...t, rackLosses: t.rackLosses.filter((r) => r.id !== rackLossId) }
          : t
      )
    );
  }, []);

  // Action: Add Order / Concession to Player Tab
  const addOrderToPlayerTab = useCallback((tabId: string, product: Product, quantity: number) => {
    if (quantity <= 0) return;
    const now = Date.now();
    const orderItem: TabOrderItem = {
      id: `ord-tab-${now}-${Math.random().toString(36).substr(2, 4)}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      category: product.category,
      timestamp: now,
    };

    setPlayerTabs((prev) =>
      prev.map((t) => {
        if (t.id !== tabId) return t;
        const existingIdx = t.orders.findIndex((o) => o.productId === product.id);
        let updatedOrders = [...t.orders];
        if (existingIdx >= 0) {
          updatedOrders[existingIdx] = {
            ...updatedOrders[existingIdx],
            quantity: updatedOrders[existingIdx].quantity + quantity,
            timestamp: now,
          };
        } else {
          updatedOrders.push(orderItem);
        }
        return { ...t, orders: updatedOrders };
      })
    );

    // Deduct stock
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, stock: Math.max(0, p.stock - quantity) } : p
      )
    );
    soundManager.playClickPop();
  }, []);

  // Action: Remove Order from Player Tab
  const removeOrderFromPlayerTab = useCallback((tabId: string, orderId: string) => {
    setPlayerTabs((prev) =>
      prev.map((t) => {
        if (t.id !== tabId) return t;
        const orderToRemove = t.orders.find((o) => o.id === orderId);
        if (orderToRemove) {
          setProducts((prodList) =>
            prodList.map((p) =>
              p.id === orderToRemove.productId
                ? { ...p, stock: p.stock + orderToRemove.quantity }
                : p
            )
          );
        }
        return {
          ...t,
          orders: t.orders.filter((o) => o.id !== orderId),
        };
      })
    );
  }, []);

  // Action: Update Player Tab Discount
  const updatePlayerTabDiscount = useCallback(
    (tabId: string, amount: number, type: 'fixed' | 'percentage') => {
      setPlayerTabs((prev) =>
        prev.map((t) =>
          t.id === tabId ? { ...t, discountAmount: Math.max(0, amount), discountType: type } : t
        )
      );
    },
    []
  );

  // Action: Delete Player Tab
  const deletePlayerTab = useCallback((tabId: string) => {
    setPlayerTabs((prev) => prev.filter((t) => t.id !== tabId));
  }, []);

  // Action: Settle & Checkout Player Tab (including associated hourly session if any)
  const checkoutPlayerTab = useCallback(
    (
      tabId: string,
      paymentMethod: PaymentMethod,
      cashReceived?: number,
      notes?: string,
      paymentDetails?: {
        customPaymentName?: string;
        trxId?: string;
        senderNumber?: string;
      }
    ): CompletedBill | null => {
      const tab = playerTabs.find((t) => t.id === tabId);
      if (!tab) return null;

      const now = Date.now();

      // Check if player has an active station session
      let associatedStation: Station | undefined;
      if (tab.activeStationId) {
        associatedStation = stations.find((s) => s.id === tab.activeStationId);
      }
      if (!associatedStation) {
        // Look up station by customerName
        associatedStation = stations.find(
          (s) =>
            s.currentSession &&
            s.currentSession.customerName.trim().toLowerCase() === tab.playerName.trim().toLowerCase()
        );
      }

      let gamingTimeCost = 0;
      let durationMinutes = 0;
      let stationHourlyRate = 0;
      let sessionOrders: TabOrderItem[] = [];
      let stationName = 'Player Tab / Billiards Rack Ledger';
      let stationCategory: Station['category'] = 'billiard';
      const billiardMatch = associatedStation?.currentSession?.billiardMatch;

      if (associatedStation && associatedStation.currentSession) {
        const sessionState = computeSessionState(
          associatedStation.currentSession,
          associatedStation.hourlyRate,
          now,
          settings.gracePeriodMinutes,
          settings.billingIntervalMinutes,
          settings.taxRatePercent
        );
        gamingTimeCost = sessionState.gamingTimeCost;
        durationMinutes = Math.round(sessionState.elapsedMinutes);
        stationHourlyRate = associatedStation.hourlyRate;
        stationName = associatedStation.name;
        stationCategory = associatedStation.category;
        sessionOrders = associatedStation.currentSession.orders;
      }

      // Combine orders from tab and session
      const allOrders = [...tab.orders, ...sessionOrders];
      const concessionsCost = allOrders.reduce((sum, o) => sum + o.price * o.quantity, 0);
      const rackFeeCost = tab.rackLosses.reduce((sum, r) => sum + r.fee, 0);

      const subtotalBeforeDiscount = gamingTimeCost + rackFeeCost + concessionsCost;

      // Calculate discount
      let discountValue = 0;
      if (tab.discountType === 'percentage') {
        discountValue = (subtotalBeforeDiscount * tab.discountAmount) / 100;
      } else {
        discountValue = tab.discountAmount;
      }
      discountValue = Math.min(discountValue, subtotalBeforeDiscount);

      const taxableAmount = Math.max(0, subtotalBeforeDiscount - discountValue);
      const taxAmount =
        settings.taxRatePercent > 0 ? (taxableAmount * settings.taxRatePercent) / 100 : 0;
      const totalAmount = Math.round(taxableAmount + taxAmount);

      const bill: CompletedBill = {
        id: `bill-tab-${now}`,
        receiptNumber: `TAB-${Math.floor(100000 + Math.random() * 900000)}`,
        stationId: associatedStation ? associatedStation.id : 'player-tab',
        stationName: associatedStation ? associatedStation.name : stationName,
        stationCategory: stationCategory,
        customerName: tab.playerName,
        customerPhone: tab.phone,
        billingMode: associatedStation?.currentSession?.billingMode || 'open_ended',
        allocatedMinutes: associatedStation?.currentSession?.allocatedMinutes,
        pausedDurationMs: associatedStation?.currentSession?.totalPausedDurationMs,
        startTime: tab.createdAt,
        endTime: now,
        durationMinutes: durationMinutes,
        hourlyRate: stationHourlyRate,
        gamingTimeCost: gamingTimeCost,
        extraControllersCost: 0,
        billiardMatch: billiardMatch,
        rackLosses: [...tab.rackLosses],
        rackFeeCost: rackFeeCost,
        concessionsCost: concessionsCost,
        orders: allOrders,
        discountAmount: discountValue,
        discountType: tab.discountType,
        discountValue: tab.discountAmount,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod,
        customPaymentName: paymentDetails?.customPaymentName,
        trxId: paymentDetails?.trxId,
        senderNumber: paymentDetails?.senderNumber,
        cashReceived: cashReceived,
        cashChange: cashReceived ? Math.max(0, cashReceived - totalAmount) : undefined,
        notes: notes || tab.notes,
        createdAt: now,
      };

      // Save bill
      setCompletedBills((prev) => [bill, ...prev]);

      // If associated station was active, free it
      if (associatedStation) {
        setStations((prev) =>
          prev.map((s) => (s.id === associatedStation?.id ? { ...s, currentSession: undefined } : s))
        );
        if (associatedStation.currentSession) {
          delete triggeredAlertsRef.current[associatedStation.currentSession.id];
        }
      }

      // Remove player tab
      setPlayerTabs((prev) => prev.filter((t) => t.id !== tabId));

      soundManager.playCashRegisterSound();
      return bill;
    },
    [playerTabs, stations, settings]
  );

  // Game catalog mutations
  const addGame = useCallback((gameData: Omit<GameItem, 'id'>) => {
    const newGame: GameItem = {
      ...gameData,
      id: `game-${Date.now()}`,
    };
    setGames((prev) => [newGame, ...prev]);
  }, []);

  const updateGame = useCallback((id: string, updates: Partial<GameItem>) => {
    setGames((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  }, []);

  const deleteGame = useCallback((id: string) => {
    setGames((prev) => prev.filter((g) => g.id !== id));
  }, []);

  // Product mutations
  const addProduct = useCallback((productData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [...prev, newProd]);
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Waitlist mutations
  const addWaitlist = useCallback((entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'status'>) => {
    const newEntry: WaitlistEntry = {
      ...entry,
      id: `wl-${Date.now()}`,
      createdAt: Date.now(),
      status: 'waiting',
    };
    setWaitlist((prev) => [...prev, newEntry]);
    soundManager.playStartChime();
  }, []);

  const updateWaitlistStatus = useCallback((id: string, status: WaitlistEntry['status']) => {
    setWaitlist((prev) => prev.map((w) => (w.id === id ? { ...w, status } : w)));
  }, []);

  const deleteWaitlist = useCallback((id: string) => {
    setWaitlist((prev) => prev.filter((w) => w.id !== id));
  }, []);

  // Station & Settings mutations
  const updateStation = useCallback((id: string, updates: Partial<Station>) => {
    setStations((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const addStation = useCallback((stationData: Omit<Station, 'id'>) => {
    const newStation: Station = {
      ...stationData,
      id: `station-${Date.now()}`,
    };
    setStations((prev) => [...prev, newStation]);
  }, []);

  const deleteStation = useCallback((id: string) => {
    setStations((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Backup and restore
  const exportDatabaseJSON = useCallback(() => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      stations,
      games,
      products,
      waitlist,
      completedBills,
      playerTabs,
    };
    return JSON.stringify(backup, null, 2);
  }, [settings, stations, games, products, waitlist, completedBills, playerTabs]);

  const importDatabaseJSON = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.settings) setSettings(parsed.settings);
      if (parsed.stations) setStations(parsed.stations);
      if (parsed.games) setGames(parsed.games);
      if (parsed.products) setProducts(parsed.products);
      if (parsed.waitlist) setWaitlist(parsed.waitlist);
      if (parsed.completedBills) setCompletedBills(parsed.completedBills);
      if (parsed.playerTabs) setPlayerTabs(parsed.playerTabs);
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setStations(INITIAL_STATIONS);
    setGames(INITIAL_GAMES);
    setProducts(INITIAL_PRODUCTS);
    setWaitlist(INITIAL_WAITLIST);
    setCompletedBills([]);
    setPlayerTabs(INITIAL_PLAYER_TABS);
    localStorage.clear();
  }, []);

  return (
    <CafeContext.Provider
      value={{
        stations,
        games,
        products,
        waitlist,
        completedBills,
        playerTabs,
        settings,
        currentTime,
        startSession,
        updateBilliardScore,
        setBilliardWinner,
        setBilliardPayer,
        addMinutesToSession,
        togglePauseSession,
        addOrderToSession,
        removeOrderFromSession,
        updateSessionDiscount,
        transferSession,
        completeAndCheckoutSession,
        cancelSession,
        createPlayerTab,
        addRackLossToPlayer,
        removeRackLoss,
        addOrderToPlayerTab,
        removeOrderFromPlayerTab,
        updatePlayerTabDiscount,
        deletePlayerTab,
        checkoutPlayerTab,
        directConcessionCheckout,
        addGame,
        updateGame,
        deleteGame,
        addProduct,
        updateProduct,
        deleteProduct,
        addWaitlist,
        updateWaitlistStatus,
        deleteWaitlist,
        updateStation,
        addStation,
        deleteStation,
        updateSettings,
        exportDatabaseJSON,
        importDatabaseJSON,
        resetToDefaults,
      }}
    >
      {children}
    </CafeContext.Provider>
  );
};

export const useCafe = () => {
  const context = useContext(CafeContext);
  if (!context) {
    throw new Error('useCafe must be used within a CafeProvider');
  }
  return context;
};
