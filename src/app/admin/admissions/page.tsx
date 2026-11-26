"use client";

import React, { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminAdmissionsClient } from "@/components/AdminAdmissionsClient";
import { apiFetch } from "@/lib/api";

function AdmissionsLoader() {
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/admissions.php").then((r) => (r.ok ? r.json() : { applications: [] })),
      apiFetch("/courses.php").then((r) => (r.ok ? r.json() : { courses: [] })),
    ])
      .then(([appData, courseData]) => {
        setApplications(appData.applications || []);
        setCourses(courseData.courses || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500">
        Loading admissions &amp; student records...
      </div>
    );
  }

  return (
    <AdminAdmissionsClient
      initialApplications={applications}
      courses={courses}
    />
  );
}

export default function AdminAdmissionsPage() {
  return (
    <AdminGuard>
      <AdmissionsLoader />
    </AdminGuard>
  );
}
