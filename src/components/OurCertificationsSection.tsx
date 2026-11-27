"use client";

import React, { useEffect, useState } from "react";
import {
  Award,
  BadgeCheck,
  ExternalLink,
  Eye,
  FileDown,
  ShieldCheck,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface InstituteCertification {
  id: string;
  badge: string;
  title: string;
  authority: string;
  certNumber: string;
  validity: string;
  description: string;
  imageUrl: string;
  pdfUrl: string;
}

const INSTITUTE_CERTIFICATIONS: InstituteCertification[] = [
  {
    id: "iso-9001-2015",
    badge: "ISO 9001:2015 • IAF / EGAC",
    title: "ISO 9001:2015 Quality Management System",
    authority: "Royal Assessments Pvt. Ltd. (IAF & EGAC Accredited)",
    certNumber: "E20250319652",
    validity: "04 Mar 2025 — 03 Mar 2028",
    description:
      "Certified for Design, Development & Implementation of Skill Development and Vocational Training Programs, Quality Assurance, and Learner Support Services.",
    imageUrl: "/certifications/iso-9001-2015.jpg",
    pdfUrl: "/certifications/iso-9001-2015.pdf",
  },
  {
    id: "dpiit-startup-india",
    badge: "Govt. of India • DPIIT",
    title: "Startup India Certificate of Recognition",
    authority:
      "Ministry of Commerce & Industry, Dept. for Promotion of Industry & Internal Trade",
    certNumber: "DIPP232988",
    validity: "08 Dec 2025 — 18 Oct 2032",
    description:
      "Officially recognized by DPIIT, Government of India, under the 'Education' Industry and 'Skill Development' Sector.",
    imageUrl: "/certifications/dpiit-startup-india.jpg",
    pdfUrl: "/certifications/dpiit-startup-india.pdf",
  },
  {
    id: "thsc-skill-india",
    badge: "Skill India • NCVET • THSC",
    title: "THSC Training Partner Affiliation",
    authority: "Tourism & Hospitality Skill Council (Skill India / NCVET)",
    certNumber: "THSC/DA/2024-2025/662",
    validity: "28 Feb 2025 — 28 Feb 2027",
    description:
      "Affiliated Training Partner approved to conduct THSC & NCVET-aligned vocational and skill development courses in Mandi, Himachal Pradesh.",
    imageUrl: "/certifications/thsc-skill-india-affiliation.jpg",
    pdfUrl: "/certifications/thsc-skill-india-affiliation.pdf",
  },
  {
    id: "mca-incorporation",
    badge: "Govt. of India • MCA",
    title: "Ministry of Corporate Affairs Incorporation",
    authority: "Ministry of Corporate Affairs, Central Registration Centre",
    certNumber: "CIN: U85499HP2023NPL010054",
    validity: "Incorporated: 01 May 2023",
    description:
      "Officially incorporated Section 8 Educational Foundation (Empire Education Foundation) under the Companies Act, 2013, Government of India.",
    imageUrl: "/certifications/mca-incorporation.jpg",
    pdfUrl: "/certifications/mca-incorporation.pdf",
  },
  {
    id: "gst-registration",
    badge: "Govt. of India • GST",
    title: "GST Registration Certificate (Form REG-06)",
    authority: "Goods & Services Tax Network, Government of India",
    certNumber: "GSTIN: 02AAHCE2923L1ZS",
    validity: "Effective From: 05 Jan 2026",
    description:
      "Regular Goods & Services Tax Registration for Empire Skills India Private Limited, Mandi, Himachal Pradesh.",
    imageUrl: "/certifications/gst-registration.jpg",
    pdfUrl: "/certifications/gst-registration.pdf",
  },
];

export function OurCertificationsSection() {
  const [certifications, setCertifications] =
    useState<InstituteCertification[]>(INSTITUTE_CERTIFICATIONS);
  const [activeCert, setActiveCert] = useState<InstituteCertification | null>(null);

  useEffect(() => {
    apiFetch(`/institute-certifications.php?_t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.certifications && Array.isArray(d.certifications)) {
          setCertifications(d.certifications);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section
      id="our-certifications"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F8FAFC] via-white to-[#FFF7ED]/60 border border-slate-200/90 p-6 sm:p-8 lg:p-10 shadow-sm"
    >
      {/* Subtle Top Gradient Accent */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#0B3D62] via-[#135589] to-[#F07228]" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5 mb-7">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#0B3D62]/10 to-[#F07228]/10 border border-[#0B3D62]/15 text-[11px] font-bold uppercase tracking-widest text-[#D65B14]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0B3D62]" />
            Government Recognitions &amp; Accreditations
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B3D62]">
            Our Certifications
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Official institutional registrations, ISO 9001:2015 certification, DPIIT Startup
            India recognition, and Skill India / NCVET affiliations of{" "}
            <strong className="text-[#0B3D62]">Empire Skills India Private Limited</strong>.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0B3D62] to-[#135589] text-white text-xs font-bold shadow-sm shrink-0">
          <BadgeCheck className="w-4 h-4 text-[#FF9B5E]" />
          {INSTITUTE_CERTIFICATIONS.length} Verified Official Credentials
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certifications.map((cert) => (
          <div
            key={cert.id}
            className="bg-white border border-slate-200/90 rounded-xl shadow-sm hover:shadow-xl hover:border-[#135589]/40 hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden group"
          >
            {/* Framed Certificate Preview */}
            <button
              type="button"
              onClick={() => setActiveCert(cert)}
              className="relative w-full aspect-[4/3] bg-gradient-to-br from-[#EFF6FF] via-slate-50 to-[#FFF7ED] p-3.5 border-b border-slate-200/80 flex items-center justify-center overflow-hidden cursor-pointer"
              aria-label={`View ${cert.title}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cert.imageUrl}
                alt={cert.title}
                loading="lazy"
                className="max-h-full max-w-full object-contain rounded shadow-md border border-slate-200 bg-white group-hover:scale-[1.03] transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-[#061E33]/0 group-hover:bg-[#061E33]/40 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-[#0B3D62] text-xs font-bold shadow-lg">
                  <Eye className="w-3.5 h-3.5 text-[#F07228]" />
                  View Full Certificate
                </span>
              </div>
            </button>

            {/* Details */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#EFF6FF] to-[#FFF7ED] border border-[#0B3D62]/15 text-[10px] font-bold uppercase tracking-wide text-[#0B3D62]">
                  <Award className="w-3 h-3 text-[#F07228]" />
                  {cert.badge}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-[#0B3D62] leading-snug">
                {cert.title}
              </h3>
              <p className="text-[11px] font-semibold text-[#D65B14] mt-1">
                {cert.authority}
              </p>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                {cert.description}
              </p>

              <div className="mt-auto pt-3.5 space-y-1.5 border-t border-slate-100 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Certificate No.</span>
                  <span className="font-mono font-bold text-[#0B3D62] text-right">
                    {cert.certNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Validity / Issue</span>
                  <span className="font-semibold text-slate-700 text-right">
                    {cert.validity}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-200/80 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveCert(cert)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-[#0B3D62] to-[#135589] hover:from-[#F07228] hover:to-[#D65B14] text-white text-xs font-semibold transition-all shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
              <a
                href={cert.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#0B3D62]/35 text-[#0B3D62] hover:bg-[#0B3D62] hover:text-white text-xs font-semibold transition-all"
              >
                <FileDown className="w-3.5 h-3.5" />
                View PDF
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Full-Screen Certificate Lightbox Modal */}
      {activeCert && (
        <div
          className="fixed inset-0 z-50 bg-[#041524]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setActiveCert(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#061E33] via-[#0B3D62] to-[#135589] text-white px-5 py-3.5 flex items-center justify-between gap-3 border-b-2 border-[#F07228]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF9B5E]">
                  {activeCert.badge} • {activeCert.certNumber}
                </p>
                <h3 className="text-sm sm:text-base font-bold leading-snug">
                  {activeCert.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeCert.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#F07228] to-[#D65B14] text-white text-xs font-bold hover:opacity-95"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Official PDF
                </a>
                <button
                  type="button"
                  onClick={() => setActiveCert(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  aria-label="Close certificate preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-slate-100 flex items-center justify-center max-h-[75vh] overflow-y-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeCert.imageUrl}
                alt={activeCert.title}
                className="max-h-[68vh] w-auto object-contain rounded-lg shadow-lg border border-slate-300 bg-white"
              />
            </div>

            <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span>
                <strong className="text-[#0B3D62]">Authority:</strong> {activeCert.authority}
              </span>
              <span className="font-semibold text-[#D65B14]">{activeCert.validity}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
