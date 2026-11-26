"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Clock,
  GraduationCap,
  IndianRupee,
  Filter,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import {
  COURSE_CATEGORIES,
  COURSE_DURATIONS,
  COURSE_ELIGIBILITIES,
  type FeeBreakdown,
} from "@/lib/constants";
import { formatINR } from "@/lib/generators";
import type { PublicCourse } from "./HomeClientSections";

function parseFee(json?: string | null): FeeBreakdown {
  if (!json) return {};
  try {
    return JSON.parse(json) as FeeBreakdown;
  } catch {
    return {};
  }
}

export function CoursesDirectoryClient({ courses }: { courses: PublicCourse[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [duration, setDuration] = useState("All");
  const [eligibility, setEligibility] = useState("All");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (category !== "All" && c.category !== category) return false;
      if (duration !== "All" && c.duration !== duration) return false;
      if (eligibility !== "All" && c.eligibility !== eligibility) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${c.title} ${c.code} ${c.category} ${c.overview}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [courses, category, duration, eligibility, search]);

  const resetFilters = () => {
    setSearch("");
    setCategory("All");
    setDuration("All");
    setEligibility("All");
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B3D62]">
            <Filter className="w-4 h-4 text-[#D65B14]" />
            Filter Programmes
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#0B3D62]"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Search Course / Code
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g., ADCA, Tally, NTT..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#135589]"
            >
              {COURSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#135589]"
            >
              {COURSE_DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Eligibility */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Minimum Eligibility
            </label>
            <select
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#135589]"
            >
              {COURSE_ELIGIBILITIES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Result Count + View Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <span>
          Showing <strong className="text-[#0B3D62]">{filtered.length}</strong> of{" "}
          <strong>{courses.length}</strong> academic programmes
        </span>
        <div className="inline-flex rounded border border-slate-300 overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 font-bold ${
              viewMode === "table"
                ? "bg-[#0B3D62] text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Fee Structure Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 font-bold ${
              viewMode === "cards"
                ? "bg-[#0B3D62] text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Card View
          </button>
        </div>
      </div>

      {/* Table or Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-2">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-[#0B3D62]">No matching courses found</p>
          <p className="text-xs text-slate-500">
            Try clearing your filters or searching with a different keyword.
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0B3D62] text-white uppercase">
              <tr>
                <th className="py-3 px-4">Course Name</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3 text-right">Registration Fee</th>
                <th className="py-3 px-3 text-right">Admission Fee</th>
                <th className="py-3 px-3 text-right">Monthly / Sem Fee</th>
                <th className="py-3 px-3 text-right bg-[#072A44]">Total Course Fee</th>
                <th className="py-3 px-3 text-right">Examination Fee</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((course) => {
                const fb = parseFee(course.feeBreakdownJson);
                const reg = fb.registrationFee ?? course.registrationFee ?? 0;
                const adm = fb.admissionFee ?? 0;
                const monthly = fb.monthlyFee ?? 0;
                const sem1 = fb.sem1Fee ?? 0;
                const sem2 = fb.sem2Fee ?? 0;
                const exam = fb.examFee ?? 0;
                return (
                  <tr key={course.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <Link
                        href={`/courses/detail?slug=${course.slug}`}
                        className="font-bold text-[#0B3D62] hover:text-[#135589] hover:underline"
                      >
                        {course.title}
                      </Link>
                      <div className="text-[10px] text-slate-500">
                        {course.category} • Eligibility: {course.eligibility}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {course.duration}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {reg > 0 ? formatINR(reg) : "—"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {adm > 0 ? formatINR(adm) : "—"}
                    </td>
                    <td className="py-3 px-3 text-right font-medium">
                      {monthly > 0
                        ? `${formatINR(monthly)} / month`
                        : sem1 > 0
                        ? `1st: ${formatINR(sem1)} | 2nd: ${formatINR(sem2)}`
                        : "—"}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-[#D65B14] bg-amber-50/50 text-sm">
                      {formatINR(course.fee)}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-700">
                      {fb.examFeeNote || (exam > 0 ? formatINR(exam) : "—")}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex gap-1.5">
                        <Link
                          href={`/courses/detail?slug=${course.slug}`}
                          className="px-2.5 py-1.5 rounded border border-[#0B3D62] text-[#0B3D62] hover:bg-[#0B3D62] hover:text-white font-bold"
                        >
                          Details
                        </Link>
                        <Link
                          href={`/admission?course=${course.id}`}
                          className="px-2.5 py-1.5 rounded bg-[#F07228] hover:bg-[#D65B14] text-white font-bold"
                        >
                          Apply
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
            >
              <div className="bg-[#F8FAFC] px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B3D62]">{course.code}</span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-[#135589] border border-blue-200">
                  {course.category}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h2 className="text-lg font-bold text-[#0B3D62] leading-snug">
                  {course.title}
                </h2>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {course.overview}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 rounded p-2">
                    <Clock className="w-3.5 h-3.5 text-[#D65B14] mx-auto mb-1" />
                    <div className="text-[10px] text-slate-500">Duration</div>
                    <div className="text-xs font-bold text-[#0B3D62]">{course.duration}</div>
                  </div>
                  <div className="bg-slate-50 rounded p-2">
                    <GraduationCap className="w-3.5 h-3.5 text-[#135589] mx-auto mb-1" />
                    <div className="text-[10px] text-slate-500">Eligibility</div>
                    <div className="text-xs font-bold text-[#0B3D62]">
                      {course.eligibility}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded p-2">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-700 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-500">Course Fee</div>
                    <div className="text-xs font-bold text-[#0B3D62]">
                      {formatINR(course.fee)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-3">
                <Link
                  href={`/courses/detail?slug=${course.slug}`}
                  className="text-center py-2 rounded border border-[#0B3D62] text-[#0B3D62] hover:bg-[#0B3D62] hover:text-white text-xs font-bold transition-colors"
                >
                  Syllabus &amp; Details
                </Link>
                <Link
                  href={`/admission?course=${course.id}`}
                  className="text-center py-2 rounded bg-[#135589] hover:bg-[#0B3D62] text-white text-xs font-bold transition-colors"
                >
                  Apply Online
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
