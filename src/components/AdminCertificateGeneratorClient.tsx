"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Award,
  Users,
  Zap,
  CheckCircle2,
  AlertCircle,
  Upload,
  Plus,
  Trash2,
} from "lucide-react";
import {
  PrintableCertificate,
  HAIR_SKIN_DEFAULT_SUBJECTS,
  type CertificateData,
  type CertificateSubjectRow,
} from "./PrintableCertificate";
import { apiFetch } from "@/lib/api";

interface EnrolledStudentOption {
  id: string;
  enrollmentNumber: string | null;
  serialNumber?: string | null;
  fullName: string;
  fatherName: string;
  dob: string;
  courseName: string;
  courseCode: string;
  duration: string;
  session: string;
  photoUrl: string | null;
  isCompleted: boolean;
  franchiseName?: string | null;
  resultJson?: string | null;
}

interface CourseOption {
  id: string;
  code: string;
  title: string;
  duration: string;
}

function computeOfficialGrade(pct: number): string {
  if (pct >= 85) return "A+";
  if (pct >= 75) return "A";
  if (pct >= 60) return "B";
  if (pct >= 40) return "C";
  return "F";
}

function getDefaultSubjectsForCourse(
  courseName: string,
  savedResultJson?: string | null
): CertificateSubjectRow[] {
  if (savedResultJson) {
    try {
      const parsed = JSON.parse(savedResultJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((r: Record<string, unknown>) => ({
          subject: String(r.subject || ""),
          maxMarks: Number(r.maxMarks || 100),
          minMarks: Number(r.minMarks ?? Math.round(Number(r.maxMarks || 100) * 0.4)),
          marksSecured: Number(r.marksSecured ?? r.obtainedMarks ?? 0),
        }));
      }
    } catch {
      // fallback below
    }
  }
  const lower = (courseName || "").toLowerCase();
  if (lower.includes("hair") && lower.includes("skin")) {
    return HAIR_SKIN_DEFAULT_SUBJECTS.map((s) => ({ ...s }));
  }
  return [
    {
      subject: `${courseName || "Course"} — Theory Examination`,
      maxMarks: 100,
      minMarks: 40,
      marksSecured: 78,
    },
    {
      subject: `${courseName || "Course"} — Practical Assessment`,
      maxMarks: 100,
      minMarks: 40,
      marksSecured: 82,
    },
  ];
}

