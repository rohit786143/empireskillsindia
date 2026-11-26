"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Printer,
  FileText,
  User,
  GraduationCap,
  ClipboardCheck,
  AlertCircle,
} from "lucide-react";
import {
  ACADEMIC_SESSIONS,
  STUDY_MODES,
  INSTITUTE_INFO,
  type QualificationItem,
} from "@/lib/constants";
import { formatDisplayDate, formatINR } from "@/lib/generators";
import { InstituteEmblem } from "./InstituteEmblem";
import { apiFetch } from "@/lib/api";

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

interface SubmittedApplication {
  id: string;
  applicationRef: string;
  courseName: string;
  courseCode: string;
  session: string;
  studyMode: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  category: string;
  aadharNumber: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  photoUrl: string | null;
  createdAt: string;
}

const STEPS = [
  { num: 1, label: "Course & Session", icon: FileText },
  { num: 2, label: "Personal Details", icon: User },
  { num: 3, label: "Qualifications", icon: GraduationCap },
  { num: 4, label: "Documents Upload", icon: Upload },
  { num: 5, label: "Review & Submit", icon: ClipboardCheck },
];

export function AdmissionWizard({ courses }: { courses: CourseOption[] }) {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("course") || courses[0]?.id || "";

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedApp, setSubmittedApp] = useState<SubmittedApplication | null>(null);

  // Step 1
  const [courseId, setCourseId] = useState(preselectedId);
  const [session, setSession] = useState<string>(ACADEMIC_SESSIONS[0]);
  const [studyMode, setStudyMode] = useState<string>(STUDY_MODES[0]);

  // Step 2
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [category, setCategory] = useState("General");
  const [aadharNumber, setAadharNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");

  // Step 3
  const [qualifications, setQualifications] = useState<QualificationItem[]>([
    { level: "10th (Matriculation)", board: "", passingYear: "", percentage: "" },
    { level: "12th (Intermediate)", board: "", passingYear: "", percentage: "" },
    { level: "Graduation (Optional)", board: "", passingYear: "", percentage: "" },
  ]);

  // Step 4
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [signatureUrl, setSignatureUrl] = useState<string>("");
  const [marksheetUrl, setMarksheetUrl] = useState<string>("");
  const [idProofUrl, setIdProofUrl] = useState<string>("");

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
      prev.map((q, idx) => (idx === index ? { ...q, [field]: value } : q))
    );
  }

  function validateStep(currentStep: number): boolean {
    setError("");
    if (currentStep === 1) {
      if (!courseId) {
        setError("Please select a course.");
        return false;
      }
    }
    if (currentStep === 2) {
      if (!fullName.trim() || !fatherName.trim() || !motherName.trim() || !dob || !mobile.trim() || !email.trim() || !address.trim()) {
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
      if (!tenth.board.trim() || !tenth.passingYear.trim() || !tenth.percentage.trim()) {
        setError("Please enter at least your 10th (Matriculation) board, passing year, and percentage.");
        return false;
      }
    }
    return true;
  }

  function goNext() {
    if (validateStep(step)) {
      setStep((s) => Math.min(5, s + 1));
    }
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit() {
    if (!declarationAccepted) {
      setError("Please accept the candidate declaration before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await apiFetch("/admissions.php", {
        method: "POST",
        body: JSON.stringify({
          courseId: selectedCourse?.id,
          courseName: selectedCourse?.title,
          courseCode: selectedCourse?.code,
          session,
          studyMode,
          fullName,
          fatherName,
          motherName,
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
          qualifications: qualifications.filter((q) => q.board.trim() !== ""),
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
        setSubmittedApp(data.application);
      }
    } catch {
      setError("Network error while submitting application.");
    } finally {
      setSubmitting(false);
    }
  }

  function printSlip() {
    document.body.classList.add("print-document-mode");
    window.print();
    setTimeout(() => document.body.classList.remove("print-document-mode"), 400);
  }

  // Acknowledgement Slip View after submission
  if (submittedApp) {
    return (
      <div className="space-y-6">
        <div className="no-print bg-emerald-50 border border-emerald-200 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-emerald-900">
                Online Admission Application Submitted Successfully!
              </h2>
              <p className="text-sm text-emerald-800">
                Your Application Reference ID is{" "}
                <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">
                  {submittedApp.applicationRef}
                </strong>
                . Save or print this acknowledgement slip for future reference.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={printSlip}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[#0B3D62] hover:bg-[#135589] text-white font-bold text-sm shrink-0"
          >
            <Printer className="w-4 h-4" />
            Print Acknowledgement Slip
          </button>
        </div>

        {/* Printable Acknowledgement Slip */}
        <div
          id="printable-document"
          className="bg-white border-2 border-[#0B3D62] rounded-lg p-6 sm:p-8 shadow-sm max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-between border-b-2 border-[#0B3D62] pb-4 mb-6">
            <div className="flex items-center gap-3">
              <InstituteEmblem size={56} />
              <div>
                <h2 className="text-xl font-extrabold text-[#0B3D62]">
                  {INSTITUTE_INFO.name}
                </h2>
                <p className="text-xs font-semibold text-[#D65B14]">
                  {INSTITUTE_INFO.tagline}
                </p>
                <p className="text-[10px] text-slate-500">{INSTITUTE_INFO.regNumber}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded bg-[#0B3D62] text-white text-xs font-bold uppercase tracking-wider">
                Admission Acknowledgement Slip
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Date: {formatDisplayDate(submittedApp.createdAt)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
            <div className="sm:col-span-9">
              <table className="w-full text-sm border border-slate-200">
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-blue-50/60">
                    <td className="py-2 px-3 font-bold text-[#0B3D62] w-44">
                      Application Ref. ID
                    </td>
                    <td className="py-2 px-3 font-mono font-extrabold text-[#0B3D62]">
                      {submittedApp.applicationRef}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-600">
                      Applied Programme
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900">
                      {submittedApp.courseName} ({submittedApp.courseCode})
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-600">
                      Academic Session / Mode
                    </td>
                    <td className="py-2 px-3">
                      {submittedApp.session} — {submittedApp.studyMode}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-600">
                      Candidate Full Name
                    </td>
                    <td className="py-2 px-3 font-bold uppercase">
                      {submittedApp.fullName}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-600">
                      Father&apos;s / Mother&apos;s Name
                    </td>
                    <td className="py-2 px-3">
                      {submittedApp.fatherName} / {submittedApp.motherName}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-600">
                      DOB / Gender / Category
                    </td>
                    <td className="py-2 px-3">
                      {formatDisplayDate(submittedApp.dob)} | {submittedApp.gender} |{" "}
                      {submittedApp.category}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-600">
                      Mobile / Email
                    </td>
                    <td className="py-2 px-3">
                      {submittedApp.mobile} | {submittedApp.email}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-600">Address</td>
                    <td className="py-2 px-3">
                      {submittedApp.address}
                      {submittedApp.city ? `, ${submittedApp.city}` : ""}
                      {submittedApp.state ? `, ${submittedApp.state}` : ""}
                      {submittedApp.pincode ? ` - ${submittedApp.pincode}` : ""}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-600">
                      Application Status
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-bold">
                        PENDING INSTITUTIONAL APPROVAL
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="sm:col-span-3 flex flex-col items-center justify-start gap-3">
              <div className="w-32 h-36 border-2 border-slate-300 rounded bg-slate-50 flex items-center justify-center overflow-hidden">
                {submittedApp.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={submittedApp.photoUrl}
                    alt="Applicant Photograph"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] text-slate-400 text-center px-2">
                    Candidate Photo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                Enrollment Number will be allotted upon document verification by the Office of
                the Registrar.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Helpline: {INSTITUTE_INFO.helpline}</span>
            <span>Computer-Generated Slip • No Signature Required</span>
          </div>
        </div>
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
        {/* STEP 1: Course & Session */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#0B3D62]">
                Step 1: Programme, Session &amp; Study Mode Selection
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose the vocational or diploma course you wish to enroll in for Academic
                Session 2026.
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
                  <span className="text-slate-500 block">Total Fee (Incl. Reg.)</span>
                  <strong className="text-[#0B3D62]">
                    {formatINR(selectedCourse.fee + selectedCourse.registrationFee)}
                  </strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Personal Details */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#0B3D62]">
                Step 2: Candidate Personal &amp; Contact Details
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter details strictly as per your 10th Board Marksheet / Government ID.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Candidate Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="As per 10th Marksheet"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
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
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
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
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
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
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
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
                  <option>Other</option>
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
                  <option>EWS</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Aadhar Number
                </label>
                <input
                  type="text"
                  value={aadharNumber}
                  onChange={(e) => setAadharNumber(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
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
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
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
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Complete Residential Address *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House No., Street, Locality"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#135589]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Academic Qualifications */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#0B3D62]">
                Step 3: Academic Qualifications
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Provide your educational qualification details. 10th details are mandatory.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded">
                <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3 text-left border-b border-slate-200">
                      Examination Passed
                    </th>
                    <th className="py-2.5 px-3 text-left border-b border-slate-200">
                      Board / University
                    </th>
                    <th className="py-2.5 px-3 text-left border-b border-slate-200">
                      Passing Year
                    </th>
                    <th className="py-2.5 px-3 text-left border-b border-slate-200">
                      Marks / Percentage (%)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {qualifications.map((q, idx) => (
                    <tr key={q.level}>
                      <td className="py-2.5 px-3 font-semibold text-[#0B3D62]">
                        {q.level}
                        {idx === 0 && <span className="text-red-600"> *</span>}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={q.board}
                          onChange={(e) =>
                            updateQualification(idx, "board", e.target.value)
                          }
                          placeholder="e.g., CBSE / UP Board"
                          className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={q.passingYear}
                          onChange={(e) =>
                            updateQualification(idx, "passingYear", e.target.value)
                          }
                          placeholder="e.g., 2022"
                          className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={q.percentage}
                          onChange={(e) =>
                            updateQualification(idx, "percentage", e.target.value)
                          }
                          placeholder="e.g., 78%"
                          className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 4: Document Uploads */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#0B3D62]">
                Step 4: Document Uploads (with Live Preview)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload clear scanned images (JPG/PNG, max 2 MB each). Passport photo is used
                on your Student ID Card and Certificate.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                {
                  label: "Passport Size Photograph",
                  value: photoUrl,
                  setter: setPhotoUrl,
                  hint: "Recent color photograph",
                },
                {
                  label: "Candidate Signature",
                  value: signatureUrl,
                  setter: setSignatureUrl,
                  hint: "Signed on white paper",
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
          </div>
        )}

        {/* STEP 5: Review & Submit */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#0B3D62]">
                Step 5: Review Application &amp; Final Submission
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Verify all particulars carefully before submitting your official admission
                application.
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
                <span className="text-xs text-slate-500 block">Session &amp; Mode</span>
                <strong>
                  {session} | {studyMode}
                </strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Candidate Name</span>
                <strong>{fullName}</strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">
                  Father&apos;s / Mother&apos;s Name
                </span>
                <strong>
                  {fatherName} / {motherName}
                </strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">DOB / Gender / Category</span>
                <strong>
                  {dob} | {gender} | {category}
                </strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Mobile &amp; Email</span>
                <strong>
                  {mobile} | {email}
                </strong>
              </div>
              <div className="md:col-span-2">
                <span className="text-xs text-slate-500 block">Address</span>
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
                <strong>Candidate Declaration:</strong> I hereby declare that all statements
                and documents submitted in this online admission form are true and correct to
                the best of my knowledge. I understand that my admission is subject to
                verification by Empire Skills India.
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
              {submitting ? "Submitting Application..." : "Submit Admission Form"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
