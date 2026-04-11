'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { STORAGE_KEYS } from '@/lib/constants';
import type { Session, Message } from '@/types';
import { toast } from 'sonner';

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await apiFetch<{ sessions: Session[] }>('/sessions');
      setSessions(data.sessions || []);
    } catch {
      // Silently fail — user may not have sessions yet
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    if (stored) setActiveSessionId(stored);
  }, []);

  const selectSession = useCallback(
    async (
      sessionId: string,
      onLoad: (messages: Message[]) => void
    ) => {
      setActiveSessionId(sessionId);
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);

      try {
        const data = await apiFetch<{ messages: Message[] }>(
          `/sessions/${sessionId}/messages`
        );
        onLoad(data.messages || []);
      } catch {
        toast.error('Failed to load session history');
      }
    },
    []
  );

  const createSession = useCallback(() => {
    setActiveSessionId(null);
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
  }, []);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await apiFetch(`/sessions/${sessionId}`, { method: 'DELETE' });
        setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
        }
      } catch {
        toast.error('Failed to delete session');
      }
    },
    [activeSessionId]
  );

  const refreshSessions = fetchSessions;

  return {
    sessions,
    isLoading,
    activeSessionId,
    setActiveSessionId,
    selectSession,
    createSession,
    deleteSession,
    refreshSessions,
  };
}
