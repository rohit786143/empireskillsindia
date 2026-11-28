"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { apiFetch } from "@/lib/api";
import {
  DEFAULT_ABOUT_CONFIG,
  mergeAboutConfig,
  type AboutPageConfig,
} from "@/lib/aboutDefaults";

function SectionToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
        checked
          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
          : "bg-slate-100 border-slate-300 text-slate-600"
      }`}
    >
      {checked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      {checked ? `${label}: Visible` : `${label}: Hidden`}
    </button>
  );
}

function AdminAboutContent() {
  const [cfg, setCfg] = useState<AboutPageConfig>(DEFAULT_ABOUT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    apiFetch(`/about-content.php?_t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.content) setCfg(mergeAboutConfig(d.content));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiFetch("/about-content.php", {
        method: "POST",
        body: JSON.stringify({ content: cfg }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: data.error || "Failed to save About Us page." });
      } else {
        setMsg({
          type: "ok",
          text: "About Us page saved! All additions, edits, and removals are now live on /about.",
        });
      }
    } catch {
      setMsg({ type: "err", text: "Network error while saving." });
    } finally {
      setSaving(false);
    }
  }

  function handleResetDefaults() {
    if (!confirm("Restore all About Us sections to default text? (Click Save after to apply)")) {
      return;
    }
    setCfg(DEFAULT_ABOUT_CONFIG);
    setMsg({
      type: "ok",
      text: "Defaults loaded in editor. Click 'Save About Us Page' to publish.",
    });
  }

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500">
        Loading About Us editor...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D62] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#F07228]" />
            About Us Page Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, edit, hide, or remove any section, paragraph, bullet point, vision/mission card,
            or highlight pillar on the public About Us page.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/about"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-[#0B3D62]"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Preview /about
          </Link>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white text-xs font-bold shadow-sm disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save About Us Page"}
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            msg.type === "ok"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {msg.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {msg.text}
        </div>
      )}

      {/* 1. Top Banner Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <h2 className="text-sm font-extrabold text-[#0B3D62]">1. Top Hero Banner</h2>
          <SectionToggle
            label="Section"
            checked={cfg.showHero}
            onChange={(v) => setCfg({ ...cfg, showHero: v })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Top Label (Eyebrow)</label>
            <input
              type="text"
              value={cfg.heroEyebrow}
              onChange={(e) => setCfg({ ...cfg, heroEyebrow: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Main Heading</label>
            <input
              type="text"
              value={cfg.heroTitle}
              onChange={(e) => setCfg({ ...cfg, heroTitle: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">Subtitle</label>
            <textarea
              rows={2}
              value={cfg.heroSubtitle}
              onChange={(e) => setCfg({ ...cfg, heroSubtitle: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* 2. Institutional Mandate Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <h2 className="text-sm font-extrabold text-[#0B3D62]">
            2. Institutional Mandate &amp; Paragraphs
          </h2>
          <div className="flex items-center gap-2">
            <SectionToggle
              label="Section"
              checked={cfg.showMandate}
              onChange={(v) => setCfg({ ...cfg, showMandate: v })}
            />
            <button
              type="button"
              onClick={() =>
                setCfg({ ...cfg, mandateParagraphs: [...cfg.mandateParagraphs, ""] })
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B3D62] text-white text-[11px] font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Paragraph
            </button>
          </div>
        </div>
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Section Heading</label>
            <input
              type="text"
              value={cfg.mandateTitle}
              onChange={(e) => setCfg({ ...cfg, mandateTitle: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          {cfg.mandateParagraphs.map((para, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-600">Paragraph {idx + 1}</label>
                <button
                  type="button"
                  onClick={() =>
                    setCfg({
                      ...cfg,
                      mandateParagraphs: cfg.mandateParagraphs.filter((_, i) => i !== idx),
                    })
                  }
                  className="inline-flex items-center gap-1 text-red-600 hover:underline font-bold"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
              <textarea
                rows={3}
                value={para}
                onChange={(e) =>
                  setCfg({
                    ...cfg,
                    mandateParagraphs: cfg.mandateParagraphs.map((p, i) =>
                      i === idx ? e.target.value : p
                    ),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Accreditation & Recognition Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <h2 className="text-sm font-extrabold text-[#0B3D62]">
            3. Accreditation &amp; Recognition Box (Right Navy Box)
          </h2>
          <div className="flex items-center gap-2">
            <SectionToggle
              label="Box"
              checked={cfg.showAccreditation}
              onChange={(v) => setCfg({ ...cfg, showAccreditation: v })}
            />
            <button
              type="button"
              onClick={() =>
                setCfg({ ...cfg, accreditationPoints: [...cfg.accreditationPoints, ""] })
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B3D62] text-white text-[11px] font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Point
            </button>
          </div>
        </div>
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Box Title</label>
              <input
                type="text"
                value={cfg.accreditationTitle}
                onChange={(e) => setCfg({ ...cfg, accreditationTitle: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Footer Registration Line
              </label>
              <input
                type="text"
                value={cfg.accreditationFooter}
                onChange={(e) => setCfg({ ...cfg, accreditationFooter: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Bullet Points</label>
            {cfg.accreditationPoints.map((pt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={pt}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      accreditationPoints: cfg.accreditationPoints.map((p, i) =>
                        i === idx ? e.target.value : p
                      ),
                    })
                  }
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() =>
                    setCfg({
                      ...cfg,
                      accreditationPoints: cfg.accreditationPoints.filter((_, i) => i !== idx),
                    })
                  }
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200"
                  title="Remove Point"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Vision & Mission Cards */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <h2 className="text-sm font-extrabold text-[#0B3D62]">
            4. Vision &amp; Mission Cards
          </h2>
          <div className="flex items-center gap-2">
            <SectionToggle
              label="Section"
              checked={cfg.showVisionMission}
              onChange={(v) => setCfg({ ...cfg, showVisionMission: v })}
            />
            <button
              type="button"
              onClick={() =>
                setCfg({
                  ...cfg,
                  visionMissionCards: [
                    ...cfg.visionMissionCards,
                    {
                      id: `vm-${Date.now()}`,
                      title: "New Statement",
                      description: "",
                      accent: "teal",
                    },
                  ],
                })
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B3D62] text-white text-[11px] font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Card
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {cfg.visionMissionCards.map((card, idx) => (
            <div
              key={card.id || idx}
              className="border border-slate-200 rounded-lg p-4 bg-slate-50/70 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={card.title}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      visionMissionCards: cfg.visionMissionCards.map((c, i) =>
                        i === idx ? { ...c, title: e.target.value } : c
                      ),
                    })
                  }
                  placeholder="Card Title"
                  className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded font-bold bg-white"
                />
                <select
                  value={card.accent}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      visionMissionCards: cfg.visionMissionCards.map((c, i) =>
                        i === idx
                          ? {
                              ...c,
                              accent: e.target.value as "navy" | "saffron" | "teal" | "emerald",
                            }
                          : c
                      ),
                    })
                  }
                  className="px-2 py-1.5 border border-slate-300 rounded bg-white font-semibold"
                >
                  <option value="navy">Navy</option>
                  <option value="saffron">Saffron</option>
                  <option value="teal">Teal</option>
                  <option value="emerald">Emerald</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setCfg({
                      ...cfg,
                      visionMissionCards: cfg.visionMissionCards.filter((_, i) => i !== idx),
                    })
                  }
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  title="Remove Card"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                rows={3}
                value={card.description}
                onChange={(e) =>
                  setCfg({
                    ...cfg,
                    visionMissionCards: cfg.visionMissionCards.map((c, i) =>
                      i === idx ? { ...c, description: e.target.value } : c
                    ),
                  })
                }
                placeholder="Write description..."
                className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 5. Highlight Pillars */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <h2 className="text-sm font-extrabold text-[#0B3D62]">
            5. Highlight Pillar Cards (Curriculum, Assessment, Placement...)
          </h2>
          <div className="flex items-center gap-2">
            <SectionToggle
              label="Section"
              checked={cfg.showPillars}
              onChange={(v) => setCfg({ ...cfg, showPillars: v })}
            />
            <button
              type="button"
              onClick={() =>
                setCfg({
                  ...cfg,
                  pillars: [
                    ...cfg.pillars,
                    { id: `p-${Date.now()}`, title: "New Pillar", description: "" },
                  ],
                })
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B3D62] text-white text-[11px] font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Pillar
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {cfg.pillars.map((pillar, idx) => (
            <div
              key={pillar.id || idx}
              className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 space-y-2"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={pillar.title}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      pillars: cfg.pillars.map((p, i) =>
                        i === idx ? { ...p, title: e.target.value } : p
                      ),
                    })
                  }
                  placeholder="Pillar Title"
                  className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded font-bold bg-white"
                />
                <button
                  type="button"
                  onClick={() =>
                    setCfg({
                      ...cfg,
                      pillars: cfg.pillars.filter((_, i) => i !== idx),
                    })
                  }
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  title="Remove Pillar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                rows={3}
                value={pillar.description}
                onChange={(e) =>
                  setCfg({
                    ...cfg,
                    pillars: cfg.pillars.map((p, i) =>
                      i === idx ? { ...p, description: e.target.value } : p
                    ),
                  })
                }
                placeholder="Pillar description..."
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 6. Extra Custom Sections */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-[#0B3D62]">
              6. Custom Extra Sections (Add Anything Else)
            </h2>
            <p className="text-[11px] text-slate-500">
              Add extra blocks like Director&apos;s Note, Government Projects, History, or Achievements.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setCfg({
                ...cfg,
                customSections: [
                  ...cfg.customSections,
                  { id: `sec-${Date.now()}`, title: "", body: "" },
                ],
              })
            }
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B3D62] text-white text-[11px] font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> Add Custom Section
          </button>
        </div>
        {cfg.customSections.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            No custom extra sections added. Click &ldquo;Add Custom Section&rdquo; above to add one.
          </p>
        ) : (
          <div className="space-y-3 text-xs">
            {cfg.customSections.map((sec, idx) => (
              <div
                key={sec.id || idx}
                className="border border-slate-200 rounded-lg p-4 bg-slate-50/70 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) =>
                      setCfg({
                        ...cfg,
                        customSections: cfg.customSections.map((s, i) =>
                          i === idx ? { ...s, title: e.target.value } : s
                        ),
                      })
                    }
                    placeholder="Section Title (e.g., Our Achievements)"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded font-bold bg-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setCfg({
                        ...cfg,
                        customSections: cfg.customSections.filter((_, i) => i !== idx),
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={sec.body}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      customSections: cfg.customSections.map((s, i) =>
                        i === idx ? { ...s, body: e.target.value } : s
                      ),
                    })
                  }
                  placeholder="Write section content..."
                  className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. Institute Certifications & Bottom CTA */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <h2 className="text-sm font-extrabold text-[#0B3D62]">
            7. Official Certifications &amp; Bottom Enrollment CTA Bar
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <SectionToggle
              label="Certifications"
              checked={cfg.showCertifications}
              onChange={(v) => setCfg({ ...cfg, showCertifications: v })}
            />
            <SectionToggle
              label="CTA Bar"
              checked={cfg.showCta}
              onChange={(v) => setCfg({ ...cfg, showCta: v })}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">CTA Heading</label>
            <input
              type="text"
              value={cfg.ctaTitle}
              onChange={(e) => setCfg({ ...cfg, ctaTitle: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">CTA Subtitle</label>
            <input
              type="text"
              value={cfg.ctaSubtitle}
              onChange={(e) => setCfg({ ...cfg, ctaSubtitle: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Primary Button Text</label>
            <input
              type="text"
              value={cfg.ctaPrimaryLabel}
              onChange={(e) => setCfg({ ...cfg, ctaPrimaryLabel: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Secondary Button Text</label>
            <input
              type="text"
              value={cfg.ctaSecondaryLabel}
              onChange={(e) => setCfg({ ...cfg, ctaSecondaryLabel: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Bottom Sticky Save */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-[#F07228] hover:bg-[#D65B14] text-white text-sm font-bold shadow-md disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving About Us Page..." : "Save About Us Page"}
        </button>
      </div>
    </form>
  );
}

export default function AdminAboutPage() {
  return (
    <AdminGuard>
      <AdminAboutContent />
    </AdminGuard>
  );
}
