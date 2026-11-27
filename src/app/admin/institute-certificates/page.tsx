"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { apiFetch } from "@/lib/api";

interface InstituteCertItem {
  id: string;
  badge: string;
  title: string;
  authority: string;
  certNumber: string;
  validity: string;
  description: string;
  imageUrl: string;
  pdfUrl: string;
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Read error"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Invalid image"));
      img.onload = () => {
        const MAX_W = 1200;
        const scale = img.width > MAX_W ? MAX_W / img.width : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function InstituteCertsContent() {
  const [certs, setCerts] = useState<InstituteCertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [form, setForm] = useState({
    badge: "Govt. of India • Recognition",
    title: "",
    authority: "",
    certNumber: "",
    validity: "",
    description: "",
    imageUrl: "",
    pdfUrl: "",
  });

  async function loadCerts() {
    setLoading(true);
    try {
      const res = await apiFetch(`/institute-certifications.php?_t=${Date.now()}`);
      const d = await res.json();
      if (res.ok && Array.isArray(d.certifications)) {
        setCerts(d.certifications);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCerts();
  }, []);

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch {
      setMsg({ type: "err", text: "Please select a valid JPG/PNG certificate image." });
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.imageUrl) {
      setMsg({ type: "err", text: "Please upload the certificate image." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiFetch("/institute-certifications.php", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: data.error || "Failed to add certificate." });
      } else if (data.certification) {
        setCerts((prev) => [...prev, data.certification]);
        setAddOpen(false);
        setForm({
          badge: "Govt. of India • Recognition",
          title: "",
          authority: "",
          certNumber: "",
          validity: "",
          description: "",
          imageUrl: "",
          pdfUrl: "",
        });
        setMsg({ type: "ok", text: "Institute certificate added! It is now live on the website." });
      }
    } catch {
      setMsg({ type: "err", text: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cert: InstituteCertItem) {
    if (!confirm(`Remove "${cert.title}" from Our Certifications section?`)) return;
    const res = await apiFetch(
      `/institute-certifications.php?id=${encodeURIComponent(cert.id)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setCerts((prev) => prev.filter((c) => c.id !== cert.id));
      setMsg({ type: "ok", text: "Certificate removed from website." });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D62] flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#F07228]" />
            Institute Accreditations &amp; Certificates
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add or remove official institute certificates (ISO, DPIIT, Skill India, MCA, GST,
            NIELIT, etc.) shown in the &ldquo;Our Certifications&rdquo; section on Home &amp;
            About pages.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMsg(null);
            setAddOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white text-xs font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Institute Certificate
        </button>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            msg.type === "ok"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {msg.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-sm text-slate-500">
          Loading institute certificates...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {certs.map((cert) => (
            <div
              key={cert.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col"
            >
              <div className="h-48 bg-slate-100 border-b border-slate-200 p-3 flex items-center justify-center relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cert.imageUrl}
                  alt={cert.title}
                  className="max-h-full max-w-full object-contain rounded shadow-sm"
                />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#0B3D62] text-white text-[10px] font-bold">
                  {cert.badge}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#0B3D62]">{cert.title}</h3>
                  <p className="text-[11px] text-slate-600">{cert.authority}</p>
                  <p className="text-[11px] font-mono text-[#D65B14] font-semibold">
                    {cert.certNumber}
                  </p>
                  {cert.validity && (
                    <p className="text-[11px] text-slate-500">{cert.validity}</p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <a
                    href={cert.pdfUrl || cert.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#135589] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(cert)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Institute Certificate Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-[#0B3D62] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Add Official Institute Certificate</h3>
              <button type="button" onClick={() => setAddOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload Certificate Image (JPG / PNG) *
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:border-[#0B3D62] bg-slate-50">
                  <Upload className="w-5 h-5 text-[#0B3D62] mb-1" />
                  <span className="font-semibold text-slate-700">
                    Click to choose certificate image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImagePick}
                    className="hidden"
                  />
                </label>
                {form.imageUrl && (
                  <div className="mt-2 border border-slate-200 rounded-lg p-2 bg-slate-50 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.imageUrl}
                      alt="Certificate Preview"
                      className="max-h-36 object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Badge Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    placeholder="e.g., NIELIT • Govt. of India"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Certificate / Reg. Number
                  </label>
                  <input
                    type="text"
                    value={form.certNumber}
                    onChange={(e) => setForm({ ...form, certNumber: e.target.value })}
                    placeholder="e.g., ACCR-12345"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Certificate Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., NIELIT Accredited Facilitation Centre"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Issuing Authority
                  </label>
                  <input
                    type="text"
                    value={form.authority}
                    onChange={(e) => setForm({ ...form, authority: e.target.value })}
                    placeholder="e.g., Ministry of Electronics & IT"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Validity / Issued Date
                  </label>
                  <input
                    type="text"
                    value={form.validity}
                    onChange={(e) => setForm({ ...form, validity: e.target.value })}
                    placeholder="e.g., Valid till 2028"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this recognition..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white font-bold disabled:opacity-60"
                >
                  {saving ? "Uploading..." : "Add Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminInstituteCertificatesPage() {
  return (
    <AdminGuard>
      <InstituteCertsContent />
    </AdminGuard>
  );
}
