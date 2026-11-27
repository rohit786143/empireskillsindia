"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileText,
  User,
  GraduationCap,
  ClipboardCheck,
  AlertCircle,
  Building2,
} from "lucide-react";
import {
  ACADEMIC_SESSIONS,
  STUDY_MODES,
  RELIGION_OPTIONS,
  HEAR_ABOUT_OPTIONS,
  ENCLOSURE_DOCUMENTS,
  type QualificationItem,
} from "@/lib/constants";
import { formatINR } from "@/lib/generators";
import { apiFetch } from "@/lib/api";
import {
  PrintableAdmissionForm,
  type AdmissionFormRecord,
} from "./PrintableAdmissionForm";

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

export interface FranchiseCenterOption {
  id: string;
  centerCode: string;
  centerName: string;
  city: string;
  state: string;
  address?: string;
}

const STEPS = [
  { num: 1, label: "Course & Session", icon: FileText },
  { num: 2, label: "Personal Details", icon: User },
  { num: 3, label: "Qualifications", icon: GraduationCap },
  { num: 4, label: "Photo, Sign & Docs", icon: Upload },
  { num: 5, label: "Review & Submit", icon: ClipboardCheck },
];

export function AdmissionWizard({
  courses,
  franchises = [],
}: {
  courses: CourseOption[];
  franchises?: FranchiseCenterOption[];
}) {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("course") || courses[0]?.id || "";

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedApp, setSubmittedApp] = useState<AdmissionFormRecord | null>(null);

  // Step 1
  const [courseId, setCourseId] = useState(preselectedId);
  const [franchiseId, setFranchiseId] = useState<string>("");
  const [session, setSession] = useState<string>(ACADEMIC_SESSIONS[0]);
  const [studyMode, setStudyMode] = useState<string>(STUDY_MODES[0]);

  // Step 2 (Matches Official Empire Admission Form PDF)
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [category, setCategory] = useState("General");
  const [religion, setReligion] = useState<string>("Hindu");
  const [nationality, setNationality] = useState("INDIAN");
  const [identificationMark, setIdentificationMark] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [sameAsPermanent, setSameAsPermanent] = useState(true);
  const [correspondenceAddress, setCorrespondenceAddress] = useState("");
  const [hearAbout, setHearAbout] = useState<string[]>(["Internet"]);
  const [hearAboutOther, setHearAboutOther] = useState("");

  // Step 3 (X, XII, Graduation, Post-Graduation, Other)
  const [qualifications, setQualifications] = useState<QualificationItem[]>([
    { level: "X", subject: "", yearFrom: "", yearTo: "", board: "", passingYear: "", percentage: "" },
    { level: "XII", subject: "", yearFrom: "", yearTo: "", board: "", passingYear: "", percentage: "" },
    { level: "Graduation", subject: "", yearFrom: "", yearTo: "", board: "", passingYear: "", percentage: "" },
    { level: "Post-Graduation", subject: "", yearFrom: "", yearTo: "", board: "", passingYear: "", percentage: "" },
    { level: "Other", subject: "", yearFrom: "", yearTo: "", board: "", passingYear: "", percentage: "" },
  ]);

  // Step 4: Photo, Signature, Marksheet, ID Proof + Enclosures Checklist
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [signatureUrl, setSignatureUrl] = useState<string>("");
  const [marksheetUrl, setMarksheetUrl] = useState<string>("");
  const [idProofUrl, setIdProofUrl] = useState<string>("");
  const [enclosedDocs, setEnclosedDocs] = useState<string[]>([
    ENCLOSURE_DOCUMENTS[0],
    ENCLOSURE_DOCUMENTS[6],
    ENCLOSURE_DOCUMENTS[8],
  ]);

  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  const selectedCourse = courses.find((c) => c.id === courseId) || courses[0];

  function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Each uploaded document must be smaller than 2 MB.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function updateQualification(
    index: number,
    field: keyof QualificationItem,
    value: string
  ) {
    setQualifications((prev) =>
      prev.map((q, idx) =>
        idx === index
          ? {
              ...q,
              [field]: value,
              ...(field === "yearTo" ? { passingYear: value } : {}),
            }
          : q
      )
    );
  }

  function toggleCheckbox(list: string[], value: string, setter: (v: string[]) => void) {
    if (list.includes(value)) setter(list.filter((i) => i !== value));
    else setter([...list, value]);
  }

  function validateStep(currentStep: number): boolean {
    setError("");
    if (currentStep === 1 && !courseId) {
      setError("Please select a course.");
      return false;
    }
    if (currentStep === 1 && !franchiseId) {
      setError("Please select a Study Center / Authorized Franchise before proceeding.");
      return false;
    }
    if (currentStep === 2) {
      if (
        !fullName.trim() ||
        !fatherName.trim() ||
        !motherName.trim() ||
        !dob ||
        !mobile.trim() ||
        !email.trim() ||
        !address.trim()
      ) {
        setError("Please fill in all mandatory personal and contact details.");
        return false;
      }
      if (!/^\d{10}$/.test(mobile.replace(/\D/g, ""))) {
        setError("Please enter a valid 10-digit mobile number.");
        return false;
      }
    }
    if (currentStep === 3) {
      const tenth = qualifications[0];
      if (!tenth.board.trim() || !(tenth.yearTo || tenth.passingYear).trim() || !tenth.percentage.trim()) {
        setError("Please enter at least your 10th (X) Board, Passing Year (To), and % of Marks.");
        return false;
      }
    }
    return true;
  }

  function goNext() {
    if (validateStep(step)) setStep((s) => Math.min(5, s + 1));
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit() {
    if (!declarationAccepted) {
      setError("Please accept the Undertaking & Declaration before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");

    const fullPermanent = [address, city, stateName, pincode].filter(Boolean).join(", ");
    const extraDetails = {
      correspondenceAddress: sameAsPermanent ? fullPermanent : correspondenceAddress,
      telephone,
      nationality,
      religion,
      identificationMark,
      hearAbout,
      hearAboutOther,
      enclosedDocs,
    };

    try {
      const res = await apiFetch("/admissions.php", {
        method: "POST",
        body: JSON.stringify({
          courseId: selectedCourse?.id,
          courseName: selectedCourse?.title,
          courseCode: selectedCourse?.code,
          franchiseId: franchiseId || null,
          session,
          studyMode,
          fullName: fullName.toUpperCase(),
          fatherName: fatherName.toUpperCase(),
          motherName: motherName.toUpperCase(),
          dob,
          gender,
          category,
          aadharNumber,
          mobile,
          email,
          address,
          city,
          state: stateName,
          pincode,
          qualifications: qualifications.filter(
            (q) => q.board.trim() !== "" || (q.subject || "").trim() !== ""
          ),
          extraDetails,
          photoUrl: photoUrl || null,
          signatureUrl: signatureUrl || null,
          marksheetUrl: marksheetUrl || null,
          idProofUrl: idProofUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit application.");
      } else {
        setSubmittedApp({
          ...data.application,
          extraDetailsJson:
            data.application.extraDetailsJson || JSON.stringify(extraDetails),
        });
      }
    } catch {
      setError("Network error while submitting application.");
    } finally {
      setSubmitting(false);
    }
  }

  // Post-Submission: Full Auto-Filled 3-Page Official Empire Admission Form
  if (submittedApp) {
    return (
      <div className="space-y-6">
        <div className="no-print bg-emerald-50 border border-emerald-200 rounded-lg p-5 flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-bold text-emerald-900">
              Admission Form Submitted &amp; Auto-Filled Successfully!
            </h2>
            <p className="text-sm text-emerald-800 mt-0.5">
              Registration / Reference No:{" "}
              <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">
                {submittedApp.applicationRef}
              </strong>
              . Niche aapka complete 3-page official Admission Form + Undertaking auto-fill
              ho chuka hai — isse PDF download / print karke apne paas rakh lein. Admin ke
              panel me bhi ye form save ho gaya hai.
            </p>
          </div>
        </div>

        <PrintableAdmissionForm record={submittedApp} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stepper Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-5 gap-2">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const active = step === s.num;
            const done = step > s.num;
            return (
              <div
                key={s.num}
                className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-2 px-2 rounded text-center sm:text-left border ${
                  active
                    ? "bg-[#0B3D62] text-white border-[#0B3D62]"
                    : done
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-slate-50 text-slate-500 border-slate-200"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <div className="leading-tight">
                  <div className="text-[10px] uppercase font-bold opacity-80">
                    Step {s.num}
                  </div>
                  <div className="text-xs font-bold hidden md:block">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Step Card */}
      <div className="bg-white border border-slate-200 border-t-4 border-t-[#0B3D62] rounded-lg p-6 sm:p-8 shadow-sm">
        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#0B3D62]">
                Step 1: Course / Programme &amp; Session Selection
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your course — it will automatically be ticked on your official 3-page
                Empire Admission Form.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Programme / Course *
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#135589]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.title} — {c.duration} ({formatINR(c.fee)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 bg-[#EFF6FF] border-2 border-[#0B3D62]/25 rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-extrabold text-[#0B3D62] uppercase tracking-wide flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#F07228]" />
                    Select Study Center / Authorized Franchise *
                  </label>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-[#0B3D62]/20 text-[11px] font-bold text-[#0B3D62]">
                    {franchises.length > 0
                      ? `${franchises.length} Franchise Center${franchises.length > 1 ? "s" : ""} Available`
                      : "Head Office"}
                  </span>
                </div>
                <select
                  value={franchiseId}
                  onChange={(e) => {
                    setFranchiseId(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  className={`w-full px-3.5 py-2.5 text-sm font-semibold border-2 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#F07228] ${
                    !franchiseId
                      ? "text-slate-500 border-amber-400"
                      : "text-slate-900 border-[#0B3D62]/30"
                  }`}
                >
                  <option value="">
                    -- Please Select Study Center / Authorized Franchise (Required) --
                  </option>
                  {franchises.map((f) => (
                    <option key={f.id} value={f.id}>
                      [{f.centerCode}] {f.centerName}
                      {f.city ? ` — ${f.city}` : ""}
                      {f.state ? `, ${f.state}` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-700 mt-2">
                  {!franchiseId ? (
                    <span className="font-semibold text-amber-800">
                      {franchises.length > 0
                        ? "Please select your Study Center from the list above to continue."
                        : "No active Study Centers are currently available. Please contact Empire Skills India."}
                    </span>
                  ) : (
                    <>
                      <span className="font-bold text-[#0B3D62]">Selected Center:</span>{" "}
                      {(() => {
                        const sel = franchises.find((x) => x.id === franchiseId);
                        if (!sel) return "";
                        return `${sel.centerName} (${sel.centerCode})${sel.address ? ` — ${sel.address}` : ""}${sel.city ? `, ${sel.city}` : ""}`;
                      })()}{" "}
                      — Your application will go directly to this Study Center&apos;s dashboard for verification &amp; forwarding to Main Institute.
                    </>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Academic Session *
                </label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#135589]"
                >
                  {ACADEMIC_SESSIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Preferred Study Mode *
                </label>
                <select
                  value={studyMode}
                  onChange={(e) => setStudyMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#135589]"
                >
                  {STUDY_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCourse && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Course Code</span>
                  <strong className="text-[#0B3D62]">{selectedCourse.code}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Duration</span>
                  <strong className="text-[#0B3D62]">{selectedCourse.duration}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Eligibility</span>
                  <strong className="text-[#0B3D62]">{selectedCourse.eligibility}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Course Fee</span>
                  <strong className="text-[#0B3D62]">
                    {formatINR(selectedCourse.fee)}
                  </strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#0B3D62]">
                Step 2: Personal Details (Auto-Filled in CAPITAL Letters on Form)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter particulars strictly as per your 10th Certificate / Aadhar Card.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student&apos;s Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="As per 10th Marksheet"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Father&apos;s Name *
                </label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mother&apos;s Name *
                </label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gender *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                >
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                >
                  <option>General</option>
                  <option>OBC</option>
                  <option>SC</option>
                  <option>ST</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Religion *
                </label>
                <select
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                >
                  {RELIGION_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nationality
                </label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Aadhar Number
                </label>
                <input
                  type="text"
                  value={aadharNumber}
                  onChange={(e) => setAadharNumber(e.target.value)}
                  placeholder="12-digit Aadhar No."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (10 digits) *
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telephone (Optional)
                </label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Identification Mark (if any)
                </label>
                <input
                  type="text"
                  value={identificationMark}
                  onChange={(e) => setIdentificationMark(e.target.value)}
                  placeholder="e.g., Mole on right cheek / NIL"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Permanent Address *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House No., Village/Street, Post Office"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City / District</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 space-y-2 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-[#0B3D62] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsPermanent}
                    onChange={(e) => setSameAsPermanent(e.target.checked)}
                  />
                  Correspondence Address is same as Permanent Address
                </label>
                {!sameAsPermanent && (
                  <input
                    type="text"
                    value={correspondenceAddress}
                    onChange={(e) => setCorrespondenceAddress(e.target.value)}
                    placeholder="Enter Complete Correspondence Address"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                )}
              </div>

              <div className="sm:col-span-2 lg:col-span-3 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  How did you hear about the Academic Programme?
                </label>
                <div className="flex flex-wrap gap-3 text-xs">
                  {HEAR_ABOUT_OPTIONS.map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hearAbout.includes(opt)}
                        onChange={() => toggleCheckbox(hearAbout, opt, setHearAbout)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                {hearAbout.includes("Other") && (
                  <input
                    type="text"
                    value={hearAboutOther}
                    onChange={(e) => setHearAboutOther(e.target.value)}
                    placeholder="Please specify"
                    className="mt-2 w-full sm:w-72 px-3 py-1.5 text-xs border border-slate-300 rounded"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#0B3D62]">
                Step 3: Academic Qualifications
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                10th (X) qualification is mandatory. Other rows are optional.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-200 rounded">
                <thead className="bg-slate-50 uppercase text-slate-600">
                  <tr>
                    <th className="py-2.5 px-2 text-left border-b border-slate-200">Qualification</th>
                    <th className="py-2.5 px-2 text-left border-b border-slate-200">Subject</th>
                    <th className="py-2.5 px-2 text-left border-b border-slate-200 w-20">Year From</th>
                    <th className="py-2.5 px-2 text-left border-b border-slate-200 w-20">Year To</th>
                    <th className="py-2.5 px-2 text-left border-b border-slate-200">Board / University</th>
                    <th className="py-2.5 px-2 text-left border-b border-slate-200 w-24">% Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {qualifications.map((q, idx) => (
                    <tr key={q.level}>
                      <td className="py-2 px-2 font-bold text-[#0B3D62]">
                        {q.level}
                        {idx === 0 && <span className="text-red-600"> *</span>}
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={q.subject || ""}
                          onChange={(e) => updateQualification(idx, "subject", e.target.value)}
                          placeholder="e.g., All / Arts / Science"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={q.yearFrom || ""}
                          onChange={(e) => updateQualification(idx, "yearFrom", e.target.value)}
                          placeholder="2020"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={q.yearTo || ""}
                          onChange={(e) => updateQualification(idx, "yearTo", e.target.value)}
                          placeholder="2021"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={q.board}
                          onChange={(e) => updateQualification(idx, "board", e.target.value)}
                          placeholder="e.g., HPBOSE / CBSE"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={q.percentage}
                          onChange={(e) => updateQualification(idx, "percentage", e.target.value)}
                          placeholder="e.g., 78%"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 4: Photo, Signature, Documents & Enclosures Checklist */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#0B3D62]">
                Step 4: Upload Candidate Photo, Signature &amp; Documents
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Uploaded Photograph and Signature are automatically embedded on your 3-page
                printable Admission Form, Undertaking, Student ID Card &amp; Certificate.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                {
                  label: "Candidate Passport Size Photograph *",
                  value: photoUrl,
                  setter: setPhotoUrl,
                  hint: "Recent colored passport photo (JPG/PNG, max 2 MB)",
                },
                {
                  label: "Candidate Signature *",
                  value: signatureUrl,
                  setter: setSignatureUrl,
                  hint: "Clear signature on white paper (JPG/PNG, max 2 MB)",
                },
                {
                  label: "Last Qualifying Marksheet",
                  value: marksheetUrl,
                  setter: setMarksheetUrl,
                  hint: "10th / 12th / Graduation marksheet",
                },
                {
                  label: "Government ID Proof (Aadhar / Voter ID)",
                  value: idProofUrl,
                  setter: setIdProofUrl,
                  hint: "Front side scan",
                },
              ].map((doc) => (
                <div
                  key={doc.label}
                  className="border border-slate-200 rounded-lg p-4 bg-slate-50/70 space-y-3"
                >
                  <div>
                    <p className="text-xs font-bold text-[#0B3D62]">{doc.label}</p>
                    <p className="text-[11px] text-slate-500">{doc.hint}</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, doc.setter)}
                    className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#0B3D62] file:text-white hover:file:bg-[#135589]"
                  />
                  {doc.value && (
                    <div className="mt-2 border border-slate-300 rounded bg-white p-2 flex items-center justify-center h-32 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={doc.value}
                        alt={doc.label}
                        className="max-h-28 object-contain"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Enclosures Checklist (Page 2 of PDF) */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
              <p className="text-xs font-bold text-[#0B3D62]">
                Enclosures Checklist (Tick copies you are enclosing with the Admission Form):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {ENCLOSURE_DOCUMENTS.map((doc, idx) => (
                  <label key={doc} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enclosedDocs.includes(doc)}
                      onChange={() =>
                        toggleCheckbox(enclosedDocs, doc, setEnclosedDocs)
                      }
                      className="mt-0.5"
                    />
                    <span>
                      {idx + 1}. {doc}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#0B3D62]">
                Step 5: Review Details &amp; Accept Undertaking
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Upon submission, your official 3-page Empire Admission Form &amp; Undertaking
                will be generated automatically for download/printing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-slate-50 p-5 rounded-lg border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 block">Selected Programme</span>
                <strong className="text-[#0B3D62]">
                  {selectedCourse?.title} ({selectedCourse?.code})
                </strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Study Center / Franchise</span>
                <strong className="text-[#D65B14]">
                  {(() => {
                    const f = franchises.find((x) => x.id === franchiseId);
                    return f
                      ? `[${f.centerCode}] ${f.centerName}${f.city ? ` (${f.city})` : ""}`
                      : "Selected Study Center";
                  })()}
                </strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Session &amp; Mode</span>
                <strong>
                  {session} | {studyMode}
                </strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Student Name</span>
                <strong className="uppercase">{fullName}</strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">
                  Father&apos;s / Mother&apos;s Name
                </span>
                <strong className="uppercase">
                  {fatherName} / {motherName}
                </strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">
                  DOB / Gender / Category / Religion
                </span>
                <strong>
                  {dob} | {gender} | {category} | {religion}
                </strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Mobile &amp; Email</span>
                <strong>
                  {mobile} | {email}
                </strong>
              </div>
              <div className="md:col-span-2">
                <span className="text-xs text-slate-500 block">Permanent Address</span>
                <strong>
                  {address} {city} {stateName} {pincode}
                </strong>
              </div>
            </div>

            <label className="flex items-start gap-3 p-4 rounded bg-amber-50 border border-amber-200 cursor-pointer text-xs text-amber-950">
              <input
                type="checkbox"
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                className="mt-0.5 rounded border-amber-400"
              />
              <span>
                <strong>Undertaking &amp; Declaration:</strong> I solemnly affirm &amp;
                declare that I have read the contents of the Institute Prospectus and all 11
                terms of the Undertaking. All particulars and uploaded photo/signature/documents
                are true and correct to the best of my knowledge.
              </span>
            </label>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="mt-8 pt-5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white font-bold text-sm transition-colors"
            >
              Save &amp; Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? "Submitting & Generating Form..." : "Submit & Generate 3-Page Form"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
