"use client";

import React, { useState } from "react";
import { Plus, Edit3, Trash2, X } from "lucide-react";
import { COURSE_CATEGORIES, COURSE_DURATIONS, COURSE_ELIGIBILITIES } from "@/lib/constants";
import { formatINR } from "@/lib/generators";
import { apiFetch } from "@/lib/api";

interface CourseItem {
  id: string;
  code: string;
  slug: string;
  title: string;
  category: string;
  duration: string;
  eligibility: string;
  fee: number;
  registrationFee: number;
  studyMode: string;
  overview: string;
  syllabusJson: string;
  careerOpportunitiesJson: string;
  feeBreakdownJson?: string | null;
  isActive: boolean;
}

const EMPTY_FORM = {
  id: "",
  code: "",
  title: "",
  category: "Computer & IT",
  duration: "6 Months",
  eligibility: "10th Pass",
  fee: 6500,
  registrationFee: 500,
  admissionFee: 1500,
  monthlyFee: 1500,
  examFee: 1000,
  studyMode: "Regular / Online",
  overview: "",
  syllabusText: "Module 1: Core Fundamentals\n- Introduction & Practical Lab\n- Assessment & Project",
  careersText: "Office Executive, Technical Assistant",
};

export function AdminCoursesClient({
  initialCourses,
}: {
  initialCourses: CourseItem[];
}) {
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openNew() {
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  }

  function openEdit(c: CourseItem) {
    let syllabusText = "";
    try {
      const mods = JSON.parse(c.syllabusJson) as {
        moduleTitle: string;
        topics: string[];
      }[];
      syllabusText = mods
        .map((m) => `${m.moduleTitle}\n${m.topics.map((t) => `- ${t}`).join("\n")}`)
        .join("\n\n");
    } catch {
      syllabusText = "";
    }

    let careersText = "";
    try {
      const arr = JSON.parse(c.careerOpportunitiesJson) as string[];
      careersText = arr.join(", ");
    } catch {
      careersText = "";
    }

    let fb: { admissionFee?: number; monthlyFee?: number; examFee?: number } = {};
    if (c.feeBreakdownJson) {
      try {
        fb = JSON.parse(c.feeBreakdownJson);
      } catch {
        fb = {};
      }
    }

    setForm({
      id: c.id,
      code: c.code,
      title: c.title,
      category: c.category,
      duration: c.duration,
      eligibility: c.eligibility,
      fee: c.fee,
      registrationFee: c.registrationFee,
      admissionFee: fb.admissionFee ?? 0,
      monthlyFee: fb.monthlyFee ?? 0,
      examFee: fb.examFee ?? 0,
      studyMode: c.studyMode,
      overview: c.overview,
      syllabusText,
      careersText,
    });
    setError("");
    setModalOpen(true);
  }

  function parseSyllabus(text: string) {
    const blocks = text
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean);
    return blocks.map((block) => {
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const moduleTitle = lines[0]?.replace(/^[-*]\s*/, "") || "Module";
      const topics = lines
        .slice(1)
        .map((l) => l.replace(/^[-*]\s*/, ""))
        .filter(Boolean);
      return {
        moduleTitle,
        topics: topics.length > 0 ? topics : [moduleTitle],
      };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        code: form.code,
        title: form.title,
        category: form.category,
        duration: form.duration,
        eligibility: form.eligibility,
        fee: Number(form.fee),
        registrationFee: Number(form.registrationFee),
        feeBreakdown: {
          registrationFee: Number(form.registrationFee),
          admissionFee: Number(form.admissionFee),
          monthlyFee: Number(form.monthlyFee),
          courseFee: Number(form.fee),
          examFee: Number(form.examFee),
        },
        studyMode: form.studyMode,
        overview: form.overview,
        syllabus: parseSyllabus(form.syllabusText),
        careerOpportunities: form.careersText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const isEdit = Boolean(form.id);
      const res = await apiFetch(
        isEdit ? `/courses.php?id=${encodeURIComponent(form.id)}` : "/courses.php",
        {
          method: isEdit ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save course.");
      } else {
        if (isEdit) {
          setCourses((prev) =>
            prev.map((c) => (c.id === form.id ? data.course : c))
          );
        } else {
          setCourses((prev) => [...prev, data.course]);
        }
        setModalOpen(false);
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this course permanently?")) return;
    const res = await apiFetch(`/courses.php?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setCourses((prev) => prev.filter((c) => c.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D62]">
            Course Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, update, or remove academic programmes displayed across the public portal and
            admission form.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white text-xs font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Course
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#0B3D62] text-white uppercase">
            <tr>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Course Title</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Duration / Eligibility</th>
              <th className="py-3 px-4">Fee</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {courses.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono font-bold text-[#0B3D62]">
                  {c.code}
                </td>
                <td className="py-3 px-4 font-bold text-slate-900">{c.title}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-[#135589] font-semibold">
                    {c.category}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {c.duration} • {c.eligibility}
                </td>
                <td className="py-3 px-4 font-bold text-[#0B3D62]">
                  {formatINR(c.fee)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded text-red-600 hover:bg-red-50"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-t-4 border-[#0B3D62] shadow-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-lg font-bold text-[#0B3D62]">
                {form.id ? "Edit Course" : "Create New Course"}
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
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Course Code *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g., ESI-PGDCA-105"
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    {COURSE_CATEGORIES.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Course Title *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration *</label>
                  <select
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    {COURSE_DURATIONS.filter((d) => d !== "All").map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Eligibility *
                  </label>
                  <select
                    value={form.eligibility}
                    onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    {COURSE_ELIGIBILITIES.filter((e) => e !== "All").map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Course Fee (INR) *
                  </label>
                  <input
                    required
                    type="number"
                    value={form.fee}
                    onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Registration Fee (INR)
                  </label>
                  <input
                    type="number"
                    value={form.registrationFee}
                    onChange={(e) =>
                      setForm({ ...form, registrationFee: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Admission Fee (INR)
                  </label>
                  <input
                    type="number"
                    value={form.admissionFee}
                    onChange={(e) =>
                      setForm({ ...form, admissionFee: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Monthly Fee (INR)
                  </label>
                  <input
                    type="number"
                    value={form.monthlyFee}
                    onChange={(e) =>
                      setForm({ ...form, monthlyFee: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Examination Fee (INR)
                  </label>
                  <input
                    type="number"
                    value={form.examFee}
                    onChange={(e) =>
                      setForm({ ...form, examFee: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Course Overview *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={form.overview}
                    onChange={(e) => setForm({ ...form, overview: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Syllabus Modules (Blank line separates modules; lines starting with - are
                    topics)
                  </label>
                  <textarea
                    rows={5}
                    value={form.syllabusText}
                    onChange={(e) => setForm({ ...form, syllabusText: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Career Opportunities (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={form.careersText}
                    onChange={(e) => setForm({ ...form, careersText: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
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
                  {saving ? "Saving..." : form.id ? "Update Course" : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
