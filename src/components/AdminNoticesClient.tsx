"use client";

import React, { useState } from "react";
import { Plus, Trash2, Megaphone, X, Bell } from "lucide-react";
import { formatDisplayDate } from "@/lib/generators";
import { apiFetch } from "@/lib/api";

interface NoticeItem {
  id: string;
  title: string;
  refNumber: string;
  category: string;
  content: string;
  publishedDate: string;
  isNew: boolean;
  showInTicker: boolean;
  attachmentLabel: string | null;
}

export function AdminNoticesClient({
  initialNotices,
}: {
  initialNotices: NoticeItem[];
}) {
  const [notices, setNotices] = useState<NoticeItem[]>(initialNotices);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    refNumber: "",
    category: "Admission",
    publishedDate: new Date().toISOString().slice(0, 10),
    content: "",
    attachmentLabel: "",
    isNew: true,
    showInTicker: true,
  });

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch("/notices.php", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.notice) {
        setNotices((prev) => [data.notice, ...prev]);
        setModalOpen(false);
        setForm({
          title: "",
          refNumber: "",
          category: "Admission",
          publishedDate: new Date().toISOString().slice(0, 10),
          content: "",
          attachmentLabel: "",
          isNew: true,
          showInTicker: true,
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleField(notice: NoticeItem, field: "isNew" | "showInTicker") {
    const nextVal = !notice[field];
    const res = await apiFetch(`/notices.php?id=${encodeURIComponent(notice.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ [field]: nextVal }),
    });
    if (res.ok) {
      setNotices((prev) =>
        prev.map((n) => (n.id === notice.id ? { ...n, [field]: nextVal } : n))
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this notice from the portal?")) return;
    const res = await apiFetch(`/notices.php?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setNotices((prev) => prev.filter((n) => n.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D62]">
            Notice Board &amp; Ticker Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Publish official announcements to the Home Page Notice Board and live Top
            Scrolling Ticker.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white text-xs font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" /> Publish Notice
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-200">
        {notices.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No notices published yet.
          </div>
        ) : (
          notices.map((n) => (
            <div
              key={n.id}
              className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="font-mono font-bold text-[#0B3D62]">
                    {n.refNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-[#135589] font-semibold">
                    {n.category}
                  </span>
                  <span className="text-slate-500">
                    {formatDisplayDate(n.publishedDate)}
                  </span>
                  {n.isNew && (
                    <span className="px-1.5 py-0.5 rounded bg-[#F07228] text-white font-bold text-[10px]">
                      NEW
                    </span>
                  )}
                  {n.showInTicker && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      <Bell className="w-3 h-3" /> In Top Ticker
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-[#0B3D62]">{n.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">{n.content}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleField(n, "showInTicker")}
                  className="px-2.5 py-1.5 rounded border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                >
                  {n.showInTicker ? "Remove from Ticker" : "Add to Ticker"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleField(n, "isNew")}
                  className="px-2.5 py-1.5 rounded border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                >
                  {n.isNew ? "Unmark NEW" : "Mark NEW"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  className="p-1.5 rounded text-red-600 hover:bg-red-50"
                  title="Delete Notice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Publish Notice Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg max-w-xl w-full border-t-4 border-[#0B3D62] shadow-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#D65B14]" />
                <h3 className="text-lg font-bold text-[#0B3D62]">
                  Publish Official Notice / Circular
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublish} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Notice Headline *
                </label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Admission Deadline Extended for July 2026 Session"
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Circular Ref No.
                  </label>
                  <input
                    type="text"
                    value={form.refNumber}
                    onChange={(e) => setForm({ ...form, refNumber: e.target.value })}
                    placeholder="Auto if blank"
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option>Admission</option>
                    <option>Examination</option>
                    <option>Result</option>
                    <option>Circular</option>
                    <option>General</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Published Date
                  </label>
                  <input
                    type="date"
                    value={form.publishedDate}
                    onChange={(e) =>
                      setForm({ ...form, publishedDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Circular Body / Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Document Reference Label (Optional)
                </label>
                <input
                  type="text"
                  value={form.attachmentLabel}
                  onChange={(e) =>
                    setForm({ ...form, attachmentLabel: e.target.value })
                  }
                  placeholder="e.g., Official Notification Circular (PDF)"
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div className="flex flex-wrap gap-5 pt-1">
                <label className="inline-flex items-center gap-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isNew}
                    onChange={(e) => setForm({ ...form, isNew: e.target.checked })}
                  />
                  Show &ldquo;NEW&rdquo; Badge
                </label>
                <label className="inline-flex items-center gap-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.showInTicker}
                    onChange={(e) =>
                      setForm({ ...form, showInTicker: e.target.checked })
                    }
                  />
                  Display in Top Scrolling Ticker
                </label>
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
                  {saving ? "Publishing..." : "Publish Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
