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
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  NoticeBoardSection,
  CoursesExplorerGrid,
  type PublicNotice,
  type PublicCourse,
} from "@/components/HomeClientSections";
import { OurCertificationsSection } from "@/components/OurCertificationsSection";
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
      {/* 1. Institutional Hero Banner */}
      <section className="bg-[#0B3D62] text-white border-b-4 border-[#F07228]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-tight text-white">
                Empowering Youth Through Industry-Recognized Skill &amp; Vocational Education
              </h1>
              <p className="text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed">
                Empire Skills India delivers structured, employment-focused diploma and
                certification programmes in IT, Accounting, Technical Trades, Management, and
                Teacher Training — backed by transparent online admission and instant QR-code
                certificate verification.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/admission"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[#F07228] hover:bg-[#D65B14] text-white font-bold text-sm shadow transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Apply Online 2026
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/verify-certificate"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded bg-white text-[#0B3D62] hover:bg-slate-100 font-bold text-sm shadow transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-[#135589]" />
                  Verify Certificate
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded border border-white/30 hover:bg-white/10 text-white font-semibold text-sm transition-colors"
                >
                  Explore Courses
                </Link>
              </div>
            </div>

            {/* Right Institutional Highlights Box */}
            <div className="lg:col-span-4">
              <div className="bg-[#072A44] border border-white/15 rounded-lg p-6 space-y-4 shadow-lg">
                <div className="border-b border-white/15 pb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#FF9B5E]">
                    National Portal Highlights
                  </p>
                  <h2 className="text-lg font-bold text-white mt-0.5">
                    Why Empire Skills India?
                  </h2>
                </div>
                <ul className="space-y-3 text-sm text-slate-200">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#FF9B5E] shrink-0 mt-0.5" />
                    <span>Standardized National Curriculum &amp; Practical Lab Assessments</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#FF9B5E] shrink-0 mt-0.5" />
                    <span>Unique Enrollment ID &amp; Printable Digital Student ID Card</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#FF9B5E] shrink-0 mt-0.5" />
                    <span>Instant Employer Verification via QR-Enabled Certificates</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#FF9B5E] shrink-0 mt-0.5" />
                    <span>Affordable Fee Structure with Regular, Online &amp; Hybrid Modes</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 4-Column Quick Service Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admission"
            className="bg-white border border-slate-200 border-t-4 border-t-[#0B3D62] rounded-lg p-5 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded bg-blue-50 text-[#0B3D62]">
                <FileText className="w-6 h-6" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#135589] group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-base font-bold text-[#0B3D62] mt-3">
              Online Admission Form
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Apply for July 2026 diploma &amp; skill courses and download acknowledgement slip.
            </p>
          </Link>

          <Link
            href="/verify-certificate"
            className="bg-white border border-slate-200 border-t-4 border-t-[#D65B14] rounded-lg p-5 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded bg-amber-50 text-[#D65B14]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#D65B14] group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-base font-bold text-[#0B3D62] mt-3">
              Certificate Verification
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Instant online authenticity check for employers &amp; institutions by Certificate No.
            </p>
          </Link>

          <Link
            href="/courses"
            className="bg-white border border-slate-200 border-t-4 border-t-[#135589] rounded-lg p-5 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded bg-blue-50 text-[#135589]">
                <BookOpen className="w-6 h-6" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#135589] group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-base font-bold text-[#0B3D62] mt-3">
              Download Syllabus / Prospectus
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Browse detailed semester-wise syllabi, eligibility criteria, and fee structures.
            </p>
          </Link>

          <Link
            href="/student-zone"
            className="bg-white border border-slate-200 border-t-4 border-t-emerald-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded bg-emerald-50 text-emerald-700">
                <GraduationCap className="w-6 h-6" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-base font-bold text-[#0B3D62] mt-3">
              Student Result &amp; ID Card
            </h3>
            <p className="text-xs text-slate-600 mt-1">
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
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="bg-white border border-slate-200 rounded-lg p-4 text-center shadow-sm"
                  >
                    <Icon className="w-6 h-6 text-[#0B3D62] mx-auto mb-2" />
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

      {/* 4. Courses Explorer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CoursesExplorerGrid courses={courses} />
      </div>

      {/* 5. Our Certifications & Official Accreditations */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <OurCertificationsSection />
      </div>
    </div>
  );
}
