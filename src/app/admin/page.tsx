"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    apiFetch("/auth.php?action=me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.authenticated) router.replace("/admin/dashboard");
        else router.replace("/admin/login");
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] text-sm text-[#0B3D62] font-semibold">
      Redirecting to Institute Portal...
    </div>
  );
}
