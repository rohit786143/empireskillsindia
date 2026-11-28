"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Plus,
  Search,
  Award,
  X,
  User,
  Trash2,
  Printer,
  IndianRupee,
  Building2,
} from "lucide-react";
import { ACADEMIC_SESSIONS, STUDY_MODES } from "@/lib/constants";
import { formatDisplayDate, formatINR } from "@/lib/generators";
import { apiFetch } from "@/lib/api";
import { PrintableAdmissionForm } from "./PrintableAdmissionForm";
import { useAdminCenter } from "./AdminCenterContext";

interface FeePaymentEntry {
  id: string;
  amount: number;
  feeType?: string;
  mode: string;
  receiptNo: string;
  date: string;
  remarks?: string;
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

interface ApplicationRow {
  id: string;
  applicationRef: string;
  status: string;
  enrollmentNumber: string | null;
  serialNumber?: string | null;
  courseId: string | null;
  courseName: string;
  courseCode: string;
  session: string;
  studyMode: string;
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
  city: string;
  state: string;
  pincode: string;
  qualificationsJson: string;
  extraDetailsJson?: string | null;
  totalFee?: number;
  courseTotalFee?: number;
  courseFeeBreakdownJson?: string | null;
  feePaid?: number;
  feePaymentsJson?: string | null;
  photoUrl: string | null;
  signatureUrl: string | null;
  marksheetUrl: string | null;
  idProofUrl: string | null;
  isCompleted: boolean;
  grade: string | null;
  percentage: number | null;
  franchiseId?: string | null;
  franchiseName?: string | null;
  franchiseCode?: string | null;
  franchiseForwardFee?: number;
  franchiseRemainingBase?: number;
  franchiseRoyalty15?: number;
  franchiseTotalDue?: number;
  franchisePaidToMain?: number;
  franchisePendingToMain?: number;
  franchisePaymentsJson?: string | null;
  createdAt: string;
}

function isFranchiseRoyaltyApp(app: { franchiseId?: string | null; franchiseCode?: string | null }): boolean {
  return Boolean(app.franchiseId) && (app.franchiseCode || "").toUpperCase() !== "ESI-CTR-001";
}

interface CourseOption {
  id: string;
  code: string;
  title: string;
}

export function AdminAdmissionsClient({
  initialApplications,
  courses,
}: {
  initialApplications: ApplicationRow[];
  courses: CourseOption[];
}) {
  const [applications, setApplications] =
    useState<ApplicationRow[]>(initialApplications);
  const { centers, selectedCenterId, setSelectedCenterId } = useAdminCenter();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ApplicationRow | null>(null);
  const [printFormApp, setPrintFormApp] = useState<ApplicationRow | null>(null);
  const [feeModalApp, setFeeModalApp] = useState<ApplicationRow | null>(null);
  const [feeModalMode, setFeeModalMode] = useState<"APPROVE" | "COLLECT">("APPROVE");
  const [feeTotalInput, setFeeTotalInput] = useState("0");
  const [feeReceiveInput, setFeeReceiveInput] = useState("0");
  const [feeHeadInput, setFeeHeadInput] = useState("Registration + Admission Fee");
  const [feePayMode, setFeePayMode] = useState("Cash");
  const [feeReceiptNo, setFeeReceiptNo] = useState("");
  const [feePayDate, setFeePayDate] = useState(new Date().toISOString().slice(0, 10));
  const [feeRemarks, setFeeRemarks] = useState("");
  const [savingFee, setSavingFee] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Offline Student Form State
  const [offlineForm, setOfflineForm] = useState({
    courseId: courses[0]?.id || "",
    session: ACADEMIC_SESSIONS[0] as string,
    studyMode: STUDY_MODES[0] as string,
    fullName: "",
    fatherName: "",
    motherName: "",
    dob: "",
    gender: "Male",
    category: "General",
    aadharNumber: "",
    mobile: "",
    email: "",
    address: "",
    photoUrl: "",
  });
  const [savingOffline, setSavingOffline] = useState(false);
  const [offlineError, setOfflineError] = useState("");

  const centerFilteredApps =
    selectedCenterId && selectedCenterId !== "ALL"
      ? applications.filter((a) => a.franchiseId === selectedCenterId)
      : applications;

  const filtered = centerFilteredApps.filter((a) => {
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${a.fullName} ${a.applicationRef} ${a.enrollmentNumber || ""} ${a.mobile} ${a.courseName} ${a.franchiseName || ""} ${a.franchiseCode || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  function openFeeModal(app: ApplicationRow, mode: "APPROVE" | "COLLECT") {
    const isFrRoyalty = isFranchiseRoyaltyApp(app);
    const baseTotal = isFrRoyalty
      ? app.franchiseTotalDue || 500
      : app.totalFee || app.courseTotalFee || 0;
    const paid = isFrRoyalty ? app.franchisePaidToMain || 0 : app.feePaid || 0;
    const pending = Math.max(0, baseTotal - paid);
    setFeeModalApp(app);
    setFeeModalMode(mode);
    setFeeTotalInput(String(baseTotal));
    setFeeReceiveInput("");
    setFeeHeadInput(
      isFrRoyalty
        ? "15% Royalty Settlement"
        : mode === "APPROVE"
        ? "Registration + Admission Fee"
        : "Monthly Fee (Month 1)"
    );
    setFeePayMode(isFrRoyalty ? "UPI" : "Cash");
    setFeeReceiptNo("");
    setFeePayDate(new Date().toISOString().slice(0, 10));
    setFeeRemarks("");
  }

  function parsePayments(json?: string | null): FeePaymentEntry[] {
    if (!json) return [];
    try {
      const arr = JSON.parse(json);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  async function handleSubmitFeeModal(e: React.FormEvent) {
    e.preventDefault();
    if (!feeModalApp) return;
    setSavingFee(true);
    try {
      const isFrRoyalty = isFranchiseRoyaltyApp(feeModalApp);
      const payload: Record<string, unknown> = {};
      if (!isFrRoyalty) {
        payload.totalFee = Number(feeTotalInput || 0);
      }
      if (feeModalMode === "APPROVE") {
        payload.action = "APPROVE";
      }
      const receivedAmt = Number(feeReceiveInput || 0);
      if (receivedAmt > 0) {
        const payObj = {
          amount: receivedAmt,
          feeType: feeHeadInput,
          mode: feePayMode,
          receiptNo: feeReceiptNo.trim(),
          date: feePayDate,
          remarks: feeRemarks.trim() || feeHeadInput,
        };
        if (isFrRoyalty) {
          payload.franchisePayment = payObj;
        } else {
          payload.payment = payObj;
        }
      }

      const res = await apiFetch(
        `/admissions.php?id=${encodeURIComponent(feeModalApp.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (res.ok && data.application) {
        setApplications((prev) =>
          prev.map((a) =>
            a.id === feeModalApp.id ? { ...a, ...data.application } : a
          )
        );
        if (selected?.id === feeModalApp.id) {
          setSelected({ ...selected, ...data.application });
        }
        setFeeModalApp(null);
      }
    } finally {
      setSavingFee(false);
    }
  }

  async function handleAction(id: string, action: "APPROVE" | "REJECT") {
    setBusyId(id);
    try {
      const res = await apiFetch(`/admissions.php?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.application) {
        setApplications((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...data.application } : a))
        );
        if (selected?.id === id) {
          setSelected({ ...selected, ...data.application });
        }
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this admission record permanently?")) return;
    setBusyId(id);
    try {
      const res = await apiFetch(`/admissions.php?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setApplications((prev) => prev.filter((a) => a.id !== id));
        if (selected?.id === id) setSelected(null);
      }
    } finally {
      setBusyId(null);
    }
  }

  function handleOfflinePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setOfflineForm((prev) => ({ ...prev, photoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleCreateOffline(e: React.FormEvent) {
    e.preventDefault();
    setSavingOffline(true);
    setOfflineError("");
    try {
      const res = await apiFetch("/admissions.php", {
        method: "POST",
        body: JSON.stringify({
          ...offlineForm,
          autoApprove: true,
          qualifications: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOfflineError(data.error || "Failed to add student.");
      } else {
        setApplications((prev) => [data.application, ...prev]);
        setAddModalOpen(false);
        setOfflineForm({
          courseId: courses[0]?.id || "",
          session: ACADEMIC_SESSIONS[0] as string,
          studyMode: STUDY_MODES[0] as string,
          fullName: "",
          fatherName: "",
          motherName: "",
          dob: "",
          gender: "Male",
          category: "General",
          aadharNumber: "",
          mobile: "",
          email: "",
          address: "",
          photoUrl: "",
        });
      }
    } catch {
      setOfflineError("Network error.");
    } finally {
      setSavingOffline(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D62]">
            Admission &amp; Student Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review online applications, approve with one-click Enrollment Number generation,
            or add offline students directly.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white text-xs font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Offline Student
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded text-xs font-bold border ${
                statusFilter === st
                  ? "bg-[#0B3D62] text-white border-[#0B3D62]"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {st} (
              {st === "ALL"
                ? centerFilteredApps.length
                : centerFilteredApps.filter((a) => a.status === st).length}
              )
            </button>
          ))}
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
              placeholder="Search name, ref, enrollment..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
            />
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#0B3D62] text-white uppercase">
            <tr>
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Ref / Enrollment No.</th>
              <th className="py-3 px-4">Programme &amp; Session</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Fee Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No applications found matching the selected filter.
                </td>
              </tr>
            ) : (
              filtered.map((app) => {
                const isFrRoyalty = isFranchiseRoyaltyApp(app);
                const totalFee = isFrRoyalty
                  ? app.franchiseTotalDue || 500
                  : app.totalFee || app.courseTotalFee || 0;
                const paidFee = isFrRoyalty ? app.franchisePaidToMain || 0 : app.feePaid || 0;
                const pendingFee = Math.max(0, totalFee - paidFee);
                const isCleared = totalFee > 0 && pendingFee === 0;
                return (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-10 rounded border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {app.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={app.photoUrl}
                            alt={app.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[#0B3D62]">{app.fullName}</p>
                        <p className="text-[11px] text-slate-500">
                          S/o {app.fatherName} • {app.mobile}
                        </p>
                        {app.franchiseName && (
                          <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 text-[#D65B14] font-bold text-[10px]">
                            <Building2 className="w-3 h-3" />
                            {app.franchiseCode ? `[${app.franchiseCode}] ` : ""}
                            {app.franchiseName}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <div className="text-slate-600">{app.applicationRef}</div>
                    {app.enrollmentNumber && (
                      <div className="font-bold text-emerald-700 mt-0.5">
                        {app.enrollmentNumber}
                      </div>
                    )}
                    {app.serialNumber && (
                      <div className="text-[10.5px] font-bold text-[#D65B14] mt-0.5">
                        Sr: {app.serialNumber}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800">{app.courseName}</p>
                    <p className="text-[11px] text-slate-500">
                      {app.session} • {app.studyMode}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                        app.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : app.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {app.status}
                    </span>
                    {app.isCompleted && (
                      <span className="ml-1 inline-block px-2 py-0.5 rounded bg-blue-100 text-[#135589] font-bold text-[10px]">
                        COMPLETED ({app.grade})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {totalFee <= 0 ? (
                      <span className="text-slate-400">—</span>
                    ) : isCleared ? (
                      <div className="space-y-0.5">
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                          {isFrRoyalty ? "✓ COMPLETE PAYMENT" : "✓ ALL FEE CLEARED"}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {isFrRoyalty ? "Admin Share: " : "Paid: "}
                          {formatINR(paidFee)} / {formatINR(totalFee)}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">
                          {isFrRoyalty ? "Share Due: " : "Pending: "}
                          {formatINR(pendingFee)}
                        </span>
                        <div className="text-[10px] text-slate-600">
                          {isFrRoyalty ? "Admin Share: " : "Paid: "}
                          {formatINR(paidFee)} / {formatINR(totalFee)}
                        </div>
                        {isFrRoyalty && (
                          <div className="text-[9px] text-[#0B3D62] font-semibold">
                            (₹500 + 15% Royalty)
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setPrintFormApp(app)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white font-bold"
                        title="Download / Print 3-Page Official Admission Form"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Form
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelected(app)}
                        className="p-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                        title="View Details & Documents"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {app.status !== "APPROVED" && (
                        <button
                          type="button"
                          disabled={busyId === app.id}
                          onClick={() => openFeeModal(app, "APPROVE")}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve &amp; Fee
                        </button>
                      )}

                      {app.status === "APPROVED" && (
                        <button
                          type="button"
                          onClick={() => openFeeModal(app, "COLLECT")}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded font-bold border ${
                            isCleared
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                          }`}
                          title={
                            isFrRoyalty
                              ? "Record Franchise Royalty Share / View Settlement Ledger"
                              : "Collect Fee / View Payment Receipts"
                          }
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                          {isFrRoyalty
                            ? isCleared
                              ? "Share Ledger"
                              : "Record Share"
                            : isCleared
                            ? "Fee Ledger"
                            : "Collect Fee"}
                        </button>
                      )}

                      {app.status === "PENDING" && (
                        <button
                          type="button"
                          disabled={busyId === app.id}
                          onClick={() => handleAction(app.id, "REJECT")}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      )}

                      {app.status === "APPROVED" &&
                        ((app.courseCode || "").toUpperCase().includes("NIELIT") ||
                        (app.courseName || "").toUpperCase().includes("NIELIT") ? (
                          <span
                            title="NIELIT course certificates are issued directly by NIELIT"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold text-[10px]"
                          >
                            Issued by NIELIT
                          </span>
                        ) : (
                          <Link
                            href={`/admin/certificates/generate?studentId=${app.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#F07228] hover:bg-[#D65B14] text-white font-bold"
                          >
                            <Award className="w-3.5 h-3.5" />
                            Certificate
                          </Link>
                        ))}

                      <button
                        type="button"
                        disabled={busyId === app.id}
                        onClick={() => handleDelete(app.id)}
                        className="p-1.5 rounded text-red-600 hover:bg-red-50"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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

      {/* Approve & Fee Collection / Ledger Modal */}
      {feeModalApp && (() => {
        const isFrRoyalty = isFranchiseRoyaltyApp(feeModalApp);
        const payments = parsePayments(
          isFrRoyalty ? feeModalApp.franchisePaymentsJson : feeModalApp.feePaymentsJson
        );
        const alreadyPaid = isFrRoyalty
          ? feeModalApp.franchisePaidToMain || 0
          : feeModalApp.feePaid || 0;
        const totalNum = isFrRoyalty
          ? feeModalApp.franchiseTotalDue || 500
          : Math.max(0, Number(feeTotalInput || 0));
        const receiveNow = Math.max(0, Number(feeReceiveInput || 0));
        const newTotalPaid = alreadyPaid + receiveNow;
        const newPending = Math.max(0, totalNum - newTotalPaid);

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
            onClick={() => setFeeModalApp(null)}
          >
            <div
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-t-4 border-[#0B3D62] shadow-xl p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-[#0B3D62]">
                    {isFrRoyalty
                      ? feeModalMode === "APPROVE"
                        ? "Approve Franchise Admission & Royalty Share"
                        : "Franchise Admin Share (₹500 + 15% Royalty) Ledger"
                      : feeModalMode === "APPROVE"
                      ? "Approve Admission & Record Fee Payment"
                      : "Fee Ledger & Collect Pending Installment"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {feeModalApp.fullName} — {feeModalApp.courseName} (
                    {feeModalApp.enrollmentNumber || feeModalApp.applicationRef})
                    {isFrRoyalty && feeModalApp.franchiseName
                      ? ` • Center: ${feeModalApp.franchiseName}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFeeModalApp(null)}
                  className="p-1 rounded hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isFrRoyalty && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[11px] space-y-1">
                  <p className="font-bold text-[#0B3D62] uppercase">
                    Franchise-to-Admin Share Calculation (₹500 + 15%)
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-700">
                    <span>
                      Student Course Fee:{" "}
                      <strong>{formatINR(feeModalApp.totalFee || feeModalApp.courseTotalFee || 0)}</strong>
                    </span>
                    <span>
                      Forward Share: <strong>₹500</strong>
                    </span>
                    <span>
                      15% Royalty (on {formatINR(feeModalApp.franchiseRemainingBase || 0)}):{" "}
                      <strong>{formatINR(feeModalApp.franchiseRoyalty15 || 0)}</strong>
                    </span>
                    <span>
                      Total Admin Share: <strong className="text-[#D65B14]">{formatINR(totalNum)}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Course Fee Bifurcation Reference Box for Admin */}
              {feeModalApp.courseFeeBreakdownJson && (() => {
                try {
                  const fb = JSON.parse(feeModalApp.courseFeeBreakdownJson) as {
                    registrationFee?: number;
                    admissionFee?: number;
                    monthlyFee?: number;
                    sem1Fee?: number;
                    sem2Fee?: number;
                    examFee?: number;
                    examFeeNote?: string;
                  };
                  return (
                    <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-[11px] space-y-1">
                      <p className="font-bold text-[#0B3D62] uppercase">
                        Course Fee Bifurcation ({feeModalApp.courseName})
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-700">
                        {(fb.registrationFee ?? 0) > 0 && (
                          <span>
                            Registration: <strong>{formatINR(fb.registrationFee!)}</strong>
                          </span>
                        )}
                        {(fb.admissionFee ?? 0) > 0 && (
                          <span>
                            Admission: <strong>{formatINR(fb.admissionFee!)}</strong>
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
                            Exam Fee:{" "}
                            <strong>
                              {fb.examFeeNote || formatINR(fb.examFee || 0)}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}

              {/* Live Fee Summary */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">
                    {isFrRoyalty ? "Total Admin Share" : "Total Course Fee"}
                  </span>
                  <strong className="text-base text-[#0B3D62]">
                    {formatINR(totalNum)}
                  </strong>
                </div>
                <div className="p-3 rounded bg-emerald-50 border border-emerald-200">
                  <span className="text-emerald-700 block">
                    {isFrRoyalty ? "Paid to Admin (After Save)" : "Total Paid (After Save)"}
                  </span>
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
                  <span className="block text-slate-600">
                    {isFrRoyalty ? "Pending Admin Share" : "Pending Balance"}
                  </span>
                  {newPending === 0 && totalNum > 0 ? (
                    <strong className="text-xs font-extrabold text-emerald-800 uppercase">
                      {isFrRoyalty ? "✓ COMPLETE PAYMENT" : "✓ ALL FEE CLEARED"}
                    </strong>
                  ) : (
                    <strong className="text-base text-red-700">
                      {formatINR(newPending)}
                    </strong>
                  )}
                </div>
              </div>

              {/* Existing Payment History */}
              {payments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-[#0B3D62]">
                    Previous Fee Receipts ({payments.length})
                  </h4>
                  <table className="w-full text-xs border border-slate-200">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="py-1.5 px-2 text-left">Date</th>
                        <th className="py-1.5 px-2 text-left">Fee Head / Remark</th>
                        <th className="py-1.5 px-2 text-left">Mode</th>
                        <th className="py-1.5 px-2 text-left">Receipt / UTR</th>
                        <th className="py-1.5 px-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-1.5 px-2">{formatDisplayDate(p.date)}</td>
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
              <form onSubmit={handleSubmitFeeModal} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isFrRoyalty ? "Total Admin Share (₹500 + 15%)" : "Total Applicable Fee (₹) *"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      disabled={isFrRoyalty}
                      value={isFrRoyalty ? String(totalNum) : feeTotalInput}
                      onChange={(e) => setFeeTotalInput(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded font-bold disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isFrRoyalty ? "Royalty Received from Franchise Now (₹)" : "Fee Received Now (₹)"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={feeReceiveInput}
                      onChange={(e) => setFeeReceiveInput(e.target.value)}
                      placeholder={isFrRoyalty ? "e.g., 2500" : "e.g., 5000"}
                      className="w-full px-3 py-2 border border-slate-300 rounded font-bold text-emerald-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#0B3D62] mb-1">
                      {isFrRoyalty ? "Settlement Head *" : "Which Fee Received? (Fee Head) *"}
                    </label>
                    {isFrRoyalty ? (
                      <select
                        value={feeHeadInput}
                        onChange={(e) => setFeeHeadInput(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-semibold"
                      >
                        <option value="15% Royalty Settlement">15% Royalty Settlement</option>
                        <option value="Partial Royalty Installment">Partial Royalty Installment</option>
                        <option value="Final Royalty Settlement">Final Royalty Settlement</option>
                        <option value="Initial Forward Fee (₹500)">Initial Forward Fee (₹500)</option>
                      </select>
                    ) : (
                      <select
                        value={feeHeadInput}
                        onChange={(e) => setFeeHeadInput(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-semibold"
                      >
                        {FEE_HEAD_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Payment Mode *
                    </label>
                    <select
                      value={feePayMode}
                      onChange={(e) => setFeePayMode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {feePayMode === "Cash"
                        ? "Cash Receipt Number"
                        : feePayMode === "UPI"
                        ? "UPI Transaction / UTR No."
                        : "Bank Reference / NEFT / IMPS No."}
                    </label>
                    <input
                      type="text"
                      value={feeReceiptNo}
                      onChange={(e) => setFeeReceiptNo(e.target.value)}
                      placeholder={
                        feePayMode === "Cash"
                          ? "e.g., REC-2026-001"
                          : "e.g., UTR / Txn Reference No."
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={feePayDate}
                      onChange={(e) => setFeePayDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      value={feeRemarks}
                      onChange={(e) => setFeeRemarks(e.target.value)}
                      placeholder="e.g., 1st Installment / Final Balance"
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFeeModalApp(null)}
                    className="px-4 py-2 rounded border border-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingFee}
                    className="px-5 py-2 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold disabled:opacity-50"
                  >
                    {savingFee
                      ? "Saving..."
                      : feeModalMode === "APPROVE"
                      ? "Confirm Approval & Save Fee"
                      : "Record Fee Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Full-Screen Printable 3-Page Official Admission Form View */}
      {printFormApp && (
        <div className="space-y-4">
          <div className="no-print flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
            <span className="text-xs font-bold text-[#0B3D62]">
              Official 3-Page Admission Form — {printFormApp.fullName} (
              {printFormApp.enrollmentNumber || printFormApp.applicationRef})
            </span>
            <button
              type="button"
              onClick={() => setPrintFormApp(null)}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-[#0B3D62]"
            >
              <X className="w-4 h-4" /> Close Form Preview
            </button>
          </div>
          <PrintableAdmissionForm record={printFormApp} />
        </div>
      )}

      {/* View Application Details Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border-t-4 border-[#0B3D62] shadow-xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#0B3D62]">
                  {selected.fullName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Ref: {selected.applicationRef}
                  {selected.enrollmentNumber
                    ? ` | Enrollment: ${selected.enrollmentNumber}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded border border-slate-200">
              <div>
                <span className="text-slate-500">Course: </span>
                <strong className="text-[#0B3D62]">{selected.courseName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Session / Mode: </span>
                <strong>
                  {selected.session} / {selected.studyMode}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Father&apos;s Name: </span>
                <strong>{selected.fatherName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Mother&apos;s Name: </span>
                <strong>{selected.motherName}</strong>
              </div>
              <div>
                <span className="text-slate-500">DOB / Gender / Category: </span>
                <strong>
                  {formatDisplayDate(selected.dob)} | {selected.gender} |{" "}
                  {selected.category}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Aadhar: </span>
                <strong>{selected.aadharNumber || "—"}</strong>
              </div>
              <div>
                <span className="text-slate-500">Mobile / Email: </span>
                <strong>
                  {selected.mobile} | {selected.email}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Address: </span>
                <strong>
                  {selected.address} {selected.city} {selected.state}{" "}
                  {selected.pincode}
                </strong>
              </div>
            </div>

            {/* Uploaded Documents */}
            <div>
              <h4 className="text-xs font-bold uppercase text-[#0B3D62] mb-2">
                Uploaded Documents
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Passport Photo", url: selected.photoUrl },
                  { label: "Signature", url: selected.signatureUrl },
                  { label: "Marksheet", url: selected.marksheetUrl },
                  { label: "ID Proof", url: selected.idProofUrl },
                ].map((doc) => (
                  <div
                    key={doc.label}
                    className="border border-slate-200 rounded p-2 text-center bg-slate-50"
                  >
                    <p className="text-[10px] font-bold text-slate-600 mb-1.5">
                      {doc.label}
                    </p>
                    {doc.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={doc.url}
                        alt={doc.label}
                        className="h-24 mx-auto object-contain rounded bg-white"
                      />
                    ) : (
                      <div className="h-24 flex items-center justify-center text-[10px] text-slate-400">
                        Not uploaded
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              {selected.status !== "APPROVED" && (
                <button
                  type="button"
                  onClick={() => {
                    const target = selected;
                    setSelected(null);
                    openFeeModal(target, "APPROVE");
                  }}
                  className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                >
                  Approve &amp; Record Fee
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded border border-slate-300 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Offline Student Modal */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
          onClick={() => setAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-t-4 border-[#0B3D62] shadow-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#0B3D62]">
                  Add Offline Enrolled Student
                </h3>
                <p className="text-xs text-slate-500">
                  Directly enrolls the student as Approved with an auto-generated Enrollment
                  Number.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {offlineError && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
                {offlineError}
              </div>
            )}

            <form onSubmit={handleCreateOffline} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Course *</label>
                  <select
                    value={offlineForm.courseId}
                    onChange={(e) =>
                      setOfflineForm({ ...offlineForm, courseId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.code}] {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={offlineForm.fullName}
                    onChange={(e) =>
                      setOfflineForm({ ...offlineForm, fullName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Father&apos;s Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={offlineForm.fatherName}
                    onChange={(e) =>
                      setOfflineForm({ ...offlineForm, fatherName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mother&apos;s Name
                  </label>
                  <input
                    type="text"
                    value={offlineForm.motherName}
                    onChange={(e) =>
                      setOfflineForm({ ...offlineForm, motherName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    required
                    type="date"
                    value={offlineForm.dob}
                    onChange={(e) =>
                      setOfflineForm({ ...offlineForm, dob: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile *</label>
                  <input
                    required
                    type="tel"
                    value={offlineForm.mobile}
                    onChange={(e) =>
                      setOfflineForm({ ...offlineForm, mobile: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={offlineForm.email}
                    onChange={(e) =>
                      setOfflineForm({ ...offlineForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Session</label>
                  <select
                    value={offlineForm.session}
                    onChange={(e) =>
                      setOfflineForm({ ...offlineForm, session: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    {ACADEMIC_SESSIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Student Photo (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleOfflinePhoto}
                    className="w-full text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={offlineForm.address}
                    onChange={(e) =>
                      setOfflineForm({ ...offlineForm, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOffline}
                  className="px-5 py-2 rounded bg-[#0B3D62] hover:bg-[#135589] text-white font-bold"
                >
                  {savingOffline ? "Enrolling..." : "Enroll & Generate ID"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
