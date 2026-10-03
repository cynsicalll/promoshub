import type {
  Promo,
  Customer,
  Sound,
  Payment,
  PromoInput,
  CustomerInput,
  SoundInput,
  PaymentInput,
  DashboardData,
  ShareData,
  MonthlyEntry,
} from "./types";

async function req<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Promos
export const api = {
  listPromos: () => req<Promo[]>("/api/promos"),
  getPromo: (id: string) => req<Promo>(`/api/promos/${id}`),
  createPromo: (data: PromoInput) =>
    req<Promo>("/api/promos", { method: "POST", body: JSON.stringify(data) }),
  updatePromo: (id: string, data: PromoInput) =>
    req<Promo>(`/api/promos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deletePromo: (id: string) =>
    req<void>(`/api/promos/${id}`, { method: "DELETE" }),

  // Customers
  listCustomers: () => req<Customer[]>("/api/customers"),
  createCustomer: (data: CustomerInput) =>
    req<Customer>("/api/customers", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCustomer: (id: string, data: CustomerInput) =>
    req<Customer>(`/api/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteCustomer: (id: string) =>
    req<void>(`/api/customers/${id}`, { method: "DELETE" }),

  // Sounds
  listSounds: () => req<Sound[]>("/api/sounds"),
  createSound: (data: SoundInput) =>
    req<Sound>("/api/sounds", { method: "POST", body: JSON.stringify(data) }),
  updateSound: (id: string, data: SoundInput) =>
    req<Sound>(`/api/sounds/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteSound: (id: string) =>
    req<void>(`/api/sounds/${id}`, { method: "DELETE" }),

  // Payments
  listPayments: () => req<Payment[]>("/api/payments"),
  createPayment: (data: PaymentInput) =>
    req<Payment>("/api/payments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePayment: (id: string, data: Partial<PaymentInput>) =>
    req<Payment>(`/api/payments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deletePayment: (id: string) =>
    req<void>(`/api/payments/${id}`, { method: "DELETE" }),

  // Dashboard
  getDashboard: () => req<DashboardData>("/api/dashboard"),

  // Search
  search: (q: string) =>
    req<{ promos: Promo[]; customers: Customer[]; sounds: Sound[] }>(
      `/api/search?q=${encodeURIComponent(q)}`
    ),

  // Import / Export
  importCsv: (rows: Record<string, string>[], type: "promos" | "payments") =>
    req<{ imported: number; skipped: number; errors: string[] }>(
      `/api/import?type=${type}`,
      { method: "POST", body: JSON.stringify({ rows }) }
    ),

  // Share
  enableShare: (id: string) =>
    req<{ shareCode: string; shareUrl: string }>(
      `/api/promos/${id}/share`,
      { method: "POST" }
    ),
  disableShare: (id: string) =>
    req<void>(`/api/promos/${id}/share`, { method: "DELETE" }),
  getShare: (code: string) =>
    req<ShareData>(`/api/share/${encodeURIComponent(code)}`),

  // Monthly
  getMonthly: (year?: number) =>
    req<{ year: number; years: number[]; entries: MonthlyEntry[] }>(
      `/api/monthly${year ? `?year=${year}` : ""}`
    ),
};

export type Api = typeof api;