export function AdminCertificateGeneratorClient({
  students,
  courses,
}: {
  students: EnrolledStudentOption[];
  courses: CourseOption[];
}) {
  const searchParams = useSearchParams();
  const initialStudentId = searchParams.get("studentId") || students[0]?.id || "";

  const [mode, setMode] = useState<"enrolled" | "quick">("enrolled");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [generatedCert, setGeneratedCert] = useState<CertificateData | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  // Mode 1: From Enrolled Students
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId);
  const [enrolledSession, setEnrolledSession] = useState("July, 2025 To June, 2026");
  const [enrolledStudyCentre, setEnrolledStudyCentre] = useState(
    "Empire Institute of Skills Technology, Mandi"
  );
  const [enrolledSubjects, setEnrolledSubjects] = useState<CertificateSubjectRow[]>(
    HAIR_SKIN_DEFAULT_SUBJECTS.map((s) => ({ ...s }))
  );
  const [enrolledCompletionDate, setEnrolledCompletionDate] = useState(today);
  const [enrolledIssueDate, setEnrolledIssueDate] = useState(today);

  // Mode 2: Direct Quick Generator
  const [quickForm, setQuickForm] = useState({
    studentName: "",
    fatherName: "",
    enrollmentNumber: "",
    dob: "2002-01-15",
    courseName: courses[0]?.title || "Diploma in Hair & Skin Care",
    courseCode: courses[0]?.code || "",
    duration: courses[0]?.duration || "1 Year",
    session: "July, 2025 To June, 2026",
    studyCentre: "Empire Institute of Skills Technology, Mandi",
    completionDate: today,
    issueDate: today,
    photoUrl: "",
  });
  const [quickSubjects, setQuickSubjects] = useState<CertificateSubjectRow[]>(
    getDefaultSubjectsForCourse(courses[0]?.title || "Diploma in Hair & Skin Care")
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Auto-populate study centre, session, and course subjects whenever Admin selects a different student
  useEffect(() => {
    if (!selectedStudent) return;
    setEnrolledSession(selectedStudent.session || "July, 2025 To June, 2026");
    setEnrolledStudyCentre(
      selectedStudent.franchiseName || "Empire Institute of Skills Technology, Mandi"
    );
    setEnrolledSubjects(
      getDefaultSubjectsForCourse(selectedStudent.courseName, selectedStudent.resultJson)
    );
  }, [selectedStudentId, selectedStudent]);

  // Live totals for Mode 1 (Enrolled)
  const enrolledTotalMax = enrolledSubjects.reduce((s, r) => s + (Number(r.maxMarks) || 0), 0);
  const enrolledTotalMin = enrolledSubjects.reduce((s, r) => s + (Number(r.minMarks) || 0), 0);
  const enrolledTotalSec = enrolledSubjects.reduce((s, r) => s + (Number(r.marksSecured) || 0), 0);
  const enrolledPct =
    enrolledTotalMax > 0 ? Number(((enrolledTotalSec / enrolledTotalMax) * 100).toFixed(2)) : 0;
  const enrolledGrade = computeOfficialGrade(enrolledPct);

  // Live totals for Mode 2 (Quick)
  const quickTotalMax = quickSubjects.reduce((s, r) => s + (Number(r.maxMarks) || 0), 0);
  const quickTotalMin = quickSubjects.reduce((s, r) => s + (Number(r.minMarks) || 0), 0);
  const quickTotalSec = quickSubjects.reduce((s, r) => s + (Number(r.marksSecured) || 0), 0);
  const quickPct =
    quickTotalMax > 0 ? Number(((quickTotalSec / quickTotalMax) * 100).toFixed(2)) : 0;
  const quickGrade = computeOfficialGrade(quickPct);

  function updateSubjectRow(
    list: CertificateSubjectRow[],
    setter: React.Dispatch<React.SetStateAction<CertificateSubjectRow[]>>,
    idx: number,
    field: keyof CertificateSubjectRow,
    val: string
  ) {
    setter(
      list.map((row, i) => {
        if (i !== idx) return row;
        if (field === "subject") return { ...row, subject: val };
        return { ...row, [field]: Math.max(0, Number(val) || 0) };
      })
    );
  }

  function handleQuickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setQuickForm((prev) => ({ ...prev, photoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  }

  function handleQuickCoursePick(courseTitle: string) {
    const found = courses.find((c) => c.title === courseTitle);
    setQuickForm((prev) => ({
      ...prev,
      courseName: courseTitle,
      courseCode: found?.code || prev.courseCode,
      duration: found?.duration || prev.duration,
    }));
    setQuickSubjects(getDefaultSubjectsForCourse(courseTitle));
  }

  async function handleGenerateFromEnrolled(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudentId) {
      setError("Please select an enrolled student.");
      return;
    }
    const cleanSubjects = enrolledSubjects.filter((s) => s.subject.trim() !== "");
    if (cleanSubjects.length === 0) {
      setError("Please enter at least one subject with marks.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await apiFetch("/certificates.php", {
        method: "POST",
        body: JSON.stringify({
          applicationId: selectedStudentId,
          session: enrolledSession.trim(),
          studyCentre: enrolledStudyCentre.trim(),
          subjects: cleanSubjects,
          marksObtained: enrolledTotalSec,
          totalMarks: enrolledTotalMax,
          percentage: enrolledPct,
          grade: enrolledGrade,
          completionDate: enrolledCompletionDate,
          issueDate: enrolledIssueDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate certificate.");
      } else {
        setGeneratedCert(data.certificate);
      }
    } catch {
      setError("Network error while generating certificate.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerateQuick(e: React.FormEvent) {
    e.preventDefault();
    const cleanSubjects = quickSubjects.filter((s) => s.subject.trim() !== "");
    setSubmitting(true);
    setError("");
    try {
      const res = await apiFetch("/certificates.php", {
        method: "POST",
        body: JSON.stringify({
          ...quickForm,
          subjects: cleanSubjects,
          marksObtained: quickTotalSec,
          totalMarks: quickTotalMax,
          percentage: quickPct,
          grade: quickGrade,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate certificate.");
      } else {
        setGeneratedCert(data.certificate);
      }
    } catch {
      setError("Network error while generating certificate.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderSubjectsEditor(
    list: CertificateSubjectRow[],
    setter: React.Dispatch<React.SetStateAction<CertificateSubjectRow[]>>,
    totalMax: number,
    totalMin: number,
    totalSec: number,
    pct: number,
    grade: string
  ) {
    return (
      <div className="md:col-span-2 lg:col-span-3 space-y-2.5 border border-slate-200 rounded-xl p-4 bg-slate-50/70">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0B3D62]">
              Subject-Wise Marks Entry (For Diploma &amp; Marksheet)
            </h3>
            <p className="text-[11px] text-slate-500">
              Enter marks secured per subject — Total, Percentage &amp; Grade calculate automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setter((prev) => [
                ...prev,
                { subject: "", maxMarks: 100, minMarks: 40, marksSecured: 75 },
              ])
            }
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0B3D62] hover:bg-[#135589] text-white text-[11px] font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> Add Subject
          </button>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0B3D62] text-white uppercase text-[10.5px]">
              <tr>
                <th className="py-2 px-3">Subject Name</th>
                <th className="py-2 px-2 text-center w-24">Max Marks</th>
                <th className="py-2 px-2 text-center w-24">Min Marks</th>
                <th className="py-2 px-2 text-center w-28">Marks Secured</th>
                <th className="py-2 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list.map((row, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 px-2">
                    <input
                      type="text"
                      required
                      value={row.subject}
                      onChange={(e) =>
                        updateSubjectRow(list, setter, idx, "subject", e.target.value)
                      }
                      placeholder="Subject name"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      min={1}
                      value={row.maxMarks}
                      onChange={(e) =>
                        updateSubjectRow(list, setter, idx, "maxMarks", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-xs text-center border border-slate-300 rounded font-semibold"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      min={0}
                      value={row.minMarks}
                      onChange={(e) =>
                        updateSubjectRow(list, setter, idx, "minMarks", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-xs text-center border border-slate-300 rounded font-semibold"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      min={0}
                      max={row.maxMarks}
                      value={row.marksSecured}
                      onChange={(e) =>
                        updateSubjectRow(list, setter, idx, "marksSecured", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-xs text-center border border-emerald-400 bg-emerald-50/40 rounded font-bold text-[#0B3D62]"
                    />
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {list.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setter((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Remove Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-amber-50/70 font-extrabold text-[#0B3D62] border-t-2 border-slate-300">
              <tr>
                <td className="py-2 px-3">TOTAL</td>
                <td className="py-2 px-2 text-center">{totalMax}</td>
                <td className="py-2 px-2 text-center">{totalMin}</td>
                <td className="py-2 px-2 text-center text-emerald-700">{totalSec}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white border border-slate-200 rounded-lg px-3.5 py-2">
          <span>
            Calculated Percentage:{" "}
            <strong className="text-[#0B3D62]">{pct.toFixed(2)}%</strong>
          </span>
          <span>
            Auto-Awarded Grade:{" "}
            <strong className="px-2 py-0.5 rounded bg-[#0B3D62] text-white">
              Grade {grade}
            </strong>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="text-2xl font-extrabold text-[#0B3D62]">
          Online Diploma Certificate &amp; Marksheet Generator
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter student-wise subject marks to generate the official A4 Portrait Diploma Certificate
          &amp; Marksheet with student photo, study centre, session, and live QR verification code.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="no-print flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("enrolled");
            setError("");
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
            mode === "enrolled"
              ? "bg-[#0B3D62] text-white border-[#0B3D62]"
              : "bg-white text-slate-700 border-slate-300 hover:border-[#0B3D62]"
          }`}
        >
          <Users className="w-4 h-4" />
          1. Generate from Enrolled Students
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("quick");
            setError("");
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
            mode === "quick"
              ? "bg-[#0B3D62] text-white border-[#0B3D62]"
              : "bg-white text-slate-700 border-slate-300 hover:border-[#0B3D62]"
          }`}
        >
          <Zap className="w-4 h-4" />
          2. Direct Quick Generator
        </button>
      </div>

      {error && (
        <div className="no-print p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generator Forms */}
      <div className="no-print bg-white border border-slate-200 border-t-4 border-t-[#F07228] rounded-xl p-5 sm:p-6 shadow-sm">
        {mode === "enrolled" ? (
          <form onSubmit={handleGenerateFromEnrolled} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Approved Enrolled Student *
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#135589]"
                >
                  {students.length === 0 && (
                    <option value="">No approved students available</option>
                  )}
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.enrollmentNumber}] {s.fullName} — {s.courseName} ({s.session})
                      {s.isCompleted ? " ✓ Completed" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudent && (
                <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs flex flex-wrap items-center gap-4">
                  {selectedStudent.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedStudent.photoUrl}
                      alt={selectedStudent.fullName}
                      className="w-12 h-14 object-cover rounded border border-slate-300 bg-white shrink-0"
                    />
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                    <div>
                      <span className="text-slate-500 block">Student Name</span>
                      <strong className="text-[#0B3D62]">{selectedStudent.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Father&apos;s Name</span>
                      <strong>{selectedStudent.fatherName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Enrollment No.</span>
                      <strong className="font-mono text-[#0B3D62]">
                        {selectedStudent.enrollmentNumber}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Serial / Cert. No.</span>
                      <strong className="font-mono text-[#D65B14]">
                        {selectedStudent.serialNumber || "Auto on Generate"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Course</span>
                      <strong>{selectedStudent.courseName}</strong>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Study Centre Name (Printed on Diploma &amp; Marksheet) *
                </label>
                <input
                  required
                  type="text"
                  value={enrolledStudyCentre}
                  onChange={(e) => setEnrolledStudyCentre(e.target.value)}
                  placeholder="e.g., Empire Institute of Skills Technology, Mandi"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Session (Printed on Diploma &amp; Marksheet) *
                </label>
                <input
                  required
                  type="text"
                  value={enrolledSession}
                  onChange={(e) => setEnrolledSession(e.target.value)}
                  placeholder="e.g., July, 2024 To June, 2025"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              {renderSubjectsEditor(
                enrolledSubjects,
                setEnrolledSubjects,
                enrolledTotalMax,
                enrolledTotalMin,
                enrolledTotalSec,
                enrolledPct,
                enrolledGrade
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Course Completion Date *
                </label>
                <input
                  required
                  type="date"
                  value={enrolledCompletionDate}
                  onChange={(e) => setEnrolledCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date of Issue *
                </label>
                <input
                  required
                  type="date"
                  value={enrolledIssueDate}
                  onChange={(e) => setEnrolledIssueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || students.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0B3D62] hover:bg-[#135589] text-white font-bold text-sm shadow disabled:opacity-50"
              >
                <Award className="w-4 h-4" />
                {submitting
                  ? "Generating Diploma & Marksheet..."
                  : "Mark Completed & Generate Diploma + Marksheet"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleGenerateQuick} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student Full Name *
                </label>
                <input
                  required
                  type="text"
                  value={quickForm.studentName}
                  onChange={(e) =>
                    setQuickForm({ ...quickForm, studentName: e.target.value })
                  }
                  placeholder="e.g., Varsha"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Father&apos;s Name *
                </label>
                <input
                  required
                  type="text"
                  value={quickForm.fatherName}
                  onChange={(e) =>
                    setQuickForm({ ...quickForm, fatherName: e.target.value })
                  }
                  placeholder="e.g., Yashwant Singh"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enrollment No. (Optional — auto-generated if blank)
                </label>
                <input
                  type="text"
                  value={quickForm.enrollmentNumber}
                  onChange={(e) =>
                    setQuickForm({ ...quickForm, enrollmentNumber: e.target.value })
                  }
                  placeholder="e.g., ESI2425BW4012"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Course Name *
                </label>
                <input
                  required
                  list="esi-course-list"
                  type="text"
                  value={quickForm.courseName}
                  onChange={(e) => handleQuickCoursePick(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
                <datalist id="esi-course-list">
                  {courses.map((c) => (
                    <option key={c.id} value={c.title} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Course Duration *
                </label>
                <input
                  required
                  type="text"
                  value={quickForm.duration}
                  onChange={(e) =>
                    setQuickForm({ ...quickForm, duration: e.target.value })
                  }
                  placeholder="e.g., 1 Year"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Study Centre Name *
                </label>
                <input
                  required
                  type="text"
                  value={quickForm.studyCentre}
                  onChange={(e) =>
                    setQuickForm({ ...quickForm, studyCentre: e.target.value })
                  }
                  placeholder="e.g., Empire Institute of Skills Technology, Mandi"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Session *
                </label>
                <input
                  required
                  type="text"
                  value={quickForm.session}
                  onChange={(e) =>
                    setQuickForm({ ...quickForm, session: e.target.value })
                  }
                  placeholder="e.g., July, 2024 To June, 2025"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              {renderSubjectsEditor(
                quickSubjects,
                setQuickSubjects,
                quickTotalMax,
                quickTotalMin,
                quickTotalSec,
                quickPct,
                quickGrade
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={quickForm.dob}
                  onChange={(e) => setQuickForm({ ...quickForm, dob: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date of Issue *
                </label>
                <input
                  required
                  type="date"
                  value={quickForm.issueDate}
                  onChange={(e) =>
                    setQuickForm({ ...quickForm, issueDate: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student Photograph
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQuickPhoto}
                      className="hidden"
                    />
                  </label>
                  {quickForm.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={quickForm.photoUrl}
                      alt="Preview"
                      className="w-10 h-12 object-cover rounded border border-slate-300"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white font-bold text-sm shadow disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                {submitting ? "Generating..." : "Generate Diploma + Marksheet Instantly"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Generated Diploma & Marksheet Preview & Print */}
      {generatedCert && (
        <div className="space-y-4">
          <div className="no-print p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>Diploma Certificate &amp; Marksheet Issued!</strong> Sr. No.{" "}
              <code className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                {generatedCert.certificateNumber}
              </code>{" "}
              is saved to the registry and immediately verifiable on{" "}
              <code className="font-mono">/verify-certificate</code>.
            </span>
          </div>

          <PrintableCertificate certificate={generatedCert} />
        </div>
      )}
    </div>
  );
}
