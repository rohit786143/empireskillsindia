"use client";

import React, { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminFranchiseAdmissionsClient } from "@/components/AdminFranchiseAdmissionsClient";
import { apiFetch } from "@/lib/api";

function FranchiseAdmissionsLoader() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/admissions.php?onlyFranchise=true")
      .then((r) => (r.ok ? r.json() : { applications: [] }))
      .then((d) => setApplications(d.applications || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500">
        Loading franchise admissions...
      </div>
    );
  }

  return <AdminFranchiseAdmissionsClient initialApplications={applications} />;
}

export default function AdminFranchiseAdmissionsPage() {
  return (
    <AdminGuard>
      <FranchiseAdmissionsLoader />
    </AdminGuard>
  );
}
