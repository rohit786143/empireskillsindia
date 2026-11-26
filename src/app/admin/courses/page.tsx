"use client";

import React, { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminCoursesClient } from "@/components/AdminCoursesClient";
import { apiFetch } from "@/lib/api";

function CoursesLoader() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/courses.php?all=true")
      .then((r) => (r.ok ? r.json() : { courses: [] }))
      .then((d) => setCourses(d.courses || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500">
        Loading courses...
      </div>
    );
  }

  return <AdminCoursesClient initialCourses={courses} />;
}

export default function AdminCoursesPage() {
  return (
    <AdminGuard>
      <CoursesLoader />
    </AdminGuard>
  );
}
