"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Phone,
  Mail,
  ShieldCheck,
  GraduationCap,
  Lock,
  Menu,
  X,
  Bell,
  FileText,
  Building2,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { INSTITUTE_INFO } from "@/lib/constants";
import { apiFetch } from "@/lib/api";

interface TickerNotice {
  id: string;
  title: string;
  publishedDate: string;
  category: string;
}

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Institute", href: "/about" },
  { label: "Courses", href: "/courses" },
  { label: "Online Admission", href: "/admission" },
  { label: "Verify Certificate", href: "/verify-certificate" },
  { label: "Student Zone", href: "/student-zone" },
  { label: "Contact", href: "/contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tickerNotices, setTickerNotices] = useState<TickerNotice[]>([]);

  useEffect(() => {
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/franchise")) return;
    apiFetch("/notices.php?ticker=true")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.notices) setTickerNotices(d.notices);
      })
      .catch(() => {});
  }, [pathname]);

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/franchise")) {
    return null;
  }

  const tickerItems =
    tickerNotices.length > 0
      ? tickerNotices
      : [
          {
            id: "default-1",
            title: "Online Admission Open for Academic Session July 2026 — Apply Now",
            publishedDate: "2026-06-15",
            category: "Admission",
          },
        ];

  return (
    <header className="no-print w-full">
      {/* Top Institutional Utility Bar */}
      <div className="bg-gradient-to-r from-[#051B2E] via-[#082D49] to-[#0B3D62] text-slate-100 text-xs border-b border-[#F07228]/35">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-slate-200">
              <Phone className="w-3.5 h-3.5 text-[#FF9B5E]" />
              <span className="font-medium text-slate-300">Helpline:</span>{" "}
              <span className="font-semibold text-white">{INSTITUTE_INFO.helpline}</span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-200">
              <Mail className="w-3.5 h-3.5 text-[#FF9B5E]" />
              {INSTITUTE_INFO.email}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admission"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-gradient-to-r from-[#F07228] to-[#FF8A3D] hover:from-[#D65B14] hover:to-[#F07228] text-white font-semibold shadow-sm shadow-[#F07228]/30 transition-all"
            >
              <FileText className="w-3 h-3" />
              Apply Online
            </Link>
            <Link
              href="/verify-certificate"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-gradient-to-r from-[#135589] to-[#1D6FA8] hover:from-[#0E4470] hover:to-[#135589] text-white font-medium shadow-sm transition-all"
            >
              <ShieldCheck className="w-3 h-3" />
              Verify Certificate
            </Link>
            <Link
              href="/student-zone"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/20 bg-white/5 hover:bg-white/15 text-slate-100 font-medium transition-colors"
            >
              <GraduationCap className="w-3 h-3 text-[#FF9B5E]" />
              Student Zone
            </Link>
            <Link
              href="/franchise/login"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-sky-400/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 font-medium transition-colors"
            >
              <Building2 className="w-3 h-3" />
              Franchise Login
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 font-medium transition-colors"
            >
              <Lock className="w-3 h-3" />
              Institute Login
            </Link>
          </div>
        </div>
      </div>

      {/* Live Scrolling Notification Ticker */}
      <div className="bg-gradient-to-r from-[#EFF6FF] via-white to-[#FFF7ED] border-b border-slate-200/80 text-xs overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center">
          <div className="shrink-0 bg-gradient-to-r from-[#072A44] to-[#135589] text-white px-3.5 sm:px-4 py-2 font-bold uppercase tracking-wider flex items-center gap-1.5 z-10 shadow-sm">
            <Bell className="w-3.5 h-3.5 text-[#FF9B5E]" />
            <span>Latest Notifications</span>
          </div>
          <div className="overflow-hidden flex-1 py-2">
            <div className="esi-ticker-track">
              {[...tickerItems, ...tickerItems].map((notice, idx) => (
                <Link
                  key={`${notice.id}-${idx}`}
                  href="/#notice-board"
                  className="inline-flex items-center gap-2 mx-6 text-[#0B3D62] hover:text-[#D65B14] font-medium transition-colors"
                >
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-[#F07228] to-[#FF8A3D] text-white rounded uppercase shadow-xs">
                    NEW
                  </span>
                  <span>{notice.title}</span>
                  <span className="text-slate-300">•</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2.5 gap-3">
            {/* Brand Identity */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <BrandLogo height={46} className="shrink-0" />
              <div className="hidden xl:block border-l border-slate-200 pl-3 max-w-[235px]">
                <p className="text-[11px] font-bold text-[#D65B14] leading-tight">
                  {INSTITUTE_INFO.tagline}
                </p>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase mt-0.5 truncate">
                  {INSTITUTE_INFO.regNumber}
                </p>
              </div>
            </Link>

            {/* Desktop Navigation — Single Crisp Row */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
              {NAV_LINKS.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap px-3 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-[#0B3D62] to-[#135589] text-white shadow-sm shadow-[#0B3D62]/20"
                        : "text-slate-700 hover:bg-gradient-to-r hover:from-[#EFF6FF] hover:to-[#FFF7ED] hover:text-[#0B3D62]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-lg border border-slate-300 text-[#0B3D62] hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="h-[3px] w-full bg-gradient-to-r from-[#0B3D62] via-[#135589] to-[#F07228]" />

        {/* Mobile Nav Drawer */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-1 shadow-md">
            {NAV_LINKS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded text-sm font-semibold ${
                    isActive
                      ? "bg-[#0B3D62] text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
