export type StationCategory = 'ps4_racing' | 'ps4_standard' | 'pandora_box' | 'billiard';

export type SessionStatus = 'available' | 'active' | 'paused' | 'expired' | 'warning';

export type BillingMode = 'prepaid' | 'open_ended';

export interface Station {
  id: string;
  name: string;
  category: StationCategory;
  hourlyRate: number;
  description: string;
  hardwareSpecs: string;
  featuredGames: string[];
  iconType: 'racing' | 'gamepad' | 'arcade' | 'billiard';
  currentSession?: StationSession;
}

export interface BilliardMatch {
  player1Name: string;
  player2Name: string;
  raceTo?: number; // e.g. 5 for Race to 5
  player1Score: number;
  player2Score: number;
  matchType?: string; // e.g. "Race to 5", "Race to 3", "Race to 7", "Open Match"
  loserPays: boolean; // default true
  winner?: 'player1' | 'player2';
  payer?: 'loser' | 'player1' | 'player2' | 'split' | 'custom';
  payerName?: string;
}

export interface PlayerRackLoss {
  id: string;
  tableId?: string;
  tableName: string; // e.g. "Table #1 (9ft Slate)"
  opponentName: string; // e.g. "Rahim"
  gameType: string; // e.g. "8-Ball Rack", "9-Ball Rack", "Snooker Frame", "Match Loss"
  fee: number; // e.g. 50
  timestamp: number;
  notes?: string;
}

export interface PlayerTab {
  id: string;
  playerName: string;
  phone?: string;
  createdAt: number;
  activeStationId?: string; // If currently seated at an active console / table
  rackLosses: PlayerRackLoss[];
  orders: TabOrderItem[];
  discountAmount: number;
  discountType: 'fixed' | 'percentage';
  notes?: string;
}

export interface StationSession {
  id: string;
  stationId: string;
  customerName: string;
  customerPhone?: string;
  billingMode: BillingMode;
  startTime: number; // timestamp
  allocatedMinutes?: number; // for prepaid
  pausedAt?: number;
  totalPausedDurationMs: number; // accumulated pause time
  notes?: string;
  extraControllersCount?: number;
  extraControllerFee?: number;
  billiardMatch?: BilliardMatch;
  orders: TabOrderItem[];
  discountAmount: number;
  discountType: 'fixed' | 'percentage';
  hasTriggeredWarning?: boolean;
  hasTriggeredExpiry?: boolean;
}

export interface TabOrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  category: 'drink' | 'snack' | 'food' | 'accessory' | 'other';
  timestamp: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'drink' | 'snack' | 'food' | 'accessory' | 'other';
  stock: number;
  imageEmoji: string;
}

export interface GameItem {
  id: string;
  title: string;
  stationCategory: StationCategory;
  genre: string;
  players: string; // e.g. "1-2 Players", "1-4 Players", "1 Player"
  hardwareRequired: string; // e.g. "Logitech G29 Steering Wheel + Pedals", "DualShock 4", "Arcade 6-Button Joystick", "Standard Cues"
  description: string;
  releaseYear?: number;
  rating?: string;
  isPopular?: boolean;
}

export interface WaitlistEntry {
  id: string;
  customerName: string;
  phone: string;
  preferredCategory: StationCategory | 'any';
  preferredStationId?: string;
  partySize: number;
  createdAt: number;
  notes?: string;
  status: 'waiting' | 'notified' | 'seated' | 'cancelled';
}

export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'custom' | 'card' | 'digital_wallet' | 'split';

export interface CompletedBill {
  id: string;
  receiptNumber: string;
  stationId: string;
  stationName: string;
  stationCategory: StationCategory;
  customerName: string;
  customerPhone?: string;
  billingMode?: BillingMode;
  allocatedMinutes?: number;
  pausedDurationMs?: number;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  hourlyRate: number;
  gamingTimeCost: number;
  extraControllersCost?: number;
  billiardMatch?: BilliardMatch;
  rackLosses?: PlayerRackLoss[];
  rackFeeCost?: number;
  concessionsCost: number;
  orders: TabOrderItem[];
  discountAmount: number;
  discountType?: 'fixed' | 'percentage';
  discountValue?: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  customPaymentName?: string;
  trxId?: string;
  senderNumber?: string;
  cashReceived?: number;
  cashChange?: number;
  notes?: string;
  createdAt: number;
}

export interface AppSettings {
  cafeName: string;
  cafeTagline: string;
  currencySymbol: string;
  currencyCode: string;
  taxRatePercent: number;
  gracePeriodMinutes: number; // e.g. 5 min grace before charging next block
  billingIntervalMinutes: number; // 1 = exact per minute, 15, 30, 60 = rounded
  extraControllerHourlyFee?: number;
  defaultRackFee?: number; // e.g. 50 BDT per rack
  warningAlertThresholdMinutes: number; // e.g. 5 mins before prepaid expires
  soundAlertsEnabled: boolean;
  phoneOrContact: string;
  receiptFooterMessage: string;
}

export interface ShiftSummary {
  date: string;
  startingCash: number;
  totalGamingRevenue: number;
  totalConcessionsRevenue: number;
  totalDiscounts: number;
  totalCollected: number;
  paymentBreakdown: Record<PaymentMethod, number>;
  totalSessionsCount: number;
  totalMinutesPlayed: number;
}
