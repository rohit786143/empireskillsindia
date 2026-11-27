"use client";

import React, { useEffect, useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Save,
  CheckCircle2,
  AlertCircle,
  Settings,
} from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { apiFetch } from "@/lib/api";
import { INSTITUTE_INFO } from "@/lib/constants";

function AdminSettingsContent() {
  const [form, setForm] = useState({
    helpline: INSTITUTE_INFO.helpline,
    email: INSTITUTE_INFO.email,
    admissionsEmail: INSTITUTE_INFO.admissionsEmail,
    address: INSTITUTE_INFO.address,
    officeHours: INSTITUTE_INFO.officeHours,
    facebook: INSTITUTE_INFO.facebook,
    instagram: INSTITUTE_INFO.instagram,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    apiFetch(`/site-settings.php?_t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.settings) {
          setForm((prev) => ({ ...prev, ...d.settings }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await apiFetch("/site-settings.php", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "err", text: data.error || "Failed to save contact details." });
      } else {
        setStatus({
          type: "ok",
          text: "Contact details & social links updated! Changes are now live on Header, Footer, and Contact Page.",
        });
      }
    } catch {
      setStatus({ type: "err", text: "Network error while saving." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B3D62] flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#F07228]" />
          Contact Details &amp; Social Links
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Update helpline phone numbers, email addresses, campus address, office hours, and
          Facebook / Instagram links across the entire public website.
        </p>
      </div>

      {status && (
        <div
          className={`p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            status.type === "ok"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {status.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{status.text}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500">
          Loading current contact settings...
        </div>
      ) : (
        <form
          onSubmit={handleSave}
          className="bg-white border border-slate-200 border-t-4 border-t-[#0B3D62] rounded-xl p-6 shadow-sm space-y-5"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#D65B14]" />
              Official Helpline Phone Numbers *
            </label>
            <input
              type="text"
              required
              value={form.helpline}
              onChange={(e) => setForm({ ...form, helpline: e.target.value })}
              placeholder="7560001910 / 9882269009 / 01905356777"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135589]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#135589]" />
                General Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135589]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#135589]" />
                Admissions Email *
              </label>
              <input
                type="email"
                required
                value={form.admissionsEmail}
                onChange={(e) => setForm({ ...form, admissionsEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135589]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D65B14]" />
              Campus / Head Office Address *
            </label>
            <textarea
              rows={2}
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135589]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              Office Hours
            </label>
            <input
              type="text"
              value={form.officeHours}
              onChange={(e) => setForm({ ...form, officeHours: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135589]"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                Facebook Page URL
              </label>
              <input
                type="url"
                value={form.facebook}
                onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135589]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-[#E4405F]" />
                Instagram Profile URL
              </label>
              <input
                type="url"
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135589]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white text-sm font-bold shadow-sm transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Contact Details"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminGuard>
      <AdminSettingsContent />
    </AdminGuard>
  );
}
