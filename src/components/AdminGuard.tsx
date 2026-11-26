"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "./AdminShell";
import { apiFetch } from "@/lib/api";

export interface AdminUserSession {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export function AdminGuard({
  children,
}: {
  children: React.ReactNode | ((admin: AdminUserSession) => React.ReactNode);
}) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUserSession | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    apiFetch("/auth.php?action=me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.authenticated && data.user) {
          setAdmin(data.user);
        } else {
          router.replace("/admin/login");
        }
      })
      .catch(() => {
        if (active) router.replace("/admin/login");
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (checking || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] text-sm font-semibold text-[#0B3D62]">
        Verifying Institute Owner session...
      </div>
    );
  }

  return (
    <AdminShell adminName={admin.name} adminEmail={admin.email}>
      {typeof children === "function" ? children(admin) : children}
    </AdminShell>
  );
}
