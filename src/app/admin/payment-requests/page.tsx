"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Receipt,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  RefreshCw,
  X,
} from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { useAdminCenter } from "@/components/AdminCenterContext";
import { apiFetch } from "@/lib/api";
import { formatDisplayDate, formatINR } from "@/lib/generators";

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

function PaymentRequestsContent() {
  const { centers, selectedCenterId, setSelectedCenterId } = useAdminCenter();
  const [submissions, setSubmissions] = useState<RoyaltySubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [viewProof, setViewProof] = useState<RoyaltySubmissionRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RoyaltySubmissionRow | null>(null);
  const [rejectRemark, setRejectRemark] = useState("");

  async function loadRequests(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await apiFetch(`/royalty-submissions.php?_t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.submissions)) {
        setSubmissions(data.submissions);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadRequests(false);
  }, []);

  const centerFiltered = useMemo(() => {
    if (!selectedCenterId || selectedCenterId === "ALL") return submissions;
    return submissions.filter((s) => s.franchiseId === selectedCenterId);
  }, [submissions, selectedCenterId]);

  const stats = useMemo(() => {
    let pendingCount = 0;
    let pendingAmt = 0;
    let approvedCount = 0;
    let approvedAmt = 0;
    let rejectedCount = 0;
    for (const s of centerFiltered) {
      if (s.status === "PENDING") {
        pendingCount++;
        pendingAmt += s.amount;
      } else if (s.status === "APPROVED") {
        approvedCount++;
        approvedAmt += s.amount;
      } else if (s.status === "REJECTED") {
        rejectedCount++;
      }
    }
    return { pendingCount, pendingAmt, approvedCount, approvedAmt, rejectedCount };
  }, [centerFiltered]);

  const filtered = useMemo(() => {
    return centerFiltered.filter((s) => {
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      const d = (s.paymentDate || s.createdAt || "").slice(0, 10);
      if (dateFrom && d && d < dateFrom) return false;
      if (dateTo && d && d > dateTo) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${s.studentName} ${s.enrollmentNumber} ${s.franchiseName} ${s.franchiseCode} ${s.utr} ${s.courseName} ${s.franchiseRemarks}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [centerFiltered, statusFilter, dateFrom, dateTo, search]);

  async function handleDecision(
    sub: RoyaltySubmissionRow,
    action: "APPROVE" | "REJECT",
    remarkText = ""
  ) {
    if (action === "REJECT" && !remarkText.trim()) {
      alert("Please enter a remark explaining why this payment is rejected.");
      return;
    }
    setBusyId(sub.id);
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
      } else if (data.submission) {
        setSubmissions((prev) =>
          prev.map((x) => (x.id === sub.id ? data.submission : x))
        );
        setRejectTarget(null);
        setRejectRemark("");
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D62] flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#F07228]" />
            Franchise Payment Requests
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify payment screenshots &amp; UTR submitted by Franchise Centers. Once approved, the
            payment automatically credits into Main Admin Dashboard &amp; the Franchise&apos;s Admin Ledger.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadRequests(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B3D62] hover:bg-[#135589] text-white text-xs font-bold shadow-sm disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Requests
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 border-t-4 border-t-[#F07228] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Pending Verification</span>
            <Clock className="w-4 h-4 text-[#F07228]" />
          </div>
          <div className="text-2xl font-extrabold text-[#D65B14] mt-1.5">
            {stats.pendingCount}{" "}
            <span className="text-sm font-bold text-slate-500">
              ({formatINR(stats.pendingAmt)})
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting your approval</p>
        </div>

        <div className="bg-white border border-slate-200 border-t-4 border-t-emerald-600 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Approved &amp; Credited</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1.5">
            {stats.approvedCount}{" "}
            <span className="text-sm font-bold text-slate-500">
              ({formatINR(stats.approvedAmt)})
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Added to Admin &amp; Franchise Ledger</p>
        </div>

        <div className="bg-white border border-slate-200 border-t-4 border-t-red-600 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Rejected Requests</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-extrabold text-red-700 mt-1.5">{stats.rejectedCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Returned to Franchise with remark</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded text-xs font-bold border ${
                statusFilter === st
                  ? st === "PENDING"
                    ? "bg-[#F07228] text-white border-[#F07228]"
                    : "bg-[#0B3D62] text-white border-[#0B3D62]"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {st} (
              {st === "ALL"
                ? centerFiltered.length
                : centerFiltered.filter((x) => x.status === st).length}
              )
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedCenterId}
            onChange={(e) => setSelectedCenterId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded bg-white text-[#0B3D62]"
          >
            <option value="ALL">All Study Centers ({centers.length})</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.centerCode}] {c.centerName}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="From Date"
            className="px-2 py-1.5 border border-slate-300 rounded bg-white text-xs"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title="To Date"
            className="px-2 py-1.5 border border-slate-300 rounded bg-white text-xs"
          />
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="px-2.5 py-1.5 rounded border border-slate-300 text-slate-600 font-bold hover:bg-slate-50"
            >
              Clear
            </button>
          )}

          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, UTR, center..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Payment Requests Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading franchise payment requests...
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0B3D62] text-white uppercase">
              <tr>
                <th className="py-3 px-4">Date &amp; Study Center</th>
                <th className="py-3 px-3">Student &amp; Course</th>
                <th className="py-3 px-3">UTR / Transaction No.</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3">Status &amp; Remarks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No franchise payment requests found matching your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => (
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
                          Franchise Note: {sub.franchiseRemarks}
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
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                        <button
                          type="button"
                          onClick={() => setViewProof(sub)}
                          className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                        >
                          View Proof
                        </button>
                        {sub.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              disabled={busyId === sub.id}
                              onClick={() => handleDecision(sub, "APPROVE")}
                              className="px-2.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs disabled:opacity-50"
                            >
                              Verify &amp; Approve
                            </button>
                            <button
                              type="button"
                              disabled={busyId === sub.id}
                              onClick={() => {
                                setRejectTarget(sub);
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
        )}
      </div>

      {/* Payment Proof Modal */}
      {viewProof && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setViewProof(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0B3D62] text-white px-5 py-3.5 flex items-center justify-between">
              <span className="text-sm font-bold">
                Payment Proof — {viewProof.studentName} ({formatINR(viewProof.amount)})
              </span>
              <button type="button" onClick={() => setViewProof(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap justify-between gap-2">
                <span>
                  <strong>Center:</strong> [{viewProof.franchiseCode}] {viewProof.franchiseName}
                </span>
                <span>
                  <strong>UTR:</strong>{" "}
                  <span className="font-mono font-bold text-[#0B3D62]">{viewProof.utr}</span>
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg bg-slate-50 p-2 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewProof.proofUrl}
                  alt="Franchise Payment Proof"
                  className="max-h-[65vh] w-auto object-contain rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal (Mandatory Remark) */}
      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setRejectTarget(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-700 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Reject Franchise Payment Request</h3>
              <button type="button" onClick={() => setRejectTarget(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDecision(rejectTarget, "REJECT", rejectRemark);
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-bold text-red-900">
                  {rejectTarget.studentName} — {formatINR(rejectTarget.amount)} (UTR:{" "}
                  {rejectTarget.utr})
                </p>
                <p className="text-[11px] text-red-700 mt-0.5">
                  [{rejectTarget.franchiseCode}] {rejectTarget.franchiseName}
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
                  placeholder="e.g., Payment not received in bank / Wrong UTR / Incorrect amount..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyId === rejectTarget.id || !rejectRemark.trim()}
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50"
                >
                  {busyId === rejectTarget.id ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPaymentRequestsPage() {
  return (
    <AdminGuard>
      <PaymentRequestsContent />
    </AdminGuard>
  );
}
