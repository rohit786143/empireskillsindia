"use client";

import React, { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminFranchisesClient } from "@/components/AdminFranchisesClient";
import { apiFetch } from "@/lib/api";

function FranchisesLoader() {
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/franchises.php")
      .then((r) => (r.ok ? r.json() : { franchises: [] }))
      .then((d) => setFranchises(d.franchises || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500">
        Loading franchise centers...
      </div>
    );
  }

  return <AdminFranchisesClient initialFranchises={franchises} />;
}

export default function AdminFranchisesPage() {
  return (
    <AdminGuard>
      <FranchisesLoader />
    </AdminGuard>
  );
}
