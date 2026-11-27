"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Send,
  Printer,
  Search,
  LogOut,
  KeyRound,
  X,
  Clock,
  FileText,
  ExternalLink,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import {
  PrintableAdmissionForm,
  type AdmissionFormRecord,
} from "./PrintableAdmissionForm";
import { apiFetch } from "@/lib/api";
import { formatDisplayDate, formatINR } from "@/lib/generators";

interface FranchiseSession {
  franchiseId: string;
  centerCode: string;
  centerName: string;
  ownerName: string;
  email: string;
  city: string;
  state: string;
}

interface FranchiseAppRow extends AdmissionFormRecord {
  id: string;
  status: string;
  franchiseId: string | null;
  franchiseName: string | null;
  franchiseCode: string | null;
  franchiseStatus: string;
  franchiseRemarks: string | null;
  remarks?: string | null;
  forwardedAt: string | null;
  totalFee?: number;
  courseTotalFee?: number;
  feePaid?: number;
}

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  PENDING_FRANCHISE: {
    label: "New — Pending Your Review",
    cls: "bg-amber-100 text-amber-900 border border-amber-300",
  },
  FRANCHISE_APPROVED: {
    label: "Approved by Center (Ready to Forward)",
    cls: "bg-blue-100 text-[#135589] border border-blue-200",
  },
  FORWARDED_TO_MAIN: {
    label: "Forwarded to Main Institute",
    cls: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  },
  MAIN_APPROVED: {
    label: "Enrolled by Main Institute",
    cls: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  MAIN_REJECTED: {
    label: "Rejected by Main Institute",
    cls: "bg-red-100 text-red-800 border border-red-200",
  },
  FRANCHISE_REJECTED: {
    label: "Rejected by Center",
    cls: "bg-red-50 text-red-700 border border-red-200",
  },
};

