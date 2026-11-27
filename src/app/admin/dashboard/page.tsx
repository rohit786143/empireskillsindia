"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  Users,
  Award,
  BookOpen,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { useAdminCenter } from "@/components/AdminCenterContext";
import { formatDisplayDate } from "@/lib/generators";
import { apiFetch } from "@/lib/api";

interface DashboardStats {
  totalApplications: number;
  pendingApprovals: number;
  activeStudents: number;
  certificatesIssued: number;
  totalCourses: number;
}

interface RecentApp {
  id: string;
  fullName: string;
  courseCode: string;
  enrollmentNumber: string | null;
  applicationRef: string;
  status: string;
}

interface RecentCert {
  id: string;
  studentName: string;
  certificateNumber: string;
  courseName: string;
  grade: string;
  issueDate: string;
}

function DashboardContent() {
  const { selectedCenterId } = useAdminCenter();
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingApprovals: 0,
    activeStudents: 0,
    certificatesIssued: 0,
    totalCourses: 0,
  });
  const [recentApplications, setRecentApplications] = useState<RecentApp[]>([]);
  const [recentCertificates, setRecentCertificates] = useState<RecentCert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs =
      selectedCenterId && selectedCenterId !== "ALL"
        ? `?franchiseId=${encodeURIComponent(selectedCenterId)}`
        : "";
    apiFetch(`/admin-stats.php${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.stats) setStats(data.stats);
        setRecentApplications(data.recentApplications || []);
        setRecentCertificates(data.recentCertificates || []);
      })
      .finally(() => setLoading(false));
  }, [selectedCenterId]);

  const cards = [
    {
      label: "Total Applications",
      value: stats.totalApplications,
      icon: FileText,
      border: "border-t-[#0B3D62]",
      href: "/admin/admissions",
    },
    {
      label: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: Clock,
      border: "border-t-[#F07228]",
      href: "/admin/admissions",
    },
    {
      label: "Active Enrolled Students",
      value: stats.activeStudents,
      icon: Users,
      border: "border-t-[#135589]",
      href: "/admin/admissions",
    },
    {
      label: "Certificates Issued",
      value: stats.certificatesIssued,
      icon: Award,
      border: "border-t-emerald-700",
      href: "/admin/certificates",
    },
    {
      label: "Total Active Courses",
      value: stats.totalCourses,
      icon: BookOpen,
      border: "border-t-slate-700",
      href: "/admin/courses",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D62]">
            Institute Owner Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live overview of admissions, enrolled students, courses, and digitally verifiable
            certificates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/admissions"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded border border-[#0B3D62] text-[#0B3D62] hover:bg-[#0B3D62] hover:text-white text-xs font-bold transition-colors"
          >
            Manage Admissions
          </Link>
          <Link
            href="/admin/certificates/generate"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#F07228] hover:bg-[#D65B14] text-white text-xs font-bold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Generate Certificate
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500">
          Loading dashboard metrics...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.label}
                  href={c.href}
                  className={`bg-white border border-slate-200 border-t-4 ${c.border} rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="w-5 h-5 text-slate-500" />
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-[#0B3D62] mt-3">
                    {c.value}
                  </div>
                  <div className="text-xs font-semibold text-slate-600 mt-1">
                    {c.label}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#0B3D62]">
                  Recent Admission Applications
                </h2>
                <Link
                  href="/admin/admissions"
                  className="text-xs font-bold text-[#135589] hover:underline"
                >
                  View All →
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {recentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="px-5 py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#0B3D62]">{app.fullName}</p>
                      <p className="text-slate-500">
                        {app.courseCode} •{" "}
                        <span className="font-mono">
                          {app.enrollmentNumber || app.applicationRef}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        app.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : app.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#0B3D62]">
                  Recently Issued Certificates
                </h2>
                <Link
                  href="/admin/certificates"
                  className="text-xs font-bold text-[#135589] hover:underline"
                >
                  Registry →
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {recentCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="px-5 py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#0B3D62]">{cert.studentName}</p>
                      <p className="text-slate-500">
                        <span className="font-mono font-semibold text-[#D65B14]">
                          {cert.certificateNumber}
                        </span>{" "}
                        • {cert.courseName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[#135589] font-bold text-[10px]">
                        Grade {cert.grade}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatDisplayDate(cert.issueDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  );
}
