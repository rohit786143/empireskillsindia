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
  QrCode,
  Receipt,
  Upload,
  Users,
  IndianRupee,
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
  isMainCenter?: boolean;
}

interface FeeSubmissionRow {
  id: string;
  applicationId: string;
  enrollmentNumber: string;
  studentName: string;
  courseName: string;
  feeHead: string;
  amount: number;
  utr: string;
  paymentDate: string;
  receiptUrl: string;
  status: string;
  remarks: string;
  createdAt: string;
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
  paymentScreenshotUrl?: string | null;
  paymentUtr?: string | null;
  registrationFeePaid?: number;
  franchiseForwardFee?: number;
  franchiseRemainingBase?: number;
  franchiseRoyalty15?: number;
  franchiseTotalDue?: number;
  franchisePaidToMain?: number;
  franchisePendingToMain?: number;
  franchiseForwardProofUrl?: string | null;
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
  const [feeSubmissions, setFeeSubmissions] = useState<FeeSubmissionRow[]>([]);
  const [mainTab, setMainTab] = useState<"applications" | "students" | "fees">("applications");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [sessionFilter, setSessionFilter] = useState("ALL");
  const [viewReceiptSub, setViewReceiptSub] = useState<FeeSubmissionRow | null>(null);
  const [collectApp, setCollectApp] = useState<FranchiseAppRow | null>(null);
  const [collectAmount, setCollectAmount] = useState("");
  const [collectHead, setCollectHead] = useState("Monthly Fee (Month 1)");
  const [collectMode, setCollectMode] = useState("Cash");
  const [collectReceipt, setCollectReceipt] = useState("");
  const [collectDate, setCollectDate] = useState(new Date().toISOString().slice(0, 10));
  const [collectRemarks, setCollectRemarks] = useState("");
  const [savingCollect, setSavingCollect] = useState(false);
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
  const [forwardProofUrl, setForwardProofUrl] = useState("");
  const [forwardUtr, setForwardUtr] = useState("");
  const [adminPayInfo, setAdminPayInfo] = useState<{
    adminPaymentQrUrl?: string;
    adminUpiId?: string;
    adminBankName?: string;
    adminAccountHolder?: string;
    adminAccountNumber?: string;
    adminIfscCode?: string;
  }>({});

  // Change password modal
  const [pwOpen, setPwOpen] = useState(false);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  // Payment proof viewer modal
  const [proofApp, setProofApp] = useState<FranchiseAppRow | null>(null);

