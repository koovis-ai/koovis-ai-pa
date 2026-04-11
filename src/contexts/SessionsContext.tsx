'use client';

import { createContext, useContext } from 'react';
import type { useSessions } from '@/hooks/useSessions';

type SessionsContextType = ReturnType<typeof useSessions>;

export const SessionsContext = createContext<SessionsContextType | undefined>(undefined);

export function useSessionsContext() {
  const context = useContext(SessionsContext);
  if (context === undefined) {
    throw new Error('useSessionsContext must be used within SessionsContext.Provider');
  }
  return context;
}
