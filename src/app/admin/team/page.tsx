"use client";

import React, { useEffect, useState } from "react";
import {
  UsersRound,
  Plus,
  Trash2,
  Edit3,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { apiFetch } from "@/lib/api";

interface AdminTeamMember {
  id: string;
  name: string;
  designation: string;
  shortIntro: string;
  photoUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

const EMPTY_MEMBER = {
  id: "",
  name: "",
  designation: "",
  shortIntro: "",
  photoUrl: "",
  sortOrder: "0",
};

function compressPortrait(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Read error"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Invalid image"));
      img.onload = () => {
        const SIZE = 480;
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
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function AdminTeamContent() {
  const [members, setMembers] = useState<AdminTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_MEMBER);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function loadMembers() {
    setLoading(true);
    try {
      const res = await apiFetch(`/team.php?all=true&_t=${Date.now()}`);
      const d = await res.json();
      if (res.ok && Array.isArray(d.members)) setMembers(d.members);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  function openNew() {
    setForm({
      ...EMPTY_MEMBER,
      sortOrder: String(members.length + 1),
    });
    setMsg(null);
    setModalOpen(true);
  }

  function openEdit(m: AdminTeamMember) {
    setForm({
      id: m.id,
      name: m.name,
      designation: m.designation,
      shortIntro: m.shortIntro,
      photoUrl: m.photoUrl || "",
      sortOrder: String(m.sortOrder ?? 0),
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
        isEdit ? `/team.php?id=${encodeURIComponent(form.id)}` : "/team.php",
        {
          method: isEdit ? "PATCH" : "POST",
          body: JSON.stringify({
            name: form.name,
            designation: form.designation,
            shortIntro: form.shortIntro,
            photoUrl: form.photoUrl || null,
            sortOrder: Number(form.sortOrder) || 0,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: data.error || "Failed to save team member." });
      } else if (data.member) {
        if (isEdit) {
          setMembers((prev) =>
            prev
              .map((x) => (x.id === form.id ? data.member : x))
              .sort((a, b) => a.sortOrder - b.sortOrder)
          );
        } else {
          setMembers((prev) =>
            [...prev, data.member].sort((a, b) => a.sortOrder - b.sortOrder)
          );
        }
        setModalOpen(false);
        setMsg({
          type: "ok",
          text: "Team member saved! It is now live in the Our Team section.",
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(m: AdminTeamMember) {
    const res = await apiFetch(`/team.php?id=${encodeURIComponent(m.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !m.isActive }),
    });
    const data = await res.json();
    if (res.ok && data.member) {
      setMembers((prev) => prev.map((x) => (x.id === m.id ? data.member : x)));
    }
  }

  async function handleDelete(m: AdminTeamMember) {
    if (!confirm(`Delete team member "${m.name}"?`)) return;
    const res = await apiFetch(`/team.php?id=${encodeURIComponent(m.id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((x) => x.id !== m.id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D62] flex items-center gap-2">
            <UsersRound className="w-6 h-6 text-[#F07228]" />
            Our Team Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, edit, reorder, or remove team members (photo, name, designation &amp; short intro)
            displayed on the public Our Team page and Home Page.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white text-xs font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Team Member
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
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-sm text-slate-500">
          Loading team members...
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center space-y-3">
          <UsersRound className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-[#0B3D62]">No Team Members Added Yet</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click &ldquo;Add Team Member&rdquo; above to add leadership, trainers, and staff
            profiles with their photo, name, and short introduction.
          </p>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B3D62] hover:bg-[#135589] text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> Add First Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {members.map((m) => (
            <div
              key={m.id}
              className={`bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col justify-between transition-opacity ${
                m.isActive ? "border-slate-200" : "border-amber-300 opacity-75"
              }`}
            >
              <div>
                <div className="h-2 bg-gradient-to-r from-[#0B3D62] via-[#135589] to-[#F07228]" />
                <div className="p-5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-[#0B3D62] to-[#F07228] shrink-0">
                      {m.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.photoUrl}
                          alt={m.name}
                          className="w-full h-full rounded-full object-cover bg-white"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-[#0B3D62] text-white font-bold flex items-center justify-center text-base">
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-extrabold text-[#0B3D62] truncate">
                          {m.name}
                        </h3>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                          #{m.sortOrder}
                        </span>
                      </div>
                      {m.designation && (
                        <p className="text-[11px] font-bold text-[#D65B14] mt-0.5 truncate">
                          {m.designation}
                        </p>
                      )}
                      {!m.isActive && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Hidden from Public
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-3 whitespace-pre-line">
                    {m.shortIntro}
                  </p>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleActive(m)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-[#0B3D62]"
                >
                  {m.isActive ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Show
                    </>
                  )}
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(m)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(m)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Team Member Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-[#0B3D62] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {form.id ? "Edit Team Member" : "Add New Team Member"}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full p-[2.5px] bg-gradient-to-tr from-[#0B3D62] to-[#F07228] shrink-0 overflow-hidden">
                  {form.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.photoUrl}
                      alt="Team Member"
                      className="w-full h-full rounded-full object-cover bg-white"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                      Photo
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer font-bold text-[#0B3D62]">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Member Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const url = await compressPortrait(f);
                        setForm((prev) => ({ ...prev, photoUrl: url }));
                      }}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500">
                    JPG / PNG portrait photo (auto-resized for fast loading)
                  </p>
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
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Rohit Sharma"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    placeholder="e.g., Managing Director / Faculty"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Intro *</label>
                <textarea
                  rows={4}
                  required
                  value={form.shortIntro}
                  onChange={(e) => setForm({ ...form, shortIntro: e.target.value })}
                  placeholder="Write a brief introduction, experience, or responsibilities..."
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
                  {saving ? "Saving..." : form.id ? "Update Member" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminTeamPage() {
  return (
    <AdminGuard>
      <AdminTeamContent />
    </AdminGuard>
  );
}
