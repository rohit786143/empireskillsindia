"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { UsersRound, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";

export interface PublicTeamMember {
  id: string;
  name: string;
  designation: string;
  shortIntro: string;
  photoUrl: string | null;
  sortOrder: number;
}

interface OurTeamSectionProps {
  mode?: "section" | "page";
}

export function OurTeamSection({ mode = "section" }: OurTeamSectionProps) {
  const [members, setMembers] = useState<PublicTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/team.php?_t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.members && Array.isArray(d.members)) {
          setMembers(d.members);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (mode === "section" && !loading && members.length === 0) {
    return null;
  }

  return (
    <section
      id="our-team"
      className={
        mode === "section"
          ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
      }
    >
      {mode === "section" && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#D65B14] flex items-center gap-1.5">
              <UsersRound className="w-3.5 h-3.5" />
              Leadership &amp; Faculty
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B3D62] mt-0.5">
              Meet Our Team
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Experienced educators, project leaders, and placement mentors driving Empire Skills
              India.
            </p>
          </div>
          <Link
            href="/our-team"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#135589] hover:text-[#F07228] transition-colors shrink-0"
          >
            View Full Team <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse space-y-4"
            >
              <div className="w-24 h-24 rounded-full bg-slate-200 mx-auto" />
              <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
              <div className="h-3 bg-slate-100 rounded w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-14 text-center max-w-xl mx-auto shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-full bg-sky-50 text-[#0B3D62] flex items-center justify-center mx-auto">
            <UsersRound className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-extrabold text-[#0B3D62]">
            Team Profiles Coming Soon
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Our leadership and faculty profiles are being updated. Please check back shortly or
            reach out to our administration desk for assistance.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#0B3D62] hover:bg-[#135589] text-white text-xs font-bold"
          >
            Contact Us <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {members.map((member) => {
            const initials = member.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <article
                key={member.id}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
              >
                {/* Top Navy-Teal Banner */}
                <div className="h-20 bg-gradient-to-r from-[#0B3D62] via-[#135589] to-[#0E7490] relative">
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#F07228] via-[#FFB36B] to-[#F07228]" />
                </div>

                {/* Circular Framed Portrait */}
                <div className="-mt-12 flex justify-center relative z-10">
                  <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-[#0B3D62] via-[#135589] to-[#F07228] shadow-md group-hover:scale-105 transition-transform">
                    {member.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-full h-full rounded-full object-cover bg-white"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-[#0B3D62] to-[#135589] text-white font-extrabold text-xl flex items-center justify-center">
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                {/* Member Details */}
                <div className="px-5 pt-3.5 pb-6 text-center flex-1 flex flex-col">
                  <h3 className="text-base font-extrabold text-[#0B3D62] leading-snug">
                    {member.name}
                  </h3>
                  {member.designation && (
                    <span className="inline-block self-center mt-1.5 px-3 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#D65B14] text-[11px] font-bold">
                      {member.designation}
                    </span>
                  )}
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mt-3 whitespace-pre-line">
                    {member.shortIntro}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
