import { format, parseISO, isValid } from "date-fns";
import { de } from "date-fns/locale";
import type { PaymentStatus, PromoStatus } from "./types";

const euroFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return euroFormatter.format(0);
  return euroFormatter.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "0";
  return new Intl.NumberFormat("de-DE").format(value);
}

export function parseCurrencyInput(input: string): number {
  if (!input) return 0;
  // accept "250", "250,50", "250.50", "1.000,50"
  const cleaned = input
    .replace(/[^\d.,-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "") // remove thousand dots
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

export function formatDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  return format(d, "dd.MM.yyyy", { locale: de });
}

export function formatDateInput(value: string | Date | null | undefined): string {
  // returns yyyy-MM-dd for <input type="date">
  const d = toDate(value);
  if (!d) return "";
  return format(d, "yyyy-MM-dd");
}

export function toISODate(value: string): string | null {
  // value is yyyy-MM-dd from input -> ISO string
  if (!value) return null;
  const d = new Date(value + "T00:00:00");
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function relativeDay(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  return format(d, "dd.MM.yyyy", { locale: de });
}

export function computePaymentStatus(
  paidOut: boolean,
  received: boolean,
  expectedDate: string | null
): PaymentStatus {
  if (received) return "ANGEKOMMEN";
  if (paidOut) return "AUSGEZAHLT";
  if (expectedDate) {
    const d = toDate(expectedDate);
    if (d && d.getTime() < Date.now()) return "UEBERFAELLIG";
  }
  return "OFFEN";
}

export const PROMO_STATUS_STYLES: Record<
  PromoStatus,
  { label: string; className: string; dot: string }
> = {
  GEPLANT: {
    label: "Geplant",
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  AKTIV: {
    label: "Aktiv",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  ABGESCHLOSSEN: {
    label: "Abgeschlossen",
    className:
      "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    dot: "bg-teal-600",
  },
  STORNIERT: {
    label: "Storniert",
    className:
      "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500",
  },
};

export const PAYMENT_STATUS_STYLES: Record<
  PaymentStatus,
  { label: string; className: string; dot: string }
> = {
  OFFEN: {
    label: "Offen",
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  AUSGEZAHLT: {
    label: "Ausgezahlt",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  ANGEKOMMEN: {
    label: "Angekommen",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  UEBERFAELLIG: {
    label: "Überfällig",
    className:
      "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500",
  },
};

export function promoTotal(promo: {
  payments: { amount: number }[];
}): number {
  return promo.payments.reduce((s, p) => s + (p.amount || 0), 0);
}

export function promoReceived(promo: {
  payments: { amount: number; received: boolean }[];
}): number {
  return promo.payments
    .filter((p) => p.received)
    .reduce((s, p) => s + (p.amount || 0), 0);
}

export function promoSoundsTotal(promo: {
  sounds: { quantityTotal: number }[];
}): number {
  return promo.sounds.reduce((s, ps) => s + (ps.quantityTotal || 0), 0);
}

export function promoSoundsUsed(promo: {
  sounds: { quantityUsed: number }[];
}): number {
  return promo.sounds.reduce((s, ps) => s + (ps.quantityUsed || 0), 0);
}

export function promoSoundsRemaining(promo: {
  sounds: { quantityTotal: number; quantityUsed: number }[];
}): number {
  return promo.sounds.reduce(
    (s, ps) => s + ((ps.quantityTotal || 0) - (ps.quantityUsed || 0)),
    0
  );
}

export function promoTiktokDone(promo: {
  tiktoks?: { id: string }[];
}): number {
  return promo.tiktoks?.length || 0;
}

export function promoTiktokRemaining(promo: {
  tiktokTarget: number;
  tiktoks?: { id: string }[];
}): number {
  const target = promo.tiktokTarget || 0;
  const done = promoTiktokDone(promo);
  return Math.max(0, target - done);
}

export function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeUrl(s: string): string {
  const t = s.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function domainFromUrl(s: string): string {
  try {
    return new URL(normalizeUrl(s)).hostname.replace(/^www\./, "");
  } catch {
    return s;
  }
}

export function genShareCode(): string {
  // 8 char alphanumeric, ambiguous chars removed
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
