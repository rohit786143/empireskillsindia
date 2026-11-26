"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  GraduationCap,
  IndianRupee,
  BookOpen,
  Briefcase,
  CheckCircle2,
  FileText,
  Monitor,
} from "lucide-react";
import { formatINR } from "@/lib/generators";
import type { SyllabusModule, FeeBreakdown } from "@/lib/constants";
import { apiFetch } from "@/lib/api";

interface CourseDetail {
  id: string;
  code: string;
  slug: string;
  title: string;
  category: string;
  duration: string;
  eligibility: string;
  fee: number;
  registrationFee: number;
  studyMode: string;
  overview: string;
  syllabusJson: string;
  careerOpportunitiesJson: string;
  feeBreakdownJson?: string | null;
}

function CourseDetailInner() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "";
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    apiFetch(`/courses.php?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.course) setCourse(data.course);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        Loading programme details...
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#0B3D62]">Course Not Found</h1>
        <p className="text-sm text-slate-600">
          The requested course could not be found in our academic directory.
        </p>
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded bg-[#0B3D62] text-white text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Browse All Courses
        </Link>
      </div>
    );
  }

  let syllabus: SyllabusModule[] = [];
  let careers: string[] = [];
  let feeBreakdown: FeeBreakdown = {};
  try {
    syllabus = JSON.parse(course.syllabusJson) as SyllabusModule[];
  } catch {
    syllabus = [];
  }
  try {
    careers = JSON.parse(course.careerOpportunitiesJson) as string[];
  } catch {
    careers = [];
  }
  if (course.feeBreakdownJson) {
    try {
      feeBreakdown = JSON.parse(course.feeBreakdownJson) as FeeBreakdown;
    } catch {
      feeBreakdown = {};
    }
  }

  return (
    <div className="pb-14">
      <section className="bg-[#0B3D62] text-white border-b-4 border-[#F07228] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFB380] hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses Directory
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-white/15 text-xs font-bold tracking-wide">
              Course Code: {course.code}
            </span>
            <span className="px-2.5 py-1 rounded bg-[#F07228] text-white text-xs font-bold">
              {course.category}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight">
            {course.title}
          </h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-[#0B3D62] border-b border-slate-200 pb-2">
              Programme Overview
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{course.overview}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-[#0B3D62] text-white px-6 py-3.5 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#FF9B5E]" />
              <h2 className="text-base font-bold uppercase tracking-wide">
                Module / Semester-Wise Syllabus
              </h2>
            </div>

            <div className="divide-y divide-slate-200">
              {syllabus.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  Detailed syllabus available at the Academic Office.
                </div>
              ) : (
                syllabus.map((mod, idx) => (
                  <div key={idx} className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[#135589] text-xs font-bold border border-blue-200">
                        Unit {idx + 1}
                      </span>
                      <h3 className="text-base font-bold text-[#0B3D62]">
                        {mod.moduleTitle}
                      </h3>
                    </div>
                    <table className="w-full text-sm border border-slate-200 rounded overflow-hidden">
                      <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                        <tr>
                          <th className="py-2 px-3 text-left w-14 border-b border-slate-200">
                            S.No
                          </th>
                          <th className="py-2 px-3 text-left border-b border-slate-200">
                            Curriculum Topic &amp; Practical Coverage
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {mod.topics.map((topic, tIdx) => (
                          <tr key={tIdx} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-semibold text-slate-500">
                              {idx + 1}.{tIdx + 1}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">{topic}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
          </div>

          {careers.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Briefcase className="w-5 h-5 text-[#D65B14]" />
                <h2 className="text-xl font-bold text-[#0B3D62]">
                  Career Opportunities &amp; Job Roles
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {careers.map((role, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-3 rounded bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 border-t-4 border-t-[#0B3D62] rounded-lg p-6 shadow-sm space-y-5 sticky top-24">
            <h3 className="text-lg font-bold text-[#0B3D62] border-b border-slate-200 pb-2">
              Programme Highlights &amp; Fee Structure
            </h3>

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <dt className="text-slate-500 inline-flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#D65B14]" /> Duration
                </dt>
                <dd className="font-bold text-[#0B3D62]">{course.duration}</dd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <dt className="text-slate-500 inline-flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#135589]" /> Eligibility
                </dt>
                <dd className="font-bold text-[#0B3D62]">{course.eligibility}</dd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <dt className="text-slate-500 inline-flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-slate-600" /> Study Mode
                </dt>
                <dd className="font-bold text-[#0B3D62]">{course.studyMode}</dd>
              </div>
              {(feeBreakdown.registrationFee ?? course.registrationFee) > 0 && (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500">Registration Fee</dt>
                  <dd className="font-semibold text-slate-700">
                    {formatINR(feeBreakdown.registrationFee ?? course.registrationFee)}
                  </dd>
                </div>
              )}
              {(feeBreakdown.admissionFee ?? 0) > 0 && (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500">Admission Fee</dt>
                  <dd className="font-semibold text-slate-700">
                    {formatINR(feeBreakdown.admissionFee || 0)}
                  </dd>
                </div>
              )}
              {(feeBreakdown.monthlyFee ?? 0) > 0 && (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500">Monthly Fee</dt>
                  <dd className="font-semibold text-slate-700">
                    {formatINR(feeBreakdown.monthlyFee || 0)} / month
                  </dd>
                </div>
              )}
              {(feeBreakdown.sem1Fee ?? 0) > 0 && (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500">1st Semester Fee</dt>
                  <dd className="font-semibold text-slate-700">
                    {formatINR(feeBreakdown.sem1Fee || 0)}
                  </dd>
                </div>
              )}
              {(feeBreakdown.sem2Fee ?? 0) > 0 && (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500">2nd Semester Fee</dt>
                  <dd className="font-semibold text-slate-700">
                    {formatINR(feeBreakdown.sem2Fee || 0)}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <dt className="font-bold text-[#0B3D62]">Course Fee</dt>
                <dd className="font-bold text-[#0B3D62]">{formatINR(course.fee)}</dd>
              </div>
              {((feeBreakdown.examFee ?? 0) > 0 || feeBreakdown.examFeeNote) && (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-600 font-semibold">Examination Fee</dt>
                  <dd className="font-bold text-amber-800">
                    {feeBreakdown.examFeeNote || formatINR(feeBreakdown.examFee || 0)}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 bg-blue-50/70 p-3 rounded border border-blue-100">
                <dt className="font-bold text-[#0B3D62] inline-flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-emerald-700" />
                  Total Payable (Course + Exam)
                </dt>
                <dd className="text-lg font-extrabold text-[#D65B14]">
                  {formatINR(course.fee + (feeBreakdown.examFee || 0))}
                </dd>
              </div>
            </dl>

            <Link
              href={`/admission?course=${course.id}`}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded bg-[#F07228] hover:bg-[#D65B14] text-white font-bold text-sm shadow transition-colors"
            >
              <FileText className="w-4 h-4" />
              Apply for This Course
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
          Loading course details...
        </div>
      }
    >
      <CourseDetailInner />
    </Suspense>
  );
}
