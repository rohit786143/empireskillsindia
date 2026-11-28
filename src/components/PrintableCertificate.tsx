"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, ExternalLink, User, Award, FileSpreadsheet, Layers } from "lucide-react";

export interface CertificateSubjectRow {
  subject: string;
  maxMarks: number;
  minMarks: number;
  marksSecured: number;
}

export interface CertificateData {
  id?: string;
  certificateNumber: string;
  enrollmentNumber: string;
  studentName: string;
  fatherName: string;
  motherName?: string | null;
  dob?: string;
  photoUrl?: string | null;
  courseName: string;
  courseCode?: string | null;
  duration: string;
  session?: string | null;
  studyCentre?: string | null;
  franchiseName?: string | null;
  subjects?: CertificateSubjectRow[];
  marksObtained?: number | null;
  totalMarks?: number | null;
  percentage?: number | null;
  grade: string;
  completionDate?: string | null;
  issueDate: string;
  status?: string;
}

export const HAIR_SKIN_DEFAULT_SUBJECTS: CertificateSubjectRow[] = [
  { subject: "Introduction to Hair Anatomy", maxMarks: 100, minMarks: 40, marksSecured: 75 },
  { subject: "Hair Types and Textures", maxMarks: 100, minMarks: 40, marksSecured: 78 },
  { subject: "Advanced Hair Styling Techniques", maxMarks: 100, minMarks: 40, marksSecured: 74 },
  { subject: "Skincare Fundamentals", maxMarks: 100, minMarks: 40, marksSecured: 76 },
  { subject: "Facials and Treatments", maxMarks: 100, minMarks: 40, marksSecured: 72 },
  { subject: "Salon Management and Ethics", maxMarks: 100, minMarks: 40, marksSecured: 75 },
  { subject: "Employability Skills", maxMarks: 100, minMarks: 40, marksSecured: 76 },
  { subject: "Practical Assessment", maxMarks: 200, minMarks: 120, marksSecured: 160 },
];

function formatDDMMYYYY(dateStr?: string | null): string {
  if (!dateStr) return "";
  const clean = dateStr.slice(0, 10);
  const parts = clean.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

function getSubjectsForCert(cert: CertificateData): CertificateSubjectRow[] {
  if (Array.isArray(cert.subjects) && cert.subjects.length > 0) {
    return cert.subjects;
  }
  const cLower = (cert.courseName || "").toLowerCase();
  if (cLower.includes("hair") && cLower.includes("skin")) {
    return HAIR_SKIN_DEFAULT_SUBJECTS;
  }
  const total = cert.totalMarks || 500;
  const obtained =
    cert.marksObtained ??
    Math.round(((cert.percentage ?? 80) / 100) * total);
  const tMax = Math.round(total * 0.6);
  const pMax = total - tMax;
  const tObt = Math.round(obtained * 0.6);
  const pObt = obtained - tObt;
  return [
    {
      subject: `${cert.courseName} — Theory Examination`,
      maxMarks: tMax,
      minMarks: Math.round(tMax * 0.4),
      marksSecured: tObt,
    },
    {
      subject: `${cert.courseName} — Practical Assessment`,
      maxMarks: pMax,
      minMarks: Math.round(pMax * 0.4),
      marksSecured: pObt,
    },
  ];
}

function OrnamentalSheetFrame({ children }: { children: React.ReactNode }) {
  // Subtle repeating EMPIRE micro-pattern background using inline SVG data URI
  const patternSvg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="84" height="22"><text x="4" y="15" font-family="Georgia, serif" font-size="11" font-weight="700" fill="#7A542E" fill-opacity="0.065">EMPIRE</text></svg>`
  );

  return (
    <div
      className="esi-official-a4-sheet relative mx-auto bg-white text-[#1A1A1A] shadow-xl select-none overflow-hidden"
      style={{
        width: "794px",
        minWidth: "794px",
        height: "1122px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* Ornamental Outer Border (Warm Vintage Brown matching official Empire Diploma & Marksheet) */}
      <div
        className="absolute inset-[18px] pointer-events-none"
        style={{
          border: "4px double #7B522D",
          boxShadow: "inset 0 0 0 2px #FFFDF8, inset 0 0 0 5px #9A6B3F",
        }}
      />
      {/* Decorative dotted inner frame */}
      <div
        className="absolute inset-[27px] pointer-events-none"
        style={{
          border: "1.5px dashed #8B5E34",
        }}
      />
      {/* Corner Ornate Medallions */}
      {[
        "top-[14px] left-[14px]",
        "top-[14px] right-[14px]",
        "bottom-[14px] left-[14px]",
        "bottom-[14px] right-[14px]",
      ].map((pos, idx) => (
        <div
          key={idx}
          className={`absolute ${pos} w-7 h-7 bg-[#7B522D] text-[#FFFDF8] flex items-center justify-center text-sm font-bold pointer-events-none z-20`}
          style={{ borderRadius: "2px", border: "1.5px solid #D9B382" }}
        >
          ✦
        </div>
      ))}

      {/* Inner Content Canvas with faint repeating EMPIRE pattern */}
      <div
        className="relative z-10 h-full flex flex-col justify-between px-[54px] py-[42px]"
        style={{
          backgroundImage: `url("data:image/svg+xml,${patternSvg}")`,
          backgroundRepeat: "repeat",
        }}
      >
        {/* Center Translucent Watermark */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center opacity-[0.075] z-0">
          <div
            className="text-[82px] font-black tracking-[0.16em] text-[#0B3D62] leading-none"
            style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
          >
            EMPIRE
          </div>
          <div className="text-[28px] font-bold tracking-[0.42em] text-[#0B3D62] mt-2">
            SKILLS INDIA
          </div>
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full">
          {children}
        </div>
      </div>
    </div>
  );
}

