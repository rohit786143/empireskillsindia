"use client";

import React, { useMemo, useState } from "react";
import {
  IndianRupee,
  Search,
  CheckCircle2,
  Clock,
  Receipt,
  Printer,
  X,
  Users,
  Building2,
} from "lucide-react";
import { formatDisplayDate, formatINR } from "@/lib/generators";
import { apiFetch } from "@/lib/api";
import { useAdminCenter } from "./AdminCenterContext";

interface FeePaymentEntry {
  id: string;
  amount: number;
  feeType?: string;
  mode: string;
  receiptNo: string;
  date: string;
  recordedAt?: string;
  remarks?: string;
}

interface StudentFeeRow {
  id: string;
  applicationRef: string;
  enrollmentNumber: string | null;
  status: string;
  fullName: string;
  fatherName: string;
  mobile: string;
  courseName: string;
  courseCode: string;
  courseDuration?: string;
  session: string;
  studyMode: string;
  totalFee: number;
  courseTotalFee?: number;
  courseFeeBreakdownJson?: string | null;
  feePaid: number;
  feePaymentsJson?: string | null;
  franchiseId?: string | null;
  franchiseName?: string | null;
  franchiseCode?: string | null;
  approvedAt?: string | null;
  createdAt: string;
}

const FEE_HEAD_OPTIONS = [
  "Registration + Admission Fee",
  "Registration Fee",
  "Admission Fee",
  "Monthly Fee (Month 1)",
  "Monthly Fee (Month 2)",
  "Monthly Fee (Month 3)",
  "Monthly Fee (Month 4)",
  "Monthly Fee (Month 5)",
  "Monthly Fee (Month 6)",
  "Monthly Fee (Month 7)",
  "Monthly Fee (Month 8)",
  "Monthly Fee (Month 9)",
  "Monthly Fee (Month 10)",
  "Monthly Fee (Month 11)",
  "Monthly Fee (Month 12)",
  "1st Semester Fee",
  "2nd Semester Fee",
  "Examination Fee",
  "Full Course Fee",
  "Other / Custom",
];

