'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, X, LogOut } from 'lucide-react';
import { SessionItem } from './SessionItem';
import { useAuth } from '@/contexts/AuthContext';
import type { Session, Message } from '@/types';

interface SessionSidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string, onLoad: (messages: Message[]) => void) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onLoadMessages: (messages: Message[]) => void;
}

export function SessionSidebar({
  sessions,
  activeSessionId,
  isOpen,
  onClose,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onLoadMessages,
}: SessionSidebarProps) {
  const { logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[280px] border-r border-border bg-card flex flex-col transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          <span className="text-sm font-semibold">Sessions</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={onNewChat}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Session list */}
        <ScrollArea className="flex-1 px-2 py-2">
          <div className="space-y-1">
            {sessions.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                No sessions yet
              </p>
            ) : (
              sessions.map((session) => (
                <SessionItem
                  key={session.session_id}
                  session={session}
                  isActive={session.session_id === activeSessionId}
                  onSelect={() =>
                    onSelectSession(session.session_id, onLoadMessages)
                  }
                  onDelete={() => onDeleteSession(session.session_id)}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-3 pb-3">
          <Separator className="mb-3" />
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            size="sm"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}
