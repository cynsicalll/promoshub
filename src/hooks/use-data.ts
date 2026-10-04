"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import type {
  PromoInput,
  CustomerInput,
  SoundInput,
  PaymentInput,
  Promo,
  Customer,
  Sound,
  Payment,
  DashboardData,
} from "@/lib/types";

export const qk = {
  promos: ["promos"] as const,
  promo: (id: string) => ["promos", id] as const,
  customers: ["customers"] as const,
  sounds: ["sounds"] as const,
  payments: ["payments"] as const,
  dashboard: ["dashboard"] as const,
  monthly: (year?: number) => ["monthly", year ?? "all"] as const,
  share: (code: string) => ["share", code] as const,
  demo: ["demo"] as const,
};

// Demo data cache
let demoCache: Record<string, unknown> | null = null;
async function getDemoData() {
  if (demoCache) return demoCache;
  const res = await fetch("/api/demo-data");
  if (!res.ok) throw new Error("Failed to load demo data");
  demoCache = await res.json();
  return demoCache!;
}

function useIsDemo() {
  const { user } = useAuth();
  return user?.role === "DEMO";
}

export function usePromos() {
  const isDemo = useIsDemo();
  return useQuery({
    queryKey: isDemo ? ["demo", "promos"] : qk.promos,
    queryFn: async () => {
      if (isDemo) {
        const data = await getDemoData();
        return data.promos as Promo[];
      }
      return api.listPromos();
    },
  });
}
export function usePromo(id: string | null) {
  const isDemo = useIsDemo();
  return useQuery({
    queryKey: id ? (isDemo ? ["demo", "promos", id] : qk.promo(id)) : ["promos", "null"],
    queryFn: async () => {
      if (isDemo && id) {
        const data = await getDemoData();
        return (data.promos as Promo[]).find((p) => p.id === id) || null;
      }
      return api.getPromo(id!);
    },
    enabled: !!id,
  });
}
export function useCustomers() {
  const isDemo = useIsDemo();
  return useQuery({
    queryKey: isDemo ? ["demo", "customers"] : qk.customers,
    queryFn: async () => {
      if (isDemo) {
        const data = await getDemoData();
        return data.customers as Customer[];
      }
      return api.listCustomers();
    },
  });
}
export function useSounds() {
  const isDemo = useIsDemo();
  return useQuery({
    queryKey: isDemo ? ["demo", "sounds"] : qk.sounds,
    queryFn: async () => {
      if (isDemo) {
        const data = await getDemoData();
        return data.sounds as Sound[];
      }
      return api.listSounds();
    },
  });
}
export function usePayments() {
  const isDemo = useIsDemo();
  return useQuery({
    queryKey: isDemo ? ["demo", "payments"] : qk.payments,
    queryFn: async () => {
      if (isDemo) {
        const data = await getDemoData();
        const promos = data.promos as Promo[];
        return promos.flatMap((p) =>
          p.payments.map((pay) => ({ ...pay, promo: p }))
        );
      }
      return api.listPayments();
    },
  });
}
export function useDashboard() {
  const isDemo = useIsDemo();
  return useQuery({
    queryKey: isDemo ? ["demo", "dashboard"] : qk.dashboard,
    queryFn: async () => {
      if (isDemo) {
        const data = await getDemoData();
        return data.dashboard as DashboardData;
      }
      return api.getDashboard();
    },
  });
}

function useRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.promos });
    qc.invalidateQueries({ queryKey: qk.payments });
    qc.invalidateQueries({ queryKey: qk.dashboard });
    qc.invalidateQueries({ queryKey: qk.customers });
    qc.invalidateQueries({ queryKey: qk.sounds });
    qc.invalidateQueries({ queryKey: ["monthly"] });
  };
}

export function useCreatePromo() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (data: PromoInput) => api.createPromo(data),
    onSuccess: refresh,
  });
}
export function useUpdatePromo() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PromoInput }) =>
      api.updatePromo(id, data),
    onSuccess: refresh,
  });
}
export function useDeletePromo() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => api.deletePromo(id),
    onSuccess: refresh,
  });
}

export function useCreateCustomer() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (data: CustomerInput) => api.createCustomer(data),
    onSuccess: refresh,
  });
}
export function useUpdateCustomer() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerInput }) =>
      api.updateCustomer(id, data),
    onSuccess: refresh,
  });
}
export function useDeleteCustomer() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => api.deleteCustomer(id),
    onSuccess: refresh,
  });
}

export function useCreateSound() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (data: SoundInput) => api.createSound(data),
    onSuccess: refresh,
  });
}
export function useUpdateSound() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SoundInput }) =>
      api.updateSound(id, data),
    onSuccess: refresh,
  });
}
export function useDeleteSound() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => api.deleteSound(id),
    onSuccess: refresh,
  });
}

export function useUpdatePayment() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<PaymentInput>;
    }) => api.updatePayment(id, data),
    onSuccess: refresh,
  });
}
export function useDeletePayment() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => api.deletePayment(id),
    onSuccess: refresh,
  });
}

export function useImport() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({
      rows,
      type,
    }: {
      rows: Record<string, string>[];
      type: "promos" | "payments";
    }) => api.importCsv(rows, type),
    onSuccess: refresh,
  });
}

export function useEnableShare() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => api.enableShare(id),
    onSuccess: refresh,
  });
}

export function useDisableShare() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => api.disableShare(id),
    onSuccess: refresh,
  });
}

export function useShare(code: string | null) {
  return useQuery({
    queryKey: code ? qk.share(code) : ["share", "none"],
    queryFn: () => api.getShare(code!),
    enabled: !!code,
    retry: false,
  });
}

export function useMonthly(year?: number) {
  const isDemo = useIsDemo();
  return useQuery({
    queryKey: isDemo ? ["demo", "monthly"] : qk.monthly(year),
    queryFn: async () => {
      if (isDemo) {
        const data = await getDemoData();
        return data.monthly as { year: number; years: number[]; entries: import("@/lib/types").MonthlyEntry[] };
      }
      return api.getMonthly(year);
    },
  });
}
// re-export the type for the consumer
export type MonthlyResponse = Awaited<ReturnType<typeof api.getMonthly>>;
