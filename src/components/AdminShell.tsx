"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  IndianRupee,
  Building2,
  Inbox,
  Wallet,
  Award,
  FileCheck2,
  ShieldCheck,
  BookOpen,
  Megaphone,
  Image as ImageIcon,
  Settings,
  LogOut,
  KeyRound,
  ExternalLink,
  Menu,
  X,
  CheckCircle2,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { apiFetch } from "@/lib/api";
import { AdminCenterProvider, useAdminCenter } from "./AdminCenterContext";

interface AdminShellProps {
  adminName: string;
  adminEmail: string;
  children: React.ReactNode;
}

const ADMIN_NAV = [
  { label: "Dashboard Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Admissions & Students", href: "/admin/admissions", icon: Users },
  { label: "Franchise Admissions", href: "/admin/franchise-admissions", icon: Inbox },
  { label: "Franchise Centers", href: "/admin/franchises", icon: Building2 },
  { label: "Franchise Ledger", href: "/admin/franchise-ledger", icon: Wallet },
  { label: "Fee Management", href: "/admin/fees", icon: IndianRupee },
  {
    label: "Certificate Generator",
    href: "/admin/certificates/generate",
    icon: Award,
  },
  { label: "Certificate Registry", href: "/admin/certificates", icon: FileCheck2 },
  {
    label: "Institute Certificates",
    href: "/admin/institute-certificates",
    icon: ShieldCheck,
  },
  { label: "Course Manager", href: "/admin/courses", icon: BookOpen },
  { label: "Notice Board Manager", href: "/admin/notices", icon: Megaphone },
  { label: "Photo Gallery Manager", href: "/admin/gallery", icon: ImageIcon },
  { label: "Contact & Settings", href: "/admin/settings", icon: Settings },
];

export function AdminShell(props: AdminShellProps) {
  return (
    <AdminCenterProvider>
      <AdminShellInner {...props} />
    </AdminCenterProvider>
  );
}

function AdminShellInner({ adminName, adminEmail, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { centers, selectedCenterId, setSelectedCenterId, selectedCenter } =
    useAdminCenter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(
    null
  );
  const [savingPw, setSavingPw] = useState(false);

  async function handleLogout() {
    await apiFetch("/auth.php?action=logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPw(true);
    setPwStatus(null);
    try {
      const res = await apiFetch("/auth.php?action=change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwStatus({ type: "err", msg: data.error || "Failed to update password." });
      } else {
        setPwStatus({ type: "ok", msg: "Password changed successfully!" });
        setCurrentPassword("");
        setNewPassword("");
      }
    } catch {
      setPwStatus({ type: "err", msg: "Network error." });
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 w-64 bg-[#0B3D62] text-slate-100 flex flex-col border-r-2 border-[#F07228] transform transition-transform lg:translate-x-0 lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-white/15 flex items-center justify-between gap-2">
          <div className="space-y-1.5">
            <BrandLogo height={34} onDarkBg />
            <p className="text-[10px] text-[#FFB380] font-semibold uppercase tracking-wider">
              Institute Owner Portal
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center-Wise Filter Switcher in Left Sidebar */}
        <div className="px-3 pt-3 pb-2 border-b border-white/15 bg-[#072A44]/60">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#FFB380] mb-1.5 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            Filter By Study Center
          </label>
          <select
            value={selectedCenterId}
            onChange={(e) => setSelectedCenterId(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded bg-[#0B3D62] border border-white/25 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F07228]"
          >
            <option value="ALL">All Study Centers ({centers.length})</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.centerCode}] {c.centerName}
              </option>
            ))}
          </select>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin/certificates"
                ? pathname === "/admin/certificates"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded text-sm font-semibold transition-colors ${
                  active
                    ? "bg-[#F07228] text-white shadow-sm"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/15 space-y-1.5 text-xs">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 rounded text-slate-200 hover:bg-white/10 font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#FF9B5E]" />
            View Public Portal
          </Link>
          <button
            type="button"
            onClick={() => {
              setPwStatus(null);
              setPwModalOpen(true);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-slate-200 hover:bg-white/10 font-medium text-left"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#FF9B5E]" />
            Change Password
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded bg-red-900/40 hover:bg-red-800/70 text-red-100 font-semibold text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Admin Header */}
        <header className="no-print bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded border border-slate-300 text-[#0B3D62]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#D65B14]">
                Institutional Administration
              </p>
              <p className="text-sm font-bold text-[#0B3D62]">{adminName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {selectedCenter && (
              <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-300 text-amber-900 font-bold">
                <Building2 className="w-3.5 h-3.5 text-[#D65B14]" />
                <span>
                  [{selectedCenter.centerCode}] {selectedCenter.centerName}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCenterId("ALL")}
                  title="Show All Centers"
                  className="ml-1 text-amber-700 hover:text-red-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <span className="hidden sm:inline-block px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-600 font-medium">
              {adminEmail}
            </span>
            <Link
              href="/admin/certificates/generate"
              className="px-3 py-1.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white font-bold"
            >
              + Generate Certificate
            </Link>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </div>

      {/* Change Password Modal */}
      {pwModalOpen && (
        <div
          className="no-print fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
          onClick={() => setPwModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full border-t-4 border-[#0B3D62] shadow-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0B3D62]">
                Change Admin Password
              </h3>
              <button
                type="button"
                onClick={() => setPwModalOpen(false)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pwStatus && (
              <div
                className={`p-3 rounded text-xs font-semibold flex items-center gap-2 ${
                  pwStatus.type === "ok"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {pwStatus.type === "ok" && <CheckCircle2 className="w-4 h-4" />}
                {pwStatus.msg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPwModalOpen(false)}
                  className="px-4 py-2 rounded border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPw}
                  className="px-4 py-2 rounded bg-[#0B3D62] hover:bg-[#135589] text-white text-xs font-bold"
                >
                  {savingPw ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
