import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE' | 'BROADCAST' | '*';

export interface RealtimeEvent<T = any> {
  type: RealtimeEventType;
  key: string;
  data: T;
  oldData?: T;
  timestamp: number;
}

export interface UseRealtimeOptions<T = any> {
  channelName: string;
  eventType?: RealtimeEventType;
  onEvent?: (event: RealtimeEvent<T>) => void;
  filter?: (event: RealtimeEvent<T>) => boolean;
  enabled?: boolean;
}

/**
 * Hook to subscribe to real-time updates from Supabase Realtime
 * Uses broadcast channel for custom events since we're using KV store
 * 
 * Example usage:
 * ```tsx
 * const { events, latestEvent, isConnected } = useRealtime({
 *   channelName: 'employees',
 *   eventType: 'UPDATE',
 *   onEvent: (event) => {
 *     console.log('Employee updated:', event.data);
 *     // Refresh your data
 *   }
 * });
 * ```
 */
export function useRealtime<T = any>(options: UseRealtimeOptions<T>) {
  const {
    channelName,
    eventType = '*',
    onEvent,
    filter,
    enabled = true,
  } = options;

  const [events, setEvents] = useState<RealtimeEvent<T>[]>([]);
  const [latestEvent, setLatestEvent] = useState<RealtimeEvent<T> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onEventRef = useRef(onEvent);
  
  // Keep callback ref up to date
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) {
      // Clean up if disabled
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    try {
      // Create a channel for this specific resource
      const channel = supabase.channel(`realtime:${channelName}`, {
        config: {
          broadcast: { self: false }, // Don't receive your own messages
        },
      });

      // Subscribe to broadcast events
      channel
        .on('broadcast' as any, { event: eventType === '*' ? '*' : eventType } as any, (payload: any) => {
          const event: RealtimeEvent<T> = {
            type: payload.type || 'BROADCAST',
            key: payload.key || '',
            data: payload.payload,
            oldData: payload.old,
            timestamp: Date.now(),
          };

          // Apply filter if provided
          if (filter && !filter(event)) {
            return;
          }

          setLatestEvent(event);
          setEvents((prev) => [...prev.slice(-99), event]); // Keep last 100 events

          // Call the callback if provided
          if (onEventRef.current) {
            onEventRef.current(event);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setError(null);
          } else if (status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            setError('Failed to connect to realtime channel');
          } else if (status === 'TIMED_OUT') {
            setIsConnected(false);
            setError('Realtime connection timed out');
          } else if (status === 'CLOSED') {
            setIsConnected(false);
          }
        });

      channelRef.current = channel;

      return () => {
        supabase.removeChannel(channel);
        channelRef.current = null;
        setIsConnected(false);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown realtime error');
      console.error('Realtime subscription error:', err);
    }
  }, [channelName, eventType, enabled, filter]);

  // Function to broadcast an event (for other clients to receive)
  const broadcast = useCallback(
    async (type: RealtimeEventType, key: string, data: T, oldData?: T) => {
      if (!channelRef.current) {
        console.warn('Cannot broadcast: channel not connected');
        return false;
      }

      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: type,
          payload: { type, key, payload: data, old: oldData },
        });
        return true;
      } catch (err) {
        console.error('Broadcast error:', err);
        return false;
      }
    },
    []
  );

  return {
    events,
    latestEvent,
    isConnected,
    error,
    broadcast,
    clearEvents: () => setEvents([]),
  };
}

/**
 * Hook to broadcast realtime events after mutations
 * Use this in components that create/update/delete data
 * 
 * Example:
 * ```tsx
 * const { broadcastChange } = useRealtimeBroadcast('employees');
 * 
 * const handleUpdate = async () => {
 *   await updateEmployee(data);
 *   broadcastChange('UPDATE', employeeId, updatedData);
 * };
 * ```
 */
export function useRealtimeBroadcast(channelName: string) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase.channel(`broadcast:${channelName}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [channelName]);

  const broadcastChange = useCallback(
    async (type: RealtimeEventType, key: string, data: any, oldData?: any) => {
      if (!channelRef.current) {
        return false;
      }

      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: type,
          payload: { type, key, payload: data, old: oldData },
        });
        return true;
      } catch (err) {
        console.error('Broadcast error:', err);
        return false;
      }
    },
    []
  );

  return { broadcastChange };
}

/**
 * Hook for components that need to refresh data when realtime events occur
 * Debounces refresh calls to avoid excessive updates
 * 
 * Example:
 * ```tsx
 * const fetchEmployees = async () => { ... };
 * 
 * useRealtimeRefresh({
 *   channelName: 'employees',
 *   onRefresh: fetchEmployees,
 *   debounceMs: 1000,
 * });
 * ```
 */
export function useRealtimeRefresh(options: {
  channelName: string;
  onRefresh: () => void | Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}) {
  const { channelName, onRefresh, debounceMs = 500, enabled = true } = options;
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const handleEvent = useCallback(() => {
    // Clear any pending refresh
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Schedule a new refresh
    refreshTimeoutRef.current = setTimeout(() => {
      onRefreshRef.current();
    }, debounceMs);
  }, [debounceMs]);

  useRealtime({
    channelName,
    onEvent: handleEvent,
    enabled,
  });

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);
}
