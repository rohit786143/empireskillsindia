"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { UsersRound, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";

export type TeamLayoutStyle =
  | "classic"
  | "portrait"
  | "horizontal"
  | "dark-executive"
  | "minimal";

export const TEAM_LAYOUT_OPTIONS: {
  id: TeamLayoutStyle;
  name: string;
  tagline: string;
}[] = [
  {
    id: "classic",
    name: "1. Classic Executive",
    tagline: "Navy top banner + circular portrait",
  },
  {
    id: "portrait",
    name: "2. Modern Portrait",
    tagline: "Large top photo card + clean bio",
  },
  {
    id: "horizontal",
    name: "3. Side-by-Side Split",
    tagline: "Wide 2-column photo & intro layout",
  },
  {
    id: "dark-executive",
    name: "4. Dark Navy Prestige",
    tagline: "Luxury dark navy cards with gold ring",
  },
  {
    id: "minimal",
    name: "5. Minimalist Clean",
    tagline: "Crisp white cards with saffron accent",
  },
];

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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function OurTeamSection({ mode = "section" }: OurTeamSectionProps) {
  const [members, setMembers] = useState<PublicTeamMember[]>([]);
  const [layout, setLayout] = useState<TeamLayoutStyle>("classic");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/team.php?_t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.members && Array.isArray(d.members)) {
          setMembers(d.members);
        }
        if (d?.layout) {
          setLayout(d.layout as TeamLayoutStyle);
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
      ) : layout === "portrait" ? (
        /* STYLE 2: Modern Portrait Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {members.map((member) => (
            <article
              key={member.id}
              className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
            >
              <div className="relative h-56 sm:h-60 bg-gradient-to-br from-[#0B3D62] to-[#0E7490] overflow-hidden">
                {member.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/90 text-4xl font-extrabold">
                    {getInitials(member.name)}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0B3D62]/85 to-transparent" />
                {member.designation && (
                  <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-md bg-[#F07228] text-white text-[10.5px] font-bold shadow">
                    {member.designation}
                  </span>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col border-t-2 border-[#F07228]">
                <h3 className="text-base font-extrabold text-[#0B3D62] leading-snug">
                  {member.name}
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mt-2 whitespace-pre-line">
                  {member.shortIntro}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : layout === "horizontal" ? (
        /* STYLE 3: Side-by-Side Split Cards */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {members.map((member) => (
            <article
              key={member.id}
              className="group bg-white border border-slate-200 border-l-4 border-l-[#0B3D62] hover:border-l-[#F07228] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5"
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border-2 border-slate-200 shadow-sm bg-slate-100">
                {member.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0B3D62] to-[#135589] text-white font-extrabold text-2xl flex items-center justify-center">
                    {getInitials(member.name)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <h3 className="text-base sm:text-lg font-extrabold text-[#0B3D62] leading-snug">
                  {member.name}
                </h3>
                {member.designation && (
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#D65B14] text-[11px] font-bold">
                    {member.designation}
                  </span>
                )}
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mt-2.5 whitespace-pre-line">
                  {member.shortIntro}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : layout === "dark-executive" ? (
        /* STYLE 4: Dark Navy Prestige Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {members.map((member) => (
            <article
              key={member.id}
              className="group relative bg-gradient-to-b from-[#0B3D62] via-[#093252] to-[#06223A] text-white border border-sky-400/20 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:border-[#FFB36B]/60 hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center overflow-hidden"
            >
              <div
                className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#F07228]/15 blur-2xl"
                aria-hidden="true"
              />
              <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-[#F07228] via-[#FFB36B] to-[#38BDF8] shadow-lg group-hover:scale-105 transition-transform">
                {member.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover bg-[#0B3D62]"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#135589] text-white font-extrabold text-xl flex items-center justify-center">
                    {getInitials(member.name)}
                  </div>
                )}
              </div>
              <h3 className="text-base font-extrabold text-white mt-4 leading-snug">
                {member.name}
              </h3>
              {member.designation && (
                <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full bg-[#F07228]/20 border border-[#FFB36B]/50 text-[#FFB36B] text-[11px] font-bold">
                  {member.designation}
                </span>
              )}
              <p className="text-xs sm:text-[13px] text-sky-100/85 leading-relaxed mt-3 whitespace-pre-line">
                {member.shortIntro}
              </p>
            </article>
          ))}
        </div>
      ) : layout === "minimal" ? (
        /* STYLE 5: Minimalist Clean Gallery */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {members.map((member) => (
            <article
              key={member.id}
              className="group bg-white border border-slate-200/90 hover:border-[#0B3D62]/40 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-slate-100 group-hover:ring-amber-100 shadow-sm transition-all">
                {member.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 text-[#0B3D62] font-extrabold text-xl flex items-center justify-center">
                    {getInitials(member.name)}
                  </div>
                )}
              </div>
              <h3 className="text-base font-extrabold text-[#0B3D62] mt-4 leading-snug">
                {member.name}
              </h3>
              {member.designation && (
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#D65B14] mt-1">
                  {member.designation}
                </p>
              )}
              <div className="w-10 h-1 rounded-full bg-gradient-to-r from-[#0B3D62] to-[#F07228] my-3" />
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed whitespace-pre-line">
                {member.shortIntro}
              </p>
            </article>
          ))}
        </div>
      ) : (
        /* STYLE 1 (Default): Classic Executive */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {members.map((member) => (
            <article
              key={member.id}
              className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
            >
              <div className="h-20 bg-gradient-to-r from-[#0B3D62] via-[#135589] to-[#0E7490] relative">
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#F07228] via-[#FFB36B] to-[#F07228]" />
              </div>
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
                      {getInitials(member.name)}
                    </div>
                  )}
                </div>
              </div>
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
          ))}
        </div>
      )}
    </section>
  );
}
