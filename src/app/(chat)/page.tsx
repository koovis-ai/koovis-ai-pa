'use client';

import { useEffect, useCallback } from 'react';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { useSSEChat } from '@/hooks/useSSEChat';
import { useSessionsContext } from '@/contexts/SessionsContext';
import { STORAGE_KEYS } from '@/lib/constants';
import type { Message } from '@/types';

export default function ChatPage() {
  const { messages, isStreaming, sendMessage, clearMessages, loadMessages } =
    useSSEChat();
  const { activeSessionId, setActiveSessionId, refreshSessions } =
    useSessionsContext();

  // Listen for session events from SSE (new session created)
  useEffect(() => {
    function handleSession(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      setActiveSessionId(id);
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, id);
      refreshSessions();
    }
    window.addEventListener('koovis:session', handleSession);
    return () => window.removeEventListener('koovis:session', handleSession);
  }, [setActiveSessionId, refreshSessions]);

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
      sendMessage(content, activeSessionId, fileIds);
    },
    [activeSessionId, sendMessage]
  );

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <ChatMessages messages={messages} isStreaming={isStreaming} />
      <ChatInput onSend={handleSend} isStreaming={isStreaming} />
    </div>
  );
}
