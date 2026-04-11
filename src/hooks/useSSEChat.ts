'use client';

import { useState, useCallback, useRef } from 'react';
import { apiStream } from '@/lib/api';
import { parseSSEStream } from '@/lib/sse-parser';
import type { Message, ToolCall } from '@/types';
import { toast } from 'sonner';

let messageCounter = 0;
function generateId() {
  return `msg-${Date.now()}-${++messageCounter}`;
}

export function useSSEChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const streamingRef = useRef(false);

  const sendMessage = useCallback(
    async (content: string, sessionId: string | null, fileIds?: string[]) => {
      if (streamingRef.current) return;

      // Cancel any lingering previous stream
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };

      const assistantId = generateId();
      const assistantMessage: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        isStreaming: true,
        tool_calls: [],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      streamingRef.current = true;
      setIsStreaming(true);

      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

      try {
        const body: Record<string, unknown> = { message: content };
        if (sessionId) body.session_id = sessionId;
        if (fileIds?.length) body.file_ids = fileIds;

        const response = await apiStream('/chat', body, controller.signal);

        if (!response.body) {
          throw new Error('No response body');
        }

        reader = response.body.getReader();

        for await (const event of parseSSEStream(reader)) {
          if (controller.signal.aborted) break;

          const parsed = JSON.parse(event.data);

          switch (event.event) {
            case 'token': {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + (parsed.content || '') }
                    : m
                )
              );
              break;
            }

            case 'tool_start': {
              const toolCall: ToolCall = {
                id: parsed.tool_call_id || generateId(),
                name: parsed.tool || parsed.name || 'unknown',
                args: parsed.args,
                status: 'running',
              };
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, tool_calls: [...(m.tool_calls || []), toolCall] }
                    : m
                )
              );
              break;
            }

            case 'tool_result': {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        tool_calls: (m.tool_calls || []).map((tc) =>
                          tc.name === (parsed.tool || parsed.name)
                            && tc.status === 'running'
                            ? { ...tc, result: parsed.result, status: 'complete' as const }
                            : tc
                        ),
                      }
                    : m
                )
              );
              break;
            }

            case 'done': {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        isStreaming: false,
                        model: parsed.model,
                        cost: parsed.cost_usd,
                      }
                    : m
                )
              );
              // Capture session_id from the done event
              if (parsed.session_id) {
                window.dispatchEvent(
                  new CustomEvent('koovis:session', { detail: parsed.session_id })
                );
              }
              break;
            }

            case 'error': {
              toast.error(parsed.message || 'An error occurred');
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        isStreaming: false,
                        content: m.content || 'An error occurred.',
                      }
                    : m
                )
              );
              break;
            }

            case 'session': {
              if (parsed.session_id) {
                window.dispatchEvent(
                  new CustomEvent('koovis:session', { detail: parsed.session_id })
                );
              }
              break;
            }
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          // User cancelled — no toast
        } else {
          const message = error instanceof Error ? error.message : 'Stream failed';
          toast.error(message);
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          )
        );
      } finally {
        streamingRef.current = false;
        setIsStreaming(false);
        abortRef.current = null;
        // Release the reader so the browser can close the connection
        try { await reader?.cancel(); } catch { /* ignore */ }
      }
    },
    [] // No dependencies — uses refs for mutable state
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const loadMessages = useCallback((msgs: Message[]) => {
    setMessages(msgs);
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
    clearMessages,
    loadMessages,
  };
}
