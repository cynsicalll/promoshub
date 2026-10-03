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

export interface Promo {
  id: string;
  name: string;
  customerId: string | null;
  date: string;
  status: PromoStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: Customer | null;
  sounds: PromoSound[];
  payments: Payment[];
}

// Payloads
export interface PromoInput {
  name: string;
  customerId: string | null;
  date: string;
  status: PromoStatus;
  notes: string | null;
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
