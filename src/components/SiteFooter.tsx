"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Phone, Mail, Clock, ShieldCheck, Lock, ExternalLink, Facebook, Instagram } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { useSiteSettings } from "@/lib/useSiteSettings";

export function SiteFooter() {
  const pathname = usePathname();
  const siteSettings = useSiteSettings();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/franchise")) {
    return null;
  }

  return (
    <footer className="no-print bg-gradient-to-br from-[#0B3D62] via-[#114B75] to-[#0E5E74] text-slate-100 border-t-4 border-[#F07228] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Brand & Accreditation */}
          <div className="space-y-4">
            <div className="space-y-2">
              <BrandLogo height={42} onDarkBg />
              <p className="text-[11px] text-[#FFB380] font-semibold">
                ISO 9001:2015 Certified Institution
              </p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dedicated to national skill empowerment through structured vocational, IT,
              accounting, technical, and teacher training programmes with transparent digital
              certification and verification.
            </p>
          </div>

          {/* Column 2: Academic & Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/15 pb-2">
              Academic Portal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="hover:text-[#FFB380] transition-colors">
                  About Empire Skills India
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-[#FFB380] transition-colors">
                  Courses &amp; Syllabus Directory
                </Link>
              </li>
              <li>
                <Link href="/admission" className="hover:text-[#FFB380] transition-colors">
                  Online Admission Portal 2026
                </Link>
              </li>
              <li>
                <Link href="/student-zone" className="hover:text-[#FFB380] transition-colors">
                  Student Result &amp; ID Card
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-[#FFB380] transition-colors">
                  Photo Gallery &amp; Events
                </Link>
              </li>
              <li>
                <Link href="/#notice-board" className="hover:text-[#FFB380] transition-colors">
                  Official Notices &amp; Circulars
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Verification & Governance */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/15 pb-2">
              Verification &amp; Administration
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/verify-certificate"
                  className="inline-flex items-center gap-1.5 text-[#FFB380] hover:text-amber-200 font-semibold"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Public Certificate Verification
                </Link>
              </li>
              <li>
                <Link href="/student-zone" className="hover:text-[#FFB380] transition-colors">
                  Enrollment Status &amp; Marksheet
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#FFB380] transition-colors">
                  Grievance &amp; Student Helpdesk
                </Link>
              </li>
              <li className="pt-2 flex flex-wrap gap-2">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded bg-[#072A44] hover:bg-slate-900 border border-[#F07228]/50 text-amber-200 text-xs font-semibold transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-[#FF9B5E]" />
                  Admin Login
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </Link>
                <Link
                  href="/franchise/login"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded bg-[#072A44] hover:bg-slate-900 border border-blue-400/50 text-blue-200 text-xs font-semibold transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-blue-300" />
                  Partner Login
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Official Contact */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/15 pb-2">
              Administrative Office
            </h4>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FF9B5E] shrink-0 mt-0.5" />
                <span>{siteSettings.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#FF9B5E] shrink-0" />
                <span>{siteSettings.helpline}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#FF9B5E] shrink-0" />
                <span>{siteSettings.email}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#FF9B5E] shrink-0" />
                <span>{siteSettings.officeHours}</span>
              </li>
            </ul>
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-2">
              {siteSettings.facebook && (
                <a
                  href={siteSettings.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1877F2]/90 hover:bg-[#1877F2] text-white text-xs font-semibold transition-colors"
                >
                  <Facebook className="w-3.5 h-3.5" />
                  Facebook
                </a>
              )}
              {siteSettings.instagram && (
                <a
                  href={siteSettings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#E4405F]/90 hover:bg-[#E4405F] text-white text-xs font-semibold transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="bg-[#072A44] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} Empire Skills India. All Rights Reserved. Official Institutional Portal.
          </p>
          <p className="text-slate-400">
            Designed for Transparent Vocational Education &amp; Instant Digital Verification.
          </p>
        </div>
      </div>
    </footer>
  );
}
