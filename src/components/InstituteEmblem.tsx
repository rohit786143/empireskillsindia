import React from "react";

interface InstituteEmblemProps {
  className?: string;
  size?: number;
}

export function InstituteEmblem({ className = "", size = 52 }: InstituteEmblemProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Empire Skills India Official Crest"
    >
      {/* Outer Gold Ring */}
      <circle cx="50" cy="50" r="47" fill="#0B3D62" stroke="#F07228" strokeWidth="3.5" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="3 2" />

      {/* Academic Shield */}
      <path
        d="M50 18 L73 26 V49 C73 65 62.5 76 50 82 C37.5 76 27 65 27 49 V26 L50 18 Z"
        fill="#FFFFFF"
        stroke="#D65B14"
        strokeWidth="2.2"
      />

      {/* Inner Navy Header inside Shield */}
      <path
        d="M50 20 L71 27.3 V41 H29 V27.3 L50 20 Z"
        fill="#0B3D62"
      />

      {/* Open Book Symbol */}
      <path
        d="M35 51 C41 48.5 46.5 49.5 50 53 C53.5 49.5 59 48.5 65 51 V64 C59 61.5 53.5 62.5 50 66 C46.5 62.5 41 61.5 35 64 V51 Z"
        fill="#EFF6FF"
        stroke="#0B3D62"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <line x1="50" y1="53" x2="50" y2="66" stroke="#0B3D62" strokeWidth="2" />

      {/* Torch / Star Accent */}
      <circle cx="50" cy="31" r="4" fill="#F59E0B" />
      <path d="M44 37 H56" stroke="#F59E0B" strokeWidth="1.6" strokeLinecap="round" />

      {/* Monogram */}
      <text
        x="50"
        y="75"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="800"
        fill="#D65B14"
        fontFamily="Georgia, serif"
        letterSpacing="1"
      >
        ESI
      </text>
    </svg>
  );
}
