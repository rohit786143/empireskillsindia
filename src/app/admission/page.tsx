"use client";

import React, { Suspense, useEffect, useState } from "react";
import {
  AdmissionWizard,
  type FranchiseCenterOption,
} from "@/components/AdmissionWizard";
import { apiFetch } from "@/lib/api";

interface CourseOption {
  id: string;
  code: string;
  title: string;
  category: string;
  duration: string;
  eligibility: string;
  fee: number;
  registrationFee: number;
}

export default function AdmissionPage() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [franchises, setFranchises] = useState<FranchiseCenterOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ts = Date.now();
    Promise.all([
      apiFetch(`/courses.php?_t=${ts}`).then((r) => (r.ok ? r.json() : { courses: [] })),
      apiFetch(`/franchises.php?public=true&_t=${ts}`).then((r) =>
        r.ok ? r.json() : { franchises: [] }
      ),
    ])
      .then(([cData, fData]) => {
        setCourses(cData.courses || []);
        setFranchises(fData.franchises || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pb-14">
      <section className="no-print bg-[#0B3D62] text-white border-b-4 border-[#F07228] py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#FF9B5E]">
            Academic Session 2026
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-1">
            Online Admission Portal
          </h1>
          <p className="text-slate-200 text-sm sm:text-base mt-2 max-w-2xl">
            Complete the 5-step official admission form below, choose your nearest Authorized
            Study Center / Franchise (or Main Institute), and download your auto-filled 3-page
            Admission Form.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-500">
            Loading admission portal...
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-500">
                Loading admission form...
              </div>
            }
          >
            <AdmissionWizard courses={courses} franchises={franchises} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
