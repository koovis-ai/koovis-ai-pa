'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { SessionSidebar } from '@/components/sidebar/SessionSidebar';
import { useSessions } from '@/hooks/useSessions';
import { SessionsContext } from '@/contexts/SessionsContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Message } from '@/types';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sessionsHook = useSessions();

  // Stable refs for event handlers — avoids re-registering listeners on every render
  const refreshRef = useRef(sessionsHook.refreshSessions);
  refreshRef.current = sessionsHook.refreshSessions;
  const createSessionRef = useRef(sessionsHook.createSession);
  createSessionRef.current = sessionsHook.createSession;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isAuthenticated, isLoading, router]);

  // Listen for session events to refresh sidebar — registered once
  useEffect(() => {
    function handleSession() {
      refreshRef.current();
    }
    window.addEventListener('koovis:session', handleSession);
    return () => window.removeEventListener('koovis:session', handleSession);
  }, []);

  const handleLoadMessages = useCallback((messages: Message[]) => {
    window.dispatchEvent(
      new CustomEvent('koovis:load-messages', { detail: messages })
    );
  }, []);

  const handleNewChat = useCallback(() => {
    createSessionRef.current();
    window.dispatchEvent(new CustomEvent('koovis:new-chat'));
    setSidebarOpen(false);
  }, []);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => sessionsHook, [
    sessionsHook.sessions,
    sessionsHook.isLoading,
    sessionsHook.activeSessionId,
  ]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SessionsContext.Provider value={contextValue}>
      <div className="flex h-full overflow-hidden">
        <SessionSidebar
          sessions={sessionsHook.sessions}
          activeSessionId={sessionsHook.activeSessionId}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectSession={sessionsHook.selectSession}
          onNewChat={handleNewChat}
          onDeleteSession={sessionsHook.deleteSession}
          onLoadMessages={handleLoadMessages}
        />

        <div className="flex flex-1 flex-col min-w-0">
          <header className="flex h-12 items-center gap-2 border-b border-border px-3 lg:px-4">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="text-sm font-semibold">Koovis PA</span>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </header>

          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </SessionsContext.Provider>
  );
}
