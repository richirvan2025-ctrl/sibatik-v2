"use client";

import { createContext, useContext } from "react";
import type { AppSession } from "@/lib/auth-types";

const SessionContext = createContext<AppSession | null>(null);

export function AppSessionProvider({
  session,
  children,
}: {
  session: AppSession;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);

  return {
    data: session,
    status: session ? ("authenticated" as const) : ("unauthenticated" as const),
  };
}
