"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  PromoInput,
  CustomerInput,
  SoundInput,
  PaymentInput,
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
};

export function usePromos() {
  return useQuery({ queryKey: qk.promos, queryFn: api.listPromos });
}
export function usePromo(id: string | null) {
  return useQuery({
    queryKey: id ? qk.promo(id) : ["promos", "null"],
    queryFn: () => api.getPromo(id!),
    enabled: !!id,
  });
}
export function useCustomers() {
  return useQuery({ queryKey: qk.customers, queryFn: api.listCustomers });
}
export function useSounds() {
  return useQuery({ queryKey: qk.sounds, queryFn: api.listSounds });
}
export function usePayments() {
  return useQuery({ queryKey: qk.payments, queryFn: api.listPayments });
}
export function useDashboard() {
  return useQuery({ queryKey: qk.dashboard, queryFn: api.getDashboard });
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
  return useQuery({
    queryKey: qk.monthly(year),
    queryFn: () => api.getMonthly(year),
  });
}
// re-export the type for the consumer
export type MonthlyResponse = Awaited<ReturnType<typeof api.getMonthly>>;
