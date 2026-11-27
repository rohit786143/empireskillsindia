"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Camera, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface SliderPhoto {
  id: string;
  src: string;
  title: string;
  event: string;
  category: string;
}

const FALLBACK_PHOTOS: SliderPhoto[] = [
  { id: "gal_01", src: "/gallery/gallery-01.jpg", title: "Chief Guest Felicitation Ceremony", event: "Annual Function — Empire Skills India", category: "Chief Guest & Felicitation" },
  { id: "gal_02", src: "/gallery/gallery-02.jpg", title: "Traditional Group Folk Dance Performance", event: "Empire Skills India Annual Celebration", category: "Cultural Performances" },
  { id: "gal_03", src: "/gallery/gallery-03.jpg", title: "Himachali Traditional Cultural Showcase", event: "Annual Function Stage Performance", category: "Cultural Performances" },
  { id: "gal_04", src: "/gallery/gallery-04.jpg", title: "Honouring Leadership with Traditional Himachali Cap", event: "Annual Function 2025", category: "Chief Guest & Felicitation" },
  { id: "gal_05", src: "/gallery/gallery-05.jpg", title: "Devotional Welcome Dance by Students", event: "Annual Function 2025", category: "Cultural Performances" },
  { id: "gal_06", src: "/gallery/gallery-06.jpg", title: "Vibrant Student Dance Presentation", event: "Annual Function 2025", category: "Cultural Performances" },
  { id: "gal_07", src: "/gallery/gallery-07.jpg", title: "Director's Address — Sankalp: Skills for Success", event: "Annual Function 2025", category: "Annual Function & Team" },
  { id: "gal_08", src: "/gallery/gallery-08.jpg", title: "Traditional Himachali Natti Performance", event: "Annual Function 2025", category: "Cultural Performances" },
  { id: "gal_09", src: "/gallery/gallery-09.jpg", title: "Memento Presentation with Chief Guest & Faculty", event: "Annual Function 2025", category: "Chief Guest & Felicitation" },
  { id: "gal_10", src: "/gallery/gallery-10.jpg", title: "Empire Skills India Faculty with Chief Guest", event: "Annual Function 2025", category: "Annual Function & Team" },
  { id: "gal_11", src: "/gallery/gallery-11.jpg", title: "Institute Leadership & Organizing Team", event: "Annual Function 2025", category: "Annual Function & Team" },
  { id: "gal_12", src: "/gallery/gallery-12.jpg", title: "Warm Welcome Reception", event: "Empire Innovate Fest & Annual Day", category: "Annual Function & Team" },
  { id: "gal_13", src: "/gallery/gallery-13.jpg", title: "Arrival of Chief Guest & Dignitaries", event: "Empire Innovate Fest — Annual Day", category: "Chief Guest & Felicitation" },
  { id: "gal_14", src: "/gallery/gallery-14.jpg", title: "Traditional Himachali Cap & Shawl Honour", event: "Empire Innovate Fest — Annual Day", category: "Chief Guest & Felicitation" },
  { id: "gal_15", src: "/gallery/gallery-15.jpg", title: "Presenting Sacred Souvenir to Chief Guest", event: "Empire Innovate Fest — Annual Day", category: "Chief Guest & Felicitation" },
  { id: "gal_16", src: "/gallery/gallery-16.jpg", title: "Guest of Honour Award Presentation", event: "Annual Prize Distribution", category: "Chief Guest & Felicitation" },
  { id: "gal_17", src: "/gallery/gallery-17.jpg", title: "Director's Keynote Speech at Annual Day", event: "Empire Innovate Fest", category: "Annual Function & Team" },
  { id: "gal_18", src: "/gallery/gallery-18.jpg", title: "Honouring Guest of Honour with Memento", event: "Annual Prize Distribution", category: "Chief Guest & Felicitation" },
  { id: "gal_19", src: "/gallery/gallery-19.jpg", title: "Empire Skills India Team with Chief Guest", event: "Empire Innovate Fest", category: "Annual Function & Team" },
  { id: "gal_20", src: "/gallery/gallery-20.jpg", title: "Faculty & Dignitaries Stage Felicitation", event: "Annual Day Ceremony", category: "Chief Guest & Felicitation" },
  { id: "gal_21", src: "/gallery/gallery-21.jpg", title: "Traditional Lamp Welcome by Students", event: "Empire Innovate Fest", category: "Cultural Performances" },
  { id: "gal_22", src: "/gallery/gallery-22.jpg", title: "Certificate Distribution to Meritorious Student", event: "Empire Innovate Fest", category: "Chief Guest & Felicitation" },
  { id: "gal_23", src: "/gallery/gallery-23.jpg", title: "Floral Welcome of Dignitaries", event: "Empire Innovate Fest", category: "Annual Function & Team" },
  { id: "gal_24", src: "/gallery/gallery-24.jpg", title: "Empire Skills India Faculty Group Photo", event: "Empire Innovate Fest", category: "Annual Function & Team" },
  { id: "gal_25", src: "/gallery/gallery-25.jpg", title: "Traditional Deep-Prajwalan & Welcome Dance", event: "Empire Innovate Fest", category: "Cultural Performances" },
];

