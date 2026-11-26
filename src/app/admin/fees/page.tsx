"use client";

import React, { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminFeesClient } from "@/components/AdminFeesClient";
import { apiFetch } from "@/lib/api";

function FeesLoader() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/admissions.php?status=APPROVED")
      .then((r) => (r.ok ? r.json() : { applications: [] }))
      .then((d) => setStudents(d.applications || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500">
        Loading Fee Management &amp; Payment Ledger...
      </div>
    );
  }

  return <AdminFeesClient initialStudents={students} />;
}

export default function AdminFeesPage() {
  return (
    <AdminGuard>
      <FeesLoader />
    </AdminGuard>
  );
}