export function FranchiseDashboardClient() {
  const router = useRouter();
  const [franchise, setFranchise] = useState<FranchiseSession | null>(null);
  const [applications, setApplications] = useState<FranchiseAppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filterTab, setFilterTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [printApp, setPrintApp] = useState<FranchiseAppRow | null>(null);

  // Action modal (Forward / Approve & Forward / Reject with remarks)
  const [actionModal, setActionModal] = useState<{
    app: FranchiseAppRow;
    action: "FRANCHISE_APPROVE" | "FRANCHISE_REJECT" | "FORWARD_TO_MAIN" | "APPROVE_AND_FORWARD";
    title: string;
    buttonLabel: string;
    buttonCls: string;
  } | null>(null);
  const [remarks, setRemarks] = useState("");

  // Change password modal
  const [pwOpen, setPwOpen] = useState(false);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await apiFetch("/franchise-admissions.php");
      if (res.status === 401) {
        router.replace("/franchise/login");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setFranchise(data.franchise || null);
        setApplications(data.applications || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = applications.length;
    const pendingReview = applications.filter(
      (a) => a.franchiseStatus === "PENDING_FRANCHISE" || a.franchiseStatus === "FRANCHISE_APPROVED"
    ).length;
    const forwarded = applications.filter(
      (a) => a.franchiseStatus === "FORWARDED_TO_MAIN"
    ).length;
    const enrolled = applications.filter(
      (a) => a.franchiseStatus === "MAIN_APPROVED"
    ).length;
    return { total, pendingReview, forwarded, enrolled };
  }, [applications]);

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      if (filterTab === "REJECTED") {
        if (a.franchiseStatus !== "FRANCHISE_REJECTED" && a.franchiseStatus !== "MAIN_REJECTED") {
          return false;
        }
      } else if (filterTab !== "ALL" && a.franchiseStatus !== filterTab) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${a.fullName} ${a.fatherName} ${a.mobile} ${a.applicationRef} ${a.enrollmentNumber || ""} ${a.courseName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [applications, filterTab, search]);

  async function executeAction(
    appId: string,
    action: "FRANCHISE_APPROVE" | "FRANCHISE_REJECT" | "FORWARD_TO_MAIN" | "APPROVE_AND_FORWARD",
    remarkText = ""
  ) {
    setBusyId(appId);
    try {
      const res = await apiFetch(`/franchise-admissions.php?id=${encodeURIComponent(appId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, remarks: remarkText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Action failed.");
      } else if (data?.application) {
        setApplications((prev) =>
          prev.map((row) => (row.id === appId ? data.application : row))
        );
        setActionModal(null);
        setRemarks("");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleLogout() {
    await apiFetch("/franchise-auth.php?action=logout", { method: "POST" }).catch(() => {});
    router.replace("/franchise/login");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    setPwBusy(true);
    try {
      const res = await apiFetch("/franchise-auth.php?action=change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwMsg({ type: "err", text: data?.error || "Failed to update password." });
      } else {
        setPwMsg({ type: "ok", text: "Password updated successfully." });
        setCurPw("");
        setNewPw("");
      }
    } catch {
      setPwMsg({ type: "err", text: "Network error." });
    } finally {
      setPwBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-600 text-sm">
        Loading Franchise Center Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* Top Franchise Bar */}
      <header className="no-print bg-[#0B3D62] text-white border-b-4 border-[#F07228] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <BrandLogo height={38} onDarkBg />
            <div className="hidden sm:block h-8 w-px bg-white/20" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base leading-tight">
                  {franchise?.centerName || "Franchise Center"}
                </span>
                {franchise?.centerCode && (
                  <span className="px-2 py-0.5 rounded bg-[#F07228] text-white text-[11px] font-bold tracking-wide">
                    {franchise.centerCode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-200 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-[#FF9B5E]" />
                {franchise?.city}
                {franchise?.state ? `, ${franchise.state}` : ""} • Center Head:{" "}
                <span className="font-medium text-white">{franchise?.ownerName}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setPwMsg(null);
                setPwOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Password
            </button>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Website
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="no-print max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#0B3D62] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#F07228]" />
              Center Admission Applications
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Review students who selected your center during online admission. Approve or reject
              applications, then forward approved candidates to{" "}
              <span className="font-semibold text-[#0B3D62]">Empire Skills India Head Office</span>{" "}
              for final enrollment &amp; Enrollment Number generation.
            </p>
          </div>
          <Link
            href="/admission"
            target="_blank"
            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B3D62] hover:bg-[#072A44] text-white text-xs font-semibold transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Open Online Admission Form
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Applications
            </div>
            <div className="text-2xl font-bold text-[#0B3D62] mt-1">{stats.total}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Received at your center</div>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 p-4">
            <div className="text-xs font-semibold text-amber-800 uppercase tracking-wide flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Action Needed
            </div>
            <div className="text-2xl font-bold text-amber-700 mt-1">{stats.pendingReview}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Pending review / forwarding</div>
          </div>
          <div className="bg-white rounded-xl border border-indigo-200 p-4">
            <div className="text-xs font-semibold text-indigo-800 uppercase tracking-wide flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> Forwarded to Main
            </div>
            <div className="text-2xl font-bold text-indigo-700 mt-1">{stats.forwarded}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Awaiting Head Office approval</div>
          </div>
          <div className="bg-white rounded-xl border border-emerald-200 p-4">
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled by Main
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.enrolled}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Official Enrollment No. issued</div>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: `All (${applications.length})` },
              {
                id: "PENDING_FRANCHISE",
                label: `New Pending (${applications.filter((a) => a.franchiseStatus === "PENDING_FRANCHISE").length})`,
              },
              {
                id: "FRANCHISE_APPROVED",
                label: `Center Approved (${applications.filter((a) => a.franchiseStatus === "FRANCHISE_APPROVED").length})`,
              },
              {
                id: "FORWARDED_TO_MAIN",
                label: `Forwarded to Main (${stats.forwarded})`,
              },
              {
                id: "MAIN_APPROVED",
                label: `Enrolled (${stats.enrolled})`,
              },
              {
                id: "REJECTED",
                label: `Rejected (${applications.filter((a) => a.franchiseStatus === "FRANCHISE_REJECTED" || a.franchiseStatus === "MAIN_REJECTED").length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterTab === tab.id
                    ? "bg-[#0B3D62] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, phone, ref..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3D62]/20 focus:border-[#0B3D62]"
            />
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No student applications found in this view.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0B3D62] text-white text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Student &amp; Contact</th>
                    <th className="py-3 px-4">Ref / Enrollment No.</th>
                    <th className="py-3 px-4">Course &amp; Fee</th>
                    <th className="py-3 px-4">Workflow Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {filtered.map((app) => {
                    const badge = STATUS_BADGES[app.franchiseStatus] || {
                      label: app.franchiseStatus,
                      cls: "bg-slate-100 text-slate-700",
                    };
                    const totalCourseFee = app.totalFee || app.courseTotalFee || 0;
                    const isBusy = busyId === app.id;

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-bold text-slate-900 text-sm">{app.fullName}</div>
                          <div className="text-slate-600 mt-0.5">S/o {app.fatherName}</div>
                          <div className="text-slate-500 mt-0.5">{app.mobile}</div>
                          {app.createdAt && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Applied: {formatDisplayDate(app.createdAt)}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 align-top">
                          <div className="font-mono font-semibold text-slate-700">
                            {app.applicationRef}
                          </div>
                          {app.enrollmentNumber ? (
                            <div className="mt-1 inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px]">
                              {app.enrollmentNumber}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 mt-1">
                              Enrollment pending Main approval
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 align-top">
                          <div className="font-semibold text-[#0B3D62]">{app.courseName}</div>
                          <div className="text-slate-500 mt-0.5">
                            {app.session} • {app.studyMode || "Regular"}
                          </div>
                          {totalCourseFee > 0 && (
                            <div className="text-[11px] font-semibold text-slate-700 mt-1">
                              Total Fee: {formatINR(totalCourseFee)}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 align-top">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                          {app.forwardedAt && (
                            <div className="text-[11px] text-slate-500 mt-1">
                              Forwarded: {formatDisplayDate(app.forwardedAt)}
                            </div>
                          )}
                          {app.franchiseRemarks && (
                            <div className="text-[11px] text-slate-600 mt-1 bg-slate-100 px-2 py-1 rounded max-w-xs">
                              <span className="font-semibold">Your Remark:</span>{" "}
                              {app.franchiseRemarks}
                            </div>
                          )}
                          {app.remarks && (
                            <div className="text-[11px] text-[#0B3D62] mt-1 bg-blue-50 border border-blue-200 px-2 py-1 rounded max-w-xs">
                              <span className="font-bold">Main Admin Remark:</span> {app.remarks}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 align-top text-right">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPrintApp(app)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0B3D62] hover:bg-[#072A44] text-white font-medium transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Form
                            </button>

                            {app.franchiseStatus === "PENDING_FRANCHISE" && (
                              <>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => executeAction(app.id, "FRANCHISE_APPROVE")}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => {
                                    setRemarks(app.franchiseRemarks || "");
                                    setActionModal({
                                      app,
                                      action: "FRANCHISE_REJECT",
                                      title: "Reject Student Application",
                                      buttonLabel: "Confirm Reject",
                                      buttonCls: "bg-red-600 hover:bg-red-700 text-white",
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium transition-colors disabled:opacity-50"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </>
                            )}

                            {app.franchiseStatus === "FRANCHISE_APPROVED" && (
                              <>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => {
                                    setRemarks(app.franchiseRemarks || "");
                                    setActionModal({
                                      app,
                                      action: "FORWARD_TO_MAIN",
                                      title: "Forward Application to Main Institute",
                                      buttonLabel: "Forward to Main Institute",
                                      buttonCls: "bg-[#F07228] hover:bg-[#D65B14] text-white",
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white font-semibold transition-colors disabled:opacity-50"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  Forward to Main
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => {
                                    setRemarks(app.franchiseRemarks || "");
                                    setActionModal({
                                      app,
                                      action: "FRANCHISE_REJECT",
                                      title: "Reject Student Application",
                                      buttonLabel: "Confirm Reject",
                                      buttonCls: "bg-red-600 hover:bg-red-700 text-white",
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium transition-colors disabled:opacity-50"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </>
                            )}

                            {(app.franchiseStatus === "FRANCHISE_REJECTED" ||
                              app.franchiseStatus === "MAIN_REJECTED") && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  setRemarks(app.franchiseRemarks || "");
                                  setActionModal({
                                    app,
                                    action: "FORWARD_TO_MAIN",
                                    title: "Re-Forward Application to Main Institute",
                                    buttonLabel: "Forward to Main Institute",
                                    buttonCls: "bg-[#F07228] hover:bg-[#D65B14] text-white",
                                  });
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors disabled:opacity-50"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Re-Forward
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Action / Remarks Modal */}
      {actionModal && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0B3D62] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">{actionModal.title}</h3>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">{actionModal.app.fullName}</div>
                <div className="text-slate-600 mt-0.5">
                  {actionModal.app.courseName} • Ref: {actionModal.app.applicationRef}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Remarks / Notes for Head Office (Optional)
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Original documents verified at center, recommended for enrollment..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3D62]/20 focus:border-[#0B3D62]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busyId === actionModal.app.id}
                  onClick={() => executeAction(actionModal.app.id, actionModal.action, remarks)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${actionModal.buttonCls}`}
                >
                  {busyId === actionModal.app.id ? "Processing..." : actionModal.buttonLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {pwOpen && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0B3D62] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Change Franchise Login Password</h3>
              <button
                type="button"
                onClick={() => setPwOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              {pwMsg && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium ${
                    pwMsg.type === "ok"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {pwMsg.text}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={curPw}
                  onChange={(e) => setCurPw(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B3D62]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B3D62]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPwOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={pwBusy}
                  className="px-4 py-2 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white text-xs font-semibold disabled:opacity-60"
                >
                  {pwBusy ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3-Page Printable Admission Form Preview Modal */}
      {printApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 overflow-y-auto p-3 sm:p-6">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="no-print bg-[#0B3D62] text-white px-5 py-3 flex items-center justify-between">
              <div className="text-sm font-bold">
                Admission Form — {printApp.fullName} ({printApp.applicationRef})
              </div>
              <button
                type="button"
                onClick={() => setPrintApp(null)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded bg-white/15 hover:bg-white/25 text-xs font-semibold"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </div>
            <div className="p-4 sm:p-6 bg-slate-100">
              <PrintableAdmissionForm record={printApp} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
