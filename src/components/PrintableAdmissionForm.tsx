"use client";

import React from "react";
import { Printer } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import {
  ENCLOSURE_DOCUMENTS,
  HEAR_ABOUT_OPTIONS,
  PDF_COURSE_CHECKBOXES,
  RELIGION_OPTIONS,
  type AdmissionExtraDetails,
  type QualificationItem,
} from "@/lib/constants";

export interface AdmissionFormRecord {
  applicationRef: string;
  enrollmentNumber?: string | null;
  courseName: string;
  courseCode?: string;
  session: string;
  studyMode?: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  category: string;
  aadharNumber: string;
  mobile: string;
  email: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  qualificationsJson?: string;
  extraDetailsJson?: string | null;
  photoUrl?: string | null;
  signatureUrl?: string | null;
  createdAt?: string;
}

function CharBoxes({ value, count }: { value: string; count: number }) {
  const chars = (value || "").toUpperCase().split("");
  return (
    <div className="inline-flex flex-nowrap">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="inline-flex items-center justify-center w-[19px] h-[20px] border border-slate-700 -ml-px text-[10.5px] font-bold font-mono text-slate-900 bg-white shrink-0"
        >
          {chars[i] || ""}
        </span>
      ))}
    </div>
  );
}

function TickBox({ checked }: { checked: boolean }) {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 border border-slate-800 text-[11px] font-extrabold text-[#0B3D62] bg-white align-middle">
      {checked ? "✓" : ""}
    </span>
  );
}

