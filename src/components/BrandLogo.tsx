import React from "react";

interface BrandLogoProps {
  className?: string;
  height?: number;
  onDarkBg?: boolean;
}

export function BrandLogo({
  className = "",
  height = 46,
  onDarkBg = false,
}: BrandLogoProps) {
  if (onDarkBg) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-white rounded-md px-3 py-1.5 shadow-sm border border-[#F07228]/30 ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/empire-logo.png"
          alt="Empire Skills India Official Logo"
          style={{ height: `${height}px`, width: "auto" }}
          className="object-contain select-none"
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/empire-logo.png"
      alt="Empire Skills India Official Logo"
      style={{ height: `${height}px`, width: "auto" }}
      className={`object-contain select-none ${className}`}
    />
  );
}
