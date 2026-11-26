"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Award,
  Users,
  Zap,
  CheckCircle2,
  AlertCircle,
  Upload,
} from "lucide-react";
import {
  PrintableCertificate,
  type CertificateData,
} from "./PrintableCertificate";
import { ACADEMIC_SESSIONS } from "@/lib/constants";
import { apiFetch } from "@/lib/api";

interface EnrolledStudentOption {
  id: string;
  enrollmentNumber: string | null;
  fullName: string;
  fatherName: string;
  dob: string;
  courseName: string;
  courseCode: string;
  duration: string;
  session: string;
  photoUrl: string | null;
  isCompleted: boolean;
}

interface CourseOption {
  id: string;
  code: string;
  title: string;
  duration: string;
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
  const [enrolledMarks, setEnrolledMarks] = useState("430");
  const [enrolledTotal, setEnrolledTotal] = useState("500");
  const [enrolledPercentage, setEnrolledPercentage] = useState("86");
  const [enrolledGrade, setEnrolledGrade] = useState("A+");
  const [enrolledCompletionDate, setEnrolledCompletionDate] = useState(today);
  const [enrolledIssueDate, setEnrolledIssueDate] = useState(today);

  // Mode 2: Direct Quick Generator
  const [quickForm, setQuickForm] = useState({
    studentName: "",
    fatherName: "",
    dob: "2002-01-15",
    courseName: courses[0]?.title || "",
    courseCode: courses[0]?.code || "",
    duration: courses[0]?.duration || "1 Year",
    session: ACADEMIC_SESSIONS[0] as string,
    percentage: "85",
    grade: "A+",
    completionDate: today,
    issueDate: today,
    photoUrl: "",
  });

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  function autoComputeEnrolled(marksStr: string, totalStr: string) {
    const m = Number(marksStr);
    const t = Number(totalStr);
    if (!isNaN(m) && !isNaN(t) && t > 0) {
      const pct = Number(((m / t) * 100).toFixed(2));
      setEnrolledPercentage(String(pct));
      if (pct >= 85) setEnrolledGrade("A+");
      else if (pct >= 75) setEnrolledGrade("A");
      else if (pct >= 65) setEnrolledGrade("B+");
      else setEnrolledGrade("B");
    }
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
  }

  async function handleGenerateFromEnrolled(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudentId) {
      setError("Please select an enrolled student.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await apiFetch("/certificates.php", {
        method: "POST",
        body: JSON.stringify({
          applicationId: selectedStudentId,
          marksObtained: enrolledMarks,
          totalMarks: enrolledTotal,
          percentage: enrolledPercentage,
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
    setSubmitting(true);
    setError("");
    try {
      const res = await apiFetch("/certificates.php", {
        method: "POST",
        body: JSON.stringify(quickForm),
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

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="text-2xl font-extrabold text-[#0B3D62]">
          Online Certificate Generator &amp; Course Completion System
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate official A4 landscape certificates with auto-assigned serial numbers and
          embedded live verification QR codes. Every issued certificate is instantly verifiable
          on the public portal.
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
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded text-sm font-bold border transition-colors ${
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
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded text-sm font-bold border transition-colors ${
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
      <div className="no-print bg-white border border-slate-200 border-t-4 border-t-[#F07228] rounded-lg p-6 shadow-sm">
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
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#135589]"
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
                <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded p-3.5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                    <span className="text-slate-500 block">Duration / Session</span>
                    <strong>
                      {selectedStudent.duration} ({selectedStudent.session})
                    </strong>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Marks Obtained
                </label>
                <input
                  type="number"
                  value={enrolledMarks}
                  onChange={(e) => {
                    setEnrolledMarks(e.target.value);
                    autoComputeEnrolled(e.target.value, enrolledTotal);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  value={enrolledTotal}
                  onChange={(e) => {
                    setEnrolledTotal(e.target.value);
                    autoComputeEnrolled(enrolledMarks, e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Percentage (%) *
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={enrolledPercentage}
                  onChange={(e) => setEnrolledPercentage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Awarded Grade *
                </label>
                <select
                  value={enrolledGrade}
                  onChange={(e) => setEnrolledGrade(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                >
                  <option value="A+">A+ (Outstanding)</option>
                  <option value="A">A (Excellent)</option>
                  <option value="B+">B+ (Very Good)</option>
                  <option value="B">B (Good)</option>
                  <option value="C">C (Satisfactory)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Course Completion Date *
                </label>
                <input
                  required
                  type="date"
                  value={enrolledCompletionDate}
                  onChange={(e) => setEnrolledCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Certificate Issue Date *
                </label>
                <input
                  required
                  type="date"
                  value={enrolledIssueDate}
                  onChange={(e) => setEnrolledIssueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || students.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white font-bold text-sm shadow disabled:opacity-50"
              >
                <Award className="w-4 h-4" />
                {submitting
                  ? "Generating Certificate..."
                  : "Mark Completed & Generate Certificate"}
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
                  placeholder="e.g., Rahul Verma"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
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
                  placeholder="e.g., Ashok Verma"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  required
                  type="date"
                  value={quickForm.dob}
                  onChange={(e) => setQuickForm({ ...quickForm, dob: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
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
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
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
                  placeholder="e.g., 1 Year / 6 Months"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Academic Session
                </label>
                <input
                  type="text"
                  value={quickForm.session}
                  onChange={(e) =>
                    setQuickForm({ ...quickForm, session: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Percentage (%) *
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={quickForm.percentage}
                  onChange={(e) =>
                    setQuickForm({ ...quickForm, percentage: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Grade *
                </label>
                <select
                  value={quickForm.grade}
                  onChange={(e) => setQuickForm({ ...quickForm, grade: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                >
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Issue Date *
                </label>
                <input
                  required
                  type="date"
                  value={quickForm.issueDate}
                  onChange={(e) =>
                    setQuickForm({ ...quickForm, issueDate: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student Photograph (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold cursor-pointer">
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
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded bg-[#F07228] hover:bg-[#F07228] text-white font-bold text-sm shadow disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                {submitting ? "Generating..." : "Generate Certificate Instantly"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Generated Certificate Preview & Print */}
      {generatedCert && (
        <div className="space-y-4">
          <div className="no-print p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>Certificate Issued &amp; Synced!</strong> Serial Number{" "}
              <code className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                {generatedCert.certificateNumber}
              </code>{" "}
              is now saved to the registry and immediately verifiable on{" "}
              <code className="font-mono">/verify-certificate</code>.
            </span>
          </div>

          <PrintableCertificate certificate={generatedCert} />
        </div>
      )}
    </div>
  );
}
