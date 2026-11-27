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
  Facebook,
  Instagram,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { apiFetch } from "@/lib/api";
import { useSiteSettings } from "@/lib/useSiteSettings";

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
  { label: "Photo Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const siteSettings = useSiteSettings();
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
      <div className="bg-[#072A44] text-slate-100 text-xs border-b border-[#F07228]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-slate-200">
              <Phone className="w-3.5 h-3.5 text-[#FF9B5E]" />
              <span className="font-medium">Helpline:</span> {siteSettings.helpline}
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-200">
              <Mail className="w-3.5 h-3.5 text-[#FF9B5E]" />
              {siteSettings.email}
            </span>
            <div className="inline-flex items-center gap-1.5">
              {siteSettings.facebook && (
                <a
                  href={siteSettings.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Empire Skills India Facebook"
                  className="inline-flex items-center justify-center w-6 h-6 rounded bg-white/10 hover:bg-[#1877F2] text-white transition-colors"
                >
                  <Facebook className="w-3.5 h-3.5" />
                </a>
              )}
              {siteSettings.instagram && (
                <a
                  href={siteSettings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Empire Skills India Instagram"
                  className="inline-flex items-center justify-center w-6 h-6 rounded bg-white/10 hover:bg-[#E4405F] text-white transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admission"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F07228] hover:bg-[#D65B14] text-white font-semibold transition-colors"
            >
              <FileText className="w-3 h-3" />
              Apply Online
            </Link>
            <Link
              href="/verify-certificate"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#135589] hover:bg-blue-600 text-white font-medium transition-colors"
            >
              <ShieldCheck className="w-3 h-3" />
              Verify Certificate
            </Link>
            <Link
              href="/student-zone"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-500/60 hover:bg-white/10 text-slate-100 font-medium transition-colors"
            >
              <GraduationCap className="w-3 h-3" />
              Student Zone
            </Link>
            <Link
              href="/franchise/login"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-sky-400/50 hover:bg-sky-500/20 text-sky-200 font-medium transition-colors"
            >
              <Building2 className="w-3 h-3" />
              Partner Login
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-amber-400/50 hover:bg-[#D65B14]/20 text-amber-200 font-medium transition-colors"
            >
              <Lock className="w-3 h-3" />
              Admin Login
            </Link>
          </div>
        </div>
      </div>

      {/* Live Scrolling Notification Ticker */}
      <div className="bg-[#EFF6FF] border-b border-slate-200 text-xs overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center">
          <div className="shrink-0 bg-[#0B3D62] text-white px-3 sm:px-4 py-2 font-semibold uppercase tracking-wider flex items-center gap-1.5 z-10">
            <Bell className="w-3.5 h-3.5 text-[#FF9B5E]" />
            <span>Latest Notifications</span>
          </div>
          <div className="overflow-hidden flex-1 py-2">
            <div className="esi-ticker-track">
              {[...tickerItems, ...tickerItems].map((notice, idx) => (
                <Link
                  key={`${notice.id}-${idx}`}
                  href="/#notice-board"
                  className="inline-flex items-center gap-2 mx-6 text-[#0B3D62] hover:text-[#135589] font-medium"
                >
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#F07228] text-white rounded uppercase">
                    NEW
                  </span>
                  <span>{notice.title}</span>
                  <span className="text-slate-400">•</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b-2 border-[#0B3D62] shadow-sm">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6">
          <div className="flex items-center justify-between py-2.5 gap-6 xl:gap-10">
            {/* Brand Identity */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <BrandLogo height={42} className="shrink-0" />
              <div className="hidden sm:block border-l border-slate-200 pl-2.5 leading-tight shrink-0">
                <p className="text-[11px] font-extrabold text-[#D65B14] tracking-wide whitespace-nowrap">
                  An ISO 9001:2015 Certified
                </p>
                <p className="text-[9.5px] font-semibold text-[#0B3D62] mt-0.5 whitespace-nowrap">
                  Reg. with Govt. of India, Ministry of Corporate Affairs
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 ml-auto" aria-label="Main Navigation">
              {NAV_LINKS.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-2.5 xl:px-3 py-2 rounded text-[12.5px] xl:text-[13.5px] font-semibold whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-[#0B3D62] text-white"
                        : "text-slate-700 hover:bg-slate-100 hover:text-[#0B3D62]"
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
              className="lg:hidden p-2 rounded border border-slate-300 text-[#0B3D62] hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

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