function parsePayments(json?: string | null): FeePaymentEntry[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function formatDateTime(dt?: string | null): string {
  if (!dt) return "—";
  const d = new Date(dt.replace(" ", "T"));
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminFeesClient({
  initialStudents,
}: {
  initialStudents: StudentFeeRow[];
}) {
  const [students, setStudents] = useState<StudentFeeRow[]>(initialStudents);
  const { centers, selectedCenterId, setSelectedCenterId } = useAdminCenter();
  const [activeTab, setActiveTab] = useState<"students" | "ledger">("students");
  const [feeFilter, setFeeFilter] = useState<"ALL" | "PENDING" | "CLEARED">("ALL");
  const [search, setSearch] = useState("");

  // Collect Fee Modal State
  const [selectedStudent, setSelectedStudent] = useState<StudentFeeRow | null>(null);
  const [totalInput, setTotalInput] = useState("0");
  const [receiveInput, setReceiveInput] = useState("0");
  const [feeHead, setFeeHead] = useState("Monthly Fee (Month 1)");
  const [payMode, setPayMode] = useState("Cash");
  const [receiptNo, setReceiptNo] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const centerStudents = useMemo(() => {
    if (!selectedCenterId || selectedCenterId === "ALL") return students;
    return students.filter((s) => s.franchiseId === selectedCenterId);
  }, [students, selectedCenterId]);

  const summary = useMemo(() => {
    let totalExpected = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let clearedCount = 0;
    for (const s of centerStudents) {
      const t = s.totalFee || s.courseTotalFee || 0;
      const p = s.feePaid || 0;
      const pend = Math.max(0, t - p);
      totalExpected += t;
      totalCollected += p;
      totalPending += pend;
      if (t > 0 && pend === 0) clearedCount++;
    }
    return { totalExpected, totalCollected, totalPending, clearedCount };
  }, [centerStudents]);

  const filteredStudents = useMemo(() => {
    return centerStudents.filter((s) => {
      const t = s.totalFee || s.courseTotalFee || 0;
      const p = s.feePaid || 0;
      const pend = Math.max(0, t - p);
      if (feeFilter === "PENDING" && !(t > 0 && pend > 0)) return false;
      if (feeFilter === "CLEARED" && !(t > 0 && pend === 0)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${s.fullName} ${s.enrollmentNumber || ""} ${s.applicationRef} ${s.courseName} ${s.mobile} ${s.franchiseName || ""} ${s.franchiseCode || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [centerStudents, feeFilter, search]);

  const masterLedger = useMemo(() => {
    const rows: {
      payment: FeePaymentEntry;
      student: StudentFeeRow;
    }[] = [];
    for (const s of centerStudents) {
      for (const p of parsePayments(s.feePaymentsJson)) {
        rows.push({ payment: p, student: s });
      }
    }
    rows.sort((a, b) => {
      const da = a.payment.recordedAt || a.payment.date || "";
      const db = b.payment.recordedAt || b.payment.date || "";
      return db.localeCompare(da);
    });
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter(({ payment, student }) =>
      `${student.fullName} ${student.enrollmentNumber || ""} ${student.courseName} ${student.franchiseName || ""} ${payment.feeType || ""} ${payment.mode} ${payment.receiptNo || ""} ${payment.remarks || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [centerStudents, search]);

  function openCollectModal(s: StudentFeeRow) {
    const t = s.totalFee || s.courseTotalFee || 0;
    const p = s.feePaid || 0;
    const pend = Math.max(0, t - p);
    const existingCount = parsePayments(s.feePaymentsJson).length;
    setSelectedStudent(s);
    setTotalInput(String(t));
    setReceiveInput(String(pend));
    setFeeHead(
      existingCount === 0
        ? "Registration + Admission Fee"
        : `Monthly Fee (Month ${Math.min(12, existingCount)})`
    );
    setPayMode("Cash");
    setReceiptNo("");
    setPayDate(new Date().toISOString().slice(0, 10));
    setRemarks("");
  }

  async function handleSavePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        totalFee: Number(totalInput || 0),
      };
      const amt = Number(receiveInput || 0);
      if (amt > 0) {
        payload.payment = {
          amount: amt,
          feeType: feeHead,
          mode: payMode,
          receiptNo: receiptNo.trim(),
          date: payDate,
          remarks: remarks.trim() || feeHead,
        };
      }
      const res = await apiFetch(
        `/admissions.php?id=${encodeURIComponent(selectedStudent.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (res.ok && data.application) {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === selectedStudent.id ? { ...s, ...data.application } : s
          )
        );
        setSelectedStudent(null);
      }
    } finally {
      setSaving(false);
    }
  }

  function handlePrintLedger() {
    document.body.classList.add("print-document-mode");
    window.print();
    setTimeout(() => document.body.classList.remove("print-document-mode"), 400);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D62]">
            Fee Management &amp; Payment Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track every student&apos;s course fee, received installments, pending dues,
            receipt numbers, and complete date/time payment register.
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrintLedger}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white text-xs font-bold shadow-sm"
        >
          <Printer className="w-4 h-4" /> Print Fee Report
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 border-t-4 border-t-[#0B3D62] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Total Course Fees</span>
            <IndianRupee className="w-4 h-4 text-[#0B3D62]" />
          </div>
          <div className="text-2xl font-extrabold text-[#0B3D62] mt-2">
            {formatINR(summary.totalExpected)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Across {centerStudents.length} enrolled students
          </p>
        </div>

        <div className="bg-white border border-slate-200 border-t-4 border-t-emerald-700 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Total Fee Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            {formatINR(summary.totalCollected)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {masterLedger.length} recorded receipts
          </p>
        </div>

        <div className="bg-white border border-slate-200 border-t-4 border-t-red-600 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Total Pending Balance</span>
            <Clock className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-extrabold text-red-700 mt-2">
            {formatINR(summary.totalPending)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Balance to be collected</p>
        </div>

        <div className="bg-white border border-slate-200 border-t-4 border-t-[#F07228] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>All Fee Cleared</span>
            <Users className="w-4 h-4 text-[#F07228]" />
          </div>
          <div className="text-2xl font-extrabold text-[#0B3D62] mt-2">
            {summary.clearedCount} / {students.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Zero pending students</p>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="no-print bg-white border border-slate-200 rounded-lg p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("students")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-bold border ${
              activeTab === "students"
                ? "bg-[#0B3D62] text-white border-[#0B3D62]"
                : "bg-slate-50 text-slate-700 border-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Student-Wise Fee Details ({centerStudents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ledger")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-bold border ${
              activeTab === "ledger"
                ? "bg-[#0B3D62] text-white border-[#0B3D62]"
                : "bg-slate-50 text-slate-700 border-slate-200"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" /> Full Payment Ledger ({masterLedger.length})
          </button>

          {activeTab === "students" && (
            <div className="flex items-center gap-1 ml-0 sm:ml-2">
              {(["ALL", "PENDING", "CLEARED"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFeeFilter(f)}
                  className={`px-2.5 py-1.5 rounded text-[11px] font-bold border ${
                    feeFilter === f
                      ? "bg-[#F07228] text-white border-[#F07228]"
                      : "bg-white text-slate-600 border-slate-300"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select
            value={selectedCenterId}
            onChange={(e) => setSelectedCenterId(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded bg-white text-[#0B3D62] focus:outline-none focus:ring-2 focus:ring-[#135589]"
          >
            <option value="ALL">All Study Centers ({centers.length})</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.centerCode}] {c.centerName}
              </option>
            ))}
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, enrollment, receipt..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
            />
          </div>
        </div>
      </div>

      {/* Printable Report Area */}
      <div id="printable-document">
        {/* TAB 1: STUDENT-WISE FEE TABLE */}
        {activeTab === "students" && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0B3D62] text-white uppercase">
                <tr>
                  <th className="py-3 px-4">Student &amp; ID</th>
                  <th className="py-3 px-3">Course &amp; Session</th>
                  <th className="py-3 px-3">Admission Date &amp; Time</th>
                  <th className="py-3 px-3 text-right">Total Fee</th>
                  <th className="py-3 px-3 text-right">Paid</th>
                  <th className="py-3 px-3 text-right">Pending / Status</th>
                  <th className="py-3 px-4 text-right no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No student fee records found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const total = s.totalFee || s.courseTotalFee || 0;
                    const paid = s.feePaid || 0;
                    const pending = Math.max(0, total - paid);
                    const cleared = total > 0 && pending === 0;
                    const payments = parsePayments(s.feePaymentsJson);
                    const lastPay = payments[payments.length - 1];

                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#0B3D62]">{s.fullName}</p>
                          <p className="text-[11px] font-mono text-emerald-700 font-semibold">
                            {s.enrollmentNumber || s.applicationRef}
                          </p>
                          <p className="text-[10px] text-slate-500">{s.mobile}</p>
                          {s.franchiseName && (
                            <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 text-[#D65B14] font-bold text-[10px]">
                              <Building2 className="w-3 h-3" />
                              {s.franchiseCode ? `[${s.franchiseCode}] ` : ""}
                              {s.franchiseName}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-800">{s.courseName}</p>
                          <p className="text-[10px] text-slate-500">
                            {s.courseDuration || "1 Year"} • {s.session} ({s.studyMode})
                          </p>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-600">
                          <div>{formatDateTime(s.approvedAt || s.createdAt)}</div>
                          {lastPay && (
                            <div className="text-[10px] text-emerald-700 mt-0.5">
                              Last Pay: {formatDisplayDate(lastPay.date)} ({lastPay.mode})
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#0B3D62]">
                          {total > 0 ? formatINR(total) : "Not Set"}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-700">
                          {formatINR(paid)}
                          <div className="text-[10px] font-normal text-slate-500">
                            {payments.length} receipt(s)
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {total <= 0 ? (
                            <span className="text-slate-400">—</span>
                          ) : cleared ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                              ✓ ALL FEE CLEARED
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-800 font-extrabold text-[11px]">
                              {formatINR(pending)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right no-print">
                          <button
                            type="button"
                            onClick={() => openCollectModal(s)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded font-bold text-xs ${
                              cleared
                                ? "bg-slate-100 text-[#0B3D62] border border-slate-300 hover:bg-slate-200"
                                : "bg-[#F07228] hover:bg-[#D65B14] text-white shadow-sm"
                            }`}
                          >
                            <IndianRupee className="w-3.5 h-3.5" />
                            {cleared ? "View Ledger" : "Collect Fee"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: COMPLETE MASTER PAYMENT LEDGER */}
        {activeTab === "ledger" && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0B3D62] text-white uppercase">
                <tr>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-3">Student &amp; Enrollment</th>
                  <th className="py-3 px-3">Course</th>
                  <th className="py-3 px-3">Fee Received For (Remark)</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3">Receipt / UTR No.</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {masterLedger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No fee payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  masterLedger.map(({ payment, student }) => (
                    <tr key={`${student.id}-${payment.id}`} className="hover:bg-slate-50">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                        <div className="font-semibold">
                          {formatDisplayDate(payment.date)}
                        </div>
                        {payment.recordedAt && (
                          <div className="text-[10px] text-slate-400">
                            {formatDateTime(payment.recordedAt)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#0B3D62]">
                          {student.fullName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {student.enrollmentNumber || student.applicationRef}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">{student.courseName}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-[#0B3D62]">
                          {payment.feeType || "Course Fee"}
                        </span>
                        {payment.remarks && payment.remarks !== payment.feeType && (
                          <div className="text-[10px] text-slate-500">
                            {payment.remarks}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[#135589] font-semibold">
                          {payment.mode}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {payment.receiptNo || "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                        {formatINR(payment.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collect Fee & Student Payment Ledger Modal */}
      {selectedStudent && (() => {
        const payments = parsePayments(selectedStudent.feePaymentsJson);
        const alreadyPaid = selectedStudent.feePaid || 0;
        const totalNum = Math.max(0, Number(totalInput || 0));
        const receiveNow = Math.max(0, Number(receiveInput || 0));
        const newTotalPaid = alreadyPaid + receiveNow;
        const newPending = Math.max(0, totalNum - newTotalPaid);

        return (
          <div
            className="no-print fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
            onClick={() => setSelectedStudent(null)}
          >
            <div
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-t-4 border-[#0B3D62] shadow-xl p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-[#0B3D62]">
                    Student Fee Ledger — {selectedStudent.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedStudent.enrollmentNumber || selectedStudent.applicationRef} •{" "}
                    {selectedStudent.courseName} ({selectedStudent.session})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="p-1 rounded hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Course Fee Bifurcation */}
              {selectedStudent.courseFeeBreakdownJson && (() => {
                try {
                  const fb = JSON.parse(selectedStudent.courseFeeBreakdownJson) as {
                    registrationFee?: number;
                    admissionFee?: number;
                    monthlyFee?: number;
                    sem1Fee?: number;
                    sem2Fee?: number;
                    examFee?: number;
                    examFeeNote?: string;
                  };
                  return (
                    <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-[11px] flex flex-wrap gap-x-4 gap-y-1 text-slate-700">
                      <span className="font-bold text-[#0B3D62] uppercase w-full">
                        Course Fee Bifurcation:
                      </span>
                      {(fb.registrationFee ?? 0) > 0 && (
                        <span>
                          Reg: <strong>{formatINR(fb.registrationFee!)}</strong>
                        </span>
                      )}
                      {(fb.admissionFee ?? 0) > 0 && (
                        <span>
                          Adm: <strong>{formatINR(fb.admissionFee!)}</strong>
                        </span>
                      )}
                      {(fb.monthlyFee ?? 0) > 0 && (
                        <span>
                          Monthly: <strong>{formatINR(fb.monthlyFee!)}/mo</strong>
                        </span>
                      )}
                      {(fb.sem1Fee ?? 0) > 0 && (
                        <span>
                          1st Sem: <strong>{formatINR(fb.sem1Fee!)}</strong>
                        </span>
                      )}
                      {(fb.sem2Fee ?? 0) > 0 && (
                        <span>
                          2nd Sem: <strong>{formatINR(fb.sem2Fee!)}</strong>
                        </span>
                      )}
                      {((fb.examFee ?? 0) > 0 || fb.examFeeNote) && (
                        <span>
                          Exam:{" "}
                          <strong>{fb.examFeeNote || formatINR(fb.examFee || 0)}</strong>
                        </span>
                      )}
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}

              {/* Live Summary */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Total Course Fee</span>
                  <strong className="text-base text-[#0B3D62]">
                    {formatINR(totalNum)}
                  </strong>
                </div>
                <div className="p-3 rounded bg-emerald-50 border border-emerald-200">
                  <span className="text-emerald-700 block">Total Paid (After Save)</span>
                  <strong className="text-base text-emerald-800">
                    {formatINR(newTotalPaid)}
                  </strong>
                </div>
                <div
                  className={`p-3 rounded border ${
                    newPending === 0 && totalNum > 0
                      ? "bg-emerald-100 border-emerald-300"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <span className="block text-slate-600">Pending Balance</span>
                  {newPending === 0 && totalNum > 0 ? (
                    <strong className="text-xs font-extrabold text-emerald-800 uppercase">
                      ✓ ALL FEE CLEARED
                    </strong>
                  ) : (
                    <strong className="text-base text-red-700">
                      {formatINR(newPending)}
                    </strong>
                  )}
                </div>
              </div>

              {/* Payment History */}
              {payments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-[#0B3D62]">
                    Payment Ledger ({payments.length} Receipts)
                  </h4>
                  <table className="w-full text-xs border border-slate-200">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="py-1.5 px-2 text-left">Date / Time</th>
                        <th className="py-1.5 px-2 text-left">Fee Head / Remark</th>
                        <th className="py-1.5 px-2 text-left">Mode</th>
                        <th className="py-1.5 px-2 text-left">Receipt / UTR</th>
                        <th className="py-1.5 px-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-1.5 px-2">
                            <div>{formatDisplayDate(p.date)}</div>
                            {p.recordedAt && (
                              <div className="text-[10px] text-slate-400">
                                {formatDateTime(p.recordedAt)}
                              </div>
                            )}
                          </td>
                          <td className="py-1.5 px-2">
                            <span className="font-bold text-[#0B3D62]">
                              {p.feeType || "Course Fee"}
                            </span>
                            {p.remarks && p.remarks !== p.feeType && (
                              <span className="block text-[10px] text-slate-500">
                                {p.remarks}
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 font-semibold">{p.mode}</td>
                          <td className="py-1.5 px-2 font-mono">{p.receiptNo || "—"}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-emerald-700">
                            {formatINR(p.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Record Payment Form */}
              <form onSubmit={handleSavePayment} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Total Applicable Fee (₹) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={totalInput}
                      onChange={(e) => setTotalInput(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Fee Received Now (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={receiveInput}
                      onChange={(e) => setReceiveInput(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded font-bold text-emerald-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#0B3D62] mb-1">
                      Which Fee Received? (Fee Head) *
                    </label>
                    <select
                      value={feeHead}
                      onChange={(e) => setFeeHead(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-semibold"
                    >
                      {FEE_HEAD_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Payment Mode *
                    </label>
                    <select
                      value={payMode}
                      onChange={(e) => setPayMode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Receipt / UTR / Bank Ref No.
                    </label>
                    <input
                      type="text"
                      value={receiptNo}
                      onChange={(e) => setReceiptNo(e.target.value)}
                      placeholder="e.g., REC-2026-001 / UTR No."
                      className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Remark (Optional)
                    </label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="e.g., Nov Month Fee Received"
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="px-4 py-2 rounded border border-slate-300 font-bold"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Record Fee Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
