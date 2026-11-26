"use client";

import React, { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  GraduationCap,
  Search,
  Printer,
  CreditCard,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  User,
  FileText,
} from "lucide-react";
import { InstituteEmblem } from "@/components/InstituteEmblem";
import { PrintableAdmissionForm } from "@/components/PrintableAdmissionForm";
import { INSTITUTE_INFO, type SubjectResultItem } from "@/lib/constants";
import { formatDisplayDate } from "@/lib/generators";
import { apiFetch } from "@/lib/api";

interface StudentRecord {
  id: string;
  applicationRef: string;
  enrollmentNumber: string;
  courseName: string;
  courseCode: string;
  session: string;
  studyMode: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  category?: string;
  aadharNumber?: string;
  qualificationsJson?: string;
  extraDetailsJson?: string | null;
  photoUrl: string | null;
  signatureUrl?: string | null;
  createdAt?: string;
  isCompleted: boolean;
  marksObtained: number | null;
  totalMarks: number | null;
  percentage: number | null;
  grade: string | null;
  resultJson: string | null;
  completionDate: string | null;
  course?: { duration: string } | null;
  certificates?: { certificateNumber: string; issueDate: string }[];
}

export default function StudentZonePage() {
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"result" | "idcard" | "form">("result");

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStudent(null);
    try {
      const qs = new URLSearchParams({
        enrollmentNumber: enrollmentNumber.trim(),
        dob: dob.trim(),
      });
      const res = await apiFetch(`/student-zone.php?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Student record not found.");
      } else {
        setStudent(data.student);
      }
    } catch {
      setError("Network error while fetching student record.");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    document.body.classList.add("print-document-mode");
    window.print();
    setTimeout(() => document.body.classList.remove("print-document-mode"), 400);
  }

  let subjects: SubjectResultItem[] = [];
  if (student?.resultJson) {
    try {
      subjects = JSON.parse(student.resultJson) as SubjectResultItem[];
    } catch {
      subjects = [];
    }
  }

  return (
    <div className="pb-14">
      <section className="no-print bg-[#0B3D62] text-white border-b-4 border-[#F07228] py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#FF9B5E]">
            Enrolled Student Self-Service Portal
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-1">
            Student Zone — Results &amp; Digital ID Card
          </h1>
          <p className="text-slate-200 text-sm sm:text-base mt-2 max-w-2xl">
            Approved students can check their Term-End / Final Examination Marksheet and
            download their official printable Empire Skills India Student ID Card.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Login / Lookup Card */}
        <div className="no-print bg-white border border-slate-200 border-t-4 border-t-[#0B3D62] rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <GraduationCap className="w-5 h-5 text-[#0B3D62]" />
            <h2 className="text-base font-bold text-[#0B3D62]">
              Access Your Student Profile
            </h2>
          </div>

          <form
            onSubmit={handleLookup}
            className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
          >
            <div className="md:col-span-5">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enrollment Number *
              </label>
              <input
                type="text"
                required
                value={enrollmentNumber}
                onChange={(e) => setEnrollmentNumber(e.target.value)}
                placeholder="e.g., ESI2026001"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#135589]"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
              />
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-[#0B3D62] hover:bg-[#135589] text-white font-bold text-sm disabled:opacity-60"
              >
                <Search className="w-4 h-4" />
                {loading ? "Searching..." : "Fetch Record"}
              </button>
            </div>
          </form>

          <p className="text-[11px] text-slate-500 mt-3">
            Sample approved student:{" "}
            <button
              type="button"
              onClick={() => {
                setEnrollmentNumber("ESI2026001");
                setDob("2002-05-14");
              }}
              className="font-mono font-bold text-[#135589] hover:underline"
            >
              ESI2026001
            </button>{" "}
            (DOB: 2002-05-14) or{" "}
            <button
              type="button"
              onClick={() => {
                setEnrollmentNumber("ESI2026002");
                setDob("2001-11-22");
              }}
              className="font-mono font-bold text-[#135589] hover:underline"
            >
              ESI2026002
            </button>{" "}
            (DOB: 2001-11-22)
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {student && (
          <div className="space-y-6">
            {/* Switch Tabs */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("result")}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded text-sm font-bold border transition-colors ${
                    activeTab === "result"
                      ? "bg-[#0B3D62] text-white border-[#0B3D62]"
                      : "bg-white text-slate-700 border-slate-300 hover:border-[#0B3D62]"
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Examination Result / Marksheet
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("idcard")}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded text-sm font-bold border transition-colors ${
                    activeTab === "idcard"
                      ? "bg-[#0B3D62] text-white border-[#0B3D62]"
                      : "bg-white text-slate-700 border-slate-300 hover:border-[#0B3D62]"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Download Student ID Card
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("form")}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded text-sm font-bold border transition-colors ${
                    activeTab === "form"
                      ? "bg-[#0B3D62] text-white border-[#0B3D62]"
                      : "bg-white text-slate-700 border-slate-300 hover:border-[#0B3D62]"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Download Admission Form
                </button>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[#F07228] hover:bg-[#F07228] text-white text-sm font-bold shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print {activeTab === "result" ? "Marksheet" : "ID Card"}
              </button>
            </div>

            {/* TAB 1: RESULT MARKSHEET */}
            {activeTab === "result" && (
              <div
                id="printable-document"
                className="bg-white border-2 border-[#0B3D62] rounded-lg p-6 sm:p-8 shadow-sm"
              >
                <div className="flex items-center justify-between border-b-2 border-[#0B3D62] pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <InstituteEmblem size={54} />
                    <div>
                      <h3 className="text-xl font-extrabold text-[#0B3D62]">
                        {INSTITUTE_INFO.name}
                      </h3>
                      <p className="text-xs font-semibold text-[#D65B14]">
                        STATEMENT OF MARKS / PROVISIONAL RESULT
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {INSTITUTE_INFO.regNumber}
                      </p>
                    </div>
                  </div>
                  {student.certificates && student.certificates[0] && (
                    <Link
                      href={`/verify-certificate?cert=${student.certificates[0].certificateNumber}`}
                      className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Verify Issued Certificate
                    </Link>
                  )}
                </div>

                {/* Student Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-6 bg-slate-50 p-4 rounded border border-slate-200">
                  <div>
                    <span className="text-slate-500">Enrollment No.: </span>
                    <strong className="font-mono text-[#0B3D62]">
                      {student.enrollmentNumber}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Session: </span>
                    <strong>{student.session}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Student Name: </span>
                    <strong className="uppercase">{student.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Father&apos;s Name: </span>
                    <strong>{student.fatherName}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">Programme: </span>
                    <strong className="text-[#0B3D62]">
                      {student.courseName} ({student.courseCode})
                    </strong>
                  </div>
                </div>

                {!student.isCompleted ? (
                  <div className="p-8 text-center bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                    <p className="text-base font-bold text-amber-900">
                      Result Not Declared Yet — Programme In Progress
                    </p>
                    <p className="text-xs text-amber-800 max-w-lg mx-auto">
                      Your enrollment ({student.enrollmentNumber}) is currently active for the{" "}
                      {student.session} session. Once your final examination is evaluated by
                      the Controller of Examinations, your marksheet will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <table className="w-full text-sm border border-slate-300">
                      <thead className="bg-[#0B3D62] text-white text-xs uppercase">
                        <tr>
                          <th className="py-2.5 px-3 text-left">S.No</th>
                          <th className="py-2.5 px-3 text-left">Subject / Module</th>
                          <th className="py-2.5 px-3 text-center">Max Marks</th>
                          <th className="py-2.5 px-3 text-center">Marks Obtained</th>
                          <th className="py-2.5 px-3 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {subjects.map((sub, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 font-semibold text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">
                              {sub.subject}
                            </td>
                            <td className="py-2.5 px-3 text-center">{sub.maxMarks}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-[#0B3D62]">
                              {sub.obtainedMarks}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                              {sub.grade}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 font-bold text-[#0B3D62]">
                        <tr>
                          <td colSpan={2} className="py-3 px-3 text-right uppercase text-xs">
                            Grand Total &amp; Final Standing
                          </td>
                          <td className="py-3 px-3 text-center">
                            {student.totalMarks ?? "—"}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {student.marksObtained ?? "—"}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {student.grade} ({student.percentage}%)
                          </td>
                        </tr>
                      </tfoot>
                    </table>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-500">Result Status: </span>
                        <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">
                          PASSED &amp; CERTIFIED
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#0B3D62]">
                          Controller of Examinations
                        </p>
                        <p className="text-slate-500">Empire Skills India</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PRINTABLE STUDENT ID CARD */}
            {activeTab === "idcard" && (
              <div id="printable-document" className="flex justify-center py-4">
                <div className="w-full max-w-md bg-white border-2 border-[#0B3D62] rounded-xl shadow-lg overflow-hidden">
                  {/* ID Card Header */}
                  <div className="bg-[#0B3D62] text-white px-5 py-3.5 border-b-4 border-[#F07228] flex items-center gap-3">
                    <InstituteEmblem size={44} className="shrink-0" />
                    <div>
                      <h3 className="text-base font-extrabold tracking-wide leading-tight">
                        {INSTITUTE_INFO.name}
                      </h3>
                      <p className="text-[10px] text-[#FFB380] font-semibold">
                        ISO 9001:2015 Certified Institution
                      </p>
                      <p className="text-[9px] text-slate-300 uppercase tracking-wider mt-0.5">
                        OFFICIAL STUDENT IDENTITY CARD
                      </p>
                    </div>
                  </div>

                  {/* ID Card Body */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-28 rounded border-2 border-[#0B3D62] bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
                        {student.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={student.photoUrl}
                            alt={student.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-slate-300" />
                        )}
                      </div>
                      <div className="space-y-1 text-xs flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#D65B14]">
                          Enrollment No.
                        </p>
                        <p className="text-sm font-mono font-extrabold text-[#0B3D62]">
                          {student.enrollmentNumber}
                        </p>
                        <p className="text-base font-extrabold text-slate-900 uppercase pt-1">
                          {student.fullName}
                        </p>
                        <p className="text-slate-600">
                          S/o / D/o: <strong className="text-slate-800">{student.fatherName}</strong>
                        </p>
                        <p className="text-slate-600">
                          DOB: <strong className="text-slate-800">{formatDisplayDate(student.dob)}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1.5">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Course:</span>
                        <strong className="text-[#0B3D62] text-right">
                          {student.courseName}
                        </strong>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Course Code / Session:</span>
                        <strong>
                          {student.courseCode} | {student.session}
                        </strong>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Contact:</span>
                        <strong>{student.mobile}</strong>
                      </div>
                    </div>

                    <div className="flex items-end justify-between pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-white border border-slate-200 rounded">
                          <QRCodeSVG
                            value={`${INSTITUTE_INFO.website}/verify-certificate?cert=${student.enrollmentNumber}`}
                            size={54}
                          />
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight">
                          <p className="font-bold text-[#0B3D62]">Scan to Verify</p>
                          <p>Authorized Student</p>
                          <p>Valid: {student.session}</p>
                        </div>
                      </div>
                      <div className="text-right text-[10px]">
                        <div className="w-24 border-b border-slate-400 mb-1 ml-auto" />
                        <p className="font-bold text-[#0B3D62]">Registrar Signature</p>
                        <p className="text-slate-500">Empire Skills India</p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Navy Bar */}
                  <div className="bg-[#0B3D62] text-slate-200 px-4 py-2 text-[10px] text-center">
                    {INSTITUTE_INFO.address} • Helpline: {INSTITUTE_INFO.helpline}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DOWNLOAD 3-PAGE OFFICIAL ADMISSION FORM */}
            {activeTab === "form" && (
              <PrintableAdmissionForm
                showPrintBar={false}
                record={{
                  applicationRef: student.applicationRef,
                  enrollmentNumber: student.enrollmentNumber,
                  courseName: student.courseName,
                  courseCode: student.courseCode,
                  session: student.session,
                  studyMode: student.studyMode,
                  fullName: student.fullName,
                  fatherName: student.fatherName,
                  motherName: student.motherName,
                  dob: student.dob,
                  gender: student.gender,
                  category: student.category || "General",
                  aadharNumber: student.aadharNumber || "",
                  mobile: student.mobile,
                  email: student.email,
                  address: student.address,
                  city: student.city,
                  state: student.state,
                  pincode: student.pincode,
                  qualificationsJson: student.qualificationsJson,
                  extraDetailsJson: student.extraDetailsJson,
                  photoUrl: student.photoUrl,
                  signatureUrl: student.signatureUrl,
                  createdAt: student.createdAt,
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
