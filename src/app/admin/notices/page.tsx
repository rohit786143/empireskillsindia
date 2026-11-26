"use client";

import React, { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminNoticesClient } from "@/components/AdminNoticesClient";
import { apiFetch } from "@/lib/api";

function NoticesLoader() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/notices.php?all=true")
      .then((r) => (r.ok ? r.json() : { notices: [] }))
      .then((d) => setNotices(d.notices || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500">
        Loading notices...
      </div>
    );
  }

  return <AdminNoticesClient initialNotices={notices} />;
}

export default function AdminNoticesPage() {
  return (
    <AdminGuard>
      <NoticesLoader />
    </AdminGuard>
  );
}
