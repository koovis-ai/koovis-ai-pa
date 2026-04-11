'use client';

import { useState, useRef, useCallback, type KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SendHorizonal, Square } from 'lucide-react';
import { VoiceInput } from '@/components/input/VoiceInput';
import { FileUpload } from '@/components/input/FileUpload';

interface ChatInputProps {
  onSend: (content: string, fileIds?: string[]) => void;
  isStreaming: boolean;
}

export function ChatInput({ onSend, isStreaming }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [pendingFileIds, setPendingFileIds] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed, pendingFileIds.length > 0 ? pendingFileIds : undefined);
    setInput('');
    setPendingFileIds([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isStreaming, onSend, pendingFileIds]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, []);

  const handleVoiceTranscript = useCallback((text: string) => {
    setInput((prev) => (prev ? prev + ' ' + text : text));
  }, []);

  const handleFilesReady = useCallback((fileIds: string[]) => {
    setPendingFileIds((prev) => [...prev, ...fileIds]);
  }, []);

  // Handle clipboard paste for images
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            // Trigger file upload via the dropzone
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (input) {
              input.files = dataTransfer.files;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
          break;
        }
      }
    }

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex items-end gap-2 rounded-xl border border-border bg-card p-2">
          <FileUpload
            onFilesReady={handleFilesReady}
            disabled={isStreaming}
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message Koovis..."
            rows={1}
            className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
            disabled={isStreaming}
          />
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            disabled={isStreaming}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() && !isStreaming}
            className="shrink-0"
          >
            {isStreaming ? (
              <Square className="h-4 w-4" />
            ) : (
              <SendHorizonal className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          Koovis can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
