"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Session = {
  access_token: string;
  refresh_token?: string;
  user_id: string;
  email: string;
};

type AuthContextType = {
  session: Session | null;
  login: (s: Session) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("session");
    if (raw) setSession(JSON.parse(raw));
  }, []);

  const api = useMemo(
    () => ({
      session,
      login: (s: Session) => {
        setSession(s);
        localStorage.setItem("session", JSON.stringify(s));
      },
      logout: () => {
        setSession(null);
        localStorage.removeItem("session");
      },
    }),
    [session]
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
