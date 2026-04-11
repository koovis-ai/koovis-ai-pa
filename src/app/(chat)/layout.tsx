'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { SessionSidebar } from '@/components/sidebar/SessionSidebar';
import { useSessions } from '@/hooks/useSessions';
import { SessionsContext } from '@/contexts/SessionsContext';
import type { Message } from '@/types';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sessionsHook = useSessions();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isAuthenticated, isLoading, router]);

  // Listen for session events to refresh sidebar
  useEffect(() => {
    function handleSession() {
      sessionsHook.refreshSessions();
    }
    window.addEventListener('koovis:session', handleSession);
    return () => window.removeEventListener('koovis:session', handleSession);
  }, [sessionsHook]);

  const handleLoadMessages = useCallback((messages: Message[]) => {
    window.dispatchEvent(
      new CustomEvent('koovis:load-messages', { detail: messages })
    );
  }, []);

  const handleNewChat = useCallback(() => {
    sessionsHook.createSession();
    window.dispatchEvent(new CustomEvent('koovis:new-chat'));
    setSidebarOpen(false);
  }, [sessionsHook]);

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
    <SessionsContext.Provider value={sessionsHook}>
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
          </header>

          <div className="flex flex-1 min-h-0">
            {children}
          </div>
        </div>
      </div>
    </SessionsContext.Provider>
  );
}
