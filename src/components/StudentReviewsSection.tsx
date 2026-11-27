"use client";

import React, { useEffect, useState } from "react";
import { Star, Quote, MessageSquareHeart } from "lucide-react";
import { apiFetch } from "@/lib/api";

export interface StudentReviewItem {
  id: string;
  studentName: string;
  courseName: string;
  batchLabel: string;
  rating: number;
  reviewText: string;
  photoUrl: string | null;
}

const DEFAULT_REVIEWS: StudentReviewItem[] = [
  {
    id: "rev_01",
    studentName: "Aarav Thakur",
    courseName: "Diploma in Computer Application (DCA)",
    batchLabel: "Mandi • Batch 2025",
    rating: 5,
    reviewText:
      "The practical computer lab sessions and faculty guidance at Empire Skills India helped me build real office automation skills and land my first job.",
    photoUrl: "/reviews/student-01.jpg",
  },
  {
    id: "rev_02",
    studentName: "Priya Sharma",
    courseName: "Diploma in Professional Accounting & Taxation",
    batchLabel: "Sundarnagar • Batch 2025",
    rating: 5,
    reviewText:
      "Learning Tally PRIME with live GST filing and accounting case studies gave me complete confidence to work independently as an accounts executive.",
    photoUrl: "/reviews/student-02.jpg",
  },
  {
    id: "rev_03",
    studentName: "Rohan Verma",
    courseName: "'O' Level (NIELIT)",
    batchLabel: "Mandi • Batch 2025",
    rating: 5,
    reviewText:
      "Structured syllabus coverage, regular mock tests, and supportive teachers made preparing for NIELIT examinations smooth and stress-free.",
    photoUrl: "/reviews/student-03.jpg",
  },
  {
    id: "rev_04",
    studentName: "Meenakshi Devi",
    courseName: "Diploma in Fashion Designing",
    batchLabel: "Mandi • Batch 2025",
    rating: 5,
    reviewText:
      "Hands-on garment drafting, stitching labs, and annual showcase events gave me the skills and confidence to start my own boutique.",
    photoUrl: "/reviews/student-04.jpg",
  },
  {
    id: "rev_05",
    studentName: "Karan Chauhan",
    courseName: "Basic + Tally PRIME",
    batchLabel: "Mandi • Batch 2026",
    rating: 5,
    reviewText:
      "Transparent fee structure, friendly atmosphere, and step-by-step practical training make Empire Skills India the best skill institute in Himachal.",
    photoUrl: "/reviews/student-05.jpg",
  },
  {
    id: "rev_06",
    studentName: "Simran Kaur",
    courseName: "Diploma in Hair & Skin Care",
    batchLabel: "Mandi • Batch 2025",
    rating: 5,
    reviewText:
      "Every module focuses on real practical demonstrations and modern beauty techniques. I am truly grateful to the trainers for their constant support.",
    photoUrl: "/reviews/student-06.jpg",
  },
];

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

export function StudentReviewsSection() {
  const [reviews, setReviews] = useState<StudentReviewItem[]>(DEFAULT_REVIEWS);

  useEffect(() => {
    apiFetch(`/reviews.php?_t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.reviews && Array.isArray(d.reviews) && d.reviews.length > 0) {
          setReviews(d.reviews);
        }
      })
      .catch(() => {});
  }, []);

  // Ensure smooth infinite right-to-left loop by duplicating the list
  const loopItems = reviews.length >= 4 ? [...reviews, ...reviews] : [...reviews, ...reviews, ...reviews, ...reviews];
  const durationSec = Math.max(22, reviews.length * 6);

  return (
    <section className="py-4">
      <div className="bg-gradient-to-br from-[#F0F7FF] via-white to-[#FFF7ED] border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-7">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#D65B14] inline-flex items-center gap-1.5">
              <MessageSquareHeart className="w-4 h-4 text-[#F07228]" />
              Student Voices &amp; Alumni Stories
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B3D62] mt-1">
              What Our Students Say About Us
            </h2>
          </div>
          <p className="text-xs text-slate-600 max-w-sm">
            Real feedback from learners building their careers across IT, Accounting,
            Fashion Designing, Beauty &amp; Skill Programmes.
          </p>
        </div>

        {/* Continuous Right-to-Left Marquee Slider (4 Cards Visible on Desktop) */}
        <div className="relative overflow-hidden group">
          <div
            className="flex gap-5 w-max esi-reviews-track group-hover:[animation-play-state:paused]"
            style={{
              animation: `esiReviewsMarquee ${durationSec}s linear infinite`,
            }}
          >
            {loopItems.map((rev, idx) => (
              <article
                key={`${rev.id}-${idx}`}
                className="w-[275px] sm:w-[290px] lg:w-[292px] shrink-0 bg-white border border-slate-200 hover:border-[#F07228]/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative"
              >
                <Quote className="w-8 h-8 text-[#0B3D62]/10 absolute top-4 right-4" />

                {/* Top: Circular Student Image + Name */}
                <div className="flex items-center gap-3.5 mb-3.5">
                  <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-[#0B3D62] via-[#0E7490] to-[#F07228] shrink-0 shadow-sm">
                    {rev.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rev.photoUrl}
                        alt={rev.studentName}
                        className="w-full h-full rounded-full object-cover bg-white"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-[#0B3D62] to-[#0E7490] text-white font-extrabold text-lg flex items-center justify-center">
                        {getInitials(rev.studentName)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-[#0B3D62] truncate">
                      {rev.studentName}
                    </h3>
                    {rev.batchLabel && (
                      <p className="text-[11px] font-semibold text-[#D65B14] truncate">
                        {rev.batchLabel}
                      </p>
                    )}
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, sIdx) => (
                        <Star
                          key={sIdx}
                          className={`w-3.5 h-3.5 ${
                            sIdx < rev.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Review Quote */}
                <p className="text-xs text-slate-600 leading-relaxed flex-1 line-clamp-4">
                  &ldquo;{rev.reviewText}&rdquo;
                </p>

                {/* Course Pill */}
                {rev.courseName && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#0B3D62] text-[10px] font-bold truncate max-w-full">
                      {rev.courseName}
                    </span>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes esiReviewsMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
