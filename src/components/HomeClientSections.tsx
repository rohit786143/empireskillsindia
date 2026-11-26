"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  FileText,
  Clock,
  GraduationCap,
  ArrowRight,
  X,
  IndianRupee,
  Megaphone,
  Award,
} from "lucide-react";
import { COURSE_CATEGORIES } from "@/lib/constants";
import { formatDisplayDate, formatINR } from "@/lib/generators";

export interface PublicNotice {
  id: string;
  title: string;
  refNumber: string;
  category: string;
  content: string;
  publishedDate: string;
  isNew: boolean;
  attachmentLabel: string | null;
}

export interface PublicCourse {
  id: string;
  code: string;
  slug: string;
  title: string;
  category: string;
  duration: string;
  eligibility: string;
  fee: number;
  studyMode: string;
  overview: string;
}

export function NoticeBoardSection({ notices }: { notices: PublicNotice[] }) {
  const [selectedNotice, setSelectedNotice] = useState<PublicNotice | null>(null);

  return (
    <div
      id="notice-board"
      className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-full"
    >
      <div className="bg-[#0B3D62] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#F07228]">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-[#FF9B5E]" />
          <h2 className="text-base font-bold tracking-wide uppercase">
            Notice Board &amp; Official Circulars
          </h2>
        </div>
        <span className="text-[11px] bg-white/15 px-2 py-0.5 rounded font-medium">
          {notices.length} Active
        </span>
      </div>

      <div className="divide-y divide-slate-200 max-h-[430px] overflow-y-auto flex-1">
        {notices.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            No official circulars published yet.
          </div>
        ) : (
          notices.map((notice) => (
            <button
              key={notice.id}
              type="button"
              onClick={() => setSelectedNotice(notice)}
              className="w-full text-left p-4 hover:bg-blue-50/60 transition-colors group"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                    <Calendar className="w-3 h-3 text-[#135589]" />
                    {formatDisplayDate(notice.publishedDate)}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {notice.category}
                  </span>
                </div>
                {notice.isNew && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#F07228] text-white rounded uppercase tracking-wider">
                    NEW
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-[#0B3D62] group-hover:text-[#135589] leading-snug">
                {notice.title}
              </p>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                <span>Ref: {notice.refNumber}</span>
                <span className="text-[#135589] font-semibold inline-flex items-center gap-1">
                  View Circular <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <span>Click any notice to view complete official circular details.</span>
      </div>

      {/* Circular Detail Modal */}
      {selectedNotice && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
          onClick={() => setSelectedNotice(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full border-t-4 border-[#0B3D62] shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <span className="font-bold text-[#0B3D62]">
                    Ref No: {selectedNotice.refNumber}
                  </span>
                  <span>•</span>
                  <span>Dated: {formatDisplayDate(selectedNotice.publishedDate)}</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-[#135589] font-semibold">
                    {selectedNotice.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#0B3D62]">
                  {selectedNotice.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedNotice.content}
              </p>
              {selectedNotice.attachmentLabel && (
                <div className="p-3.5 rounded bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-amber-700" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">
                        Official Document Reference
                      </p>
                      <p className="text-xs text-amber-800">
                        {selectedNotice.attachmentLabel}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white text-xs font-semibold"
                  >
                    Print Circular
                  </button>
                </div>
              )}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Issued By: Office of the Registrar, Empire Skills India</span>
                <button
                  type="button"
                  onClick={() => setSelectedNotice(null)}
                  className="px-4 py-1.5 rounded border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CoursesExplorerGrid({ courses }: { courses: PublicCourse[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filtered =
    selectedCategory === "All"
      ? courses
      : courses.filter((c) => c.category === selectedCategory);

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#D65B14]">
            Academic Programmes 2026
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B3D62] mt-1">
            Industry-Recognized Vocational &amp; Skill Courses
          </h2>
        </div>
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#135589] hover:text-[#0B3D62]"
        >
          View Complete Course Directory <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {COURSE_CATEGORIES.map((category) => {
          const active = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-3.5 py-2 rounded text-xs sm:text-sm font-semibold border transition-colors ${
                active
                  ? "bg-[#0B3D62] text-white border-[#0B3D62]"
                  : "bg-white text-slate-700 border-slate-300 hover:border-[#0B3D62] hover:text-[#0B3D62]"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filtered.map((course) => (
          <div
            key={course.id}
            className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
          >
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#0B3D62] tracking-wide">
                {course.code}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#135589] border border-blue-200">
                {course.category}
              </span>
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-base font-bold text-[#0B3D62] leading-snug mb-2">
                {course.title}
              </h3>
              <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                {course.overview}
              </p>

              <div className="mt-auto space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-[#D65B14]" />
                    Duration
                  </span>
                  <span className="font-semibold">{course.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <GraduationCap className="w-3.5 h-3.5 text-[#135589]" />
                    Eligibility
                  </span>
                  <span className="font-semibold">{course.eligibility}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-700" />
                    Programme Fee
                  </span>
                  <span className="font-bold text-[#0B3D62]">
                    {formatINR(course.fee)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-2">
              <Link
                href={`/courses/detail?slug=${course.slug}`}
                className="text-center px-2.5 py-2 rounded border border-[#0B3D62] text-[#0B3D62] hover:bg-[#0B3D62] hover:text-white text-xs font-semibold transition-colors"
              >
                View Details
              </Link>
              <Link
                href={`/admission?course=${course.id}`}
                className="text-center px-2.5 py-2 rounded bg-[#135589] hover:bg-[#0B3D62] text-white text-xs font-semibold transition-colors"
              >
                Apply Now
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-sm">
          <Award className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          No courses currently listed under this category.
        </div>
      )}
    </section>
  );
}
