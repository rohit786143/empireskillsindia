"use client";

import React, { useEffect, useState } from "react";
import { CoursesDirectoryClient } from "@/components/CoursesDirectoryClient";
import type { PublicCourse } from "@/components/HomeClientSections";
import { apiFetch } from "@/lib/api";

export default function CoursesPage() {
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/courses.php")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.courses) setCourses(data.courses);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pb-12">
      <section className="bg-gradient-to-r from-[#061E33] via-[#0B3D62] to-[#135589] text-white border-b-4 border-[#F07228] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#FF9B5E]">
            Academic Prospectus 2026
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-1">
            Courses &amp; Vocational Programmes Directory
          </h1>
          <p className="text-slate-200 text-sm sm:text-base mt-2 max-w-3xl">
            Explore all diploma, certificate, and short-term skill programmes offered by Empire
            Skills India. Filter by category, duration, or eligibility to find your ideal
            programme.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-sm text-slate-500">
            Loading courses directory...
          </div>
        ) : (
          <CoursesDirectoryClient courses={courses} />
        )}
      </div>
    </div>
  );
}
