"use client";

import React, { useState } from "react";
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  Ban,
  CheckCircle2,
  X,
  ExternalLink,
  Copy,
  QrCode,
  Upload,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface FranchiseRow {
  id: string;
  centerCode: string;
  centerName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  status: string;
  paymentQrUrl?: string;
  upiId?: string;
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  registrationFee?: number;
  isMainCenter?: boolean;
  stats?: {
    totalApps: number;
    forwardedApps: number;
    approvedApps: number;
  };
}

const EMPTY_FORM = {
  id: "",
  centerCode: "",
  centerName: "",
  ownerName: "",
  email: "",
  password: "",
  phone: "",
  city: "",
  state: "",
  address: "",
  paymentQrUrl: "",
  upiId: "",
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  registrationFee: "500",
};

export function AdminFranchisesClient({
  initialFranchises,
}: {
  initialFranchises: FranchiseRow[];
}) {
  const [franchises, setFranchises] = useState<FranchiseRow[]>(initialFranchises);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function openNew() {
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  }

  function openEdit(f: FranchiseRow) {
    setForm({
      id: f.id,
      centerCode: f.centerCode,
      centerName: f.centerName,
      ownerName: f.ownerName,
      email: f.email,
      password: "",
      phone: f.phone,
      city: f.city,
      state: f.state,
      address: f.address,
      paymentQrUrl: f.paymentQrUrl || "",
      upiId: f.upiId || "",
      bankName: f.bankName || "",
      accountHolderName: f.accountHolderName || "",
      accountNumber: f.accountNumber || "",
      ifscCode: f.ifscCode || "",
      registrationFee: String(f.registrationFee || 500),
    });
    setError("");
    setModalOpen(true);
  }

  function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("QR Code image must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((prev) => ({ ...prev, paymentQrUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const isEdit = Boolean(form.id);
      const paymentFields = {
        paymentQrUrl: form.paymentQrUrl,
        upiId: form.upiId,
        bankName: form.bankName,
        accountHolderName: form.accountHolderName,
        accountNumber: form.accountNumber,
        ifscCode: form.ifscCode,
        registrationFee: Number(form.registrationFee) || 500,
      };
      const payload = isEdit
        ? {
          centerName: form.centerName,
          ownerName: form.ownerName,
          email: form.email,
          phone: form.phone,
          city: form.city,
          state: form.state,
          address: form.address,
          ...paymentFields,
          ...(form.password.trim() ? { newPassword: form.password.trim() } : {}),
        }
        : {
          centerCode: form.centerCode,
          centerName: form.centerName,
          ownerName: form.ownerName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          city: form.city,
          state: form.state,
          address: form.address,
          ...paymentFields,
        };

      const res = await apiFetch(
        isEdit ? `/franchises.php?id=${encodeURIComponent(form.id)}` : "/franchises.php",
        {
          method: isEdit ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save franchise.");
      } else {
        if (isEdit) {
          setFranchises((prev) =>
            prev.map((f) =>
              f.id === form.id ? { ...f, ...data.franchise } : f
            )
          );
        } else {
          setFranchises((prev) => [data.franchise, ...prev]);
        }
        setModalOpen(false);
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(f: FranchiseRow) {
    const next = f.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const res = await apiFetch(`/franchises.php?id=${encodeURIComponent(f.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setFranchises((prev) =>
        prev.map((x) => (x.id === f.id ? { ...x, status: next } : x))
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this franchise center permanently?")) return;
    const res = await apiFetch(`/franchises.php?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setFranchises((prev) => prev.filter((x) => x.id !== id));
    }
  }

  function copyLoginInfo(f: FranchiseRow) {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://empireskillsindia.com";
    const text = `Empire Skills India — Franchise Portal\nCenter: ${f.centerName} (${f.centerCode})\nLogin URL: ${origin}/franchise/login\nEmail: ${f.email}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(f.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D62]">
            Franchise / Authorized Study Centers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create franchise study centers with dedicated login credentials. Active centers
            automatically appear in the Online Admission Form for students to select.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/franchise/login"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Franchise Portal
          </a>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white text-xs font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add New Franchise
          </button>
        </div>
      </div>

      {/* Franchise Cards / Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#0B3D62] text-white uppercase">
            <tr>
              <th className="py-3 px-4">Center Code &amp; Name</th>
              <th className="py-3 px-3">Center Head &amp; Login</th>
              <th className="py-3 px-3">Location</th>
              <th className="py-3 px-3 text-center">Applications</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {franchises.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">
                  <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  No franchise centers added yet. Click &ldquo;Add New Franchise&rdquo; to
                  authorize your first Study Center.
                </td>
              </tr>
            ) : (
              franchises.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[#D65B14]">{f.centerCode}</span>
                      {(f.isMainCenter || f.centerCode?.toUpperCase() === "ESI-CTR-001") && (
                        <span className="px-1.5 py-0.5 rounded bg-[#0B3D62] text-white text-[9px] font-extrabold uppercase tracking-wider">
                          MAIN CENTER
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-[#0B3D62] text-sm">{f.centerName}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">{f.ownerName}</div>
                    <div className="text-[11px] text-slate-500">{f.email}</div>
                    <div className="text-[11px] text-slate-500">{f.phone}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-700">
                      {[f.city, f.state].filter(Boolean).join(", ") || "—"}
                    </div>
                    <div className="text-[10px] text-slate-500 max-w-[200px] truncate">
                      {f.address}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="font-bold text-[#0B3D62]">
                      {f.stats?.totalApps ?? 0} Total
                    </div>
                    <div className="text-[10px] text-amber-700 font-semibold">
                      {f.stats?.forwardedApps ?? 0} Forwarded •{" "}
                      <span className="text-emerald-700">
                        {f.stats?.approvedApps ?? 0} Enrolled
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${f.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                        }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyLoginInfo(f)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold"
                        title="Copy Franchise Login Info"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedId === f.id ? "Copied!" : "Login"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(f)}
                        className="p-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                        title="Edit / Reset Password"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {!(f.isMainCenter || f.centerCode?.toUpperCase() === "ESI-CTR-001") && (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleStatus(f)}
                            className={`p-1.5 rounded border ${f.status === "ACTIVE"
                                ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                                : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              }`}
                            title={f.status === "ACTIVE" ? "Suspend Center" : "Activate Center"}
                          >
                            {f.status === "ACTIVE" ? (
                              <Ban className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(f.id)}
                            className="p-1.5 rounded text-red-600 hover:bg-red-50"
                            title="Delete Franchise"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Franchise Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto border-t-4 border-[#0B3D62] shadow-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-lg font-bold text-[#0B3D62]">
                {form.id ? "Edit Franchise Center" : "Register New Franchise Study Center"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Franchise / Study Center Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.centerName}
                    onChange={(e) => setForm({ ...form, centerName: e.target.value })}
                    placeholder="e.g., Empire Skills Mandi Study Center"
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Center Head / Owner Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Franchise Login Email *
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="center@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {form.id ? "Reset Password (leave blank to keep)" : "Login Password (min 6 chars) *"}
                  </label>
                  <input
                    required={!form.id}
                    minLength={form.id ? undefined : 6}
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={form.id ? "Optional new password" : "Set login password"}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City *</label>
                  <input
                    required
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g., Mandi"
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State *</label>
                  <input
                    required
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="e.g., Himachal Pradesh"
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Full Center Address
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>

                {/* Registration Fee Payment QR & Bank Details */}
                <div className="sm:col-span-2 pt-3 mt-1 border-t border-slate-200">
                  <p className="text-xs font-extrabold text-[#0B3D62] uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <QrCode className="w-4 h-4 text-[#F07228]" />
                    Center Payment QR Code &amp; Bank Details (For ₹500 Registration Fee)
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Registration Fee Amount (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.registrationFee}
                    onChange={(e) => setForm({ ...form, registrationFee: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    UPI ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.upiId}
                    onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                    placeholder="e.g., centername@sbi / 9882269009@upi"
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Upload Payment QR Code Image (PhonePe / GPay / Paytm / Bank QR)
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer font-semibold text-slate-700">
                      <Upload className="w-3.5 h-3.5 text-[#0B3D62]" />
                      Choose QR Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrUpload}
                        className="hidden"
                      />
                    </label>
                    {form.paymentQrUrl && (
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.paymentQrUrl}
                          alt="Payment QR Preview"
                          className="w-16 h-16 object-contain border border-slate-300 rounded bg-white p-0.5"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, paymentQrUrl: "" })}
                          className="text-[11px] font-bold text-red-600 hover:underline"
                        >
                          Remove QR
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    placeholder="e.g., State Bank of India"
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={form.accountHolderName}
                    onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
                    placeholder="Account holder / Center name"
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={form.accountNumber}
                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    placeholder="Enter account number"
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={form.ifscCode}
                    onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="e.g., SBIN0001234"
                    className="w-full px-3 py-2 border border-slate-300 rounded uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded bg-[#0B3D62] hover:bg-[#135589] text-white font-bold"
                >
                  {saving
                    ? "Saving..."
                    : form.id
                      ? "Update Franchise"
                      : "Create Franchise Center"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
