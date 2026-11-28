"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  Target,
  Eye,
  BookOpen,
  Building2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { OurCertificationsSection } from "@/components/OurCertificationsSection";
import { apiFetch } from "@/lib/api";
import {
  DEFAULT_ABOUT_CONFIG,
  mergeAboutConfig,
  type AboutPageConfig,
} from "@/lib/aboutDefaults";

export default function AboutPage() {
  const [cfg, setCfg] = useState<AboutPageConfig>(DEFAULT_ABOUT_CONFIG);

  useEffect(() => {
    apiFetch(`/about-content.php?_t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.content) {
          setCfg(mergeAboutConfig(d.content));
        }
      })
      .catch(() => {});
  }, []);

  const pillarIcons = [BookOpen, Award, Building2, Sparkles];
  const pillarColors = [
    "text-[#135589]",
    "text-[#D65B14]",
    "text-emerald-700",
    "text-[#0B3D62]",
  ];

  const accentBorder: Record<string, string> = {
    navy: "border-t-[#0B3D62]",
    saffron: "border-t-[#F07228]",
    teal: "border-t-[#0E7490]",
    emerald: "border-t-emerald-600",
  };
  const accentIconColor: Record<string, string> = {
    navy: "text-[#0B3D62]",
    saffron: "text-[#D65B14]",
    teal: "text-[#0E7490]",
    emerald: "text-emerald-700",
  };

  return (
    <div className="pb-12">
      {/* 1. Page Banner */}
      {cfg.showHero && (
        <section className="bg-[#0B3D62] text-white border-b-4 border-[#F07228] py-8 sm:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {cfg.heroEyebrow && (
              <p className="text-xs font-bold uppercase tracking-widest text-[#FF9B5E]">
                {cfg.heroEyebrow}
              </p>
            )}
            <h1 className="text-2xl sm:text-4xl font-extrabold mt-1">{cfg.heroTitle}</h1>
            {cfg.heroSubtitle && (
              <p className="text-slate-200 text-sm sm:text-base mt-2 max-w-3xl leading-relaxed">
                {cfg.heroSubtitle}
              </p>
            )}
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10 space-y-8 sm:space-y-10">
        {/* 2. Institutional Mandate + Accreditation & Recognition */}
        {(cfg.showMandate || cfg.showAccreditation) && (
          <div
            className={`grid grid-cols-1 gap-6 sm:gap-8 ${
              cfg.showMandate && cfg.showAccreditation ? "lg:grid-cols-3" : ""
            }`}
          >
            {cfg.showMandate && (
              <div
                className={`${
                  cfg.showAccreditation ? "lg:col-span-2" : ""
                } bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm space-y-4`}
              >
                <h2 className="text-xl sm:text-2xl font-bold text-[#0B3D62] border-b border-slate-200 pb-3">
                  {cfg.mandateTitle}
                </h2>
                {cfg.mandateParagraphs
                  .filter((p) => p.trim() !== "")
                  .map((para, idx) => (
                    <p
                      key={idx}
                      className="text-sm text-slate-700 leading-relaxed whitespace-pre-line"
                    >
                      {para}
                    </p>
                  ))}
              </div>
            )}

            {cfg.showAccreditation && (
              <div className="bg-[#0B3D62] text-white rounded-lg p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-[#FF9B5E]">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <h3 className="font-bold uppercase text-sm tracking-wider">
                    {cfg.accreditationTitle}
                  </h3>
                </div>
                <ul className="space-y-3 text-sm text-slate-200">
                  {cfg.accreditationPoints
                    .filter((pt) => pt.trim() !== "")
                    .map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#FF9B5E] shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                </ul>
                {cfg.accreditationFooter && (
                  <div className="pt-3 border-t border-white/15 text-xs text-amber-200 font-semibold">
                    {cfg.accreditationFooter}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. Vision & Mission Cards */}
        {cfg.showVisionMission && cfg.visionMissionCards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cfg.visionMissionCards.map((card, idx) => {
              const Icon = idx % 2 === 0 ? Eye : Target;
              return (
                <div
                  key={card.id || idx}
                  className={`bg-white border border-slate-200 border-t-4 ${
                    accentBorder[card.accent] || "border-t-[#0B3D62]"
                  } rounded-lg p-6 shadow-sm space-y-3`}
                >
                  <div
                    className={`flex items-center gap-2.5 ${
                      accentIconColor[card.accent] || "text-[#0B3D62]"
                    }`}
                  >
                    <Icon className="w-6 h-6 shrink-0" />
                    <h3 className="text-xl font-bold text-[#0B3D62]">{card.title}</h3>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Pillars / Highlights */}
        {cfg.showPillars && cfg.pillars.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cfg.pillars.map((pillar, idx) => {
              const Icon = pillarIcons[idx % pillarIcons.length];
              const colorCls = pillarColors[idx % pillarColors.length];
              return (
                <div
                  key={pillar.id || idx}
                  className="bg-white border border-slate-200 rounded-lg p-5 space-y-2 shadow-sm"
                >
                  <Icon className={`w-6 h-6 ${colorCls}`} />
                  <h4 className="font-bold text-[#0B3D62]">{pillar.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. Custom Admin-Added Sections */}
        {cfg.customSections.length > 0 && (
          <div className="space-y-6">
            {cfg.customSections
              .filter((s) => s.title.trim() !== "" || s.body.trim() !== "")
              .map((sec) => (
                <div
                  key={sec.id}
                  className="bg-white border border-slate-200 border-l-4 border-l-[#F07228] rounded-lg p-6 sm:p-8 shadow-sm space-y-3"
                >
                  {sec.title && (
                    <h3 className="text-xl font-bold text-[#0B3D62]">{sec.title}</h3>
                  )}
                  {sec.body && (
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {sec.body}
                    </p>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* 6. Official Institute Certifications & Accreditations */}
        {cfg.showCertifications && <OurCertificationsSection />}

        {/* 7. CTA Bar */}
        {cfg.showCta && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-[#0B3D62]">{cfg.ctaTitle}</h3>
              {cfg.ctaSubtitle && (
                <p className="text-xs text-slate-600 mt-0.5">{cfg.ctaSubtitle}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {cfg.ctaSecondaryLabel && (
                <Link
                  href="/courses"
                  className="px-4 py-2.5 rounded border border-[#0B3D62] text-[#0B3D62] font-semibold text-sm hover:bg-slate-50"
                >
                  {cfg.ctaSecondaryLabel}
                </Link>
              )}
              {cfg.ctaPrimaryLabel && (
                <Link
                  href="/admission"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white font-semibold text-sm"
                >
                  {cfg.ctaPrimaryLabel} <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
