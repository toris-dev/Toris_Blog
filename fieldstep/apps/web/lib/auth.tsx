"use client";

import type { Role } from "@fieldstep/shared";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  api,
  clearFieldRecordDrafts,
  clearToken,
  getToken,
} from "./api";

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  org: { id: string; name: string } | null;
  role: Role | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [org, setOrg] = useState<{ id: string; name: string } | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setOrg(null);
      setRole(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.me();
      setUser(res.user);
      setOrg(res.org);
      setRole(res.role);
    } catch {
      setUser(null);
      setOrg(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      if (getToken()) await api.logout();
    } catch {
      // 서버 세션 정리에 실패해도 클라이언트 로그아웃은 항상 완료한다.
    } finally {
      clearToken();
      clearFieldRecordDrafts();
      setUser(null);
      setOrg(null);
      setRole(null);
      if (typeof window !== "undefined") window.location.href = "/login";
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, org, role, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있습니다");
  return ctx;
}
