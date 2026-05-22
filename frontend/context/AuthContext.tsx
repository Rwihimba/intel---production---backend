"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "agent" | "ambassador";
  org_id: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchMe(): Promise<User | null> {
  try {
    const res = await api.get("/v1/me");
    // /v1/me returns { user, counts } — unwrap user
    return (res.data?.user ?? res.data) as User;
  } catch (err) {
    console.error("[auth] /v1/me failed:", err);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        const me = await fetchMe();
        if (mounted) setUser(me);
      }
      if (mounted) setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event) => {
      if (!mounted) return;
      if (event === "SIGNED_IN") {
        const me = await fetchMe();
        if (mounted) setUser(me);
      } else if (event === "SIGNED_OUT") {
        if (mounted) setUser(null);
        router.push("/login");
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo<AuthContextType>(
    () => ({ user, loading, signOut }),
    [user, loading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
