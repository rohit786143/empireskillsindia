"use client";

import React, { useEffect, useState } from "react";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit3,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { apiFetch } from "@/lib/api";

interface GalleryPhotoItem {
  id: string;
  title: string;
  event: string;
  category: string;
  src: string;
  sortOrder?: number;
}

const CATEGORY_OPTIONS = [
  "Chief Guest & Felicitation",
  "Cultural Performances",
  "Annual Function & Team",
  "Campus & Classrooms",
  "Certificate Distribution",
];

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Invalid image file."));
      img.onload = () => {
        const MAX_W = 1280;
        const scale = img.width > MAX_W ? MAX_W / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function AdminGalleryContent() {
  const [photos, setPhotos] = useState<GalleryPhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("ALL");

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newEvent, setNewEvent] = useState("Empire Skills India Event");
  const [newCategory, setNewCategory] = useState(CATEGORY_OPTIONS[0]);
  const [newSrc, setNewSrc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Edit modal
  const [editPhoto, setEditPhoto] = useState<GalleryPhotoItem | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  async function loadPhotos() {
    setLoading(true);
    try {
      const res = await apiFetch(`/gallery.php?_t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.photos)) {
        setPhotos(data.photos);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPhotos();
  }, []);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setNewSrc(dataUrl);
      if (!newTitle) {
        const base = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
        setNewTitle(base.charAt(0).toUpperCase() + base.slice(1));
      }
    } catch {
      setMsg({ type: "err", text: "Please select a valid JPG/PNG image." });
    }
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newSrc) {
      setMsg({ type: "err", text: "Please select a photo to upload." });
      return;
    }
    setUploading(true);
    setMsg(null);
    try {
      const res = await apiFetch("/gallery.php", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          event: newEvent.trim(),
          category: newCategory,
          src: newSrc,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: data.error || "Failed to upload photo." });
      } else if (data.photo) {
        setPhotos((prev) => [...prev, data.photo]);
        setAddOpen(false);
        setNewTitle("");
        setNewEvent("Empire Skills India Event");
        setNewSrc("");
        setMsg({ type: "ok", text: "Photo added to public gallery!" });
      }
    } catch {
      setMsg({ type: "err", text: "Network error while uploading photo." });
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editPhoto) return;
    setSavingEdit(true);
    try {
      const res = await apiFetch(`/gallery.php?id=${encodeURIComponent(editPhoto.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editPhoto.title,
          event: editPhoto.event,
          category: editPhoto.category,
        }),
      });
      const data = await res.json();
      if (res.ok && data.photo) {
        setPhotos((prev) =>
          prev.map((p) => (p.id === editPhoto.id ? data.photo : p))
        );
        setEditPhoto(null);
      }
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(photo: GalleryPhotoItem) {
    if (!confirm(`Delete "${photo.title}" from the Photo Gallery?`)) return;
    const res = await apiFetch(`/gallery.php?id=${encodeURIComponent(photo.id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    }
  }

  const visiblePhotos =
    filterCat === "ALL" ? photos : photos.filter((p) => p.category === filterCat);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D62] flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[#F07228]" />
            Photo Gallery Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload new event photos, edit captions/categories, or remove photos from the public
            website Photo Gallery.
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
          Add New Photo
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

      {/* Category Filter */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFilterCat("ALL")}
          className={`px-3 py-1.5 rounded text-xs font-bold border ${
            filterCat === "ALL"
              ? "bg-[#0B3D62] text-white border-[#0B3D62]"
              : "bg-slate-50 text-slate-700 border-slate-200"
          }`}
        >
          All ({photos.length})
        </button>
        {CATEGORY_OPTIONS.map((cat) => {
          const cnt = photos.filter((p) => p.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded text-xs font-bold border ${
                filterCat === cat
                  ? "bg-[#0B3D62] text-white border-[#0B3D62]"
                  : "bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              {cat} ({cnt})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-sm text-slate-500">
          Loading gallery photos...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visiblePhotos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col"
            >
              <div className="aspect-[4/3] bg-slate-900 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-top"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#0B3D62]/85 text-white text-[10px] font-bold">
                  {photo.category}
                </span>
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-[#0B3D62] line-clamp-2">{photo.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{photo.event}</p>
                </div>
                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditPhoto(photo)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(photo)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Photo Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0B3D62] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Upload New Gallery Photo</h3>
              <button type="button" onClick={() => setAddOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Photo (JPG / PNG) *
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:border-[#0B3D62] bg-slate-50">
                  <Upload className="w-5 h-5 text-[#0B3D62] mb-1" />
                  <span className="text-xs font-semibold text-slate-700">
                    Click to choose photo from computer
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                {newSrc && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 h-40 bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={newSrc}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Photo Title / Caption *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Annual Function Prize Distribution"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value)}
                  placeholder="e.g. Empire Innovate Fest 2026"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white text-xs font-bold disabled:opacity-60"
                >
                  {uploading ? "Uploading..." : "Upload Photo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Photo Modal */}
      {editPhoto && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0B3D62] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Edit Photo Details</h3>
              <button type="button" onClick={() => setEditPhoto(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Photo Title *
                </label>
                <input
                  type="text"
                  required
                  value={editPhoto.title}
                  onChange={(e) => setEditPhoto({ ...editPhoto, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  value={editPhoto.event}
                  onChange={(e) => setEditPhoto({ ...editPhoto, event: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={editPhoto.category}
                  onChange={(e) => setEditPhoto({ ...editPhoto, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditPhoto(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-lg bg-[#0B3D62] hover:bg-[#135589] text-white text-xs font-bold disabled:opacity-60"
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

export default function AdminGalleryPage() {
  return (
    <AdminGuard>
      <AdminGalleryContent />
    </AdminGuard>
  );
}
