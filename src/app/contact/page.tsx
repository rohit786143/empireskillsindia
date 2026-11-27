"use client";

import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from "lucide-react";
import { INSTITUTE_INFO } from "@/lib/constants";
import { apiFetch } from "@/lib/api";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Admission Inquiry",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await apiFetch("/contact.php", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to send message.");
      } else {
        setSubmitted(true);
        setForm({
          name: "",
          email: "",
          phone: "",
          subject: "Admission Inquiry",
          message: "",
        });
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-14">
      <section className="bg-gradient-to-r from-[#061E33] via-[#0B3D62] to-[#135589] text-white border-b-4 border-[#F07228] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#FF9B5E]">
            Student Helpdesk &amp; Administrative Office
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-1">
            Contact Empire Skills India
          </h1>
          <p className="text-slate-200 text-sm sm:text-base mt-2 max-w-2xl">
            Reach out to our Admission Cell, Examination Branch, or Certificate Verification
            Desk for prompt official assistance.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Info */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-[#0B3D62] border-b border-slate-200 pb-2">
              Head Office &amp; Helpdesk
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#D65B14] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#0B3D62]">Campus Address</p>
                  <p className="text-slate-600">{INSTITUTE_INFO.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#135589] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#0B3D62]">Official Helpline</p>
                  <p className="text-slate-600">{INSTITUTE_INFO.helpline}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#135589] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#0B3D62]">Email Desks</p>
                  <p className="text-slate-600">General: {INSTITUTE_INFO.email}</p>
                  <p className="text-slate-600">
                    Admissions: {INSTITUTE_INFO.admissionsEmail}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#0B3D62]">Office Hours</p>
                  <p className="text-slate-600">{INSTITUTE_INFO.officeHours}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200 border-t-4 border-t-[#0B3D62] rounded-lg p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#0B3D62] mb-1">
              Submit an Official Inquiry
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Our academic counsellors typically respond within 1 working day.
            </p>

            {submitted && (
              <div className="mb-6 p-4 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Inquiry Submitted Successfully</p>
                  <p className="text-xs mt-0.5">
                    Thank you for contacting Empire Skills India. Our team will reach out to you
                    shortly.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department / Subject
                  </label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#135589]"
                  >
                    <option>Admission Inquiry</option>
                    <option>Certificate Verification Assistance</option>
                    <option>Examination &amp; Result Desk</option>
                    <option>Study Center Affiliation</option>
                    <option>General Helpdesk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message / Query Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white font-bold text-sm disabled:opacity-60 transition-colors"
              >
                <Send className="w-4 h-4" />
                {submitting ? "Submitting..." : "Submit Inquiry"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
