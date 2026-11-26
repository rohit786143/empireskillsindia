"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Search,
  AlertTriangle,
  Printer,
  CheckCircle2,
  Award,
  User,
} from "lucide-react";
import { InstituteEmblem } from "@/components/InstituteEmblem";
import { INSTITUTE_INFO } from "@/lib/constants";
import { formatDisplayDate } from "@/lib/generators";
import { apiFetch } from "@/lib/api";

interface VerifiedCert {
  id: string;
  certificateNumber: string;
  enrollmentNumber: string;
  studentName: string;
  fatherName: string;
  motherName: string | null;
  dob: string;
  photoUrl: string | null;
  courseName: string;
  courseCode: string | null;
  duration: string;
  session: string | null;
  marksObtained: number | null;
  totalMarks: number | null;
  percentage: number | null;
  grade: string;
  completionDate: string | null;
  issueDate: string;
  status: string;
}

function VerifyCertificateInner() {
  const searchParams = useSearchParams();
  const initialCert = searchParams.get("cert") || "";

  const [identifier, setIdentifier] = useState(initialCert);
  const [dob, setDob] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [certificate, setCertificate] = useState<VerifiedCert | null>(null);

  async function runVerification(params: {
    idVal: string;
    dobVal?: string;
    nameVal?: string;
    qr?: boolean;
  }) {
    if (!params.idVal.trim()) {
      setError("Please enter a Certificate Number or Enrollment Number.");
      return;
    }
    setLoading(true);
    setError("");
    setCertificate(null);
    try {
      const qs = new URLSearchParams();
      qs.set("cert", params.idVal.trim());
      if (params.dobVal) qs.set("dob", params.dobVal);
      if (params.nameVal) qs.set("name", params.nameVal);
      if (params.qr) qs.set("qr", "1");

      const res = await apiFetch(`/verify-certificate.php?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setError(
          data.error ||
            "Record Not Found. Please verify the Certificate Number and details."
        );
      } else {
        setCertificate(data.certificate);
      }
    } catch {
      setError("Unable to reach verification server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialCert) {
      runVerification({ idVal: initialCert, qr: true });
    }
  }, [initialCert]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runVerification({
      idVal: identifier,
      dobVal: dob,
      nameVal: studentName,
      qr: false,
    });
  }

  function handlePrintRecord() {
    document.body.classList.add("print-document-mode");
    window.print();
    setTimeout(() => document.body.classList.remove("print-document-mode"), 400);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
      {/* Search Form Card */}
      <div className="no-print bg-white border border-slate-200 border-t-4 border-t-[#0B3D62] rounded-lg p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-3 mb-6">
          <div className="p-2.5 rounded bg-blue-50 text-[#0B3D62]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0B3D62]">
              Verify Candidate Certificate Authenticity
            </h2>
            <p className="text-xs text-slate-500">
              Enter the Certificate Number or Enrollment Number along with Date of Birth (or
              Student Name) to verify against Empire Skills India&apos;s official central
              registry.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Certificate / Enrollment No. *
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g., CERT-ESI-2026-0001"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded font-mono focus:outline-none focus:ring-2 focus:ring-[#135589]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date of Birth (Optional if Name given)
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student Name (Optional)
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g., Aarav Sharma"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-slate-500">
              Sample test record:{" "}
              <button
                type="button"
                onClick={() => {
                  setIdentifier("CERT-ESI-2026-0001");
                  setDob("2002-05-14");
                  setStudentName("");
                }}
                className="font-mono font-bold text-[#135589] hover:underline"
              >
                CERT-ESI-2026-0001
              </button>{" "}
              (DOB: 2002-05-14) or{" "}
              <button
                type="button"
                onClick={() => {
                  setIdentifier("CERT-ESI-2026-0002");
                  setDob("2001-11-22");
                  setStudentName("");
                }}
                className="font-mono font-bold text-[#135589] hover:underline"
              >
                CERT-ESI-2026-0002
              </button>
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white font-bold text-sm disabled:opacity-60 transition-colors"
            >
              <Search className="w-4 h-4" />
              {loading ? "Verifying Registry..." : "Verify Certificate"}
            </button>
          </div>
        </form>
      </div>

      {/* Record Not Found Warning */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 flex items-start gap-4">
          <AlertTriangle className="w-7 h-7 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-red-900">
              Verification Failed — Record Not Found
            </h3>
            <p className="text-sm text-red-800 mt-1">{error}</p>
            <p className="text-xs text-red-700 mt-2">
              If you believe this is an error, please contact the Examination &amp;
              Verification Cell at {INSTITUTE_INFO.email}.
            </p>
          </div>
        </div>
      )}

      {/* Verified Result Card */}
      {certificate && (
        <div
          id="printable-document"
          className="bg-white border-2 border-emerald-700 rounded-lg shadow-md overflow-hidden"
        >
          {/* Official Verified Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-4 border-amber-400">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-400 text-emerald-950">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-amber-200 font-bold">
                  Central Digital Registry Confirmation
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold tracking-wide">
                  VERIFIED &amp; AUTHENTIC CERTIFICATE
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePrintRecord}
              className="no-print inline-flex items-center gap-1.5 px-4 py-2 rounded bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print Verification Record
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Institutional Header inside Printable Record */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <InstituteEmblem size={48} />
                <div>
                  <h4 className="text-base font-extrabold text-[#0B3D62]">
                    {INSTITUTE_INFO.name}
                  </h4>
                  <p className="text-[11px] text-[#D65B14] font-semibold">
                    {INSTITUTE_INFO.tagline}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                  <Award className="w-3.5 h-3.5" /> STATUS: VALID
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Student Photo */}
              <div className="md:col-span-3 flex flex-col items-center">
                <div className="w-32 h-36 rounded border-2 border-[#0B3D62] bg-slate-50 overflow-hidden flex items-center justify-center shadow-sm">
                  {certificate.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={certificate.photoUrl}
                      alt={certificate.studentName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-slate-300" />
                  )}
                </div>
                <p className="text-[11px] font-mono font-bold text-[#0B3D62] mt-2">
                  {certificate.certificateNumber}
                </p>
              </div>

              {/* Candidate & Course Table */}
              <div className="md:col-span-9">
                <table className="w-full text-sm border border-slate-200">
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2.5 px-3 bg-slate-50 font-semibold text-slate-600 w-44">
                        Student Name
                      </td>
                      <td className="py-2.5 px-3 font-extrabold text-[#0B3D62] uppercase">
                        {certificate.studentName}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 bg-slate-50 font-semibold text-slate-600">
                        Father&apos;s Name
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {certificate.fatherName}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 bg-slate-50 font-semibold text-slate-600">
                        Enrollment Number
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#0B3D62]">
                        {certificate.enrollmentNumber}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 bg-slate-50 font-semibold text-slate-600">
                        Certificate Number
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#D65B14]">
                        {certificate.certificateNumber}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 bg-slate-50 font-semibold text-slate-600">
                        Programme / Course
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {certificate.courseName}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 bg-slate-50 font-semibold text-slate-600">
                        Course Duration
                      </td>
                      <td className="py-2.5 px-3">
                        {certificate.duration}
                        {certificate.session ? ` (Session: ${certificate.session})` : ""}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 bg-slate-50 font-semibold text-slate-600">
                        Grade / Percentage
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-2 font-bold text-emerald-800">
                          Grade {certificate.grade}
                          {certificate.percentage !== null && (
                            <span className="text-slate-600 font-semibold">
                              ({certificate.percentage}%)
                            </span>
                          )}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 bg-slate-50 font-semibold text-slate-600">
                        Date of Issue
                      </td>
                      <td className="py-2.5 px-3 font-semibold">
                        {formatDisplayDate(certificate.issueDate)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                Verified electronically against Empire Skills India Central Examination
                Database.
              </span>
              <span>Verification Timestamp: {new Date().toLocaleDateString("en-IN")}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyCertificatePage() {
  return (
    <div className="pb-14">
      <section className="no-print bg-[#0B3D62] text-white border-b-4 border-[#F07228] py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#FF9B5E]">
            Public Digital Verification Registry
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-1">
            Instant Certificate Verification Portal
          </h1>
          <p className="text-slate-200 text-sm sm:text-base mt-2 max-w-2xl">
            Employers, government agencies, and academic institutions can verify the
            authenticity of any certificate issued by Empire Skills India in real time.
          </p>
        </div>
      </section>

      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto p-8 text-center text-sm text-slate-500">
            Loading verification portal...
          </div>
        }
      >
        <VerifyCertificateInner />
      </Suspense>
    </div>
  );
}