function OfficialHeaderBlock({
  certificateNumber,
  photoUrl,
  studentName,
}: {
  certificateNumber: string;
  photoUrl?: string | null;
  studentName: string;
}) {
  return (
    <div>
      {/* Top Right Sr. No. */}
      <div className="flex justify-end text-[11.5px] font-semibold text-[#222] mb-1">
        <span>क्रमांक संख्या / Sr. No. :&nbsp;</span>
        <span className="font-bold tracking-wide">{certificateNumber}</span>
      </div>

      {/* Main Bilingual Institute Heading */}
      <div className="text-center leading-tight">
        <div className="text-[25px] font-extrabold text-[#16365C] tracking-wide">
          एम्पायर कौशल प्रौद्योगिकी संस्थान
        </div>
        <div
          className="text-[27px] font-bold text-[#16365C] mt-0.5 tracking-wide"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Empire Institute of Skills Technology
        </div>
        <div className="text-[12.5px] font-semibold text-[#1E1E1E] mt-1">
          An Autonomous Institution, Recognised by Govt. of India
        </div>
        <div className="text-[11px] font-medium text-[#2A2A2A] mt-0.5">
          Registered with the Ministry of Corporate Affairs Government of India, CIN :
          U72900HP2022PTC009633
        </div>
        <div
          className="text-[16px] font-extrabold text-[#111] mt-1.5"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          An ISO 9001:2015 Certified Institute
        </div>
      </div>

      {/* Logo Centered + Student Photo Top-Right */}
      <div className="relative flex items-center justify-center mt-2.5 min-h-[82px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/empire-logo.png"
          alt="Empire Skills India"
          className="h-[64px] w-auto object-contain"
        />

        {/* Student Photo Box (Right) */}
        <div className="absolute right-0 top-0 w-[84px] h-[98px] border border-[#555] bg-white shadow-sm overflow-hidden flex items-center justify-center">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={studentName}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <User className="w-8 h-8 text-slate-300" />
          )}
        </div>
      </div>
    </div>
  );
}

