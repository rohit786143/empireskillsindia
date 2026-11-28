"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowLeft, AlertCircle } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { apiFetch } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/auth.php?action=login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials.");
      } else {
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B3D62] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center text-white space-y-3">
          <div className="flex justify-center">
            <BrandLogo height={54} onDarkBg />
          </div>
          <p className="text-xs font-semibold text-[#FFB380] uppercase tracking-widest">
            Institute Owner &amp; Examination Controller Login
          </p>
        </div>

        <div className="bg-white rounded-lg border-t-4 border-[#F07228] shadow-2xl p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter official admin email"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white font-bold text-sm shadow transition-colors disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Sign In to Institute Portal"}
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-[#FFB380] font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Public Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
