'use client';

import { useEffect, useCallback, useRef } from 'react';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { useSSEChat } from '@/hooks/useSSEChat';
import { useSessionsContext } from '@/contexts/SessionsContext';
import { STORAGE_KEYS } from '@/lib/constants';
import { apiFetch } from '@/lib/api';
import type { Message } from '@/types';

/** Map a backend message row to frontend Message, skipping tool/system rows. */
function toFrontendMessage(raw: Record<string, unknown>): Message | null {
  const role = raw.role as string;
  if (role === 'tool' || role === 'system') return null;
  if (role === 'assistant' && !raw.content) return null;
  return {
    id: (raw.message_id as string) || String(raw.id ?? ''),
    role: role as 'user' | 'assistant',
    content: (raw.content as string) || '',
    model: (raw.model as string) || undefined,
    cost: (raw.cost_usd as number) || undefined,
    timestamp: (raw.created_at as string) || undefined,
  };
}

export default function ChatPage() {
  const { messages, isStreaming, sendMessage, clearMessages, loadMessages } =
    useSSEChat();
  const { activeSessionId, setActiveSessionId, refreshSessions } =
    useSessionsContext();

  // Stable refs for event handlers
  const activeSessionRef = useRef(activeSessionId);
  activeSessionRef.current = activeSessionId;
  const setActiveSessionRef = useRef(setActiveSessionId);
  setActiveSessionRef.current = setActiveSessionId;
  const refreshSessionsRef = useRef(refreshSessions);
  refreshSessionsRef.current = refreshSessions;

  // On mount, restore the active session's messages from the backend
  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    const storedId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    if (!storedId) return;
    loadedRef.current = true;

    apiFetch<{ session: unknown; messages: Record<string, unknown>[] }>(
      `/sessions/${storedId}`
    )
      .then((data) => {
        const msgs = (data.messages || [])
          .map(toFrontendMessage)
          .filter((m): m is Message => m !== null);
        if (msgs.length > 0) loadMessages(msgs);
      })
      .catch(() => {
        // Session may have been deleted — clear the stale ID
        localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
      });
  }, [loadMessages]);

  // Listen for session events from SSE (new session created)
  useEffect(() => {
    function handleSession(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      setActiveSessionRef.current(id);
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, id);
      refreshSessionsRef.current();
    }
    window.addEventListener('koovis:session', handleSession);
    return () => window.removeEventListener('koovis:session', handleSession);
  }, []);

  // Listen for sidebar loading messages (session selection)
  useEffect(() => {
    function handleLoadMessages(e: Event) {
      const msgs = (e as CustomEvent<Message[]>).detail;
      loadMessages(msgs);
    }
    function handleNewChat() {
      clearMessages();
    }
    window.addEventListener('koovis:load-messages', handleLoadMessages);
    window.addEventListener('koovis:new-chat', handleNewChat);
    return () => {
      window.removeEventListener('koovis:load-messages', handleLoadMessages);
      window.removeEventListener('koovis:new-chat', handleNewChat);
    };
  }, [loadMessages, clearMessages]);

  const handleSend = useCallback(
    (content: string, fileIds?: string[]) => {
      sendMessage(content, activeSessionRef.current, fileIds);
    },
    [sendMessage]
  );

  return (
    <div className="flex flex-1 flex-col min-w-0 min-h-0">
      <ChatMessages messages={messages} isStreaming={isStreaming} />
      <ChatInput onSend={handleSend} isStreaming={isStreaming} />
    </div>
  );
}
