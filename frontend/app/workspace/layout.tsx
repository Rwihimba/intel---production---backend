"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FloatingNav } from "@/components/FloatingNav";

function rolePrefixOf(path: string): "admin" | "agent" | "ambassador" | null {
  if (path.startsWith("/workspace/admin")) return "admin";
  if (path.startsWith("/workspace/agent")) return "agent";
  if (path.startsWith("/workspace/ambassador")) return "ambassador";
  return null;
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const expected = rolePrefixOf(pathname);
    if (expected && expected !== user.role) {
      router.replace(`/workspace/${user.role}`);
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text3)",
          fontSize: 13,
        }}
      >
        Loading workspace…
      </div>
    );
  }

  const expected = rolePrefixOf(pathname);
  if (expected && expected !== user.role) {
    return null;
  }

  return (
    <div className="workspace">
      <FloatingNav role={user.role} currentPath={pathname} />
      <div className="main">
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