function OfficialFooterBlock({
  issueDate,
  verifyUrl,
}: {
  issueDate: string;
  verifyUrl: string;
}) {
  return (
    <div className="space-y-2.5">
      {/* Date of Issue + Center QR Code */}
      <div className="relative flex items-end justify-between pt-1">
        <div className="text-[12.5px] font-semibold text-[#1E1E1E]">
          Date of Issue : <span className="font-bold">{formatDDMMYYYY(issueDate)}</span>
        </div>

        <div className="mx-auto p-1 bg-white border border-slate-300">
          <QRCodeSVG value={verifyUrl} size={74} level="M" />
        </div>

        <div className="w-[155px]" />
      </div>

      {/* Signatures */}
      <div className="flex items-end justify-between pt-4 px-2 text-[12.5px] font-semibold text-[#1E1E1E]">
        <div className="text-center">
          <div className="h-5" />
          <p>Controller of Examination</p>
        </div>
        <div className="text-center pr-6">
          <div className="h-5" />
          <p>Director</p>
        </div>
      </div>

      {/* Official Accreditation Logos Strip (MSME, Digital India, Skill India, IAF, EGAC) */}
      <div className="flex justify-center pt-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cert-accreditation-strip.png"
          alt="MSME, Digital India, Skill India, IAF, EGAC Accreditations"
          className="h-[62px] w-auto object-contain"
        />
      </div>

      {/* Corporate Office & Verification Notice */}
      <div className="pt-1 text-[11px] text-[#222] leading-snug">
        <p className="font-semibold">Corporate Office :</p>
        <p>#110/13, Near Police Station Paddal Mandi,</p>
        <p>District Mandi, Himachal Pradesh, India</p>
        <p className="text-[10.5px] font-semibold text-[#B91C1C] mt-1">
          *This Certificate can be verified by online visiting www.empireskillsindia.com
        </p>
      </div>
    </div>
  );
}

