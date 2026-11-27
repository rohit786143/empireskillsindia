"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  IndianRupee,
  CheckCircle2,
  Clock,
  Receipt,
  Search,
  Printer,
  X,
  Users,
  Wallet,
} from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { useAdminCenter } from "@/components/AdminCenterContext";
import { apiFetch } from "@/lib/api";
import { formatDisplayDate, formatINR } from "@/lib/generators";

interface FranchisePaymentEntry {
  id: string;
  amount: number;
  feeType?: string;
  mode: string;
  receiptNo: string;
  date: string;
  recordedAt?: string;
  remarks?: string;
  proofUrl?: string | null;
}

interface RoyaltySubmissionRow {
  id: string;
  applicationId: string;
  franchiseId: string;
  franchiseName: string;
  franchiseCode: string;
  enrollmentNumber: string;
  studentName: string;
  courseName: string;
  amount: number;
  utr: string;
  paymentDate: string;
  proofUrl: string;
  franchiseRemarks: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  adminRemarks: string;
  createdAt: string;
}

interface FranchiseLedgerRow {
  id: string;
  applicationRef: string;
  enrollmentNumber: string | null;
  status: string;
  fullName: string;
  fatherName: string;
  mobile: string;
  courseName: string;
  courseCode: string;
  session: string;
  franchiseId: string | null;
  franchiseName: string | null;
  franchiseCode: string | null;
  franchiseStatus: string;
  forwardedAt: string | null;
  totalFee: number;
  courseTotalFee?: number;
  franchiseForwardFee: number;
  franchiseRemainingBase: number;
  franchiseRoyalty15: number;
  franchiseTotalDue: number;
  franchisePaidToMain: number;
  franchisePendingToMain: number;
  franchisePaymentsJson?: string | null;
  franchiseForwardProofUrl?: string | null;
  franchiseForwardUtr?: string | null;
}

