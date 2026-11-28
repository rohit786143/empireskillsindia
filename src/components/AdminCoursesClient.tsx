"use client";

import React, { useState } from "react";
import { Plus, Edit3, Trash2, X } from "lucide-react";
import {
  COURSE_CATEGORIES,
  COURSE_DURATIONS,
  COURSE_ELIGIBILITIES,
  type FeeBreakdown,
} from "@/lib/constants";
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
  enrollmentPrefix?: string;
  serialPrefix?: string;
  isActive: boolean;
}

function getDurationMonths(duration: string): number {
  const d = duration.toLowerCase();
  if (d.includes("2 year")) return 24;
  if (d.includes("1 year")) return 12;
  if (d.includes("6 month")) return 6;
  if (d.includes("3 month")) return 3;
  if (d.includes("1 month")) return 1;
  return 0;
}

const EMPTY_FORM = {
  id: "",
  code: "",
  title: "",
  category: "Computer & IT",
  duration: "1 Year",
  eligibility: "10th Pass",
  feeType: "monthly" as "monthly" | "semester" | "onetime",
  registrationFee: 500,
  admissionFee: 3000,
  monthlyFee: 1500,
  sem1Fee: 0,
  sem2Fee: 0,
  fee: 21500,
  examFee: 1500,
  examFeeNote: "",
  enrollmentPrefix: "",
  serialPrefix: "",
  studyMode: "Regular / Hybrid",
  overview: "",
  syllabusText:
    "Module 1: Core Fundamentals\n- Introduction & Practical Lab\n- Assessment & Project",
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
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  async function handleSyncOfficialCourses() {
    if (
      !confirm(
        "Replace current sample courses with the exact 19 Official Empire + NIELIT Courses & Fee Structure? (All existing student records & certificates stay safe.)"
      )
    ) {
      return;
    }
    setSyncing(true);
    try {
      const res = await apiFetch("/sync-courses.php", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.courses) {
        setCourses(data.courses);
        alert("Official 19 Courses & Fee Structure loaded successfully!");
      } else {
        alert(data.error || "Failed to sync official courses.");
      }
    } finally {
      setSyncing(false);
    }
  }

  function recalcTotal(next: typeof EMPTY_FORM) {
    if (next.feeType === "monthly") {
      const months = getDurationMonths(next.duration);
      const calc =
        Number(next.registrationFee || 0) +
        Number(next.admissionFee || 0) +
        Number(next.monthlyFee || 0) * months;
      return { ...next, fee: calc };
    }
    if (next.feeType === "semester") {
      const calc =
        Number(next.registrationFee || 0) +
        Number(next.admissionFee || 0) +
        Number(next.sem1Fee || 0) +
        Number(next.sem2Fee || 0);
      return { ...next, fee: calc };
    }
    return next;
  }

  function updateField<K extends keyof typeof EMPTY_FORM>(
    key: K,
    value: (typeof EMPTY_FORM)[K],
    shouldRecalc = false
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      return shouldRecalc ? recalcTotal(next) : next;
    });
  }

  function openNew() {
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  }

  function parseBreakdown(json?: string | null): FeeBreakdown {
    if (!json) return {};
    try {
      return JSON.parse(json) as FeeBreakdown;
    } catch {
      return {};
    }
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

    const fb = parseBreakdown(c.feeBreakdownJson);
    const feeType: "monthly" | "semester" | "onetime" =
      (fb.sem1Fee || 0) > 0 || (fb.sem2Fee || 0) > 0
        ? "semester"
        : (fb.monthlyFee || 0) > 0
        ? "monthly"
        : "onetime";

    setForm({
      id: c.id,
      code: c.code,
      title: c.title,
      category: c.category,
      duration: c.duration,
      eligibility: c.eligibility,
      feeType,
      registrationFee: fb.registrationFee ?? c.registrationFee ?? 0,
      admissionFee: fb.admissionFee ?? 0,
      monthlyFee: fb.monthlyFee ?? 0,
      sem1Fee: fb.sem1Fee ?? 0,
      sem2Fee: fb.sem2Fee ?? 0,
      fee: c.fee,
      examFee: fb.examFee ?? 0,
      examFeeNote: fb.examFeeNote ?? "",
      enrollmentPrefix: c.enrollmentPrefix ?? "",
      serialPrefix: c.serialPrefix ?? "",
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
      const feeBreakdown: FeeBreakdown = {
        registrationFee: Number(form.registrationFee || 0),
        admissionFee: Number(form.admissionFee || 0),
        courseFee: Number(form.fee || 0),
        examFee: Number(form.examFee || 0),
      };
      if (form.feeType === "monthly") {
        feeBreakdown.monthlyFee = Number(form.monthlyFee || 0);
      } else if (form.feeType === "semester") {
        feeBreakdown.sem1Fee = Number(form.sem1Fee || 0);
        feeBreakdown.sem2Fee = Number(form.sem2Fee || 0);
      }
      if (form.examFeeNote.trim()) {
        feeBreakdown.examFeeNote = form.examFeeNote.trim();
      }

      const payload = {
        code: form.code,
        title: form.title,
        category: form.category,
        duration: form.duration,
        eligibility: form.eligibility,
        fee: Number(form.fee),
        registrationFee: Number(form.registrationFee),
        feeBreakdown,
        enrollmentPrefix: form.enrollmentPrefix.trim().toUpperCase(),
        serialPrefix: form.serialPrefix.trim().toUpperCase(),
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

  const monthsCount = getDurationMonths(form.duration);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D62]">
            Course &amp; Fee Structure Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add individual fee heads (Registration, Admission, Monthly/Semester, Exam Fee) —
            Total Course Fee calculates automatically and displays identically to students.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={syncing}
            onClick={handleSyncOfficialCourses}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded bg-[#F07228] hover:bg-[#D65B14] text-white text-xs font-bold shadow-sm disabled:opacity-60"
          >
            {syncing ? "Loading 19 Courses..." : "Load Official 19 Courses & Fees"}
          </button>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white text-xs font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add New Course
          </button>
        </div>
      </div>

      {/* Official Fee Structure Style Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#0B3D62] text-white uppercase">
            <tr>
              <th className="py-3 px-3">Course Name</th>
              <th className="py-3 px-3">Duration</th>
              <th className="py-3 px-3 text-right">Reg. Fee</th>
              <th className="py-3 px-3 text-right">Adm. Fee</th>
              <th className="py-3 px-3 text-right">Monthly / Sem Fee</th>
              <th className="py-3 px-3 text-right">Course Fee</th>
              <th className="py-3 px-3 text-right">Exam Fee</th>
              <th className="py-3 px-3 text-right bg-[#072A44]">Grand Total</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {courses.map((c) => {
              const fb = parseBreakdown(c.feeBreakdownJson);
              const reg = fb.registrationFee ?? c.registrationFee ?? 0;
              const adm = fb.admissionFee ?? 0;
              const monthly = fb.monthlyFee ?? 0;
              const sem1 = fb.sem1Fee ?? 0;
              const sem2 = fb.sem2Fee ?? 0;
              const exam = fb.examFee ?? 0;
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3">
                    <div className="font-bold text-[#0B3D62]">{c.title}</div>
                    <div className="text-[10px] text-slate-500">
                      <span className="font-mono">{c.code}</span> • {c.category}
                    </div>
                    {(c.enrollmentPrefix || c.serialPrefix) && (
                      <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-mono">
                        {c.enrollmentPrefix && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200 text-[#0B3D62] font-bold">
                            Enr: {c.enrollmentPrefix}
                          </span>
                        )}
                        {c.serialPrefix && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[#D65B14] font-bold">
                            Sr: {c.serialPrefix}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 font-semibold">{c.duration}</td>
                  <td className="py-3 px-3 text-right">
                    {reg > 0 ? formatINR(reg) : "—"}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {adm > 0 ? formatINR(adm) : "—"}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {monthly > 0
                      ? `${formatINR(monthly)}/mo`
                      : sem1 > 0
                      ? `S1: ${formatINR(sem1)} / S2: ${formatINR(sem2)}`
                      : "—"}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#0B3D62]">
                    {formatINR(c.fee)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {fb.examFeeNote || (exam > 0 ? formatINR(exam) : "—")}
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-[#D65B14] bg-amber-50/50">
                    {formatINR(c.fee + exam)}
                  </td>
                  <td className="py-3 px-3">
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Course Modal with Auto-Total Fee Calculator */}
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
                {form.id ? "Edit Course & Fee Structure" : "Add New Course & Fee Structure"}
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

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Course Code *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.code}
                    onChange={(e) => updateField("code", e.target.value)}
                    placeholder="e.g., ESI-DCA-101"
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono uppercase"
                  />
                </div>
              </div>

              {/* Course Numbering Prefixes (Auto Enrollment & Serial / Certificate No.) */}
              <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3.5 space-y-2.5">
                <div>
                  <p className="text-xs font-extrabold text-[#0B3D62]">
                    Enrollment &amp; Serial (Certificate) Number Prefixes
                  </p>
                  <p className="text-[11px] text-slate-600">
                    When any student enrolls in this course, both their Enrollment No. and Serial
                    (Certificate) No. auto-generate sequentially using these prefixes.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Enrollment Number Prefix
                    </label>
                    <input
                      type="text"
                      value={form.enrollmentPrefix}
                      onChange={(e) =>
                        updateField("enrollmentPrefix", e.target.value.toUpperCase())
                      }
                      placeholder="e.g., ESIDS"
                      className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-mono uppercase"
                    />
                    {form.enrollmentPrefix.trim() && (() => {
                      const rawP = form.enrollmentPrefix.trim().toUpperCase();
                      const tail = rawP.startsWith("ESI") ? rawP.slice(3) : rawP;
                      const isQuarterly = form.duration.toLowerCase().includes("3 month");
                      return (
                        <p className="text-[10.5px] text-[#0B3D62] font-mono mt-1">
                          Preview:{" "}
                          <strong>ESI0126{tail}10001</strong> (Jan)
                          {isQuarterly ? (
                            <>
                              {" • "}
                              <strong>ESI0426{tail}10001</strong> (Apr)
                              {" • "}
                              <strong>ESI0726{tail}10001</strong> (Jul)
                              {" • "}
                              <strong>ESI1026{tail}10001</strong> (Oct)
                            </>
                          ) : (
                            <>
                              {" • "}
                              <strong>ESI0726{tail}10001</strong> (July)
                            </>
                          )}
                        </p>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Serial / Certificate Number Prefix
                    </label>
                    <input
                      type="text"
                      value={form.serialPrefix}
                      onChange={(e) =>
                        updateField("serialPrefix", e.target.value.toUpperCase())
                      }
                      placeholder="e.g., SNDS"
                      className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-mono uppercase"
                    />
                    {form.serialPrefix.trim() && (
                      <p className="text-[10.5px] text-[#D65B14] font-mono mt-1">
                        Preview:{" "}
                        <strong>{form.serialPrefix.trim().toUpperCase()}2610001</strong> (2026)
                        {" • "}
                        <strong>{form.serialPrefix.trim().toUpperCase()}2710001</strong> (2027)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
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
                    Course Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration *</label>
                  <select
                    value={form.duration}
                    onChange={(e) => updateField("duration", e.target.value, true)}
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
                    onChange={(e) => updateField("eligibility", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    {COURSE_ELIGIBILITIES.filter((e) => e !== "All").map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Itemized Fee Structure Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-[#0B3D62] uppercase">
                    Fee Structure Breakdown (Auto-Calculates Total Course Fee)
                  </span>
                  <div className="flex gap-1.5">
                    {(["monthly", "semester", "onetime"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateField("feeType", t, true)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border ${
                          form.feeType === t
                            ? "bg-[#0B3D62] text-white border-[#0B3D62]"
                            : "bg-white text-slate-600 border-slate-300"
                        }`}
                      >
                        {t === "monthly"
                          ? "Monthly Plan"
                          : t === "semester"
                          ? "Semester Plan"
                          : "One-Time Fee"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Registration Fee (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.registrationFee}
                      onChange={(e) =>
                        updateField("registrationFee", Number(e.target.value), true)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Admission Fee (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.admissionFee}
                      onChange={(e) =>
                        updateField("admissionFee", Number(e.target.value), true)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                    />
                  </div>

                  {form.feeType === "monthly" && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Monthly Fee (₹) {monthsCount > 0 ? `× ${monthsCount} mo` : ""}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.monthlyFee}
                        onChange={(e) =>
                          updateField("monthlyFee", Number(e.target.value), true)
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                      />
                    </div>
                  )}

                  {form.feeType === "semester" && (
                    <>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          1st Sem Fee (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={form.sem1Fee}
                          onChange={(e) =>
                            updateField("sem1Fee", Number(e.target.value), true)
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          2nd Sem Fee (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={form.sem2Fee}
                          onChange={(e) =>
                            updateField("sem2Fee", Number(e.target.value), true)
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block font-bold text-[#D65B14] mb-1">
                      Total Course Fee (₹) *
                    </label>
                    <input
                      required
                      type="number"
                      min={0}
                      value={form.fee}
                      onChange={(e) => updateField("fee", Number(e.target.value))}
                      className="w-full px-3 py-2 border-2 border-[#F07228] rounded bg-white font-extrabold text-[#D65B14]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Examination Fee (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.examFee}
                      onChange={(e) => updateField("examFee", Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                    />
                  </div>
                </div>

                {form.feeType === "monthly" && monthsCount > 0 && (
                  <p className="text-[11px] text-slate-600 bg-white px-3 py-1.5 rounded border border-slate-200">
                    Formula: Reg ({formatINR(form.registrationFee)}) + Adm (
                    {formatINR(form.admissionFee)}) + Monthly ({formatINR(form.monthlyFee)} ×{" "}
                    {monthsCount} months = {formatINR(form.monthlyFee * monthsCount)}) ={" "}
                    <strong className="text-[#D65B14]">
                      {formatINR(
                        form.registrationFee +
                          form.admissionFee +
                          form.monthlyFee * monthsCount
                      )}
                    </strong>
                    {form.examFee > 0 && (
                      <>
                        {" "}
                        + Exam Fee ({formatINR(form.examFee)}) ={" "}
                        <strong className="text-[#0B3D62]">
                          Grand Total{" "}
                          {formatINR(
                            form.registrationFee +
                              form.admissionFee +
                              form.monthlyFee * monthsCount +
                              form.examFee
                          )}
                        </strong>
                      </>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Course Overview *
                </label>
                <textarea
                  required
                  rows={2}
                  value={form.overview}
                  onChange={(e) => updateField("overview", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Syllabus Modules (Blank line separates modules; lines starting with - are
                  topics)
                </label>
                <textarea
                  rows={4}
                  value={form.syllabusText}
                  onChange={(e) => updateField("syllabusText", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Career Opportunities (Comma-separated)
                </label>
                <input
                  type="text"
                  value={form.careersText}
                  onChange={(e) => updateField("careersText", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
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