export function PrintableCertificate({
  certificate,
  showActions = true,
}: {
  certificate: CertificateData;
  showActions?: boolean;
}) {
  const [viewDoc, setViewDoc] = useState<"both" | "diploma" | "marksheet">("both");

  const siteBase =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "https://empireskillsindia.com";

  const verifyUrl = `${siteBase}/verify-certificate?cert=${encodeURIComponent(
    certificate.certificateNumber
  )}`;

  const subjects = getSubjectsForCert(certificate);
  const totalMax = subjects.reduce((s, r) => s + (Number(r.maxMarks) || 0), 0);
  const totalMin = subjects.reduce((s, r) => s + (Number(r.minMarks) || 0), 0);
  const totalSecured = subjects.reduce((s, r) => s + (Number(r.marksSecured) || 0), 0);
  const pct =
    certificate.percentage !== null && certificate.percentage !== undefined
      ? Number(certificate.percentage).toFixed(2)
      : totalMax > 0
      ? ((totalSecured / totalMax) * 100).toFixed(2)
      : "0.00";

  const studyCentre =
    certificate.studyCentre ||
    certificate.franchiseName ||
    "Empire Institute of Skills Technology, Mandi";

  const sessionLabel = certificate.session || "July, 2025 To June, 2026";
  const subjectsInline = subjects.map((s) => s.subject).join(", ");

  function handlePrint(mode: "both" | "diploma" | "marksheet") {
    setViewDoc(mode);
    let styleEl = document.getElementById("esi-portrait-cert-print-style");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "esi-portrait-cert-print-style";
      styleEl.innerHTML = `@media print { @page { size: A4 portrait; margin: 0; } }`;
      document.head.appendChild(styleEl);
    }
    setTimeout(() => {
      document.body.classList.add("print-certificate-mode");
      window.print();
      setTimeout(() => {
        document.body.classList.remove("print-certificate-mode");
      }, 500);
    }, 120);
  }

  return (
    <div className="space-y-4">
      {showActions && (
        <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div>
            <p className="text-xs font-extrabold text-[#0B3D62] uppercase tracking-wider">
              Official A4 Portrait Diploma &amp; Marksheet Ready
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Sr. No.:{" "}
              <strong className="font-mono text-[#D65B14]">
                {certificate.certificateNumber}
              </strong>{" "}
              • Enrollment:{" "}
              <strong className="font-mono text-[#0B3D62]">
                {certificate.enrollmentNumber}
              </strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewDoc("diploma")}
                className={`px-3 py-1.5 inline-flex items-center gap-1 ${
                  viewDoc === "diploma"
                    ? "bg-[#0B3D62] text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Award className="w-3.5 h-3.5" /> Diploma
              </button>
              <button
                type="button"
                onClick={() => setViewDoc("marksheet")}
                className={`px-3 py-1.5 inline-flex items-center gap-1 border-l border-slate-300 ${
                  viewDoc === "marksheet"
                    ? "bg-[#0B3D62] text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Marksheet
              </button>
              <button
                type="button"
                onClick={() => setViewDoc("both")}
                className={`px-3 py-1.5 inline-flex items-center gap-1 border-l border-slate-300 ${
                  viewDoc === "both"
                    ? "bg-[#0B3D62] text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Both
              </button>
            </div>

            <a
              href={`/verify-certificate?cert=${encodeURIComponent(
                certificate.certificateNumber
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Verify
            </a>
            <button
              type="button"
              onClick={() => handlePrint("diploma")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#8A5A2B] hover:bg-[#704720] text-white text-xs font-bold shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Diploma
            </button>
            <button
              type="button"
              onClick={() => handlePrint("marksheet")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0E7490] hover:bg-[#0B5E75] text-white text-xs font-bold shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Marksheet
            </button>
            <button
              type="button"
              onClick={() => handlePrint("both")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B3D62] hover:bg-[#135589] text-white text-xs font-bold shadow"
            >
              <Printer className="w-4 h-4" />
              Print Both (PDF)
            </button>
          </div>
        </div>
      )}

      {/* Printable Container (1 or 2 Exact A4 Portrait Sheets) */}
      <div className="overflow-x-auto pb-4">
        <div id="printable-certificate" className="space-y-8 print:space-y-0">
          {/* SHEET 1: OFFICIAL DIPLOMA CERTIFICATE */}
          {(viewDoc === "both" || viewDoc === "diploma") && (
            <OrnamentalSheetFrame>
              <OfficialHeaderBlock
                certificateNumber={certificate.certificateNumber}
                photoUrl={certificate.photoUrl}
                studentName={certificate.studentName}
              />

              {/* DIPLOMA Ribbon & Session */}
              <div className="text-center mt-2">
                <div className="inline-block px-9 py-1.5 bg-[#8E6230] text-white text-[19px] font-extrabold tracking-[0.14em] uppercase rounded-[2px] shadow-sm">
                  DIPLOMA
                </div>
                <p className="text-[13px] font-bold text-[#1E1E1E] mt-2">
                  Session : {sessionLabel}
                </p>
              </div>

              {/* Bilingual Student Details */}
              <div className="space-y-3.5 my-3 text-[13px] text-[#1A1A1A]">
                <div className="grid grid-cols-12 items-start">
                  <div className="col-span-6 leading-snug">
                    <p className="text-[11.5px] font-semibold">प्रमाणित किया जाता है कि</p>
                    <p className="font-bold tracking-wide">CERTIFIED THAT</p>
                  </div>
                  <div className="col-span-6 flex items-baseline gap-3 leading-snug">
                    <div>
                      <p className="text-[11.5px] font-semibold">पंजीकरण संख्या</p>
                      <p className="font-bold tracking-wide">ENROLLMENT NO.</p>
                    </div>
                    <div className="font-extrabold text-[14px] tracking-wide text-[#111]">
                      {certificate.enrollmentNumber}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-4 leading-snug">
                    <p className="text-[11.5px] font-semibold">श्री/सुश्री</p>
                    <p className="font-bold">MR. /MRS.</p>
                  </div>
                  <div className="col-span-8 text-[15px] font-extrabold text-[#111]">
                    {certificate.studentName}
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-4 leading-snug">
                    <p className="text-[11.5px] font-semibold">पिता का नाम</p>
                    <p className="font-bold">FATHER&apos;S NAME</p>
                  </div>
                  <div className="col-span-8 text-[14.5px] font-bold text-[#111]">
                    {certificate.fatherName}
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-4 leading-snug">
                    <p className="text-[11.5px] font-semibold">पूरा कर लिया है</p>
                    <p className="font-bold">HAVE COMPLETED</p>
                  </div>
                  <div className="col-span-8 text-[14.5px] font-extrabold text-[#111]">
                    {certificate.courseName}
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-4 leading-snug">
                    <p className="text-[11.5px] font-semibold">अध्ययन केन्द्र</p>
                    <p className="font-bold">AT STUDY CENTRE</p>
                  </div>
                  <div className="col-span-8 text-[14px] font-bold text-[#111]">
                    {studyCentre}
                  </div>
                </div>

                {/* Subjects List */}
                <div className="pt-1 leading-relaxed">
                  <p className="text-[11.5px] font-semibold">निम्न विषयों के साथ</p>
                  <p className="text-[12.5px]">
                    <span className="font-bold">WITH THE FOLLOWING SUBJECTS :</span>{" "}
                    <span className="font-medium text-[#111]">{subjectsInline}</span>
                  </p>
                </div>

                {/* Grade & Percentage */}
                <div className="grid grid-cols-12 items-start pt-2">
                  <div className="col-span-3 leading-snug">
                    <p className="text-[11.5px] font-semibold">ग्रेड</p>
                    <p className="text-[14px] font-extrabold">
                      Grade &nbsp;{certificate.grade}
                    </p>
                  </div>
                  <div className="col-span-9 leading-snug">
                    <p className="text-[11.5px] font-semibold">अंक हासिल किये है ।</p>
                    <p className="text-[14px] font-bold">
                      He/She has secured <span className="font-extrabold">{pct} %</span> Marks.
                    </p>
                  </div>
                </div>
              </div>

              <OfficialFooterBlock issueDate={certificate.issueDate} verifyUrl={verifyUrl} />
            </OrnamentalSheetFrame>
          )}

          {/* SHEET 2: OFFICIAL SUBJECT-WISE MARKSHEET */}
          {(viewDoc === "both" || viewDoc === "marksheet") && (
            <OrnamentalSheetFrame>
              <OfficialHeaderBlock
                certificateNumber={certificate.certificateNumber}
                photoUrl={certificate.photoUrl}
                studentName={certificate.studentName}
              />

              {/* MARKSHEET Heading & Session */}
              <div className="text-center mt-1">
                <div className="inline-block text-[18px] font-extrabold tracking-[0.12em] uppercase text-[#111] border-b-2 border-[#111] pb-0.5">
                  MARKSHEET
                </div>
                <p className="text-[12.5px] font-bold text-[#1E1E1E] mt-1">
                  Session : {sessionLabel}
                </p>
              </div>

              {/* Bilingual Student Details (Compact 2-Column) */}
              <div className="space-y-1.5 mt-2 text-[12px] text-[#1A1A1A]">
                <div className="grid grid-cols-12 items-start">
                  <div className="col-span-7 grid grid-cols-12 items-center">
                    <div className="col-span-6 leading-tight">
                      <p className="text-[10.5px] font-semibold">प्रमाणित किया जाता है कि श्री/सुश्री</p>
                      <p className="font-bold">CERTIFIED THAT SHRI/SUSHRI</p>
                    </div>
                    <div className="col-span-6 font-extrabold text-[13.5px] text-[#111]">
                      {certificate.studentName}
                    </div>
                  </div>
                  <div className="col-span-5 flex items-baseline justify-between leading-tight pl-2">
                    <div>
                      <p className="text-[10.5px] font-semibold">पंजीकरण संख्या</p>
                      <p className="font-bold">ENROLLMENT NO.</p>
                    </div>
                    <div className="font-extrabold text-[13px] text-[#111]">
                      {certificate.enrollmentNumber}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 items-start">
                  <div className="col-span-7 grid grid-cols-12 items-center">
                    <div className="col-span-6 leading-tight">
                      <p className="text-[10.5px] font-semibold">पिता का नाम</p>
                      <p className="font-bold">FATHER&apos;S NAME</p>
                    </div>
                    <div className="col-span-6 font-bold text-[13px] text-[#111]">
                      {certificate.fatherName}
                    </div>
                  </div>
                  <div className="col-span-5 flex items-baseline justify-between leading-tight pl-2">
                    <div>
                      <p className="text-[10.5px] font-semibold">प्राप्त किया</p>
                      <p className="font-bold">ACHIEVED</p>
                    </div>
                    <div className="font-extrabold text-[13px] text-[#111]">
                      Grade {certificate.grade}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-4 leading-tight">
                    <p className="text-[10.5px] font-semibold">पूरा कर लिया है</p>
                    <p className="font-bold">HAVE COMPLETED</p>
                  </div>
                  <div className="col-span-8 font-extrabold text-[13px] text-[#111]">
                    {certificate.courseName}
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-4 leading-tight">
                    <p className="text-[10.5px] font-semibold">अध्ययन केन्द्र</p>
                    <p className="font-bold">AT STUDY CENTRE</p>
                  </div>
                  <div className="col-span-8 font-bold text-[13px] text-[#111]">
                    {studyCentre}
                  </div>
                </div>
              </div>

              {/* Subject-wise Marks Table */}
              <div className="mt-2">
                <div className="text-[11px] leading-snug mb-1">
                  <p className="font-semibold">विषयवार प्राप्तांक निम्नानुसार अर्जित किए गए है :-</p>
                  <p className="font-bold uppercase">SUBJECT WISE MARKS OBTAINED ARE AS UNDER :-</p>
                </div>

                <table className="w-full border-collapse border border-[#333] text-[12px]">
                  <thead>
                    <tr className="bg-[#F8FAFC]/80">
                      <th className="border border-[#333] py-1.5 px-3 text-center font-extrabold">
                        विषय / SUBJECT
                      </th>
                      <th className="border border-[#333] py-1.5 px-2 text-center font-extrabold w-[92px]">
                        Max
                        <br />
                        Marks
                      </th>
                      <th className="border border-[#333] py-1.5 px-2 text-center font-extrabold w-[92px]">
                        Min
                        <br />
                        Marks
                      </th>
                      <th className="border border-[#333] py-1.5 px-2 text-center font-extrabold w-[104px]">
                        Marks
                        <br />
                        Secured
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((row, idx) => (
                      <tr key={idx}>
                        <td className="border-x border-[#333] py-1 px-3 font-medium text-[#111]">
                          {row.subject}
                        </td>
                        <td className="border-x border-[#333] py-1 px-2 text-center font-semibold">
                          {row.maxMarks}
                        </td>
                        <td className="border-x border-[#333] py-1 px-2 text-center font-semibold">
                          {row.minMarks}
                        </td>
                        <td className="border-x border-[#333] py-1 px-2 text-center font-bold text-[#111]">
                          {row.marksSecured}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-[#333] font-extrabold bg-[#F8FAFC]/70">
                      <td className="border border-[#333] py-1.5 px-3">योग / TOTAL</td>
                      <td className="border border-[#333] py-1.5 px-2 text-center">{totalMax}</td>
                      <td className="border border-[#333] py-1.5 px-2 text-center">{totalMin}</td>
                      <td className="border border-[#333] py-1.5 px-2 text-center">
                        {totalSecured}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Performance Grade Legend Table */}
                <table className="w-[82%] mx-auto border-collapse border border-[#333] text-[10.5px] mt-2.5 text-center">
                  <tbody>
                    <tr>
                      <td className="border border-[#333] px-2 py-1 text-left font-bold">
                        Performance
                        <br />
                        Mark Range
                        <br />
                        Grade
                      </td>
                      <td className="border border-[#333] px-2 py-1">
                        <div className="font-bold">Excellent</div>
                        <div>(85%-100%)</div>
                        <div className="font-extrabold">(A+)</div>
                      </td>
                      <td className="border border-[#333] px-2 py-1">
                        <div className="font-bold">Very Good</div>
                        <div>(75%-84%)</div>
                        <div className="font-extrabold">(A)</div>
                      </td>
                      <td className="border border-[#333] px-2 py-1">
                        <div className="font-bold">Good</div>
                        <div>(60%-74%)</div>
                        <div className="font-extrabold">(B)</div>
                      </td>
                      <td className="border border-[#333] px-2 py-1">
                        <div className="font-bold">Satisfactory</div>
                        <div>(40%-59%)</div>
                        <div className="font-extrabold">(C)</div>
                      </td>
                      <td className="border border-[#333] px-2 py-1">
                        <div className="font-bold">Failure</div>
                        <div>(below 40%)</div>
                        <div className="font-extrabold">(F)</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <OfficialFooterBlock issueDate={certificate.issueDate} verifyUrl={verifyUrl} />
            </OrnamentalSheetFrame>
          )}
        </div>
      </div>
    </div>
  );
}
