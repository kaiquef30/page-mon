import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  CreateTarget,
  UpdateTarget,
  TargetQueryParams,
  ChangeQueryParams,
  UpdateDiscordNotification,
} from './types';

export const queryKeys = {
  targets: {
    all: ['targets'] as const,
    list: (params?: TargetQueryParams) => [...queryKeys.targets.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.targets.all, 'detail', id] as const,
    snapshots: (id: string) => [...queryKeys.targets.all, 'snapshots', id] as const,
    changes: (id: string) => [...queryKeys.targets.all, 'changes', id] as const,
  },
  changes: {
    all: ['changes'] as const,
    list: (params?: ChangeQueryParams) => [...queryKeys.changes.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.changes.all, 'detail', id] as const,
  },
  notifications: {
    discord: ['notifications', 'discord'] as const,
  },
  health: ['health'] as const,
};

const TARGETS_POLL_INTERVAL = 30000;
const TARGET_DETAIL_POLL_INTERVAL = 15000;

function useVisibilityPolling(interval: number): number | false {
  const isVisible = typeof document !== 'undefined' && document.visibilityState === 'visible';
  return isVisible ? interval : false;
}

export function useTargets(params?: TargetQueryParams) {
  const refetchInterval = useVisibilityPolling(TARGETS_POLL_INTERVAL);
  
  return useQuery({
    queryKey: queryKeys.targets.list(params),
    queryFn: () => api.getTargets(params),
    refetchInterval,
    staleTime: 10000,
  });
}

export function useTarget(id: string) {
  const refetchInterval = useVisibilityPolling(TARGET_DETAIL_POLL_INTERVAL);
  
  return useQuery({
    queryKey: queryKeys.targets.detail(id),
    queryFn: () => api.getTarget(id),
    refetchInterval,
    enabled: Boolean(id),
  });
}

export function useTargetSnapshots(targetId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.targets.snapshots(targetId),
    queryFn: () => api.getSnapshots(targetId),
    enabled: Boolean(targetId) && (options?.enabled ?? true),
  });
}

export function useTargetChanges(targetId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.targets.changes(targetId),
    queryFn: () => api.getTargetChanges(targetId),
    enabled: Boolean(targetId) && (options?.enabled ?? true),
  });
}

export function useCreateTarget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTarget) => api.createTarget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.targets.all });
    },
  });
}

export function useUpdateTarget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTarget }) => 
      api.updateTarget(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.targets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.targets.detail(id) });
    },
  });
}

export function useDeleteTarget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.deleteTarget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.targets.all });
    },
  });
}

export function useRunTarget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, force = false }: { id: string; force?: boolean }) => 
      api.runTarget(id, force),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.targets.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.targets.changes(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.changes.all });
    },
  });
}

export function useChanges(params?: ChangeQueryParams) {
  const refetchInterval = useVisibilityPolling(TARGETS_POLL_INTERVAL);

  return useQuery({
    queryKey: queryKeys.changes.list(params),
    queryFn: () => api.getChanges(params),
    refetchInterval,
    staleTime: 10000,
  });
}

export function useChange(id: string) {
  return useQuery({
    queryKey: queryKeys.changes.detail(id),
    queryFn: () => api.getChange(id),
    enabled: Boolean(id),
  });
}

export function useDiscordNotification() {
  return useQuery({
    queryKey: queryKeys.notifications.discord,
    queryFn: () => api.getDiscordNotification(),
  });
}

export function useUpdateDiscordNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateDiscordNotification) => api.updateDiscordNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.discord });
    },
  });
}

export function useDeleteDiscordNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.deleteDiscordNotification(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.discord });
    },
  });
}

export function useTestDiscordNotification() {
  return useMutation({
    mutationFn: () => api.testDiscordNotification(),
  });
}

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => api.checkHealth(),
    refetchInterval: 60000,
    retry: false,
  });
}
