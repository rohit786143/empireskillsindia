"use client";

import React, { Suspense, useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { useAdminCenter } from "@/components/AdminCenterContext";
import { AdminCertificateGeneratorClient } from "@/components/AdminCertificateGeneratorClient";
import { apiFetch } from "@/lib/api";

interface RawApp {
  id: string;
  enrollmentNumber: string | null;
  fullName: string;
  fatherName: string;
  dob: string;
  courseName: string;
  courseCode: string;
  courseDuration?: string;
  session: string;
  photoUrl: string | null;
  isCompleted: boolean;
  franchiseId?: string | null;
  franchiseName?: string | null;
  franchiseCode?: string | null;
}

function GeneratorLoader() {
  const { selectedCenterId } = useAdminCenter();
  const [students, setStudents] = useState<
    {
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
      franchiseId?: string | null;
    }[]
  >([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/admissions.php?status=APPROVED").then((r) =>
        r.ok ? r.json() : { applications: [] }
      ),
      apiFetch("/courses.php").then((r) => (r.ok ? r.json() : { courses: [] })),
    ])
      .then(([appData, courseData]) => {
        const mapped = ((appData.applications || []) as RawApp[]).map((s) => ({
          id: s.id,
          enrollmentNumber: s.enrollmentNumber,
          fullName: s.fullName,
          fatherName: s.fatherName,
          dob: s.dob,
          courseName: s.courseName,
          courseCode: s.courseCode,
          duration: s.courseDuration || "1 Year",
          session: s.session,
          photoUrl: s.photoUrl,
          isCompleted: s.isCompleted,
          franchiseId: s.franchiseId || null,
        }));
        setStudents(mapped);
        setCourses(courseData.courses || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleStudents =
    selectedCenterId && selectedCenterId !== "ALL"
      ? students.filter((s) => s.franchiseId === selectedCenterId)
      : students;

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500">
        Loading Certificate Generator...
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-slate-500">
          Loading Certificate Generator...
        </div>
      }
    >
      <AdminCertificateGeneratorClient students={visibleStudents} courses={courses} />
    </Suspense>
  );
}

export default function AdminCertificateGeneratorPage() {
  return (
    <AdminGuard>
      <GeneratorLoader />
    </AdminGuard>
  );
}
