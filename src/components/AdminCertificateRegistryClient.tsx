"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Printer,
  Edit3,
  Trash2,
  Ban,
  CheckCircle2,
  PlusCircle,
  X,
  Building2,
} from "lucide-react";
import {
  PrintableCertificate,
  type CertificateData,
} from "./PrintableCertificate";
import { formatDisplayDate } from "@/lib/generators";
import { apiFetch } from "@/lib/api";
import { useAdminCenter } from "./AdminCenterContext";

interface CertRow extends CertificateData {
  id: string;
  status: string;
  franchiseId?: string | null;
  franchiseName?: string | null;
  franchiseCode?: string | null;
  createdAt: string;
}

export function AdminCertificateRegistryClient({
  initialCertificates,
}: {
  initialCertificates: CertRow[];
}) {
  const [certificates, setCertificates] = useState<CertRow[]>(initialCertificates);
  const { centers, selectedCenterId, setSelectedCenterId } = useAdminCenter();
  const [search, setSearch] = useState("");
  const [previewCert, setPreviewCert] = useState<CertRow | null>(null);
  const [editingCert, setEditingCert] = useState<CertRow | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const filtered = certificates.filter((c) => {
    if (selectedCenterId && selectedCenterId !== "ALL" && c.franchiseId !== selectedCenterId) {
      return false;
    }
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return `${c.certificateNumber} ${c.enrollmentNumber} ${c.studentName} ${c.courseName} ${c.franchiseName || ""} ${c.franchiseCode || ""}`
      .toLowerCase()
      .includes(q);
  });

  async function toggleStatus(cert: CertRow) {
    const nextStatus = cert.status === "VALID" ? "REVOKED" : "VALID";
    const res = await apiFetch(`/certificates.php?id=${encodeURIComponent(cert.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      setCertificates((prev) =>
        prev.map((c) => (c.id === cert.id ? { ...c, status: nextStatus } : c))
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Permanently delete this certificate from the registry?")) return;
    const res = await apiFetch(`/certificates.php?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setCertificates((prev) => prev.filter((c) => c.id !== id));
      if (previewCert?.id === id) setPreviewCert(null);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCert) return;
    setSavingEdit(true);
    try {
      const res = await apiFetch(
        `/certificates.php?id=${encodeURIComponent(editingCert.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
          studentName: editingCert.studentName,
          fatherName: editingCert.fatherName,
          courseName: editingCert.courseName,
          duration: editingCert.duration,
          session: editingCert.session,
          percentage: editingCert.percentage,
          grade: editingCert.grade,
          issueDate: editingCert.issueDate,
        }),
      });
      const data = await res.json();
      if (res.ok && data.certificate) {
        setCertificates((prev) =>
          prev.map((c) =>
            c.id === editingCert.id ? { ...c, ...data.certificate } : c
          )
        );
        setEditingCert(null);
      }
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D62]">
            Certificate Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, re-print, edit, revoke, or delete issued Empire Skills India certificates.
          </p>
        </div>
        <Link
          href="/admin/certificates/generate"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded bg-[#F07228] hover:bg-[#F07228] text-white text-xs font-bold shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Generate New Certificate
        </Link>
      </div>

      {/* Live Preview Panel when user clicks Re-print */}
      {previewCert && (
        <div className="space-y-3">
          <div className="no-print flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
            <span className="text-xs font-bold text-[#0B3D62]">
              Viewing Certificate: {previewCert.certificateNumber} ({previewCert.studentName})
            </span>
            <button
              type="button"
              onClick={() => setPreviewCert(null)}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#0B3D62]"
            >
              <X className="w-4 h-4" /> Close Preview
            </button>
          </div>
          <PrintableCertificate certificate={previewCert} />
        </div>
      )}

      {/* Search & Center Filter */}
      <div className="no-print bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
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

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search certificate no., student, course..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
            />
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-500 shrink-0">
          Total: {filtered.length} certificates
        </span>
      </div>

      {/* Registry Table */}
      <div className="no-print bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#0B3D62] text-white uppercase">
            <tr>
              <th className="py-3 px-4">Certificate / Enrollment No.</th>
              <th className="py-3 px-4">Student Details</th>
              <th className="py-3 px-4">Programme</th>
              <th className="py-3 px-4">Grade &amp; Issue Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No certificates found.
                </td>
              </tr>
            ) : (
              filtered.map((cert) => (
                <tr key={cert.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono">
                    <div className="font-bold text-[#D65B14]">
                      {cert.certificateNumber}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {cert.enrollmentNumber}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#0B3D62]">{cert.studentName}</div>
                    <div className="text-[11px] text-slate-500">
                      S/o {cert.fatherName}
                    </div>
                    {cert.franchiseName && (
                      <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 text-[#D65B14] font-bold text-[10px]">
                        <Building2 className="w-3 h-3" />
                        {cert.franchiseCode ? `[${cert.franchiseCode}] ` : ""}
                        {cert.franchiseName}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{cert.courseName}</div>
                    <div className="text-[11px] text-slate-500">
                      {cert.duration} {cert.session ? `• ${cert.session}` : ""}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#0B3D62]">
                      Grade {cert.grade}
                      {cert.percentage !== null ? ` (${cert.percentage}%)` : ""}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {formatDisplayDate(cert.issueDate)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        cert.status === "VALID"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {cert.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewCert(cert)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white font-bold"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCert(cert)}
                        className="p-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                        title="Edit Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStatus(cert)}
                        className={`p-1.5 rounded border ${
                          cert.status === "VALID"
                            ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                            : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        }`}
                        title={
                          cert.status === "VALID"
                            ? "Revoke Certificate"
                            : "Restore Certificate"
                        }
                      >
                        {cert.status === "VALID" ? (
                          <Ban className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cert.id)}
                        className="p-1.5 rounded text-red-600 hover:bg-red-50"
                        title="Delete Certificate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingCert && (
        <div
          className="no-print fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
          onClick={() => setEditingCert(null)}
        >
          <div
            className="bg-white rounded-lg max-w-lg w-full border-t-4 border-[#0B3D62] shadow-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-base font-bold text-[#0B3D62]">
                Edit Certificate ({editingCert.certificateNumber})
              </h3>
              <button
                type="button"
                onClick={() => setEditingCert(null)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Student Name
                  </label>
                  <input
                    required
                    type="text"
                    value={editingCert.studentName}
                    onChange={(e) =>
                      setEditingCert({ ...editingCert, studentName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Father&apos;s Name
                  </label>
                  <input
                    required
                    type="text"
                    value={editingCert.fatherName}
                    onChange={(e) =>
                      setEditingCert({ ...editingCert, fatherName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Course Name
                  </label>
                  <input
                    required
                    type="text"
                    value={editingCert.courseName}
                    onChange={(e) =>
                      setEditingCert({ ...editingCert, courseName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration</label>
                  <input
                    required
                    type="text"
                    value={editingCert.duration}
                    onChange={(e) =>
                      setEditingCert({ ...editingCert, duration: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issue Date</label>
                  <input
                    required
                    type="date"
                    value={editingCert.issueDate}
                    onChange={(e) =>
                      setEditingCert({ ...editingCert, issueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCert.percentage ?? ""}
                    onChange={(e) =>
                      setEditingCert({
                        ...editingCert,
                        percentage: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grade</label>
                  <select
                    value={editingCert.grade}
                    onChange={(e) =>
                      setEditingCert({ ...editingCert, grade: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingCert(null)}
                  className="px-4 py-2 rounded border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded bg-[#0B3D62] hover:bg-[#135589] text-white font-bold"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
