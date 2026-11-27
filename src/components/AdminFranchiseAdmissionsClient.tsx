"use client";

import React, { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Printer,
  Search,
  X,
  Send,
} from "lucide-react";
import { formatDisplayDate, formatINR } from "@/lib/generators";
import { apiFetch } from "@/lib/api";
import {
  PrintableAdmissionForm,
  type AdmissionFormRecord,
} from "./PrintableAdmissionForm";

interface FranchiseAppRow extends AdmissionFormRecord {
  id: string;
  status: string;
  franchiseId: string | null;
  franchiseName: string | null;
  franchiseCode: string | null;
  franchiseStatus: string;
  franchiseRemarks: string | null;
  forwardedAt: string | null;
  totalFee?: number;
  courseTotalFee?: number;
  feePaid?: number;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING_FRANCHISE: {
    label: "Pending at Franchise",
    cls: "bg-slate-100 text-slate-700",
  },
  FRANCHISE_APPROVED: {
    label: "Franchise Approved (Not Forwarded)",
    cls: "bg-blue-100 text-[#135589]",
  },
  FORWARDED_TO_MAIN: {
    label: "Forwarded to Main (Action Needed)",
    cls: "bg-amber-100 text-amber-900 border border-amber-300",
  },
  MAIN_APPROVED: {
    label: "Accepted & Enrolled by Main",
    cls: "bg-emerald-100 text-emerald-800",
  },
  MAIN_REJECTED: {
    label: "Rejected by Main",
    cls: "bg-red-100 text-red-800",
  },
  FRANCHISE_REJECTED: {
    label: "Rejected by Franchise",
    cls: "bg-red-50 text-red-700",
  },
};