function parseFrPayments(json?: string | null): FranchisePaymentEntry[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function FranchiseLedgerContent() {
  const { centers, selectedCenterId, setSelectedCenterId } = useAdminCenter();
  const [rows, setRows] = useState<FranchiseLedgerRow[]>([]);
  const [royaltySubs, setRoyaltySubs] = useState<RoyaltySubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"students" | "requests" | "register">("students");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "SETTLED">("ALL");
  const [search, setSearch] = useState("");
  const [busySubId, setBusySubId] = useState<string | null>(null);
  const [viewSubProof, setViewSubProof] = useState<RoyaltySubmissionRow | null>(null);
  const [rejectSub, setRejectSub] = useState<RoyaltySubmissionRow | null>(null);
  const [rejectRemark, setRejectRemark] = useState("");

  // Proof modal
  const [proofRow, setProofRow] = useState<FranchiseLedgerRow | null>(null);

  // Record Payment modal
  const [payRow, setPayRow] = useState<FranchiseLedgerRow | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payType, setPayType] = useState("15% Royalty Settlement");
  const [payMode, setPayMode] = useState("UPI");
  const [payReceipt, setPayReceipt] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payRemarks, setPayRemarks] = useState("");
  const [savingPay, setSavingPay] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch("/admissions.php?onlyFranchise=true").then((r) =>
        r.ok ? r.json() : { applications: [] }
      ),
      apiFetch("/royalty-submissions.php").then((r) =>
        r.ok ? r.json() : { submissions: [] }
      ),
    ])
      .then(([aData, sData]) => {
        setRows(aData.applications || []);
        setRoyaltySubs(sData.submissions || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const centerRoyaltySubs = useMemo(() => {
    const base =
      !selectedCenterId || selectedCenterId === "ALL"
        ? royaltySubs
        : royaltySubs.filter((s) => s.franchiseId === selectedCenterId);
    if (!search.trim()) return base;
    const q = search.trim().toLowerCase();
    return base.filter((s) =>
      `${s.studentName} ${s.enrollmentNumber} ${s.franchiseName} ${s.franchiseCode} ${s.utr} ${s.courseName}`
        .toLowerCase()
        .includes(q)
    );
  }, [royaltySubs, selectedCenterId, search]);

  const pendingReqCount = useMemo(
    () => centerRoyaltySubs.filter((s) => s.status === "PENDING").length,
    [centerRoyaltySubs]
  );

  async function handleRoyaltyDecision(
    sub: RoyaltySubmissionRow,
    action: "APPROVE" | "REJECT",
    remarkText = ""
  ) {
    if (action === "REJECT" && !remarkText.trim()) {
      alert("Please enter a rejection remark for the franchise.");
      return;
    }
    setBusySubId(sub.id);
    try {
      const res = await apiFetch("/royalty-submissions.php", {
        method: "PATCH",
        body: JSON.stringify({
          id: sub.id,
          action,
          adminRemarks: remarkText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Action failed.");
      } else {
        if (data.submission) {
          setRoyaltySubs((prev) =>
            prev.map((x) => (x.id === sub.id ? data.submission : x))
          );
        }
        if (data.application) {
          setRows((prev) =>
            prev.map((x) =>
              x.id === data.application.id ? { ...x, ...data.application } : x
            )
          );
        }
        setRejectSub(null);
        setRejectRemark("");
      }
    } finally {
      setBusySubId(null);
    }
  }

  const centerRows = useMemo(() => {
    if (!selectedCenterId || selectedCenterId === "ALL") return rows;
    return rows.filter((r) => r.franchiseId === selectedCenterId);
  }, [rows, selectedCenterId]);

  const summary = useMemo(() => {
    let totalDue = 0;
    let totalReceived = 0;
    let totalPending = 0;
    let settledCount = 0;
    for (const r of centerRows) {
      totalDue += r.franchiseTotalDue || 0;
      totalReceived += r.franchisePaidToMain || 0;
      totalPending += r.franchisePendingToMain || 0;
      if ((r.franchiseTotalDue || 0) > 0 && (r.franchisePendingToMain || 0) === 0) {
        settledCount++;
      }
    }
    return { totalDue, totalReceived, totalPending, settledCount };
  }, [centerRows]);

  const filteredStudents = useMemo(() => {
    return centerRows.filter((r) => {
      const pending = r.franchisePendingToMain || 0;
      if (statusFilter === "PENDING" && pending <= 0) return false;
      if (statusFilter === "SETTLED" && pending > 0) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${r.fullName} ${r.enrollmentNumber || ""} ${r.applicationRef} ${r.courseName} ${r.franchiseName || ""} ${r.franchiseCode || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [centerRows, statusFilter, search]);

  const paymentRegister = useMemo(() => {
    const list: { payment: FranchisePaymentEntry; student: FranchiseLedgerRow }[] = [];
    for (const r of centerRows) {
      for (const p of parseFrPayments(r.franchisePaymentsJson)) {
        list.push({ payment: p, student: r });
      }
    }
    list.sort((a, b) =>
      (b.payment.recordedAt || b.payment.date || "").localeCompare(
        a.payment.recordedAt || a.payment.date || ""
      )
    );
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(({ payment, student }) =>
      `${student.fullName} ${student.franchiseName || ""} ${student.franchiseCode || ""} ${student.courseName} ${payment.feeType || ""} ${payment.receiptNo || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [centerRows, search]);

  function openPayModal(r: FranchiseLedgerRow) {
    setPayRow(r);
    setPayAmount(String(r.franchisePendingToMain || 0));
    setPayType(
      (r.franchisePaidToMain || 0) < 500
        ? "Initial Forward Fee (₹500)"
        : "15% Royalty Settlement"
    );
    setPayMode("UPI");
    setPayReceipt("");
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayRemarks("");
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payRow) return;
    setSavingPay(true);
    try {
      const res = await apiFetch(`/admissions.php?id=${encodeURIComponent(payRow.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          franchisePayment: {
            amount: Number(payAmount || 0),
            feeType: payType,
            mode: payMode,
            receiptNo: payReceipt.trim(),
            date: payDate,
            remarks: payRemarks.trim(),
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.application) {
        setRows((prev) =>
          prev.map((x) => (x.id === payRow.id ? { ...x, ...data.application } : x))
        );
        setPayRow(null);
      } else {
        alert(data?.error || "Failed to record franchise payment.");
      }
    } finally {
      setSavingPay(false);
    }
  }

  function handlePrint() {
    document.body.classList.add("print-document-mode");
    window.print();
    setTimeout(() => document.body.classList.remove("print-document-mode"), 400);
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D62] flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#F07228]" />
            Franchise Settlement Ledger (₹500 + 15%)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Per-student Franchise settlement account: <strong>₹500</strong> paid on application
            forward + <strong>15%</strong> of remaining course fee.
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white text-xs font-bold shadow-sm"
        >
          <Printer className="w-4 h-4" /> Print Franchise Ledger
        </button>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 border-t-4 border-t-[#0B3D62] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Total Franchise Share Due</span>
            <IndianRupee className="w-4 h-4 text-[#0B3D62]" />
          </div>
          <div className="text-2xl font-extrabold text-[#0B3D62] mt-2">
            {formatINR(summary.totalDue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            ₹500 + 15% across {centerRows.length} students
          </p>
        </div>

        <div className="bg-white border border-slate-200 border-t-4 border-t-emerald-700 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Received from Franchises</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            {formatINR(summary.totalReceived)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {paymentRegister.length} recorded settlements
          </p>
        </div>

        <div className="bg-white border border-slate-200 border-t-4 border-t-red-600 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Pending from Franchises</span>
            <Clock className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-extrabold text-red-600 mt-2">
            {formatINR(summary.totalPending)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Remaining 15% royalty balance</p>
        </div>

        <div className="bg-white border border-slate-200 border-t-4 border-t-[#F07228] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Fully Settled Students</span>
            <Users className="w-4 h-4 text-[#D65B14]" />
          </div>
          <div className="text-2xl font-extrabold text-[#D65B14] mt-2">
            {summary.settledCount} / {centerRows.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Zero pending share</p>
        </div>
      </div>

      {/* Pending Royalty Payment Requests Alert Banner */}
      {pendingReqCount > 0 && activeTab !== "requests" && (
        <div className="no-print bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-amber-950">
            <strong className="text-sm text-[#D65B14]">
              {pendingReqCount} Franchise Royalty Payment Request{pendingReqCount > 1 ? "s" : ""} Pending Approval!
            </strong>
            <p className="mt-0.5 text-amber-900">
              Verify the payment screenshot &amp; UTR before approving — balance only updates after your approval.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className="px-4 py-2 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white text-xs font-extrabold shadow-sm"
          >
            Review Pending Requests ({pendingReqCount})
          </button>
        </div>
      )}

      {/* Filters Bar */}
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
            <Users className="w-3.5 h-3.5" /> Student-Wise Ledger ({centerRows.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-bold border ${
              activeTab === "requests"
                ? "bg-[#F07228] text-white border-[#F07228]"
                : pendingReqCount > 0
                ? "bg-amber-50 text-amber-900 border-amber-300"
                : "bg-slate-50 text-slate-700 border-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Payment Requests ({pendingReqCount} Pending)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-bold border ${
              activeTab === "register"
                ? "bg-[#0B3D62] text-white border-[#0B3D62]"
                : "bg-slate-50 text-slate-700 border-slate-200"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" /> Full Payment Register ({paymentRegister.length})
          </button>

          {activeTab === "students" && (
            <div className="flex items-center gap-1 ml-0 sm:ml-2">
              {(["ALL", "PENDING", "SETTLED"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`px-2.5 py-1.5 rounded text-[11px] font-bold border ${
                    statusFilter === f
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
            className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded bg-white text-[#0B3D62]"
          >
            <option value="ALL">All Study Centers ({centers.length})</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.centerCode}] {c.centerName}
              </option>
            ))}
          </select>
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, center..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500">
          Loading Franchise Ledger...
        </div>
      ) : (
        <div id="printable-document">
          {activeTab === "students" ? (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0B3D62] text-white uppercase">
                  <tr>
                    <th className="py-3 px-4">Student &amp; Study Center</th>
                    <th className="py-3 px-3">Course &amp; Course Fee</th>
                    <th className="py-3 px-3">Admin Share (₹500 + 15%)</th>
                    <th className="py-3 px-3 text-right">Paid to Admin</th>
                    <th className="py-3 px-3 text-right">Pending</th>
                    <th className="py-3 px-4 text-right no-print">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No franchise ledger records found.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((r) => {
                      const settled = r.franchiseTotalDue > 0 && r.franchisePendingToMain === 0;
                      const pays = parseFrPayments(r.franchisePaymentsJson);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <p className="font-bold text-[#0B3D62]">{r.fullName}</p>
                            <p className="text-[11px] font-mono text-emerald-700 font-semibold">
                              {r.enrollmentNumber || r.applicationRef}
                            </p>
                            {r.franchiseName && (
                              <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 text-[#D65B14] font-bold text-[10px]">
                                <Building2 className="w-3 h-3" />
                                {r.franchiseCode ? `[${r.franchiseCode}] ` : ""}
                                {r.franchiseName}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-semibold text-slate-800">{r.courseName}</p>
                            <p className="text-[11px] text-slate-500">
                              Course Total: <strong>{formatINR(r.totalFee || r.courseTotalFee || 0)}</strong>
                            </p>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-extrabold text-[#0B3D62]">
                              {formatINR(r.franchiseTotalDue)}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              ₹500 + 15% of {formatINR(r.franchiseRemainingBase)} (
                              {formatINR(r.franchiseRoyalty15)})
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="font-bold text-emerald-700">
                              {formatINR(r.franchisePaidToMain)}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {pays.length} entry(s)
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {settled ? (
                              <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                SETTLED
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded bg-red-50 text-red-700 font-bold">
                                {formatINR(r.franchisePendingToMain)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right no-print">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {r.franchiseForwardProofUrl && (
                                <button
                                  type="button"
                                  onClick={() => setProofRow(r)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold"
                                >
                                  <Receipt className="w-3.5 h-3.5" /> ₹500 Proof
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openPayModal(r)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#F07228] hover:bg-[#D65B14] text-white font-bold"
                              >
                                <IndianRupee className="w-3.5 h-3.5" /> Record Payment
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : activeTab === "requests" ? (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0B3D62] text-white uppercase">
                  <tr>
                    <th className="py-3 px-4">Date &amp; Study Center</th>
                    <th className="py-3 px-3">Student &amp; Course</th>
                    <th className="py-3 px-3">UTR / Transaction No.</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3">Status &amp; Remarks</th>
                    <th className="py-3 px-4 text-right no-print">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {centerRoyaltySubs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        No franchise royalty payment requests submitted yet.
                      </td>
                    </tr>
                  ) : (
                    centerRoyaltySubs.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-700">
                            {formatDisplayDate(sub.paymentDate)}
                          </div>
                          <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-50 border border-orange-200 text-[#D65B14] font-bold text-[10px]">
                            <Building2 className="w-3 h-3" />
                            {sub.franchiseCode ? `[${sub.franchiseCode}] ` : ""}
                            {sub.franchiseName}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-[#0B3D62]">{sub.studentName}</p>
                          <p className="text-[10px] font-mono text-emerald-700 font-semibold">
                            {sub.enrollmentNumber}
                          </p>
                          <p className="text-[10px] text-slate-500">{sub.courseName}</p>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#0B3D62]">
                          {sub.utr}
                          {sub.franchiseRemarks && (
                            <div className="font-sans font-normal text-[10px] text-slate-500 mt-0.5">
                              Note: {sub.franchiseRemarks}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-sm text-[#0B3D62]">
                          {formatINR(sub.amount)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                              sub.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : sub.status === "REJECTED"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {sub.status === "PENDING" ? "PENDING APPROVAL" : sub.status}
                          </span>
                          {sub.adminRemarks && (
                            <div
                              className={`text-[10px] mt-1 ${
                                sub.status === "REJECTED"
                                  ? "text-red-700 font-semibold"
                                  : "text-slate-500"
                              }`}
                            >
                              Admin Remark: {sub.adminRemarks}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right no-print">
                          <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                            <button
                              type="button"
                              onClick={() => setViewSubProof(sub)}
                              className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                            >
                              View Proof
                            </button>
                            {sub.status === "PENDING" && (
                              <>
                                <button
                                  type="button"
                                  disabled={busySubId === sub.id}
                                  onClick={() => handleRoyaltyDecision(sub, "APPROVE")}
                                  className="px-2.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs disabled:opacity-50"
                                >
                                  Verify &amp; Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={busySubId === sub.id}
                                  onClick={() => {
                                    setRejectSub(sub);
                                    setRejectRemark("");
                                  }}
                                  className="px-2.5 py-1.5 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0B3D62] text-white uppercase">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Study Center</th>
                    <th className="py-3 px-3">Student &amp; Course</th>
                    <th className="py-3 px-3">Payment Type</th>
                    <th className="py-3 px-3">Mode / UTR</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paymentRegister.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No franchise settlement payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    paymentRegister.map(({ payment, student }) => (
                      <tr key={payment.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {formatDisplayDate(payment.date)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-50 border border-orange-200 text-[#D65B14] font-bold text-[10px]">
                            <Building2 className="w-3 h-3" />
                            {student.franchiseCode ? `[${student.franchiseCode}] ` : ""}
                            {student.franchiseName || "Center"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-[#0B3D62]">{student.fullName}</p>
                          <p className="text-[10px] text-slate-500">{student.courseName}</p>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {payment.feeType || "Royalty Settlement"}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <div>{payment.mode}</div>
                          {payment.receiptNo && (
                            <div className="font-mono text-[10px]">{payment.receiptNo}</div>
                          )}
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
      )}

      {/* Royalty Submission Proof Modal */}
      {viewSubProof && (
        <div
          className="no-print fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setViewSubProof(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0B3D62] text-white px-5 py-3.5 flex items-center justify-between">
              <span className="text-sm font-bold">
                Royalty Payment Proof — {viewSubProof.studentName} ({formatINR(viewSubProof.amount)})
              </span>
              <button type="button" onClick={() => setViewSubProof(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap justify-between gap-2">
                <span>
                  <strong>Center:</strong> [{viewSubProof.franchiseCode}] {viewSubProof.franchiseName}
                </span>
                <span>
                  <strong>UTR:</strong>{" "}
                  <span className="font-mono font-bold text-[#0B3D62]">{viewSubProof.utr}</span>
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg bg-slate-50 p-2 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewSubProof.proofUrl}
                  alt="Royalty Payment Proof"
                  className="max-h-[65vh] w-auto object-contain rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Royalty Payment Modal (Mandatory Remark) */}
      {rejectSub && (
        <div
          className="no-print fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setRejectSub(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-700 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Reject Royalty Payment Request</h3>
              <button type="button" onClick={() => setRejectSub(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRoyaltyDecision(rejectSub, "REJECT", rejectRemark);
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-bold text-red-900">
                  {rejectSub.studentName} — {formatINR(rejectSub.amount)} (UTR: {rejectSub.utr})
                </p>
                <p className="text-[11px] text-red-700 mt-0.5">
                  [{rejectSub.franchiseCode}] {rejectSub.franchiseName}
                </p>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason / Remark for Rejection (Mandatory) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectRemark}
                  onChange={(e) => setRejectRemark(e.target.value)}
                  placeholder="e.g., Payment not received in bank / Wrong UTR number / Incorrect amount..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRejectSub(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busySubId === rejectSub.id || !rejectRemark.trim()}
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50"
                >
                  {busySubId === rejectSub.id ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ₹500 Forward Proof Modal */}
      {proofRow && proofRow.franchiseForwardProofUrl && (
        <div
          className="no-print fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setProofRow(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0B3D62] text-white px-5 py-3.5 flex items-center justify-between">
              <span className="text-sm font-bold">
                Franchise ₹500 Forward Payment Proof — {proofRow.fullName}
              </span>
              <button type="button" onClick={() => setProofRow(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs flex flex-wrap justify-between gap-2">
                <span>
                  <strong>Center:</strong> [{proofRow.franchiseCode}] {proofRow.franchiseName}
                </span>
                {proofRow.franchiseForwardUtr && (
                  <span>
                    <strong>UTR:</strong>{" "}
                    <span className="font-mono">{proofRow.franchiseForwardUtr}</span>
                  </span>
                )}
              </div>
              <div className="border border-slate-200 rounded-lg bg-slate-50 p-2 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={proofRow.franchiseForwardProofUrl}
                  alt="Franchise ₹500 Payment Proof"
                  className="max-h-[65vh] w-auto object-contain rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Franchise Settlement Payment Modal */}
      {payRow && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0B3D62] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Record Franchise Settlement Payment</h3>
              <button type="button" onClick={() => setPayRow(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-5 space-y-3.5 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                <div className="font-bold text-[#0B3D62]">{payRow.fullName}</div>
                <div className="text-[#D65B14] font-semibold">
                  [{payRow.franchiseCode}] {payRow.franchiseName}
                </div>
                <div className="text-slate-600">
                  Total Share Due: <strong>{formatINR(payRow.franchiseTotalDue)}</strong> (₹500 +
                  15% = {formatINR(payRow.franchiseRoyalty15)}) • Paid:{" "}
                  <strong className="text-emerald-700">
                    {formatINR(payRow.franchisePaidToMain)}
                  </strong>{" "}
                  • Pending:{" "}
                  <strong className="text-red-600">
                    {formatINR(payRow.franchisePendingToMain)}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Type</label>
                  <select
                    value={payType}
                    onChange={(e) => setPayType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Initial Forward Fee (₹500)">Initial Forward Fee (₹500)</option>
                    <option value="15% Royalty Settlement">15% Royalty Settlement</option>
                    <option value="15% Royalty Installment">15% Royalty Installment</option>
                    <option value="Full Balance Settlement">Full Balance Settlement</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  UTR / Receipt Number
                </label>
                <input
                  type="text"
                  value={payReceipt}
                  onChange={(e) => setPayReceipt(e.target.value)}
                  placeholder="Optional UTR / transaction ref"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  placeholder="Optional note"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayRow(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPay}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold disabled:opacity-60"
                >
                  {savingPay ? "Saving..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminFranchiseLedgerPage() {
  return (
    <AdminGuard>
      <FranchiseLedgerContent />
    </AdminGuard>
  );
}
