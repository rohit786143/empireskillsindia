"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, ExternalLink, User } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { InstituteEmblem } from "./InstituteEmblem";
import { INSTITUTE_INFO } from "@/lib/constants";
import { formatDisplayDate } from "@/lib/generators";

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
  marksObtained?: number | null;
  totalMarks?: number | null;
  percentage?: number | null;
  grade: string;
  completionDate?: string | null;
  issueDate: string;
  status?: string;
}

export function PrintableCertificate({
  certificate,
  showActions = true,
}: {
  certificate: CertificateData;
  showActions?: boolean;
}) {
  const siteBase =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "https://empireskillsindia.com";

  const verifyUrl = `${siteBase}/verify-certificate?cert=${encodeURIComponent(
    certificate.certificateNumber
  )}`;

  function handlePrintCertificate() {
    // Inject @page landscape rule dynamically so portrait pages stay portrait
    let styleEl = document.getElementById("esi-landscape-print-style");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "esi-landscape-print-style";
      styleEl.innerHTML = `@media print { @page { size: A4 landscape; margin: 0; } }`;
      document.head.appendChild(styleEl);
    }

    document.body.classList.add("print-certificate-mode");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("print-certificate-mode");
    }, 500);
  }

  return (
    <div className="space-y-4">
      {showActions && (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div>
            <p className="text-xs font-bold text-[#0B3D62] uppercase tracking-wider">
              A4 Landscape Certificate Ready
            </p>
            <p className="text-xs text-slate-500">
              Certificate No:{" "}
              <strong className="font-mono text-[#D65B14]">
                {certificate.certificateNumber}
              </strong>{" "}
              • Live &amp; verifiable on public portal
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/verify-certificate?cert=${encodeURIComponent(
                certificate.certificateNumber
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Test Public Verification
            </a>
            <button
              type="button"
              onClick={handlePrintCertificate}
              className="inline-flex items-center gap-2 px-5 py-2 rounded bg-[#0B3D62] hover:bg-[#135589] text-white text-xs font-bold shadow"
            >
              <Printer className="w-4 h-4" />
              Download PDF / Print Certificate
            </button>
          </div>
        </div>
      )}

      {/* Scroll wrapper for small screens while preserving A4 Landscape proportions */}
      <div className="overflow-x-auto pb-2">
        <div
          id="printable-certificate"
          className="relative mx-auto bg-[#FFFDF7] text-[#0B3D62] shadow-xl select-none"
          style={{
            width: "1050px",
            height: "742px",
            minWidth: "1050px",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          {/* Outer Navy Border */}
          <div className="absolute inset-3 border-[8px] border-[#0B3D62]" />
          {/* Inner Gold Ornate Border */}
          <div className="absolute inset-6 border-[3px] border-[#D65B14]" />
          <div className="absolute inset-8 border border-[#F07228]/70" />

          {/* Corner Decorative Accents */}
          <div className="absolute top-5 left-5 w-8 h-8 border-t-4 border-l-4 border-[#F07228]" />
          <div className="absolute top-5 right-5 w-8 h-8 border-t-4 border-r-4 border-[#F07228]" />
          <div className="absolute bottom-5 left-5 w-8 h-8 border-b-4 border-l-4 border-[#F07228]" />
          <div className="absolute bottom-5 right-5 w-8 h-8 border-b-4 border-r-4 border-[#F07228]" />

          {/* Watermark Background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.045]">
            <div className="text-center -rotate-12">
              <InstituteEmblem size={340} />
            </div>
          </div>

          {/* Certificate Content */}
          <div className="relative z-10 h-full flex flex-col justify-between px-14 py-12">
            {/* Top Serial & Enrollment Bar */}
            <div
              className="flex items-center justify-between text-xs font-sans font-bold tracking-wide text-slate-700 border-b border-amber-700/30 pb-2"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <div>
                CERTIFICATE NO.:{" "}
                <span className="font-mono text-[#0B3D62]">
                  {certificate.certificateNumber}
                </span>
              </div>
              <div className="text-[11px] text-[#D65B14] uppercase">
                {INSTITUTE_INFO.regNumber}
              </div>
              <div>
                ENROLLMENT NO.:{" "}
                <span className="font-mono text-[#0B3D62]">
                  {certificate.enrollmentNumber}
                </span>
              </div>
            </div>

            {/* Institutional Header */}
            <div className="flex items-center justify-between gap-4 mt-2">
              <div className="w-28 flex justify-start">
                <InstituteEmblem size={76} />
              </div>

              <div className="text-center flex-1 flex flex-col items-center">
                <BrandLogo height={52} />
                <p
                  className="text-xs font-semibold text-[#D65B14] tracking-wider uppercase mt-1.5"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {INSTITUTE_INFO.tagline}
                </p>
                <p
                  className="text-[11px] text-slate-600 mt-0.5"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {INSTITUTE_INFO.registrationLine}
                </p>

                <div className="mt-2.5 inline-block px-8 py-1.5 bg-[#0B3D62] text-[#FFB380] text-lg font-bold tracking-[0.2em] uppercase border-2 border-[#F07228]">
                  Certificate of Completion
                </div>
              </div>

              {/* Student Photo Frame */}
              <div className="w-28 flex flex-col items-end">
                <div className="w-24 h-28 border-2 border-[#0B3D62] bg-white shadow-sm overflow-hidden flex items-center justify-center">
                  {certificate.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={certificate.photoUrl}
                      alt={certificate.studentName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-slate-300" />
                  )}
                </div>
              </div>
            </div>

            {/* Main Citation Text */}
            <div className="text-center max-w-4xl mx-auto space-y-3 my-2">
              <p className="text-base italic text-slate-700">
                This is to formally certify that
              </p>

              <div className="text-3xl font-bold tracking-wide text-[#0B3D62] uppercase border-b-2 border-[#F07228]/60 inline-block px-8 pb-1">
                {certificate.studentName}
              </div>

              <p className="text-[15px] text-slate-800 leading-relaxed px-4">
                Son / Daughter of{" "}
                <strong className="text-[#0B3D62] uppercase">
                  {certificate.fatherName}
                </strong>
                , bearing Enrollment Number{" "}
                <strong className="font-mono text-[#0B3D62]">
                  {certificate.enrollmentNumber}
                </strong>
                , has successfully completed the prescribed academic &amp; practical
                programme in
              </p>

              <div className="py-1.5">
                <span className="text-2xl font-bold text-[#D65B14] tracking-wide">
                  {certificate.courseName}
                </span>
                {certificate.courseCode && (
                  <span
                    className="ml-2 text-xs font-sans font-bold text-slate-600 align-middle"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    ({certificate.courseCode})
                  </span>
                )}
              </div>

              <p className="text-[15px] text-slate-800 leading-relaxed">
                of duration <strong>{certificate.duration}</strong>
                {certificate.session ? (
                  <>
                    {" "}
                    during Academic Session <strong>{certificate.session}</strong>
                  </>
                ) : null}
                , and has passed the prescribed examination securing{" "}
                <strong className="text-[#0B3D62]">
                  Grade &ldquo;{certificate.grade}&rdquo;
                </strong>
                {certificate.percentage !== null &&
                certificate.percentage !== undefined ? (
                  <>
                    {" "}
                    with{" "}
                    <strong className="text-[#0B3D62]">
                      {certificate.percentage}% Marks
                    </strong>
                  </>
                ) : null}
                .
              </p>
            </div>

            {/* Bottom Verification QR, Seal & Signature Blocks */}
            <div
              className="grid grid-cols-12 items-end pt-3 border-t border-amber-700/30"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {/* Left: QR Code + Issue Date */}
              <div className="col-span-4 flex items-center gap-3">
                <div className="p-1.5 bg-white border-2 border-[#0B3D62] rounded">
                  <QRCodeSVG value={verifyUrl} size={76} level="M" />
                </div>
                <div className="text-[10px] text-slate-700 space-y-1">
                  <p className="font-bold text-[#0B3D62] uppercase tracking-wider">
                    Scan to Verify Online
                  </p>
                  <p>
                    Date of Issue:{" "}
                    <strong className="text-[#0B3D62]">
                      {formatDisplayDate(certificate.issueDate)}
                    </strong>
                  </p>
                  {certificate.completionDate && (
                    <p>
                      Completed:{" "}
                      <strong>{formatDisplayDate(certificate.completionDate)}</strong>
                    </p>
                  )}
                  <p className="text-[9px] text-slate-500">
                    {INSTITUTE_INFO.website}/verify-certificate
                  </p>
                </div>
              </div>

              {/* Center: Official Gold Seal */}
              <div className="col-span-4 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-double border-[#D65B14] bg-amber-50 flex flex-col items-center justify-center text-center shadow-inner">
                  <span className="text-[8px] font-extrabold text-[#D65B14] tracking-widest uppercase">
                    OFFICIAL
                  </span>
                  <span className="text-[11px] font-extrabold text-[#0B3D62] leading-tight">
                    VERIFIED
                  </span>
                  <span className="text-[8px] font-bold text-[#D65B14] uppercase">
                    SEAL
                  </span>
                </div>
              </div>

              {/* Right: Signatures */}
              <div className="col-span-4 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div
                    className="text-sm italic text-[#0B3D62] mb-1"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    R. K. Mishra
                  </div>
                  <div className="border-t border-[#0B3D62] pt-1">
                    <p className="text-[10px] font-bold text-[#0B3D62] uppercase">
                      Controller of Examinations
                    </p>
                    <p className="text-[9px] text-slate-500">Empire Skills India</p>
                  </div>
                </div>
                <div>
                  <div
                    className="text-sm italic text-[#0B3D62] mb-1"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    Dr. S. P. Verma
                  </div>
                  <div className="border-t border-[#0B3D62] pt-1">
                    <p className="text-[10px] font-bold text-[#0B3D62] uppercase">
                      Director / Registrar
                    </p>
                    <p className="text-[9px] text-slate-500">Empire Skills India</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
