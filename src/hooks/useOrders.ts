import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Order } from '../types';

interface OrdersResponse {
  orders: Order[];
}

type OptimisticUpdate<TVars> = {
  apply: (old: Order[], vars: TVars) => Order[];
  onSettled?: (qc: QueryClient) => void;
};

const invalidateOrders = (qc: QueryClient) => qc.invalidateQueries({ queryKey: ['orders'] });

function withOptimisticUpdate<TVars>(
  qc: QueryClient,
  update: OptimisticUpdate<TVars>,
  opts?: { ignoreError?: (err: Error) => boolean },
) {
  return {
    onMutate: async (vars: TVars) => {
      await qc.cancelQueries({ queryKey: ['orders'] });
      const prev = qc.getQueryData<Order[]>(['orders']);
      if (prev) {
        qc.setQueryData<Order[]>(['orders'], (old) =>
          old ? update.apply(old, vars) : old
        );
      }
      return { prev };
    },
    onError: (_err: Error, _vars: TVars, ctx: { prev?: Order[] } | undefined) => {
      if (opts?.ignoreError?.(_err)) return;
      if (ctx?.prev) qc.setQueryData(['orders'], ctx.prev);
    },
    onSettled: (_data: unknown, err: Error | null) => {
      if (err && opts?.ignoreError?.(err)) return;
      if (update.onSettled) {
        update.onSettled(qc);
      } else {
        invalidateOrders(qc);
      }
    },
  };
}

const DEBOUNCE_MS = 500;
const SUPERSEDED = '__superseded__';
const pending = new Map<string, {
  timer: ReturnType<typeof setTimeout>;
  data: Partial<Order>;
  reject: (e: Error) => void;
}>();

function schedulePatch(id: string, data: Partial<Order>): Promise<unknown> {
  const existing = pending.get(id);
  if (existing) {
    clearTimeout(existing.timer);
    Object.assign(existing.data, data);
    existing.reject(new Error(SUPERSEDED));
    return new Promise((resolve, reject) => {
      existing.timer = setTimeout(async () => {
        pending.delete(id);
        try {
          resolve(await api.patch(`/api/orders/${id}`, existing.data));
        } catch (e) {
          reject(e);
        }
      }, DEBOUNCE_MS);
      existing.reject = reject;
    });
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(async () => {
      pending.delete(id);
      try {
        resolve(await api.patch(`/api/orders/${id}`, data));
      } catch (e) {
        reject(e);
      }
    }, DEBOUNCE_MS);
    pending.set(id, { timer, data: { ...data }, reject });
  });
}

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const data = await api.get<OrdersResponse>('/api/orders');
      return data.orders;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Order>) => api.post<{ id: string }>('/api/orders', data),
    onSuccess: () => invalidateOrders(qc),
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Order> }) =>
      api.put(`/api/orders/${id}`, data),
    ...withOptimisticUpdate(qc, {
      apply: (old, { id, data }) =>
        old.map((o) => (o.id === id ? { ...o, ...data, updatedAt: new Date().toISOString() } : o)),
    }),
  });
}

export function usePatchOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Order> }) =>
      schedulePatch(id, data),
    ...withOptimisticUpdate(qc, {
      apply: (old, { id, data }) =>
        old.map((o) => (o.id === id ? { ...o, ...data, updatedAt: new Date().toISOString() } : o)),
    }, { ignoreError: (e) => e.message === SUPERSEDED }),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/orders/${id}`),
    ...withOptimisticUpdate(qc, {
      apply: (old, id) => old.filter((o) => o.id !== id),
    }),
  });
}