export function AdminFranchiseAdmissionsClient({
  initialApplications,
}: {
  initialApplications: FranchiseAppRow[];
}) {
  const [applications, setApplications] =
    useState<FranchiseAppRow[]>(initialApplications);
  const [filterTab, setFilterTab] = useState<string>("FORWARDED_TO_MAIN");
  const [centerFilter, setCenterFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [printApp, setPrintApp] = useState<FranchiseAppRow | null>(null);

  const uniqueCenters = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of applications) {
      if (a.franchiseId && a.franchiseName) {
        map.set(
          a.franchiseId,
          `${a.franchiseCode ? `[${a.franchiseCode}] ` : ""}${a.franchiseName}`
        );
      }
    }
    return Array.from(map.entries());
  }, [applications]);

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      if (filterTab !== "ALL" && a.franchiseStatus !== filterTab) return false;
      if (centerFilter !== "ALL" && a.franchiseId !== centerFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${a.fullName} ${a.applicationRef} ${a.enrollmentNumber || ""} ${a.franchiseName || ""} ${a.franchiseCode || ""} ${a.courseName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [applications, filterTab, centerFilter, search]);

  async function handleMainDecision(app: FranchiseAppRow, action: "APPROVE" | "REJECT") {
    if (
      action === "REJECT" &&
      !confirm(`Reject application of ${app.fullName} from ${app.franchiseName}?`)
    ) {
      return;
    }
    setBusyId(app.id);
    try {
      const payload: Record<string, unknown> = { action };
      if (action === "APPROVE") {
        payload.totalFee = app.totalFee || app.courseTotalFee || 0;
      }
      const res = await apiFetch(`/admissions.php?id=${encodeURIComponent(app.id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.application) {
        setApplications((prev) =>
          prev.map((x) => (x.id === app.id ? { ...x, ...data.application } : x))
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B3D62]">
          Franchise Admissions Inbox
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review student applications submitted through Authorized Franchise Centers. Accept
          forwarded applications to issue official Enrollment Numbers, or reject them.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: "FORWARDED_TO_MAIN", label: "Forwarded to Main" },
            { key: "ALL", label: "All Franchise Apps" },
            { key: "MAIN_APPROVED", label: "Accepted by Main" },
            { key: "PENDING_FRANCHISE", label: "Pending at Franchise" },
            { key: "MAIN_REJECTED", label: "Rejected" },
          ].map((tab) => {
            const count =
              tab.key === "ALL"
                ? applications.length
                : applications.filter((a) => a.franchiseStatus === tab.key).length;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterTab(tab.key)}
                className={`px-3 py-1.5 rounded text-xs font-bold border ${
                  filterTab === tab.key
                    ? "bg-[#0B3D62] text-white border-[#0B3D62]"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={centerFilter}
            onChange={(e) => setCenterFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded bg-white"
          >
            <option value="ALL">All Franchise Centers</option>
            {uniqueCenters.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>

          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or center..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Printable Form Preview */}
      {printApp && (
        <div className="space-y-3">
          <div className="no-print flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
            <span className="text-xs font-bold text-[#0B3D62]">
              Admission Form — {printApp.fullName} (Center: {printApp.franchiseName})
            </span>
            <button
              type="button"
              onClick={() => setPrintApp(null)}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700"
            >
              <X className="w-4 h-4" /> Close
            </button>
          </div>
          <PrintableAdmissionForm record={printApp} />
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#0B3D62] text-white uppercase">
            <tr>
              <th className="py-3 px-4">From Franchise Center</th>
              <th className="py-3 px-3">Student &amp; Ref/Enrollment</th>
              <th className="py-3 px-3">Course &amp; Fee</th>
              <th className="py-3 px-3">Workflow Status &amp; Remarks</th>
              <th className="py-3 px-4 text-right">Main Admin Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-500">
                  <Send className="w-7 h-7 mx-auto text-slate-300 mb-2" />
                  No franchise applications in this view.
                </td>
              </tr>
            ) : (
              filtered.map((app) => {
                const badge = STATUS_LABELS[app.franchiseStatus] || {
                  label: app.franchiseStatus,
                  cls: "bg-slate-100 text-slate-700",
                };
                return (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1 font-mono font-bold text-[#D65B14]">
                        <Building2 className="w-3.5 h-3.5" />
                        {app.franchiseCode || "FRANCHISE"}
                      </div>
                      <div className="font-bold text-[#0B3D62]">{app.franchiseName}</div>
                      {app.forwardedAt && (
                        <div className="text-[10px] text-slate-500">
                          Forwarded: {formatDisplayDate(app.forwardedAt)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{app.fullName}</div>
                      <div className="text-[11px] text-slate-500">
                        S/o {app.fatherName} • {app.mobile}
                      </div>
                      <div className="font-mono text-[10px] text-slate-600">
                        {app.applicationRef}
                        {app.enrollmentNumber && (
                          <span className="ml-1.5 font-bold text-emerald-700">
                            • {app.enrollmentNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{app.courseName}</div>
                      <div className="text-[10px] text-slate-500">
                        {app.session} • Total:{" "}
                        <strong>
                          {formatINR(app.totalFee || app.courseTotalFee || 0)}
                        </strong>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                      {app.franchiseRemarks && (
                        <p className="text-[10px] text-slate-600 mt-1 italic">
                          &ldquo;{app.franchiseRemarks}&rdquo;
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setPrintApp(app)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white font-bold"
                        >
                          <Printer className="w-3.5 h-3.5" /> Form
                        </button>

                        {app.franchiseStatus !== "MAIN_APPROVED" && (
                          <button
                            type="button"
                            disabled={busyId === app.id}
                            onClick={() => handleMainDecision(app, "APPROVE")}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accept &amp; Enroll
                          </button>
                        )}

                        {app.franchiseStatus !== "MAIN_REJECTED" &&
                          app.franchiseStatus !== "MAIN_APPROVED" && (
                            <button
                              type="button"
                              disabled={busyId === app.id}
                              onClick={() => handleMainDecision(app, "REJECT")}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          )}
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
  );
}