  // Center Payment QR & Bank settings modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    paymentQrUrl: "",
    upiId: "",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    registrationFee: "500",
  });
  const [paySaving, setPaySaving] = useState(false);
  const [payMsg, setPayMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function openPaymentSettings() {
    setPayMsg(null);
    setPayModalOpen(true);
    try {
      const res = await apiFetch("/franchise-auth.php?action=payment-settings");
      const data = await res.json();
      if (res.ok && data.franchise) {
        setPayForm({
          paymentQrUrl: data.franchise.paymentQrUrl || "",
          upiId: data.franchise.upiId || "",
          bankName: data.franchise.bankName || "",
          accountHolderName: data.franchise.accountHolderName || "",
          accountNumber: data.franchise.accountNumber || "",
          ifscCode: data.franchise.ifscCode || "",
          registrationFee: String(data.franchise.registrationFee || 500),
        });
      }
    } catch {
      // ignore
    }
  }

  function handlePartnerQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setPayMsg({ type: "err", text: "QR image must be under 2 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPayForm((prev) => ({ ...prev, paymentQrUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSavePaymentSettings(e: React.FormEvent) {
    e.preventDefault();
    setPaySaving(true);
    setPayMsg(null);
    try {
      const res = await apiFetch("/franchise-auth.php?action=payment-settings", {
        method: "POST",
        body: JSON.stringify({
          ...payForm,
          registrationFee: Number(payForm.registrationFee) || 500,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayMsg({ type: "err", text: data.error || "Failed to save payment details." });
      } else {
        setPayMsg({ type: "ok", text: "Payment QR & Bank details saved! Students will now see this on the admission form." });
      }
    } catch {
      setPayMsg({ type: "err", text: "Network error." });
    } finally {
      setPaySaving(false);
    }
  }

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
        setFeeSubmissions(data.feeSubmissions || []);
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
    apiFetch(`/site-settings.php?_t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.settings) setAdminPayInfo(d.settings);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isMainCenter = Boolean(
    franchise?.isMainCenter || franchise?.centerCode?.toUpperCase() === "ESI-CTR-001"
  );

  const enrolledStudents = useMemo(
    () => applications.filter((a) => a.status === "APPROVED" || a.franchiseStatus === "MAIN_APPROVED"),
    [applications]
  );

  const uniqueCourses = useMemo(
    () => Array.from(new Set(enrolledStudents.map((s) => s.courseName).filter(Boolean))),
    [enrolledStudents]
  );

  const uniqueSessions = useMemo(
    () => Array.from(new Set(enrolledStudents.map((s) => s.session).filter(Boolean))),
    [enrolledStudents]
  );

  const filteredEnrolled = useMemo(() => {
    return enrolledStudents.filter((s) => {
      if (courseFilter !== "ALL" && s.courseName !== courseFilter) return false;
      if (sessionFilter !== "ALL" && s.session !== sessionFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !`${s.fullName} ${s.enrollmentNumber || ""} ${s.mobile} ${s.courseName} ${s.session}`
            .toLowerCase()
            .includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [enrolledStudents, courseFilter, sessionFilter, search]);

  async function handleFeeSubmissionDecision(
    sub: FeeSubmissionRow,
    action: "APPROVE_FEE_SUBMISSION" | "REJECT_FEE_SUBMISSION"
  ) {
    if (
      action === "REJECT_FEE_SUBMISSION" &&
      !confirm(`Reject online fee receipt of ₹${sub.amount} from ${sub.studentName}?`)
    ) {
      return;
    }
    setBusyId(sub.id);
    try {
      const res = await apiFetch("/franchise-admissions.php", {
        method: "PATCH",
        body: JSON.stringify({ action, submissionId: sub.id }),
      });
      if (res.ok) {
        await loadData(true);
      } else {
        const d = await res.json();
        alert(d?.error || "Action failed.");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleMainCenterCollectFee(e: React.FormEvent) {
    e.preventDefault();
    if (!collectApp) return;
    setSavingCollect(true);
    try {
      const res = await apiFetch(`/franchise-admissions.php?id=${encodeURIComponent(collectApp.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "COLLECT_FEE",
          payment: {
            amount: Number(collectAmount || 0),
            feeType: collectHead,
            mode: collectMode,
            receiptNo: collectReceipt.trim(),
            date: collectDate,
            remarks: collectRemarks.trim(),
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.application) {
        setApplications((prev) =>
          prev.map((x) => (x.id === collectApp.id ? data.application : x))
        );
        setCollectApp(null);
      } else {
        alert(data?.error || "Failed to record fee.");
      }
    } finally {
      setSavingCollect(false);
    }
  }

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
    remarkText = "",
    proofUrl = "",
    utrText = ""
  ) {
    setBusyId(appId);
    try {
      const res = await apiFetch(`/franchise-admissions.php?id=${encodeURIComponent(appId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          remarks: remarkText.trim(),
          ...(proofUrl ? { forwardPaymentProofUrl: proofUrl } : {}),
          ...(utrText.trim() ? { forwardPaymentUtr: utrText.trim() } : {}),
        }),
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
        setForwardProofUrl("");
        setForwardUtr("");
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
                {isMainCenter && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider">
                    Main Center
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
              onClick={openPaymentSettings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white text-xs font-semibold transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              Payment QR &amp; Bank
            </button>
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

        {/* Main Center Exclusive Navigation Tabs (Hidden for all other franchises) */}
        {isMainCenter && (
          <div className="bg-white rounded-xl border border-slate-200 p-2 flex flex-wrap gap-2 shadow-sm">
            <button
              type="button"
              onClick={() => setMainTab("applications")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                mainTab === "applications"
                  ? "bg-[#0B3D62] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Admission Applications ({applications.length})
            </button>
            <button
              type="button"
              onClick={() => setMainTab("students")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                mainTab === "students"
                  ? "bg-[#0B3D62] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Students — Course &amp; Session Wise ({enrolledStudents.length})
            </button>
            <button
              type="button"
              onClick={() => setMainTab("fees")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                mainTab === "fees"
                  ? "bg-[#F07228] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              Fee Management &amp; Online Receipts (
              {feeSubmissions.filter((s) => s.status === "PENDING").length} Pending)
            </button>
          </div>
        )}

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

        {/* Applications Tab (Default for all franchises; Tab 1 for Main Center) */}
        {(!isMainCenter || mainTab === "applications") && (
        <>
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
                            <div className="mt-1 space-y-0.5 text-[11px]">
                              <div className="font-semibold text-slate-700">
                                Course Fee: {formatINR(totalCourseFee)}
                              </div>
                              {!isMainCenter && (
                                <div className="text-[10px] text-[#0B3D62] bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 inline-block">
                                  Admin Share: <strong>{formatINR(app.franchiseTotalDue || 500)}</strong>{" "}
                                  (₹500 + 15% = {formatINR(app.franchiseRoyalty15 || 0)}) • Paid:{" "}
                                  <strong className="text-emerald-700">
                                    {formatINR(app.franchisePaidToMain || 0)}
                                  </strong>{" "}
                                  • Due:{" "}
                                  <strong className="text-red-600">
                                    {formatINR(app.franchisePendingToMain ?? (app.franchiseTotalDue || 500))}
                                  </strong>
                                </div>
                              )}
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

                            {app.paymentScreenshotUrl && (
                              <button
                                type="button"
                                onClick={() => setProofApp(app)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold transition-colors"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                Payment Proof
                              </button>
                            )}

                            {app.franchiseStatus === "PENDING_FRANCHISE" && (
                              <>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => executeAction(app.id, "FRANCHISE_APPROVE")}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {isMainCenter ? "Accept & Enroll (Direct)" : "Accept"}
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
        </>
        )}

        {/* MAIN CENTER EXCLUSIVE TAB 2: Course & Session Wise Students */}
        {isMainCenter && mainTab === "students" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-3">
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-[#0B3D62]"
              >
                <option value="ALL">All Courses ({uniqueCourses.length})</option>
                {uniqueCourses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-[#0B3D62]"
              >
                <option value="ALL">All Sessions ({uniqueSessions.length})</option>
                {uniqueSessions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search enrolled student..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0B3D62] text-white uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Student &amp; Enrollment No.</th>
                    <th className="py-3 px-3">Course</th>
                    <th className="py-3 px-3">Session</th>
                    <th className="py-3 px-3 text-right">Total Fee</th>
                    <th className="py-3 px-3 text-right">Paid</th>
                    <th className="py-3 px-3 text-right">Pending</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredEnrolled.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500">
                        No enrolled students match the selected course/session filter.
                      </td>
                    </tr>
                  ) : (
                    filteredEnrolled.map((s) => {
                      const t = s.totalFee || s.courseTotalFee || 0;
                      const p = s.feePaid || 0;
                      const pend = Math.max(0, t - p);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#0B3D62]">{s.fullName}</div>
                            <div className="font-mono text-[11px] font-bold text-emerald-700">
                              {s.enrollmentNumber || s.applicationRef}
                            </div>
                            <div className="text-[10px] text-slate-500">{s.mobile}</div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800">{s.courseName}</td>
                          <td className="py-3 px-3 text-slate-600">{s.session}</td>
                          <td className="py-3 px-3 text-right font-bold">{formatINR(t)}</td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-700">
                            {formatINR(p)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {pend === 0 && t > 0 ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                CLEARED
                              </span>
                            ) : (
                              <span className="font-bold text-red-600">{formatINR(pend)}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPrintApp(s)}
                                className="px-2.5 py-1.5 rounded bg-[#0B3D62] text-white font-bold"
                              >
                                Form
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCollectApp(s);
                                  setCollectAmount(String(pend > 0 ? Math.min(1500, pend) : 0));
                                  setCollectHead("Monthly Fee (Month 1)");
                                  setCollectMode("Cash");
                                  setCollectReceipt("");
                                  setCollectRemarks("");
                                }}
                                className="px-2.5 py-1.5 rounded bg-[#F07228] text-white font-bold"
                              >
                                Collect Fee
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
          </div>
        )}

        {/* MAIN CENTER EXCLUSIVE TAB 3: Fee Management & Online Monthly Fee Receipts */}
        {isMainCenter && mainTab === "fees" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-[#0B3D62]">
                    Student Online Monthly Fee Receipts ({feeSubmissions.length})
                  </h2>
                  <p className="text-[11px] text-slate-600">
                    Students of {franchise?.centerName} upload their monthly fee payment receipts
                    from Student Zone. Verify &amp; Approve to auto-credit their fee balance.
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#0B3D62] text-white uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Student &amp; Enrollment</th>
                      <th className="py-3 px-3">Fee Head &amp; Date</th>
                      <th className="py-3 px-3">UTR / Ref</th>
                      <th className="py-3 px-3 text-right">Amount</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {feeSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No online monthly fee receipts submitted yet.
                        </td>
                      </tr>
                    ) : (
                      feeSubmissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#0B3D62]">{sub.studentName}</div>
                            <div className="font-mono text-[11px] text-emerald-700 font-semibold">
                              {sub.enrollmentNumber}
                            </div>
                            <div className="text-[10px] text-slate-500">{sub.courseName}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{sub.feeHead}</div>
                            <div className="text-[10px] text-slate-500">
                              {formatDisplayDate(sub.paymentDate)}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {sub.utr || "—"}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-[#0B3D62]">
                            {formatINR(sub.amount)}
                          </td>
                          <td className="py-3 px-3">
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
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setViewReceiptSub(sub)}
                                className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold"
                              >
                                View Receipt
                              </button>
                              {sub.status === "PENDING" && (
                                <>
                                  <button
                                    type="button"
                                    disabled={busyId === sub.id}
                                    onClick={() =>
                                      handleFeeSubmissionDecision(sub, "APPROVE_FEE_SUBMISSION")
                                    }
                                    className="px-2.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold disabled:opacity-50"
                                  >
                                    Verify &amp; Approve
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busyId === sub.id}
                                    onClick={() =>
                                      handleFeeSubmissionDecision(sub, "REJECT_FEE_SUBMISSION")
                                    }
                                    className="px-2.5 py-1.5 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold disabled:opacity-50"
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
            </div>
          </div>
        )}
      </main>

      {/* Main Center View Online Fee Receipt Modal */}
      {viewReceiptSub && (
        <div
          className="no-print fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setViewReceiptSub(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0B3D62] text-white px-5 py-3.5 flex items-center justify-between">
              <span className="text-sm font-bold">
                Monthly Fee Receipt — {viewReceiptSub.studentName} ({formatINR(viewReceiptSub.amount)})
              </span>
              <button type="button" onClick={() => setViewReceiptSub(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-wrap justify-between gap-2">
                <span>
                  <strong>Head:</strong> {viewReceiptSub.feeHead}
                </span>
                <span>
                  <strong>UTR:</strong>{" "}
                  <span className="font-mono">{viewReceiptSub.utr || "—"}</span>
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg bg-slate-50 p-2 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewReceiptSub.receiptUrl}
                  alt="Online Fee Receipt"
                  className="max-h-[65vh] w-auto object-contain rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Center Direct Collect Fee Modal */}
      {collectApp && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0B3D62] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Record Fee Payment — {collectApp.fullName}</h3>
              <button type="button" onClick={() => setCollectApp(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleMainCenterCollectFee} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={collectDate}
                    onChange={(e) => setCollectDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fee Head</label>
                  <input
                    type="text"
                    value={collectHead}
                    onChange={(e) => setCollectHead(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mode</label>
                  <select
                    value={collectMode}
                    onChange={(e) => setCollectMode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Receipt / UTR No.</label>
                <input
                  type="text"
                  value={collectReceipt}
                  onChange={(e) => setCollectReceipt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  value={collectRemarks}
                  onChange={(e) => setCollectRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCollectApp(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCollect}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold disabled:opacity-60"
                >
                  {savingCollect ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action / Remarks / ₹500 Forward Payment Modal */}
      {actionModal && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
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

              {(actionModal.action === "FORWARD_TO_MAIN" ||
                actionModal.action === "APPROVE_AND_FORWARD") && (
                <div className="bg-[#EFF6FF] border border-[#0B3D62]/25 rounded-xl p-3.5 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#0B3D62] uppercase tracking-wide">
                      Pay ₹500 Forward Share to Main Admin *
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#F07228] text-white font-extrabold text-[11px]">
                      Pay Now: ₹500
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">1. Initial Share (Pay Now on Forward):</span>
                      <strong className="text-[#D65B14]">₹500</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        2. 15% Royalty on Remaining ({formatINR(actionModal.app.franchiseRemainingBase || 0)}):
                      </span>
                      <strong>{formatINR(actionModal.app.franchiseRoyalty15 || 0)}</strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-[#0B3D62]">
                      <span>Total Franchise Share (Ledger):</span>
                      <span>{formatINR(actionModal.app.franchiseTotalDue || 500)}</span>
                    </div>
                  </div>

                  {/* Main Admin QR / Bank Details */}
                  {(adminPayInfo.adminPaymentQrUrl ||
                    adminPayInfo.adminUpiId ||
                    adminPayInfo.adminAccountNumber) && (
                    <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col sm:flex-row items-center gap-3">
                      {adminPayInfo.adminPaymentQrUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={adminPayInfo.adminPaymentQrUrl}
                          alt="Main Admin Payment QR"
                          className="w-28 h-28 object-contain border border-slate-200 rounded p-1 bg-white shrink-0"
                        />
                      )}
                      <div className="text-[11px] space-y-0.5 flex-1">
                        <p className="font-bold text-[#0B3D62]">Main Admin Account Details:</p>
                        {adminPayInfo.adminUpiId && (
                          <p>
                            UPI: <strong className="font-mono">{adminPayInfo.adminUpiId}</strong>
                          </p>
                        )}
                        {adminPayInfo.adminBankName && <p>Bank: {adminPayInfo.adminBankName}</p>}
                        {adminPayInfo.adminAccountHolder && (
                          <p>A/c Holder: {adminPayInfo.adminAccountHolder}</p>
                        )}
                        {adminPayInfo.adminAccountNumber && (
                          <p>
                            A/c No.:{" "}
                            <strong className="font-mono">{adminPayInfo.adminAccountNumber}</strong>
                          </p>
                        )}
                        {adminPayInfo.adminIfscCode && (
                          <p>
                            IFSC: <strong className="font-mono">{adminPayInfo.adminIfscCode}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mandatory ₹500 Forward Payment Screenshot */}
                  <div>
                    <label className="block font-bold text-[#D65B14] mb-1">
                      Upload ₹500 Payment Screenshot to Main Admin (Mandatory) *
                    </label>
                    <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#0B3D62]/40 hover:border-[#F07228] rounded-lg p-2.5 cursor-pointer bg-white font-semibold text-[#0B3D62]">
                      <Upload className="w-4 h-4" />
                      {forwardProofUrl || actionModal.app.franchiseForwardProofUrl
                        ? "Change ₹500 Payment Screenshot"
                        : "Upload ₹500 Payment Screenshot *"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) {
                            alert("Image must be under 2 MB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === "string") {
                              setForwardProofUrl(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                      />
                    </label>
                    {(forwardProofUrl || actionModal.app.franchiseForwardProofUrl) && (
                      <div className="mt-2 bg-white border border-emerald-300 rounded p-1.5 flex justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={forwardProofUrl || actionModal.app.franchiseForwardProofUrl || ""}
                          alt="Forward Payment Proof"
                          className="max-h-32 object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      UTR / Transaction Ref No. (Optional)
                    </label>
                    <input
                      type="text"
                      value={forwardUtr}
                      onChange={(e) => setForwardUtr(e.target.value)}
                      placeholder="e.g., 432198765432"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Remarks / Notes for Head Office (Optional)
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Original documents verified at center, ₹500 paid..."
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
                  disabled={
                    busyId === actionModal.app.id ||
                    ((actionModal.action === "FORWARD_TO_MAIN" ||
                      actionModal.action === "APPROVE_AND_FORWARD") &&
                      !forwardProofUrl &&
                      !actionModal.app.franchiseForwardProofUrl)
                  }
                  onClick={() =>
                    executeAction(
                      actionModal.app.id,
                      actionModal.action,
                      remarks,
                      forwardProofUrl || actionModal.app.franchiseForwardProofUrl || "",
                      forwardUtr
                    )
                  }
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${actionModal.buttonCls}`}
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

      {/* Payment Proof Viewer Modal */}
      {proofApp && proofApp.paymentScreenshotUrl && (
        <div
          className="no-print fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setProofApp(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0B3D62] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="text-sm font-bold">
                Registration Fee Payment Proof — {proofApp.fullName}
              </div>
              <button type="button" onClick={() => setProofApp(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs flex flex-wrap justify-between gap-2">
                <span>
                  <strong>Reg. Fee Paid:</strong> ₹{proofApp.registrationFeePaid || 500}
                </span>
                {proofApp.paymentUtr && (
                  <span>
                    <strong>UTR / Ref:</strong>{" "}
                    <span className="font-mono">{proofApp.paymentUtr}</span>
                  </span>
                )}
              </div>
              <div className="border border-slate-200 rounded-lg bg-slate-50 p-2 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={proofApp.paymentScreenshotUrl}
                  alt="Payment Screenshot"
                  className="max-h-[65vh] w-auto object-contain rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Partner Payment QR & Bank Settings Modal */}
      {payModalOpen && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-[#0B3D62] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#FF9B5E]" />
                Center Payment QR Code &amp; Bank Details
              </h3>
              <button type="button" onClick={() => setPayModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSavePaymentSettings} className="p-5 space-y-3.5 text-xs">
              {payMsg && (
                <div
                  className={`p-3 rounded-lg font-semibold ${
                    payMsg.type === "ok"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {payMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Registration Fee (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={payForm.registrationFee}
                    onChange={(e) =>
                      setPayForm({ ...payForm, registrationFee: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={payForm.upiId}
                    onChange={(e) => setPayForm({ ...payForm, upiId: e.target.value })}
                    placeholder="e.g., center@upi"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload Payment QR Code Image
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer font-semibold text-slate-700">
                    <Upload className="w-3.5 h-3.5 text-[#0B3D62]" />
                    Choose QR Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePartnerQrUpload}
                      className="hidden"
                    />
                  </label>
                  {payForm.paymentQrUrl && (
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={payForm.paymentQrUrl}
                        alt="QR Preview"
                        className="w-16 h-16 object-contain border border-slate-300 rounded bg-white p-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => setPayForm({ ...payForm, paymentQrUrl: "" })}
                        className="text-red-600 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={payForm.bankName}
                    onChange={(e) => setPayForm({ ...payForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={payForm.accountHolderName}
                    onChange={(e) =>
                      setPayForm({ ...payForm, accountHolderName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={payForm.accountNumber}
                    onChange={(e) =>
                      setPayForm({ ...payForm, accountNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={payForm.ifscCode}
                    onChange={(e) =>
                      setPayForm({ ...payForm, ifscCode: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={paySaving}
                  className="px-4 py-2 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white font-bold disabled:opacity-60"
                >
                  {paySaving ? "Saving..." : "Save Payment Details"}
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