export function PrintableAdmissionForm({
  record,
  showPrintBar = true,
}: {
  record: AdmissionFormRecord;
  showPrintBar?: boolean;
}) {
  let qualifications: QualificationItem[] = [];
  if (record.qualificationsJson) {
    try {
      qualifications = JSON.parse(record.qualificationsJson) as QualificationItem[];
    } catch {
      qualifications = [];
    }
  }

  let extra: AdmissionExtraDetails = {};
  if (record.extraDetailsJson) {
    try {
      extra = JSON.parse(record.extraDetailsJson) as AdmissionExtraDetails;
    } catch {
      extra = {};
    }
  }

  const dobParts = (record.dob || "").split("-"); // YYYY-MM-DD
  const dobYear = dobParts[0] || "";
  const dobMonth = dobParts[1] || "";
  const dobDay = dobParts[2] || "";

  const permanentFull = [record.address, record.city, record.state, record.pincode]
    .filter(Boolean)
    .join(", ");
  const correspondenceFull = extra.correspondenceAddress || permanentFull;
  const regNo = record.enrollmentNumber || record.applicationRef;

  const createdDate = record.createdAt ? new Date(record.createdAt) : new Date();
  const formattedSlashDate = isNaN(createdDate.getTime())
    ? new Date().toLocaleDateString("en-GB")
    : createdDate.toLocaleDateString("en-GB");

  const courseLower = (record.courseName || "").toLowerCase();
  const isCourseTicked = (label: string) => {
    const l = label.toLowerCase();
    if (l === "tallyprime") return courseLower.includes("tally");
    if (l === "dca") return courseLower.includes("dca") && !courseLower.includes("adca");
    if (l === "cca") return courseLower.includes("cca");
    return courseLower.includes(l);
  };
  const anyPdfCourseMatched = PDF_COURSE_CHECKBOXES.some(isCourseTicked);

  const qualRows = ["X", "XII", "Graduation", "Post-Graduation", "Other"];
  const findQual = (key: string) => {
    const k = key.toLowerCase();
    return qualifications.find((q) => {
      const ql = (q.level || "").toLowerCase();
      if (k === "x") return ql.includes("10") || ql === "x";
      if (k === "xii") return ql.includes("12") || ql === "xii";
      if (k === "graduation") return ql.includes("grad") && !ql.includes("post");
      if (k === "post-graduation") return ql.includes("post");
      return ql.includes("other");
    });
  };

  function handlePrintForm() {
    let styleEl = document.getElementById("esi-portrait-a4-print-style");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "esi-portrait-a4-print-style";
      styleEl.innerHTML = `@media print { @page { size: A4 portrait; margin: 0; } }`;
      document.head.appendChild(styleEl);
    }
    const landscapeEl = document.getElementById("esi-landscape-print-style");
    if (landscapeEl) landscapeEl.remove();

    document.body.classList.add("print-admission-form-mode");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("print-admission-form-mode");
    }, 500);
  }

  return (
    <div className="space-y-4">
      {showPrintBar && (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div>
            <p className="text-sm font-bold text-[#0B3D62]">
              Official 3-Page Empire Admission Form Ready (Auto-Filled)
            </p>
            <p className="text-xs text-slate-500">
              Reg/Ref No:{" "}
              <strong className="font-mono text-[#D65B14]">{regNo}</strong> • Includes
              Admission Form, Document Checklist, Photo, Signature &amp; Undertaking
            </p>
          </div>
          <button
            type="button"
            onClick={handlePrintForm}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white text-xs font-bold shadow"
          >
            <Printer className="w-4 h-4" />
            Download PDF / Print 3-Page Admission Form
          </button>
        </div>
      )}

      <div id="printable-document" className="space-y-6">
        {/* ================= PAGE 1: ADMISSION FORM ================= */}
        <div
          className="admission-a4-page bg-white border border-slate-300 shadow-sm mx-auto p-6 text-slate-900 text-[11px]"
          style={{ width: "794px", maxWidth: "100%" }}
        >
          {/* Top Title */}
          <div className="text-center mb-3">
            <span className="inline-block bg-[#8B1E24] text-white font-bold tracking-[0.18em] px-4 py-1 text-sm uppercase">
              ADMISSION FORM
            </span>
          </div>

          {/* Header Row: Logo + Session/Reg/Aadhar + Photo */}
          <div className="grid grid-cols-12 gap-3 items-start mb-3">
            <div className="col-span-4 pt-1">
              <BrandLogo height={48} />
            </div>

            <div className="col-span-5 space-y-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Session:</span>
                <span className="flex-1 border-b border-slate-700 font-bold text-[#0B3D62] px-1 uppercase">
                  {record.session}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-24 shrink-0 font-semibold">Registration No.</span>
                <CharBoxes value={regNo.replace(/[^A-Z0-9]/gi, "")} count={12} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-24 shrink-0 font-semibold">Aadhar No.</span>
                <CharBoxes value={(record.aadharNumber || "").replace(/\D/g, "")} count={12} />
              </div>
            </div>

            <div className="col-span-3 flex justify-end">
              <div className="w-28 h-32 border-2 border-slate-700 bg-slate-100 flex items-center justify-center overflow-hidden text-[10px] text-slate-500 text-center">
                {record.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={record.photoUrl}
                    alt="Candidate Photograph"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>Space for Photograph</span>
                )}
              </div>
            </div>
          </div>

          {/* COURSE / PROGRAMME */}
          <div className="mb-3">
            <div className="inline-block bg-[#8B1E24] text-white font-bold text-[11px] uppercase px-2.5 py-0.5 tracking-wider mb-1.5">
              COURSE / PROGRAMME
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
              {PDF_COURSE_CHECKBOXES.map((cLabel) => (
                <span key={cLabel} className="inline-flex items-center gap-1.5">
                  <span>{cLabel}</span>
                  <TickBox checked={isCourseTicked(cLabel)} />
                </span>
              ))}
              {!anyPdfCourseMatched && record.courseName && (
                <span className="inline-flex items-center gap-1.5 font-bold text-[#0B3D62]">
                  <span>Other ({record.courseName})</span>
                  <TickBox checked={true} />
                </span>
              )}
            </div>
          </div>

          {/* PERSONAL DETAILS */}
          <div className="bg-[#8B1E24] text-white font-bold text-[11px] px-2.5 py-0.5 mb-2.5">
            PERSONAL DETAILS{" "}
            <span className="font-normal">
              (Please read carefully &amp; fill the application form in CAPITAL letters)
            </span>
          </div>

          <div className="space-y-2 text-[11px]">
            {/* Gender + DOB */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-semibold">Gender:</span>
                <span className="inline-flex items-center gap-1">
                  Male <TickBox checked={record.gender === "Male"} />
                </span>
                <span className="inline-flex items-center gap-1">
                  Female <TickBox checked={record.gender === "Female"} />
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold">Date of Birth:</span>
                <div className="inline-flex text-center text-[9px]">
                  <div>
                    <div className="border border-b-0 border-slate-700 px-1 font-semibold">
                      Day
                    </div>
                    <CharBoxes value={dobDay} count={2} />
                  </div>
                  <div>
                    <div className="border border-b-0 border-l-0 border-slate-700 px-1 font-semibold">
                      Month
                    </div>
                    <CharBoxes value={dobMonth} count={2} />
                  </div>
                  <div>
                    <div className="border border-b-0 border-l-0 border-slate-700 px-1 font-semibold">
                      Year
                    </div>
                    <CharBoxes value={dobYear} count={4} />
                  </div>
                </div>
              </div>
            </div>

            {/* Names */}
            <div className="flex items-center gap-2">
              <span className="w-32 shrink-0 font-semibold">Student&apos;s Name:</span>
              <CharBoxes value={record.fullName} count={26} />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-32 shrink-0 font-semibold">Father&apos;s Name:</span>
              <CharBoxes value={record.fatherName} count={26} />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-32 shrink-0 font-semibold">Mother&apos;s Name:</span>
              <CharBoxes value={record.motherName} count={26} />
            </div>

            {/* Addresses */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-32 shrink-0 font-semibold">Permanent Address:</span>
                <CharBoxes value={permanentFull.slice(0, 26)} count={26} />
              </div>
              {permanentFull.length > 26 && (
                <div className="pl-[136px]">
                  <CharBoxes value={permanentFull.slice(26, 52)} count={26} />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-32 shrink-0 font-semibold">
                  Correspondence Address:
                </span>
                <CharBoxes value={correspondenceFull.slice(0, 26)} count={26} />
              </div>
              {correspondenceFull.length > 26 && (
                <div className="pl-[136px]">
                  <CharBoxes value={correspondenceFull.slice(26, 52)} count={26} />
                </div>
              )}
            </div>

            {/* Mob, Tel, Nationality */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">Mob:</span>
                <CharBoxes value={(record.mobile || "").replace(/\D/g, "")} count={10} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">Tel:</span>
                <CharBoxes value={(extra.telephone || "").replace(/\D/g, "")} count={8} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">Nationality:</span>
                <CharBoxes value={extra.nationality || "INDIAN"} count={6} />
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-2">
              <span className="w-32 shrink-0 font-semibold">E-mail Address:</span>
              <CharBoxes value={record.email} count={26} />
            </div>

            {/* Category & Religion */}
            <div className="flex flex-wrap items-center gap-6 pt-1">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold">CATEGORY:</span>
                {["General", "OBC", "SC", "ST"].map((cat) => (
                  <span key={cat} className="inline-flex items-center gap-1">
                    <TickBox checked={record.category === cat} /> {cat}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2.5">
                <span className="font-semibold">Religion:</span>
                {RELIGION_OPTIONS.map((rel) => (
                  <span key={rel} className="inline-flex items-center gap-1">
                    <TickBox checked={(extra.religion || "Hindu") === rel} /> {rel}
                  </span>
                ))}
              </div>
            </div>

            {/* Identification Mark */}
            <div className="flex items-center gap-2">
              <span className="font-semibold shrink-0">Identification Mark:</span>
              <span className="flex-1 border-b border-slate-700 px-2 font-semibold uppercase">
                {extra.identificationMark || "NIL"}
              </span>
            </div>
          </div>

          {/* ACADEMIC QUALIFICATION */}
          <div className="mt-3">
            <div className="bg-[#8B1E24] text-white font-bold text-[11px] px-2.5 py-0.5 uppercase tracking-wider mb-1.5">
              ACADEMIC QUALIFICATION
            </div>
            <table className="w-full border-collapse border border-slate-800 text-[11px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-800 px-2 py-1 text-left w-28">
                    Qualification
                  </th>
                  <th className="border border-slate-800 px-2 py-1 text-left">Subject</th>
                  <th className="border border-slate-800 px-1 py-1 text-center w-14">
                    Year From
                  </th>
                  <th className="border border-slate-800 px-1 py-1 text-center w-14">
                    Year To
                  </th>
                  <th className="border border-slate-800 px-2 py-1 text-left">
                    University/Board/Institution
                  </th>
                  <th className="border border-slate-800 px-2 py-1 text-center w-24">
                    % of Marks
                  </th>
                </tr>
              </thead>
              <tbody>
                {qualRows.map((rk) => {
                  const q = findQual(rk);
                  return (
                    <tr key={rk}>
                      <td className="border border-slate-800 px-2 py-1 font-semibold">
                        {rk === "Other" ? "Other (Specify)" : rk}
                      </td>
                      <td className="border border-slate-800 px-2 py-1">
                        {q?.subject || ""}
                      </td>
                      <td className="border border-slate-800 px-1 py-1 text-center">
                        {q?.yearFrom || ""}
                      </td>
                      <td className="border border-slate-800 px-1 py-1 text-center">
                        {q?.yearTo || q?.passingYear || ""}
                      </td>
                      <td className="border border-slate-800 px-2 py-1">
                        {q?.board || ""}
                      </td>
                      <td className="border border-slate-800 px-2 py-1 text-center font-semibold">
                        {q?.percentage || ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* How did you hear */}
          <div className="mt-3 text-[11px] space-y-1.5">
            <p className="font-semibold">
              How did you hear about the Academic Programme (Please tick the relevant boxes)
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {HEAR_ABOUT_OPTIONS.map((opt) => (
                <span key={opt} className="inline-flex items-center gap-1">
                  <span>{opt === "Poster" ? "Advertisement: Poster" : opt}</span>
                  <TickBox checked={(extra.hearAbout || []).includes(opt)} />
                </span>
              ))}
              {extra.hearAboutOther && (
                <span className="border-b border-slate-700 px-2 font-semibold">
                  {extra.hearAboutOther}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ================= PAGE 2: ENCLOSURES, SIGNATURE & OFFICE SIGN ================= */}
        <div
          className="admission-a4-page bg-white border border-slate-300 shadow-sm mx-auto p-9 text-slate-900 text-[12px] flex flex-col justify-between"
          style={{ width: "794px", maxWidth: "100%", minHeight: "1060px" }}
        >
          <div className="space-y-8">
            <div>
              <p className="font-bold text-sm mb-3">
                Following 3 sets of attested copies should be enclosed with the Application
                Form: (Tick Appropriate One&apos;s)
              </p>
              <ol className="space-y-2 text-xs pl-2">
                {ENCLOSURE_DOCUMENTS.map((doc, idx) => (
                  <li key={doc} className="flex items-start gap-2.5">
                    <TickBox checked={(extra.enclosedDocs || []).includes(doc)} />
                    <span>
                      {idx + 1}. {doc}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Left Thumb Impression & Uploaded Candidate Signature */}
            <div className="grid grid-cols-2 gap-10 pt-8">
              <div className="border border-slate-800 h-32 p-2.5 flex flex-col justify-between">
                <span className="text-xs font-semibold">Left Thumb Impression</span>
              </div>
              <div className="border border-slate-800 h-32 p-2.5 flex flex-col justify-between">
                <span className="text-xs font-semibold">Signature</span>
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                  {record.signatureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={record.signatureUrl}
                      alt="Candidate Signature"
                      className="max-h-20 object-contain"
                    />
                  ) : null}
                </div>
              </div>
            </div>

            {/* Declaration */}
            <div className="space-y-2 pt-4 text-xs">
              <p>
                I have read &ldquo;Training Programme&rdquo; Brochure and I undertake to abide
                by the rules laid down in it.
              </p>
              <p>
                <strong>Declaration:</strong> I solemnly declare that the information provided
                above is true to the best of my knowledge.
              </p>
            </div>
          </div>

          {/* Signatures Footer */}
          <div className="space-y-12 pt-10 text-xs">
            <div className="flex justify-end">
              <div className="text-center w-64">
                {record.signatureUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={record.signatureUrl}
                    alt="Candidate Signature"
                    className="h-10 mx-auto object-contain mb-1"
                  />
                )}
                <div className="border-t border-dotted border-slate-800 pt-1 font-semibold">
                  Student&apos;s/Guardian&apos;s Signature
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-8">
              <div className="w-56">
                <span className="font-semibold">Date: </span>
                <span className="inline-block border-b border-slate-800 w-40 px-2 font-bold">
                  {formattedSlashDate}
                </span>
              </div>
              <div className="w-64 text-right">
                <span className="font-semibold">Front Officer Councilor: </span>
                <span className="inline-block border-b border-slate-800 w-32" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-8 pt-6">
              <div className="w-60">
                <span className="font-semibold">Centre Seal: </span>
                <span className="inline-block border-b border-slate-800 w-36" />
              </div>
              <div className="w-72 text-right">
                <span className="font-semibold">Centre Head/Managing Director: </span>
                <span className="inline-block border-b border-slate-800 w-28" />
              </div>
            </div>
          </div>
        </div>

        {/* ================= PAGE 3: UNDERTAKING & DECLARATION ================= */}
        <div
          className="admission-a4-page bg-white border border-slate-300 shadow-sm mx-auto p-8 text-slate-900 text-[11.5px]"
          style={{ width: "794px", maxWidth: "100%", minHeight: "1060px" }}
        >
          <div className="flex items-center justify-between mb-4">
            <BrandLogo height={44} />
            <div className="text-xs font-mono font-bold text-[#0B3D62]">
              Ref: {regNo}
            </div>
          </div>

          <div className="text-center mb-5">
            <span className="inline-block bg-[#8B1E24] text-white font-bold tracking-[0.18em] px-4 py-1 text-sm uppercase">
              UNDERTAKING
            </span>
          </div>

          <ol className="list-decimal pl-5 space-y-2.5 text-[11.5px] leading-relaxed text-justify">
            <li>
              I{" "}
              <span className="inline-block border-b border-slate-800 px-3 font-bold uppercase text-[#0B3D62] min-w-[210px]">
                {record.fullName}
              </span>{" "}
              S/o, D/o{" "}
              <span className="inline-block border-b border-slate-800 px-3 font-bold uppercase text-[#0B3D62] min-w-[200px]">
                {record.fatherName}
              </span>{" "}
              Do hereby undertake that the particulars submitted to the Institute are true and
              correct. I agree that the admission is granted to me as per the terms, conditions
              and rules of the institution. I also understand that the admission will be
              cancelled and fee paid by me will be forfeited if any of the particulars given by
              me at the time of admission or later on are found to be incorrect or false.
            </li>
            <li>
              I agree that The Director/ Management&apos;s decision in all matters concerning
              admission, studies, discipline, training and conduct will be final and binding on
              me.
            </li>
            <li>
              I understand that the consumption of alcohol, drugs or any other intoxicant and
              smoking within the Institute premises is forbidden.
            </li>
            <li>
              I am aware that as per The Hon&apos;ble Supreme Court orders&apos;, ragging in any
              form is totally banned. This is a criminal act for which FIR will be lodged and if
              found involved suspension and rustication from the Institute is must and I will
              not be able to take admission in any institution anywhere in India.
            </li>
            <li>
              I also know that in case of discontinuation of my studies or leaving the institute
              in between the duration of the course I shall have to pay the fee for the
              remaining duration of the course. Failing to do so the institute can take any
              legal action against me.
            </li>
            <li>
              I am aware that my name will be struck off from the rolls of the institute if I
              fail to pay fee on time, remain absent continuously for a period of 10 days
              without any information or behave in a manner subversive to the discipline or
              commit grave misconduct such as ragging or indulge in any activity which may bring
              disrepute to the institute.
            </li>
            <li>
              I am aware that the use of mobile phones in the institute premises is banned. In
              case I violate this, strict action will be taken against me as per the
              disciplinary rules of the institute and University as mentioned in the prospectus.
            </li>
            <li>
              I am aware that if I withdraw my admission from the institute after the cut-off
              date for admissions, the fee paid is not refundable under any circumstances.
            </li>
            <li>
              I understand that in event of breach of any of the above mentioned conditions of
              the undertaking, my admission will stand cancelled without any obligation on the
              part of the institute to issue show cause notice. The fee paid shall be forfeited.
            </li>
            <li>
              I will pay damage charges for furniture and equipment&apos;s of the institute in
              case I am found guilty during my stay in the Institute.
            </li>
            <li>
              All legal disputes, if any, shall come under the jurisdiction of Court in Mandi
              (HP) only.
            </li>
          </ol>

          <div className="flex justify-end mt-6">
            <div className="text-center w-52">
              {record.signatureUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={record.signatureUrl}
                  alt="Candidate Signature"
                  className="h-9 mx-auto object-contain mb-1"
                />
              )}
              <div className="border-t border-slate-700 pt-1 text-[11px] font-semibold">
                Signature of the Candidate
              </div>
            </div>
          </div>

          <div className="text-center my-5">
            <span className="inline-block bg-[#8B1E24] text-white font-bold tracking-[0.18em] px-4 py-1 text-sm uppercase">
              DECLARATION
            </span>
          </div>

          <p className="text-[11.5px] leading-relaxed text-justify">
            I hereby solemnly affirm &amp; declare that I have read the contents of Institute
            Prospectus clearly and have understood the points mentioned in the undertaking. I
            shall abide by the rules and regulations of the Institute as mentioned in the
            prospectus and also the changes which may be notified from time to time. I further
            confirm that the information given in the application form is correct and true to
            the best of my knowledge &amp; belief.
          </p>

          <div className="flex items-center justify-between mt-6 text-xs">
            <div>
              <span className="font-semibold">Dated: </span>
              <span className="inline-block border-b border-slate-800 px-3 font-bold">
                {formattedSlashDate}
              </span>
            </div>
            <div className="text-right font-semibold">
              Signature of the parent/Guardian
            </div>
          </div>

          <div className="mt-5 text-[10.5px] italic text-slate-700 space-y-1 border-t border-slate-200 pt-3">
            <p>
              <strong>Note: (i)</strong> Incomplete Application form shall not be accepted.
            </p>
            <p>
              <strong>(ii)</strong> It must be understood that the submission of the Application
              form in no way confirms admission to the institute. After the completion of
              admission process by the competent authority, the admissions for lapse seats shall
              be made at the sole discretion of the governing body of the institute in
              accordance with the relevant rules and regulations of the competent authority.
            </p>
            <p>
              <strong>(iii)</strong> It&apos;s your responsibility to ensure that the
              application with necessary certificates/testimonials is received by Empire
              Education before the closing date.
            </p>
          </div>

          <div className="flex items-end justify-between mt-10 text-xs font-semibold">
            <div>Signature of the parent/Guardian</div>
            <div className="text-center">
              {record.signatureUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={record.signatureUrl}
                  alt="Candidate Signature"
                  className="h-9 mx-auto object-contain mb-1"
                />
              )}
              <div>Signature of the Candidate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
