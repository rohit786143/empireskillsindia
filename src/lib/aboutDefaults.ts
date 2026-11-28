export interface AboutHighlightCard {
  id: string;
  title: string;
  description: string;
  accent: "navy" | "saffron" | "teal" | "emerald";
}

export interface AboutPillarItem {
  id: string;
  title: string;
  description: string;
}

export interface AboutCustomSection {
  id: string;
  title: string;
  body: string;
}

export interface AboutPageConfig {
  showHero: boolean;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;

  showMandate: boolean;
  mandateTitle: string;
  mandateParagraphs: string[];

  showAccreditation: boolean;
  accreditationTitle: string;
  accreditationPoints: string[];
  accreditationFooter: string;

  showVisionMission: boolean;
  visionMissionCards: AboutHighlightCard[];

  showPillars: boolean;
  pillars: AboutPillarItem[];

  customSections: AboutCustomSection[];

  showCertifications: boolean;

  showCta: boolean;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaPrimaryLabel: string;
  ctaSecondaryLabel: string;
}

export const DEFAULT_ABOUT_CONFIG: AboutPageConfig = {
  showHero: true,
  heroEyebrow: "Institutional Overview",
  heroTitle: "About Empire Skills India",
  heroSubtitle:
    "Empowering youth and communities through industry-aligned Vocational Education, Skill Development, and IT Sector training — backed by dedicated Student Placement Services and end-to-end execution of Government, CSR, and National Skill Development Projects.",

  showMandate: true,
  mandateTitle: "Institutional Mandate & Academic Governance",
  mandateParagraphs: [
    "Empire Skills India was established with the core objective of democratizing career-oriented vocational and technical education across India. Modeled on structured national open-learning and skill-qualification frameworks, the institution ensures that students from diverse academic backgrounds can acquire practical, industry-validated competencies at an affordable cost.",
    "Every programme is governed by an Academic Advisory Council that reviews syllabi annually to align with current corporate, banking, accounting, IT, and technical sector standards. From digital enrollment and structured practical evaluations to QR-coded certificate issuance, our entire academic lifecycle is transparent and auditable.",
  ],

  showAccreditation: true,
  accreditationTitle: "Accreditation & Recognition",
  accreditationPoints: [
    "ISO 9001:2015 Certified Quality Management System (IAF & EGAC Accredited)",
    "Registered with Ministry of Corporate Affairs (MCA), Government of India",
    "Recognized by Startup India (DPIIT) & Skill India / NCVET Affiliated Training Partner",
    "100% Online QR-Code Verifiable Digital & Print Diplomas & Marksheets",
    "Dedicated Practical Labs, Govt. Project Implementation & Career Placement Support",
  ],
  accreditationFooter: "ISO 9001:2015 CERTIFIED • GOVT. OF INDIA (MCA) REGISTERED",

  showVisionMission: true,
  visionMissionCards: [
    {
      id: "vision",
      title: "Our Vision",
      description:
        "To emerge as a premier national vocational and skill development institution that builds a self-reliant, technically skilled workforce capable of excelling in domestic and global industries.",
      accent: "navy",
    },
    {
      id: "mission",
      title: "Our Mission",
      description:
        "To deliver accessible, hands-on training in IT, Accounting, Technical Trades, and Education through transparent admissions, rigorous practical evaluations, and instantly verifiable credentials.",
      accent: "saffron",
    },
  ],

  showPillars: true,
  pillars: [
    {
      id: "pillar-1",
      title: "Structured Curriculum",
      description:
        "Semester-wise and module-wise syllabi designed with 60% practical lab training and 40% conceptual mastery.",
    },
    {
      id: "pillar-2",
      title: "Transparent Assessment",
      description:
        "Standardized grading (A+ to B), online marksheet access in Student Zone, and tamper-evident certificates.",
    },
    {
      id: "pillar-3",
      title: "Career & Placement Support",
      description:
        "Resume workshops, employer verification desk, and periodic skill placement drives for certified alumni.",
    },
  ],

  customSections: [],

  showCertifications: true,

  showCta: true,
  ctaTitle: "Ready to enroll for Academic Session 2026?",
  ctaSubtitle:
    "Browse our 8+ vocational programmes or submit your online admission form today.",
  ctaPrimaryLabel: "Apply Online",
  ctaSecondaryLabel: "View Courses",
};

export function mergeAboutConfig(raw: Partial<AboutPageConfig> | null | undefined): AboutPageConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_ABOUT_CONFIG;
  return {
    ...DEFAULT_ABOUT_CONFIG,
    ...raw,
    mandateParagraphs: Array.isArray(raw.mandateParagraphs)
      ? raw.mandateParagraphs
      : DEFAULT_ABOUT_CONFIG.mandateParagraphs,
    accreditationPoints: Array.isArray(raw.accreditationPoints)
      ? raw.accreditationPoints
      : DEFAULT_ABOUT_CONFIG.accreditationPoints,
    visionMissionCards: Array.isArray(raw.visionMissionCards)
      ? raw.visionMissionCards
      : DEFAULT_ABOUT_CONFIG.visionMissionCards,
    pillars: Array.isArray(raw.pillars) ? raw.pillars : DEFAULT_ABOUT_CONFIG.pillars,
    customSections: Array.isArray(raw.customSections) ? raw.customSections : [],
  };
}
