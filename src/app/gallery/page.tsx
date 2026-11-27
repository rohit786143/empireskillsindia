"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Camera, X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface GalleryPhoto {
  id: string;
  src: string;
  title: string;
  event: string;
  category: string;
}

const DEFAULT_GALLERY_PHOTOS: GalleryPhoto[] = [
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
  { id: "gal_14", src: "/gallery/gallery-14.jpg", title: "Traditional Himachali Cap & Shawl Honour", event: "Empire Innovate Fest — Annual Day Celebration", category: "Chief Guest & Felicitation" },
  { id: "gal_15", src: "/gallery/gallery-15.jpg", title: "Presenting Sacred Souvenir to Chief Guest", event: "Empire Innovate Fest — Annual Day Celebration", category: "Chief Guest & Felicitation" },
  { id: "gal_16", src: "/gallery/gallery-16.jpg", title: "Guest of Honour Award Presentation", event: "Empire Innovate Fest — Annual Prize Distribution", category: "Chief Guest & Felicitation" },
  { id: "gal_17", src: "/gallery/gallery-17.jpg", title: "Director's Keynote Speech at Annual Day", event: "Empire Innovate Fest — Annual Day Celebration", category: "Annual Function & Team" },
  { id: "gal_18", src: "/gallery/gallery-18.jpg", title: "Honouring Guest of Honour with Memento", event: "Empire Innovate Fest — Annual Prize Distribution", category: "Chief Guest & Felicitation" },
  { id: "gal_19", src: "/gallery/gallery-19.jpg", title: "Empire Skills India Team with Chief Guest", event: "Empire Innovate Fest — Annual Day Celebration", category: "Annual Function & Team" },
  { id: "gal_20", src: "/gallery/gallery-20.jpg", title: "Faculty & Dignitaries Stage Felicitation", event: "Annual Day & Prize Distribution Ceremony", category: "Chief Guest & Felicitation" },
  { id: "gal_21", src: "/gallery/gallery-21.jpg", title: "Traditional Lamp Welcome by Students & Faculty", event: "Empire Innovate Fest — Annual Day", category: "Cultural Performances" },
  { id: "gal_22", src: "/gallery/gallery-22.jpg", title: "Certificate Distribution to Meritorious Student", event: "Empire Innovate Fest — Annual Day Celebration", category: "Chief Guest & Felicitation" },
  { id: "gal_23", src: "/gallery/gallery-23.jpg", title: "Floral Welcome of Dignitaries", event: "Empire Innovate Fest — Annual Day", category: "Annual Function & Team" },
  { id: "gal_24", src: "/gallery/gallery-24.jpg", title: "Empire Skills India Faculty Group Photo", event: "Empire Innovate Fest — Annual Day", category: "Annual Function & Team" },
  { id: "gal_25", src: "/gallery/gallery-25.jpg", title: "Traditional Deep-Prajwalan & Cultural Welcome Dance", event: "Empire Innovate Fest — Annual Day Celebration", category: "Cultural Performances" },
];

export default function PhotoGalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(DEFAULT_GALLERY_PHOTOS);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Photos");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    apiFetch(`/gallery.php?_t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.photos && Array.isArray(d.photos) && d.photos.length > 0) {
          setPhotos(d.photos);
        }
      })
      .catch(() => {});
  }, []);

  const categories = useMemo(() => {
    const uniq = Array.from(new Set(photos.map((p) => p.category).filter(Boolean)));
    return ["All Photos", ...uniq];
  }, [photos]);

  const visiblePhotos =
    selectedCategory === "All Photos"
      ? photos
      : photos.filter((p) => p.category === selectedCategory);

  useEffect(() => {
    if (lightboxIdx === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIdx(null);
      else if (e.key === "ArrowRight") {
        setLightboxIdx((prev) =>
          prev === null ? null : (prev + 1) % visiblePhotos.length
        );
      } else if (e.key === "ArrowLeft") {
        setLightboxIdx((prev) =>
          prev === null ? null : (prev - 1 + visiblePhotos.length) % visiblePhotos.length
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, visiblePhotos.length]);

  const activePhoto = lightboxIdx !== null ? visiblePhotos[lightboxIdx] : null;

  return (
    <div className="pb-16">
      {/* Page Banner */}
      <section className="bg-[#0B3D62] text-white border-b-4 border-[#F07228] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#FF9B5E] inline-flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            Campus Life &amp; Celebrations
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-1">
            Empire Skills India Photo Gallery
          </h1>
          <p className="text-slate-200 text-sm sm:text-base mt-2 max-w-2xl">
            Memorable moments from our Annual Function (Sankalp — Skills for Success), Empire
            Innovate Fest, Chief Guest felicitations, and vibrant student cultural showcases.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Category Filter Tabs */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const count =
                cat === "All Photos"
                  ? photos.length
                  : photos.filter((p) => p.category === cat).length;
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setLightboxIdx(null);
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    active
                      ? "bg-[#0B3D62] text-white border-[#0B3D62]"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
          <span className="text-xs font-semibold text-slate-500 inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#F07228]" />
            Click any photo to view full screen
          </span>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visiblePhotos.map((photo, idx) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxIdx(idx)}
              className="group text-left bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-[#0B3D62]/40 transition-all focus:outline-none focus:ring-2 focus:ring-[#F07228]"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-900 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-[#0B3D62]/85 text-white text-[10px] font-bold backdrop-blur-sm">
                  {photo.category}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-[#0B3D62] group-hover:text-[#D65B14] transition-colors">
                  {photo.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{photo.event}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activePhoto && lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx(
                (lightboxIdx - 1 + visiblePhotos.length) % visiblePhotos.length
              );
            }}
            className="absolute left-3 sm:left-6 p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div
            className="max-w-5xl w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto.src}
              alt={activePhoto.title}
              className="max-h-[78vh] w-auto max-w-full rounded-lg shadow-2xl object-contain"
            />
            <div className="mt-4 text-center text-white">
              <p className="text-base font-bold">{activePhoto.title}</p>
              <p className="text-xs text-slate-300 mt-0.5">
                {activePhoto.event} • Photo {lightboxIdx + 1} of {visiblePhotos.length}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx((lightboxIdx + 1) % visiblePhotos.length);
            }}
            className="absolute right-3 sm:right-6 p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
