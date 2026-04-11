'use client';

import { useEffect, useRef, useCallback } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageSquare } from 'lucide-react';
import type { Message } from '@/types';

interface ChatMessagesProps {
  messages: Message[];
  isStreaming: boolean;
}

export function ChatMessages({ messages, isStreaming }: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);

  // Track whether user is near the bottom
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 100;
  }, []);

  // Scroll the container to the bottom (without affecting ancestors)
  const scrollToBottom = useCallback((instant?: boolean) => {
    const el = containerRef.current;
    if (!el) return;
    if (instant) {
      el.scrollTop = el.scrollHeight;
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  // Auto-scroll only when stuck to bottom
  useEffect(() => {
    if (!stickToBottomRef.current) return;
    scrollToBottom(isStreaming);
  }, [messages, isStreaming, scrollToBottom]);

  // Always scroll to bottom when a new message is added (user sent a message)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      // New user message or new assistant placeholder — snap to bottom
      if (lastMsg.role === 'user' || (lastMsg.role === 'assistant' && lastMsg.isStreaming)) {
        stickToBottomRef.current = true;
        scrollToBottom(true);
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <MessageSquare className="h-12 w-12 opacity-30" />
        <div className="text-center">
          <p className="text-lg font-medium">Koovis PA</p>
          <p className="text-sm">Ask me anything to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto min-h-0"
    >
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div aria-hidden />
      </div>
    </div>
  );
}