/**
 * Picks 5 diverse photos across different gallery categories for the given 5-minute batch index.
 */
function pickDiverseBatch(allPhotos: SliderPhoto[], batchIndex: number, count = 5): SliderPhoto[] {
  if (allPhotos.length <= count) return allPhotos;

  // Group by category so each 5-photo set mixes different gallery sections
  const byCat = new Map<string, SliderPhoto[]>();
  for (const p of allPhotos) {
    const key = p.category || "General";
    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key)!.push(p);
  }

  const catLists = Array.from(byCat.values());
  const interleaved: SliderPhoto[] = [];
  const maxLen = Math.max(...catLists.map((l) => l.length));
  for (let i = 0; i < maxLen; i++) {
    for (const list of catLists) {
      if (list[i]) interleaved.push(list[i]);
    }
  }

  const totalBatches = Math.max(1, Math.ceil(interleaved.length / count));
  const start = ((batchIndex % totalBatches) * count) % interleaved.length;
  const result: SliderPhoto[] = [];
  for (let i = 0; i < count; i++) {
    result.push(interleaved[(start + i) % interleaved.length]);
  }
  return result;
}

export function HeroGallerySlider() {
  const [allPhotos, setAllPhotos] = useState<SliderPhoto[]>(FALLBACK_PHOTOS);
  // 5-minute rotating batch index (changes automatically every 5 minutes)
  const [batchIndex, setBatchIndex] = useState<number>(() =>
    Math.floor(Date.now() / (5 * 60 * 1000))
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  // Fetch live gallery photos from Admin Gallery Manager
  useEffect(() => {
    apiFetch(`/gallery.php?_t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.photos && Array.isArray(d.photos) && d.photos.length > 0) {
          setAllPhotos(d.photos);
        }
      })
      .catch(() => {});
  }, []);

  const slides = useMemo(
    () => pickDiverseBatch(allPhotos, batchIndex, 5),
    [allPhotos, batchIndex]
  );

  // Auto-slide every 2 seconds
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % slides.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  // Rotate to a new set of 5 gallery photos every 5 minutes (300,000 ms)
  useEffect(() => {
    const batchTimer = setInterval(() => {
      setBatchIndex((prev) => prev + 1);
      setActiveIdx(0);
    }, 5 * 60 * 1000);
    return () => clearInterval(batchTimer);
  }, []);

  const current = slides[activeIdx] || slides[0];

  return (
    <div
      className="p-[3px] rounded-2xl bg-gradient-to-tr from-[#F07228] via-[#F59E0B] via-[#38BDF8] to-[#10B981] shadow-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="bg-[#072A44] rounded-[13px] overflow-hidden">
        {/* Top Bar */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-[#0B3D62] via-[#125488] to-[#0E7490] flex items-center justify-between border-b border-white/15">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-[#FF9B5E]" />
            <span>Campus &amp; Event Highlights</span>
          </div>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-white/90 hover:text-amber-200 transition-colors"
          >
            <Camera className="w-3 h-3" />
            View All →
          </Link>
        </div>

        {/* Main Image Stage */}
        <div className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden">
          {slides.map((slide, idx) => (
            <div
              key={`${batchIndex}-${slide.id}`}
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                idx === activeIdx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.src}
                alt={slide.title}
                className="w-full h-full object-cover object-top"
              />
              {/* Bottom Caption Gradient */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3.5 pt-10">
                <span className="inline-block px-2 py-0.5 rounded-full bg-[#F07228] text-white text-[10px] font-bold uppercase tracking-wide mb-1">
                  {slide.category}
                </span>
                <p className="text-white text-xs sm:text-sm font-bold leading-snug line-clamp-1">
                  {slide.title}
                </p>
                <p className="text-slate-300 text-[11px] line-clamp-1">{slide.event}</p>
              </div>
            </div>
          ))}

          {/* Prev / Next Controls */}
          <button
            type="button"
            onClick={() =>
              setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length)
            }
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/45 hover:bg-[#F07228] text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveIdx((prev) => (prev + 1) % slides.length)}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/45 hover:bg-[#F07228] text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Progress Dots */}
        <div className="px-4 py-2 bg-[#072A44] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === activeIdx
                    ? "w-6 bg-gradient-to-r from-[#F07228] to-[#F59E0B]"
                    : "w-2 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-semibold text-slate-300">
            {current ? `${activeIdx + 1} / ${slides.length}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
