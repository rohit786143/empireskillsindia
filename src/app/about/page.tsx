import React from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  Target,
  Eye,
  BookOpen,
  Building2,
  ArrowRight,
} from "lucide-react";
import { INSTITUTE_INFO } from "@/lib/constants";
import { OurCertificationsSection } from "@/components/OurCertificationsSection";

export default function AboutPage() {
  return (
    <div className="pb-12">
      {/* Page Banner */}
      <section className="bg-[#0B3D62] text-white border-b-4 border-[#F07228] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#FF9B5E]">
            Institutional Overview
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-1">
            About Empire Skills India
          </h1>
          <p className="text-slate-200 text-sm sm:text-base mt-2 max-w-3xl">
            {INSTITUTE_INFO.tagline} — Committed to standardized vocational education,
            transparent examinations, and nationally verifiable digital credentials.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-10">
        {/* Institutional Mandate */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-2xl font-bold text-[#0B3D62] border-b border-slate-200 pb-3">
              Institutional Mandate &amp; Academic Governance
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Empire Skills India was established with the core objective of democratizing
              career-oriented vocational and technical education across India. Modeled on
              structured national open-learning and skill-qualification frameworks, the
              institution ensures that students from diverse academic backgrounds can acquire
              practical, industry-validated competencies at an affordable cost.
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              Every programme is governed by an Academic Advisory Council that reviews syllabi
              annually to align with current corporate, banking, accounting, IT, and technical
              sector standards. From digital enrollment and structured practical evaluations to
              QR-coded certificate issuance, our entire academic lifecycle is transparent and
              auditable.
            </p>
          </div>

          <div className="bg-[#0B3D62] text-white rounded-lg p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-[#FF9B5E]">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold uppercase text-sm tracking-wider">
                Accreditation &amp; Recognition
              </h3>
            </div>
            <ul className="space-y-3 text-sm text-slate-200">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FF9B5E] shrink-0 mt-0.5" />
                <span>ISO 9001:2015 Certified Quality Management System</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FF9B5E] shrink-0 mt-0.5" />
                <span>Registered under MSME / Govt. of India Skill Ecosystem</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FF9B5E] shrink-0 mt-0.5" />
                <span>100% Online QR-Code Verifiable Digital &amp; Print Certificates</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FF9B5E] shrink-0 mt-0.5" />
                <span>Pan-India Network of Authorized Training &amp; Study Centres</span>
              </li>
            </ul>
            <div className="pt-3 border-t border-white/15 text-xs text-amber-200 font-semibold">
              {INSTITUTE_INFO.regNumber}
            </div>
          </div>
        </div>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 border-t-4 border-t-[#0B3D62] rounded-lg p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-[#0B3D62]">
              <Eye className="w-6 h-6" />
              <h3 className="text-xl font-bold">Our Vision</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              To emerge as a premier national vocational and skill development institution that
              builds a self-reliant, technically skilled workforce capable of excelling in
              domestic and global industries.
            </p>
          </div>

          <div className="bg-white border border-slate-200 border-t-4 border-t-[#F07228] rounded-lg p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-[#D65B14]">
              <Target className="w-6 h-6" />
              <h3 className="text-xl font-bold text-[#0B3D62]">Our Mission</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              To deliver accessible, hands-on training in IT, Accounting, Technical Trades, and
              Education through transparent admissions, rigorous practical evaluations, and
              instantly verifiable credentials.
            </p>
          </div>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2">
            <BookOpen className="w-6 h-6 text-[#135589]" />
            <h4 className="font-bold text-[#0B3D62]">Structured Curriculum</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Semester-wise and module-wise syllabi designed with 60% practical lab training and
              40% conceptual mastery.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2">
            <Award className="w-6 h-6 text-[#D65B14]" />
            <h4 className="font-bold text-[#0B3D62]">Transparent Assessment</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standardized grading (A+ to B), online marksheet access in Student Zone, and
              tamper-evident certificates.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2">
            <Building2 className="w-6 h-6 text-emerald-700" />
            <h4 className="font-bold text-[#0B3D62]">Career &amp; Placement Support</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Resume workshops, employer verification desk, and periodic skill placement drives
              for certified alumni.
            </p>
          </div>
        </div>

        {/* Official Institute Certifications & Accreditations */}
        <OurCertificationsSection />

        {/* CTA Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#0B3D62]">
              Ready to enroll for Academic Session 2026?
            </h3>
            <p className="text-xs text-slate-600">
              Browse our 8+ vocational programmes or submit your online admission form today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/courses"
              className="px-4 py-2.5 rounded border border-[#0B3D62] text-[#0B3D62] font-semibold text-sm hover:bg-slate-50"
            >
              View Courses
            </Link>
            <Link
              href="/admission"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white font-semibold text-sm"
            >
              Apply Online <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
