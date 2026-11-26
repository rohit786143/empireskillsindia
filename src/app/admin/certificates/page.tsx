"use client";

import React, { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminCertificateRegistryClient } from "@/components/AdminCertificateRegistryClient";
import { apiFetch } from "@/lib/api";

function RegistryLoader() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/certificates.php")
      .then((r) => (r.ok ? r.json() : { certificates: [] }))
      .then((d) => setCertificates(d.certificates || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500">
        Loading Certificate Registry...
      </div>
    );
  }

  return <AdminCertificateRegistryClient initialCertificates={certificates} />;
}

export default function AdminCertificatesPage() {
  return (
    <AdminGuard>
      <RegistryLoader />
    </AdminGuard>
  );
}
