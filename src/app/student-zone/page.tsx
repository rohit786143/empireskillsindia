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
  Upload,
  CheckCircle2,
  IndianRupee,
} from "lucide-react";
import { InstituteEmblem } from "@/components/InstituteEmblem";
import { BrandLogo } from "@/components/BrandLogo";
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
  totalFee?: number;
  feePaid?: number;
  feePaymentsJson?: string | null;
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
  isMainCenterStudent?: boolean;
  centerPayment?: {
    centerName: string;
    centerCode: string;
    paymentQrUrl: string;
    upiId: string;
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
  } | null;
  mainCenterPayment?: {
    centerName: string;
    centerCode: string;
    paymentQrUrl: string;
    upiId: string;
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
  } | null;
  feeSubmissions?: {
    id: string;
    feeHead: string;
    amount: number;
    utr: string;
    paymentDate: string;
    receiptUrl: string;
    status: string;
    remarks: string;
    createdAt: string;
  }[];
}

export default function StudentZonePage() {
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"result" | "idcard" | "form">("result");

  // Online Fee Submission State (for student's own Study Center)
  const [showPayFeePanel, setShowPayFeePanel] = useState(false);
  const [feeHead, setFeeHead] = useState("Monthly Fee (Month 1)");
  const [feeAmount, setFeeAmount] = useState("");
  const [feeUtr, setFeeUtr] = useState("");
  const [feeDate, setFeeDate] = useState(new Date().toISOString().slice(0, 10));
  const [feeReceiptUrl, setFeeReceiptUrl] = useState("");
  const [submittingFee, setSubmittingFee] = useState(false);
  const [feeMsg, setFeeMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleOnlineFeeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!student || !feeUtr.trim()) {
      setFeeMsg({ type: "err", text: "UTR / Transaction Reference Number is mandatory." });
      return;
    }
    if (!feeReceiptUrl) {
      setFeeMsg({ type: "err", text: "Please upload your payment receipt screenshot." });
      return;
    }
    setSubmittingFee(true);
    setFeeMsg(null);
    try {
      const res = await apiFetch("/student-zone.php", {
        method: "POST",
        body: JSON.stringify({
          enrollmentNumber: student.enrollmentNumber,
          dob: student.dob,
          feeHead,
          amount: Number(feeAmount || 0),
          utr: feeUtr.trim(),
          paymentDate: feeDate,
          receiptUrl: feeReceiptUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeeMsg({ type: "err", text: data.error || "Failed to submit fee receipt." });
      } else if (data.submission) {
        setStudent((prev) =>
          prev
            ? { ...prev, feeSubmissions: [data.submission, ...(prev.feeSubmissions || [])] }
            : prev
        );
        setFeeAmount("");
        setFeeUtr("");
        setFeeReceiptUrl("");
        setFeeMsg({
          type: "ok",
          text: "Fee receipt uploaded successfully! Your Study Center will verify & update your fee balance shortly.",
        });
      }
    } catch {
      setFeeMsg({ type: "err", text: "Network error while uploading receipt." });
    } finally {
      setSubmittingFee(false);
    }
  }

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
    if (activeTab === "form") {
      let styleEl = document.getElementById("esi-portrait-a4-print-style");
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "esi-portrait-a4-print-style";
        styleEl.innerHTML = `@media print { @page { size: A4 portrait; margin: 0; } }`;
        document.head.appendChild(styleEl);
      }
      document.body.classList.add("print-admission-form-mode");
      window.print();
      setTimeout(
        () => document.body.classList.remove("print-admission-form-mode"),
        500
      );
      return;
    }
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
            {/* Student Fee Status Summary & Payment Receipts */}
            {(student.totalFee ?? 0) > 0 && (() => {
              let payments: {
                id: string;
                amount: number;
                feeType?: string;
                mode: string;
                receiptNo?: string;
                date: string;
                remarks?: string;
              }[] = [];
              if (student.feePaymentsJson) {
                try {
                  const arr = JSON.parse(student.feePaymentsJson);
                  if (Array.isArray(arr)) payments = arr;
                } catch {}
              }
              const pending = Math.max(
                0,
                (student.totalFee || 0) - (student.feePaid || 0)
              );
              return (
                <div className="no-print bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden text-xs">
                  <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 bg-slate-50 border-b border-slate-200">
                    <div className="flex flex-wrap items-center gap-4">
                      <span>
                        Total Course Fee:{" "}
                        <strong className="text-[#0B3D62]">
                          ₹{(student.totalFee || 0).toLocaleString("en-IN")}
                        </strong>
                      </span>
                      <span>
                        Fee Paid:{" "}
                        <strong className="text-emerald-700">
                          ₹{(student.feePaid || 0).toLocaleString("en-IN")}
                        </strong>
                      </span>
                      <span>
                        Pending Balance:{" "}
                        <strong
                          className={
                            pending === 0 ? "text-emerald-700" : "text-red-700"
                          }
                        >
                          ₹{pending.toLocaleString("en-IN")}
                        </strong>
                      </span>
                    </div>
                    {pending === 0 ? (
                      <span className="px-3 py-1 rounded bg-emerald-100 text-emerald-800 font-extrabold uppercase tracking-wider">
                        ✓ ALL FEE CLEARED
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded bg-amber-100 text-amber-900 font-bold">
                          Pending Fee: ₹{pending.toLocaleString("en-IN")}
                        </span>
                        {(student.centerPayment || student.mainCenterPayment) && (
                          <button
                            type="button"
                            onClick={() => setShowPayFeePanel((v) => !v)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white font-extrabold text-xs shadow-sm transition-colors"
                          >
                            <IndianRupee className="w-3.5 h-3.5" />
                            {showPayFeePanel ? "Hide Pay Fee" : "Pay Fee"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {payments.length > 0 && (
                    <div className="p-4 overflow-x-auto">
                      <p className="font-bold text-[#0B3D62] mb-2 uppercase text-[11px]">
                        Fee Payment Receipts ({payments.length})
                      </p>
                      <table className="w-full border border-slate-200 text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="py-1.5 px-2.5 text-left">Date</th>
                            <th className="py-1.5 px-2.5 text-left">Fee Received For</th>
                            <th className="py-1.5 px-2.5 text-left">Mode</th>
                            <th className="py-1.5 px-2.5 text-left">Receipt / UTR</th>
                            <th className="py-1.5 px-2.5 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {payments.map((p) => (
                            <tr key={p.id}>
                              <td className="py-1.5 px-2.5">
                                {formatDisplayDate(p.date)}
                              </td>
                              <td className="py-1.5 px-2.5">
                                <strong className="text-[#0B3D62]">
                                  {p.feeType || "Course Fee"}
                                </strong>
                                {p.remarks && p.remarks !== p.feeType && (
                                  <span className="text-slate-500 ml-1">
                                    ({p.remarks})
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 px-2.5 font-semibold">{p.mode}</td>
                              <td className="py-1.5 px-2.5 font-mono">
                                {p.receiptNo || "—"}
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-bold text-emerald-700">
                                ₹{Number(p.amount).toLocaleString("en-IN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Online Fee Payment & Receipt Upload (Shows student's own Study Center QR & Bank Details) */}
            {(student.centerPayment || student.mainCenterPayment) && showPayFeePanel && (() => {
              const payInfo = student.centerPayment || student.mainCenterPayment;
              return (
              <div className="no-print bg-white border-2 border-[#0B3D62]/25 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#0B3D62] to-[#135589] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-[#FF9B5E]" />
                    <h3 className="text-sm font-extrabold">
                      Pay Course / Monthly Fee Online &amp; Upload Payment Receipt
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F07228] text-white text-[10px] font-bold uppercase">
                    {payInfo?.centerName} ({payInfo?.centerCode})
                  </span>
                </div>

                <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left: Student's Study Center QR & Bank Info */}
                  <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-xs">
                    <p className="font-extrabold text-[#0B3D62] uppercase tracking-wide">
                      Scan Center QR or Pay via Bank Transfer
                    </p>
                    {payInfo?.paymentQrUrl ? (
                      <div className="flex flex-col items-center bg-white border border-slate-200 rounded-lg p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={payInfo.paymentQrUrl}
                          alt="Study Center Payment QR"
                          className="w-44 h-44 object-contain"
                        />
                        <span className="text-[11px] font-bold text-[#0B3D62] mt-1.5 text-center">
                          {payInfo.centerName} ({payInfo.centerCode})
                        </span>
                      </div>
                    ) : null}
                    <div className="space-y-1 text-slate-700">
                      {payInfo?.upiId && (
                        <p>
                          <strong>UPI ID:</strong>{" "}
                          <span className="font-mono text-[#0B3D62]">
                            {payInfo.upiId}
                          </span>
                        </p>
                      )}
                      {payInfo?.bankName && (
                        <p>
                          <strong>Bank:</strong> {payInfo.bankName}
                        </p>
                      )}
                      {payInfo?.accountHolderName && (
                        <p>
                          <strong>Account Holder:</strong>{" "}
                          {payInfo.accountHolderName}
                        </p>
                      )}
                      {payInfo?.accountNumber && (
                        <p>
                          <strong>Account No.:</strong>{" "}
                          <span className="font-mono">
                            {payInfo.accountNumber}
                          </span>
                        </p>
                      )}
                      {payInfo?.ifscCode && (
                        <p>
                          <strong>IFSC:</strong>{" "}
                          <span className="font-mono">{payInfo.ifscCode}</span>
                        </p>
                      )}
                      {!payInfo?.paymentQrUrl && !payInfo?.upiId && !payInfo?.accountNumber && (
                        <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                          Please contact your Study Center ({payInfo?.centerName}) for payment QR / bank details, pay your fee, and upload the receipt with UTR number here.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Upload Monthly Fee Receipt Form */}
                  <form
                    onSubmit={handleOnlineFeeSubmit}
                    className="lg:col-span-7 space-y-3.5 text-xs"
                  >
                    {feeMsg && (
                      <div
                        className={`p-3 rounded-lg font-semibold flex items-center gap-2 ${
                          feeMsg.type === "ok"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {feeMsg.type === "ok" ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{feeMsg.text}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Select Fee Head / Month *
                        </label>
                        <select
                          value={feeHead}
                          onChange={(e) => setFeeHead(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="Monthly Fee (Month 1)">Monthly Fee (Month 1)</option>
                          <option value="Monthly Fee (Month 2)">Monthly Fee (Month 2)</option>
                          <option value="Monthly Fee (Month 3)">Monthly Fee (Month 3)</option>
                          <option value="Monthly Fee (Month 4)">Monthly Fee (Month 4)</option>
                          <option value="Monthly Fee (Month 5)">Monthly Fee (Month 5)</option>
                          <option value="Monthly Fee (Month 6)">Monthly Fee (Month 6)</option>
                          <option value="Monthly Fee (Month 7)">Monthly Fee (Month 7)</option>
                          <option value="Monthly Fee (Month 8)">Monthly Fee (Month 8)</option>
                          <option value="Monthly Fee (Month 9)">Monthly Fee (Month 9)</option>
                          <option value="Monthly Fee (Month 10)">Monthly Fee (Month 10)</option>
                          <option value="Monthly Fee (Month 11)">Monthly Fee (Month 11)</option>
                          <option value="Monthly Fee (Month 12)">Monthly Fee (Month 12)</option>
                          <option value="Admission Fee">Admission Fee</option>
                          <option value="1st Semester Fee">1st Semester Fee</option>
                          <option value="2nd Semester Fee">2nd Semester Fee</option>
                          <option value="Examination Fee">Examination Fee</option>
                          <option value="Course Fee Installment">Course Fee Installment</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Amount Paid (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={feeAmount}
                          onChange={(e) => setFeeAmount(e.target.value)}
                          placeholder="e.g., 1500"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Payment Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={feeDate}
                          onChange={(e) => setFeeDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#D65B14] mb-1">
                          UTR / Transaction Ref No. (Mandatory) *
                        </label>
                        <input
                          type="text"
                          required
                          value={feeUtr}
                          onChange={(e) => setFeeUtr(e.target.value)}
                          placeholder="Enter 12-digit UTR / Transaction No."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-[#D65B14] mb-1">
                        Upload Payment Receipt Screenshot (Mandatory) *
                      </label>
                      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#0B3D62]/40 hover:border-[#F07228] rounded-lg p-3 cursor-pointer bg-slate-50 font-bold text-[#0B3D62]">
                        <Upload className="w-4 h-4" />
                        {feeReceiptUrl ? "Change Receipt Screenshot" : "Click to Upload Receipt Screenshot *"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            if (f.size > 2 * 1024 * 1024) {
                              setFeeMsg({ type: "err", text: "Receipt image must be under 2 MB." });
                              return;
                            }
                            const r = new FileReader();
                            r.onload = () => {
                              if (typeof r.result === "string") setFeeReceiptUrl(r.result);
                            };
                            r.readAsDataURL(f);
                          }}
                          className="hidden"
                        />
                      </label>
                      {feeReceiptUrl && (
                        <div className="mt-2 p-2 border border-emerald-300 bg-emerald-50/40 rounded-lg flex justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={feeReceiptUrl}
                            alt="Fee Receipt Preview"
                            className="max-h-36 object-contain rounded"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submittingFee || !feeReceiptUrl || !feeUtr.trim()}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white font-bold text-xs disabled:opacity-50"
                    >
                      {submittingFee ? "Uploading Receipt..." : "Submit Fee Receipt"}
                    </button>
                  </form>
                </div>

                {/* Submitted Online Fee Receipts History */}
                {student.feeSubmissions && student.feeSubmissions.length > 0 && (
                  <div className="px-5 pb-5 border-t border-slate-200 pt-4 overflow-x-auto text-xs">
                    <p className="font-bold text-[#0B3D62] uppercase text-[11px] mb-2">
                      Your Online Fee Submissions ({student.feeSubmissions.length})
                    </p>
                    <table className="w-full text-left border border-slate-200">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Fee Head</th>
                          <th className="py-2 px-3">UTR</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                          <th className="py-2 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {student.feeSubmissions.map((sub) => (
                          <tr key={sub.id}>
                            <td className="py-2 px-3">{formatDisplayDate(sub.paymentDate)}</td>
                            <td className="py-2 px-3 font-semibold">{sub.feeHead}</td>
                            <td className="py-2 px-3 font-mono">{sub.utr || "—"}</td>
                            <td className="py-2 px-3 text-right font-bold text-[#0B3D62]">
                              ₹{Number(sub.amount).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span
                                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                  sub.status === "APPROVED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : sub.status === "REJECTED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-900"
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              );
            })()}

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

            {/* TAB 2: PRINTABLE PVC PORTRAIT STUDENT ID CARD (54mm x 86mm CR80 — Balanced Executive Theme) */}
            {activeTab === "idcard" && (
              <div className="space-y-3">
                <p className="no-print text-center text-xs text-slate-500">
                  Standard PVC Aadhar / CR80 Portrait Size (<strong>54mm × 86mm</strong>) —
                  Ready for PVC Card Printing
                </p>
                <div id="printable-document" className="flex justify-center py-2">
                  <div
                    className="pvc-id-card relative bg-gradient-to-b from-white via-[#F5F9FD] to-[#EBF3FA] border-2 border-[#0B3D62] rounded-[14px] shadow-xl overflow-hidden flex flex-col justify-between text-slate-900 font-sans"
                    style={{
                      width: "268px",
                      minHeight: "426px",
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  >
                    {/* Centered Subtle Logo Watermark in Middle */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0 pt-10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/empire-logo.png"
                        alt=""
                        aria-hidden="true"
                        className="w-44 h-44 object-contain opacity-[0.08] select-none"
                      />
                    </div>

                    {/* Top Brand Header: Clean White Background for Logo */}
                    <div className="relative z-10 bg-white pt-2.5 text-center">
                      <div className="flex justify-center px-3">
                        <BrandLogo height={30} />
                      </div>
                      <p className="text-[7px] font-bold text-[#0B3D62] tracking-[0.12em] uppercase mt-1 px-2">
                        ISO 9001:2015 Certified Institution
                      </p>
                      {/* Logo-Matched Navy + Saffron Identity Ribbon */}
                      <div className="mt-1.5 bg-gradient-to-r from-[#0B3D62] via-[#135589] to-[#0B3D62] border-y-2 border-[#F07228] py-1">
                        <span className="text-white text-[8px] font-extrabold tracking-[0.18em] uppercase">
                          STUDENT IDENTITY CARD
                        </span>
                      </div>
                    </div>

                    {/* Portrait Body: Balanced Photo + Structured Professional Details */}
                    <div className="relative z-10 px-3 py-2 flex-1 flex flex-col items-center justify-between gap-1.5">
                      {/* Passport Photo with Logo Navy-Saffron Ring */}
                      <div className="w-[74px] h-[84px] rounded-lg p-[2px] bg-gradient-to-tr from-[#0B3D62] via-[#135589] to-[#F07228] shadow-md shrink-0">
                        <div className="w-full h-full rounded-[6px] bg-white overflow-hidden flex items-center justify-center">
                          {student.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={student.photoUrl}
                              alt={student.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 text-slate-300" />
                          )}
                        </div>
                      </div>

                      {/* Student Name & Enrollment Badge */}
                      <div className="text-center w-full">
                        <p className="text-[12.5px] font-extrabold text-[#0B3D62] uppercase leading-tight tracking-wide">
                          {student.fullName}
                        </p>
                        <div className="mt-0.5 inline-block px-2.5 py-0.5 rounded-full bg-[#0B3D62]/10 border border-[#0B3D62]/20">
                          <span className="text-[9px] font-mono font-extrabold text-[#D65B14] tracking-wider">
                            ID: {student.enrollmentNumber}
                          </span>
                        </div>
                      </div>

                      {/* Balanced Course & Details Card (Full Course Name — Zero Truncation) */}
                      <div className="w-full bg-white/85 border border-[#0B3D62]/20 rounded-lg overflow-hidden shadow-xs text-[8.3px]">
                        {/* Logo-Matched Dark Navy Course Strip */}
                        <div className="bg-gradient-to-r from-[#0B3D62] to-[#135589] px-2.5 py-1.5 text-center">
                          <span className="text-[6.5px] uppercase tracking-[0.14em] text-[#FFB380] font-bold block leading-none">
                            Course / Programme
                          </span>
                          <strong className="text-[8.8px] text-white font-bold leading-snug whitespace-normal break-words block mt-0.5">
                            {student.courseName}
                          </strong>
                        </div>

                        <div className="px-2.5 py-1.5 space-y-1">
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-500 font-semibold shrink-0">
                              Father&apos;s Name:
                            </span>
                            <strong className="text-slate-900 font-bold text-right uppercase leading-tight">
                              {student.fatherName}
                            </strong>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-500 font-semibold shrink-0">DOB:</span>
                            <strong className="text-slate-900 font-bold">
                              {formatDisplayDate(student.dob)}
                            </strong>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-500 font-semibold shrink-0">Session:</span>
                            <strong className="text-[#0B3D62] font-bold">
                              {student.session} ({student.courseCode})
                            </strong>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-500 font-semibold shrink-0">Mobile:</span>
                            <strong className="text-slate-900 font-bold">{student.mobile}</strong>
                          </div>
                        </div>
                      </div>

                      {/* QR Code + Registrar Signature */}
                      <div className="w-full flex items-end justify-between pt-1 border-t border-[#0B3D62]/15">
                        <div className="flex items-center gap-1.5">
                          <div className="p-0.5 bg-white border border-[#0B3D62]/25 rounded shadow-xs">
                            <QRCodeSVG
                              value={`https://${INSTITUTE_INFO.website}/verify-certificate?cert=${student.enrollmentNumber}`}
                              size={36}
                            />
                          </div>
                          <div className="text-[6.8px] text-slate-600 leading-tight">
                            <p className="font-extrabold text-[#0B3D62]">Scan Verify</p>
                            <p>Valid: {student.session}</p>
                          </div>
                        </div>
                        <div className="text-right text-[7.2px]">
                          <div className="w-16 border-b border-[#0B3D62]/60 mb-0.5 ml-auto" />
                          <p className="font-extrabold text-[#0B3D62]">Registrar Sign</p>
                          <p className="text-[6.5px] text-slate-500 font-medium">
                            Empire Skills India
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Logo-Matched Navy Footer Strip */}
                    <div className="relative z-10 bg-gradient-to-r from-[#0B3D62] via-[#135589] to-[#0B3D62] border-t-2 border-[#F07228] text-white px-2.5 py-1.5 text-[7px] text-center leading-tight">
                      <p className="font-bold text-[#FFB380] tracking-wide">
                        {INSTITUTE_INFO.website}
                      </p>
                      <p className="text-slate-100 truncate">
                        Helpline: {INSTITUTE_INFO.helpline}
                      </p>
                    </div>
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
