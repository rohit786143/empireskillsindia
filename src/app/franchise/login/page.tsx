"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { apiFetch } from "@/lib/api";

export default function FranchiseLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/franchise-auth.php?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Invalid franchise credentials.");
        setLoading(false);
        return;
      }
      router.push("/franchise/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#072A44] via-[#0B3D62] to-[#0F4C7A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Brand Header */}
        <div className="bg-[#0B3D62] px-6 py-6 text-center border-b-4 border-[#F07228]">
          <div className="flex justify-center mb-3">
            <BrandLogo height={52} onDarkBg />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-200 text-xs font-semibold tracking-wide uppercase">
            <Building2 className="w-3.5 h-3.5" />
            Authorized Study Center / Franchise Portal
          </div>
          <p className="text-slate-200 text-xs mt-2">
            Sign in with the credentials issued by Empire Skills India Head Office
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Franchise Registered Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="center@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3D62]/20 focus:border-[#0B3D62]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3D62]/20 focus:border-[#0B3D62]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Sign In to Center Dashboard"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link href="/" className="hover:text-[#0B3D62] font-medium">
              ← Back to Website
            </Link>
            <Link href="/admin/login" className="hover:text-[#0B3D62] font-medium inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Head Office Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
