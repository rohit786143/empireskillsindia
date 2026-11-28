import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { UsersRound, ArrowLeft } from "lucide-react";
import { OurTeamSection } from "@/components/OurTeamSection";

export const metadata: Metadata = {
  title: "Our Team | Empire Skills India",
  description:
    "Meet the leadership, trainers, and project implementation team of Empire Skills India.",
};

export default function OurTeamPage() {
  return (
    <div className="pb-12">
      {/* Page Banner */}
      <section className="bg-gradient-to-r from-[#0B3D62] via-[#135589] to-[#0E7490] text-white border-b-4 border-[#F07228]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-200 hover:text-white mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <div className="flex items-center gap-2 text-[#FFB36B] text-xs font-bold uppercase tracking-wider">
            <UsersRound className="w-4 h-4" />
            Empire Skills India
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold mt-1">Our Team</h1>
          <p className="text-xs sm:text-base text-sky-100/90 mt-2 max-w-2xl leading-relaxed">
            Dedicated professionals, skill trainers, and project leaders committed to empowering
            youth through quality vocational education and career placement.
          </p>
        </div>
      </section>

      <OurTeamSection mode="page" />
    </div>
  );
}
