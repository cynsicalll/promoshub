// Shared domain types for the Promo Management System

export type PromoStatus = "GEPLANT" | "AKTIV" | "ABGESCHLOSSEN" | "STORNIERT";

export type PaymentStatus =
  | "OFFEN"
  | "AUSGEZAHLT"
  | "ANGEKOMMEN"
  | "UEBERFAELLIG";

export interface Customer {
  id: string;
  name: string;
  company: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Sound {
  id: string;
  name: string;
  artist: string | null;
  internalRef: string | null;
  url: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromoSound {
  id: string;
  promoId: string;
  soundId: string;
  quantityTotal: number;
  quantityUsed: number;
  sound: Sound;
}

export interface Payment {
  id: string;
  promoId: string;
  amount: number;
  expectedDate: string | null;
  payoutDate: string | null;
  receivedDate: string | null;
  paidOut: boolean;
  received: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TikTok {
  id: string;
  promoId: string;
  soundId: string | null;
  url: string;
  title: string | null;
  playCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  shareCount: number | null;
  statsSynced: string | null;
  createdAt: string;
}

export interface Promo {
  id: string;
  name: string;
  customerId: string | null;
  date: string;
  status: PromoStatus;
  notes: string | null;
  tiktokTarget: number;
  shareCode: string | null;
  shareEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  customer: Customer | null;
  sounds: PromoSound[];
  payments: Payment[];
  tiktoks: TikTok[];
}

// Payloads
export interface PromoInput {
  name: string;
  customerId: string | null;
  date: string;
  status: PromoStatus;
  notes: string | null;
  tiktokTarget: number;
  sounds: {
    soundId: string;
    quantityTotal: number;
    quantityUsed: number;
  }[];
  payments: {
    id?: string;
    amount: number;
    expectedDate: string | null;
    payoutDate: string | null;
    receivedDate: string | null;
    paidOut: boolean;
    received: boolean;
    notes: string | null;
  }[];
  tiktoks: {
    id?: string;
    url: string;
    title: string | null;
    soundId: string | null;
  }[];
}

export interface CustomerInput {
  name: string;
  company?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface SoundInput {
  name: string;
  artist?: string | null;
  internalRef?: string | null;
  url?: string | null;
  notes?: string | null;
}

export interface PaymentInput {
  promoId: string;
  amount: number;
  expectedDate?: string | null;
  payoutDate?: string | null;
  receivedDate?: string | null;
  paidOut?: boolean;
  received?: boolean;
  notes?: string | null;
}

// Customer-facing share payload (no sensitive data)
export interface ShareData {
  name: string;
  customerName: string | null;
  customerCompany: string | null;
  date: string;
  status: PromoStatus;
  notes: string | null;
  tiktokTarget: number;
  tiktokDone: number;
  sounds: {
    name: string;
    artist: string | null;
    url: string | null;
    quantityTotal: number;
    quantityUsed: number;
    quantityRemaining: number;
  }[];
  tiktoks: {
    url: string;
    title: string | null;
    soundName: string | null;
    playCount: number | null;
    likeCount: number | null;
    createdAt: string;
  }[];
}

// Monthly aggregation entry
export interface MonthlyEntry {
  key: string; // yyyy-MM
  label: string; // e.g. "Okt 26"
  promos: number;
  earned: number;
  received: number;
  outstanding: number;
  tiktoks: number;
}

// Dashboard aggregate
export interface DashboardData {
  counts: {
    total: number;
    aktiv: number;
    geplant: number;
    abgeschlossen: number;
    storniert: number;
    openSoundsRemaining: number;
  };
  money: {
    totalEarned: number; // sum of all promo amounts
    received: number; // sum of received payments
    outstanding: number; // totalEarned - received
    paidOut: number; // sum of paidOut payments
    notPaidOut: number; // totalEarned - paidOut
  };
  recentPromos: Promo[];
  recentPayments: (Payment & { promo: Promo })[];
  overduePayments: (Payment & { promo: Promo })[];
  monthly: { month: string; earned: number; received: number }[];
}

export const PROMO_STATUS_LABELS: Record<PromoStatus, string> = {
  GEPLANT: "Geplant",
  AKTIV: "Aktiv",
  ABGESCHLOSSEN: "Abgeschlossen",
  STORNIERT: "Storniert",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  OFFEN: "Offen",
  AUSGEZAHLT: "Ausgezahlt",
  ANGEKOMMEN: "Angekommen",
  UEBERFAELLIG: "Überfällig",
};
