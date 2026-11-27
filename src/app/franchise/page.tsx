"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function FranchiseIndexPage() {
  const router = useRouter();

  useEffect(() => {
    apiFetch("/franchise-auth.php?action=me")
      .then((res) => {
        if (res.ok) router.replace("/franchise/dashboard");
        else router.replace("/franchise/login");
      })
      .catch(() => router.replace("/franchise/login"));
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-600 text-sm">
      Redirecting to Franchise Portal...
    </div>
  );
}
