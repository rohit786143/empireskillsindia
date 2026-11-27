"use client";

import React, { useEffect, useState } from "react";
import {
  MessageSquareHeart,
  Plus,
  Trash2,
  Edit3,
  Upload,
  X,
  Star,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { apiFetch } from "@/lib/api";

interface AdminReviewRow {
  id: string;
  studentName: string;
  courseName: string;
  batchLabel: string;
  rating: number;
  reviewText: string;
  photoUrl: string | null;
  isActive: boolean;
}

const EMPTY_REVIEW = {
  id: "",
  studentName: "",
  courseName: "",
  batchLabel: "Mandi • Batch 2026",
  rating: "5",
  reviewText: "",
  photoUrl: "",
};

function compressAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Read error"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Invalid image"));
      img.onload = () => {
        const SIZE = 320;
        const scale = Math.min(1, SIZE / Math.max(img.width, img.height));
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

function AdminReviewsContent() {
  const [reviews, setReviews] = useState<AdminReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_REVIEW);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function loadReviews() {
    setLoading(true);
    try {
      const res = await apiFetch(`/reviews.php?all=true&_t=${Date.now()}`);
      const d = await res.json();
      if (res.ok && Array.isArray(d.reviews)) setReviews(d.reviews);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  function openNew() {
    setForm(EMPTY_REVIEW);
    setMsg(null);
    setModalOpen(true);
  }

  function openEdit(r: AdminReviewRow) {
    setForm({
      id: r.id,
      studentName: r.studentName,
      courseName: r.courseName,
      batchLabel: r.batchLabel,
      rating: String(r.rating),
      reviewText: r.reviewText,
      photoUrl: r.photoUrl || "",
    });
    setMsg(null);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const isEdit = Boolean(form.id);
      const res = await apiFetch(
        isEdit ? `/reviews.php?id=${encodeURIComponent(form.id)}` : "/reviews.php",
        {
          method: isEdit ? "PATCH" : "POST",
          body: JSON.stringify({
            studentName: form.studentName,
            courseName: form.courseName,
            batchLabel: form.batchLabel,
            rating: Number(form.rating) || 5,
            reviewText: form.reviewText,
            photoUrl: form.photoUrl || null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: data.error || "Failed to save review." });
      } else if (data.review) {
        if (isEdit) {
          setReviews((prev) => prev.map((x) => (x.id === form.id ? data.review : x)));
        } else {
          setReviews((prev) => [data.review, ...prev]);
        }
        setModalOpen(false);
        setMsg({ type: "ok", text: "Student review saved! It is now live on the Home Page slider." });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(r: AdminReviewRow) {
    if (!confirm(`Delete review by "${r.studentName}"?`)) return;
    const res = await apiFetch(`/reviews.php?id=${encodeURIComponent(r.id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D62] flex items-center gap-2">
            <MessageSquareHeart className="w-6 h-6 text-[#F07228]" />
            Student Reviews Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, edit, or delete student testimonials with circular profile photos shown in the
            Home Page right-to-left review slider.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white text-xs font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Student Review
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
          Loading student reviews...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-[#0B3D62] to-[#F07228] shrink-0">
                    {r.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.photoUrl}
                        alt={r.studentName}
                        className="w-full h-full rounded-full object-cover bg-white"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#0B3D62] text-white font-bold flex items-center justify-center text-sm">
                        {r.studentName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#0B3D62] truncate">{r.studentName}</h3>
                    <p className="text-[11px] text-[#D65B14] font-semibold truncate">
                      {r.batchLabel}
                    </p>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  &ldquo;{r.reviewText}&rdquo;
                </p>
                {r.courseName && (
                  <p className="mt-2 text-[11px] font-bold text-[#0B3D62]">{r.courseName}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openEdit(r)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(r)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Review Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-[#0B3D62] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {form.id ? "Edit Student Review" : "Add New Student Review"}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#0B3D62] to-[#F07228] shrink-0 overflow-hidden">
                  {form.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.photoUrl}
                      alt="Student"
                      className="w-full h-full rounded-full object-cover bg-white"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                      Photo
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer font-bold text-[#0B3D62]">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Circular Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const url = await compressAvatar(f);
                        setForm((prev) => ({ ...prev, photoUrl: url }));
                      }}
                      className="hidden"
                    />
                  </label>
                  {form.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, photoUrl: "" })}
                      className="block text-[11px] font-bold text-red-600 hover:underline"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Name *</label>
                <input
                  type="text"
                  required
                  value={form.studentName}
                  onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                  placeholder="e.g., Priya Sharma"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Course Name</label>
                  <input
                    type="text"
                    value={form.courseName}
                    onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                    placeholder="e.g., DCA / Tally PRIME"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City &amp; Batch</label>
                  <input
                    type="text"
                    value={form.batchLabel}
                    onChange={(e) => setForm({ ...form, batchLabel: e.target.value })}
                    placeholder="e.g., Mandi • Batch 2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Star Rating</label>
                <select
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="5">★★★★★ (5 Stars)</option>
                  <option value="4">★★★★☆ (4 Stars)</option>
                  <option value="3">★★★☆☆ (3 Stars)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Review *</label>
                <textarea
                  rows={3}
                  required
                  value={form.reviewText}
                  onChange={(e) => setForm({ ...form, reviewText: e.target.value })}
                  placeholder="Write student's feedback..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white font-bold disabled:opacity-60"
                >
                  {saving ? "Saving..." : form.id ? "Update Review" : "Add Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminReviewsPage() {
  return (
    <AdminGuard>
      <AdminReviewsContent />
    </AdminGuard>
  );
}
