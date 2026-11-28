"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Award,
  Users,
  Building2,
  ArrowRight,
  Briefcase,
  Globe,
  Landmark,
} from "lucide-react";
import {
  NoticeBoardSection,
  type PublicNotice,
  type PublicCourse,
} from "@/components/HomeClientSections";
import { StudentReviewsSection } from "@/components/StudentReviewsSection";
import { OurTeamSection } from "@/components/OurTeamSection";
import { HeroGallerySlider } from "@/components/HeroGallerySlider";
import { apiFetch } from "@/lib/api";

export default function HomePage() {
  const [notices, setNotices] = useState<PublicNotice[]>([]);
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [certCount, setCertCount] = useState(0);

  useEffect(() => {
    apiFetch("/public-home.php")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setNotices(data.notices || []);
        setCourses(data.courses || []);
        setStudentCount(Number(data.studentCount || 0));
        setCertCount(Number(data.certCount || 0));
      })
      .catch(() => {});
  }, []);

  const stats = [
    {
      label: "Students Trained",
      value: `${(14800 + studentCount).toLocaleString("en-IN")}+`,
      icon: Users,
    },
    { label: "Courses Offered", value: `${courses.length || 8}+`, icon: BookOpen },
    {
      label: "Certified Alumni",
      value: `${(12400 + certCount).toLocaleString("en-IN")}+`,
      icon: Award,
    },
    { label: "Study Centers", value: "65+", icon: Building2 },
  ];

  return (
    <div className="space-y-12 pb-8">
      {/* 1. Institutional Hero Banner — Balanced Navy, Ocean Teal & Saffron Logo Palette */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B3D62] via-[#135589] to-[#0E7490] text-white border-b-4 border-[#F07228]">
        {/* Subtle luminous ambient accents */}
        <div
          className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#F07228]/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-1/4 w-96 h-96 rounded-full bg-[#38BDF8]/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
            <div className="lg:col-span-7 space-y-3.5 lg:pt-2">
              <h1 className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold tracking-tight leading-snug sm:leading-tight text-white">
                A National{" "}
                <span className="text-[#FFB36B]">Skill Development, Training,</span>{" "}
                Placement &amp; Project Implementation Organization
              </h1>
              <p className="text-xs sm:text-[15px] text-sky-100/90 max-w-2xl leading-relaxed font-medium">
                Empowering India&apos;s youth and partner institutions with globally benchmarked
                vocational programmes, government skill mission delivery, and verified career
                pathways.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 pt-0.5 max-w-2xl">
                <div className="group relative flex items-center gap-2.5 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 hover:border-[#FFB36B]/60 backdrop-blur-md shadow-sm transition-all duration-200 hover:-translate-y-0.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F07228]/25 ring-1 ring-[#FFB36B]/40 text-[#FFB36B] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] sm:text-xs font-extrabold uppercase tracking-wider text-white leading-tight truncate">
                      SKILL DEVELOPMENT
                    </p>
                    <p className="text-[10px] sm:text-[11.5px] text-sky-100/85 mt-0.5 leading-tight line-clamp-1">
                      Training &amp; Certification Programmes
                    </p>
                  </div>
                  <span className="hidden sm:block text-[10px] font-black text-white/20 group-hover:text-[#FFB36B]/80 transition-colors self-start">
                    01
                  </span>
                </div>

                <div className="group relative flex items-center gap-2.5 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 hover:border-sky-300/60 backdrop-blur-md shadow-sm transition-all duration-200 hover:-translate-y-0.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-400/20 ring-1 ring-sky-300/40 text-sky-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] sm:text-xs font-extrabold uppercase tracking-wider text-white leading-tight truncate">
                      GOVERNMENT PROJECTS
                    </p>
                    <p className="text-[10px] sm:text-[11.5px] text-sky-100/85 mt-0.5 leading-tight line-clamp-1">
                      Project Implementation
                    </p>
                  </div>
                  <span className="hidden sm:block text-[10px] font-black text-white/20 group-hover:text-sky-300/80 transition-colors self-start">
                    02
                  </span>
                </div>

                <div className="group relative flex items-center gap-2.5 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 hover:border-emerald-300/60 backdrop-blur-md shadow-sm transition-all duration-200 hover:-translate-y-0.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-400/20 ring-1 ring-emerald-300/40 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] sm:text-xs font-extrabold uppercase tracking-wider text-white leading-tight truncate">
                      PLACEMENT SERVICES
                    </p>
                    <p className="text-[10px] sm:text-[11.5px] text-sky-100/85 mt-0.5 leading-tight line-clamp-1">
                      Employment &amp; Recruitment Support
                    </p>
                  </div>
                  <span className="hidden sm:block text-[10px] font-black text-white/20 group-hover:text-emerald-300/80 transition-colors self-start">
                    03
                  </span>
                </div>

                <div className="group relative flex items-center gap-2.5 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 hover:border-amber-300/60 backdrop-blur-md shadow-sm transition-all duration-200 hover:-translate-y-0.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/20 ring-1 ring-amber-300/40 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] sm:text-xs font-extrabold uppercase tracking-wider text-white leading-tight truncate">
                      NATIONAL PARTNERSHIPS
                    </p>
                    <p className="text-[10px] sm:text-[11.5px] text-sky-100/85 mt-0.5 leading-tight line-clamp-1">
                      Institutional &amp; Corporate Network
                    </p>
                  </div>
                  <span className="hidden sm:block text-[10px] font-black text-white/20 group-hover:text-amber-300/80 transition-colors self-start">
                    04
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
                <Link
                  href="/admission"
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-gradient-to-r from-[#F07228] to-[#F59E0B] hover:from-[#D65B14] hover:to-[#D97706] text-white font-bold text-xs sm:text-sm shadow-lg transition-all"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Apply Online</span>
                  <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
                </Link>
                <Link
                  href="/verify-certificate"
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-white text-[#0B3D62] hover:bg-sky-50 font-bold text-xs sm:text-sm shadow-md transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-[#0E7490] shrink-0" />
                  <span>Verify Cert.</span>
                </Link>
                <Link
                  href="/courses"
                  className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-sm transition-colors"
                >
                  Explore Courses
                </Link>
              </div>
            </div>

            {/* Right: Colorful-Bordered Auto-Rotating Gallery Image Slider (5 images, 2s slide, 5m refresh) */}
            <div className="lg:col-span-5">
              <HeroGallerySlider />
            </div>
          </div>
        </div>
      </section>

      {/* 2. 4-Column Quick Service Bar */}
      <section className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 -mt-4 sm:-mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link
            href="/admission"
            className="bg-white border border-slate-200 border-t-4 border-t-[#0B3D62] rounded-lg p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 sm:p-2.5 rounded bg-blue-50 text-[#0B3D62]">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#135589] group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#0B3D62] mt-2.5 sm:mt-3 leading-snug">
              Online Admission Form
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-1 line-clamp-3">
              Apply for July 2026 diploma &amp; skill courses and download acknowledgement slip.
            </p>
          </Link>

          <Link
            href="/verify-certificate"
            className="bg-white border border-slate-200 border-t-4 border-t-[#D65B14] rounded-lg p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 sm:p-2.5 rounded bg-amber-50 text-[#D65B14]">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#D65B14] group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#0B3D62] mt-2.5 sm:mt-3 leading-snug">
              Certificate Verification
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-1 line-clamp-3">
              Instant online authenticity check for employers &amp; institutions by Certificate No.
            </p>
          </Link>

          <Link
            href="/courses"
            className="bg-white border border-slate-200 border-t-4 border-t-[#135589] rounded-lg p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 sm:p-2.5 rounded bg-blue-50 text-[#135589]">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#135589] group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#0B3D62] mt-2.5 sm:mt-3 leading-snug">
              Courses &amp; Syllabus
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-1 line-clamp-3">
              Browse detailed semester-wise syllabi, eligibility criteria, and fee structures.
            </p>
          </Link>

          <Link
            href="/student-zone"
            className="bg-white border border-slate-200 border-t-4 border-t-emerald-700 rounded-lg p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 sm:p-2.5 rounded bg-emerald-50 text-emerald-700">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#0B3D62] mt-2.5 sm:mt-3 leading-snug">
              Student Result &amp; ID Card
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-1 line-clamp-3">
              Check examination marksheet and print your official Empire Skills India ID card.
            </p>
          </Link>
        </div>
      </section>

      {/* 3. IGNOU-Style Split Section: Notices + Institute Profile & Director's Message */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5">
            <NoticeBoardSection notices={notices} />
          </div>

          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#D65B14]">
                    Institutional Profile
                  </span>
                  <h2 className="text-2xl font-extrabold text-[#0B3D62]">
                    About Empire Skills India
                  </h2>
                </div>
                <Link
                  href="/about"
                  className="text-xs font-bold text-[#135589] hover:underline shrink-0"
                >
                  Read More →
                </Link>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                <strong>Empire Skills India</strong> is an ISO 9001:2015 certified national
                skill development and vocational training institution committed to bridging the
                gap between formal education and industry employability. Through our structured
                curriculum, qualified faculty, and digital academic governance, we empower
                learners across urban and rural India with verified, career-ready credentials.
              </p>

              <div className="bg-[#F8FAFC] border-l-4 border-[#0B3D62] p-4 rounded-r">
                <p className="text-xs font-bold uppercase tracking-wider text-[#0B3D62] mb-1">
                  Director&apos;s Message
                </p>
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  &ldquo;True national progress is achieved when every youth possesses practical,
                  verifiable skills that translate into dignified livelihoods. At Empire Skills
                  India, we uphold academic rigor, transparency in assessment, and lifelong
                  career support for every student who enrolls with us.&rdquo;
                </p>
                <p className="text-xs font-bold text-[#D65B14] mt-2">
                  — Office of the Director, Empire Skills India
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                const accents = [
                  "border-t-[#0B3D62] text-[#0B3D62]",
                  "border-t-[#F07228] text-[#D65B14]",
                  "border-t-[#0E7490] text-[#0E7490]",
                  "border-t-[#059669] text-[#059669]",
                ];
                const accent = accents[idx % accents.length];
                return (
                  <div
                    key={stat.label}
                    className={`bg-white border border-slate-200 border-t-4 ${accent.split(" ")[0]} rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${accent.split(" ")[1]}`} />
                    <div className="text-2xl font-extrabold text-[#0B3D62]">
                      {stat.value}
                    </div>
                    <div className="text-xs font-semibold text-slate-600 mt-0.5">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Leadership & Faculty — Our Team (Admin Managed) */}
      <OurTeamSection mode="section" />

      {/* 5. Student Voices & Alumni Reviews (4-Card Right-to-Left Slider) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <StudentReviewsSection />
      </div>
    </div>
  );
}
