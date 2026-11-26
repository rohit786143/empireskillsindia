export interface SyllabusModule {
  moduleTitle: string;
  topics: string[];
}

export interface QualificationItem {
  level: string;
  subject?: string;
  yearFrom?: string;
  yearTo?: string;
  board: string;
  passingYear: string;
  percentage: string;
}

export interface AdmissionExtraDetails {
  correspondenceAddress?: string;
  telephone?: string;
  nationality?: string;
  religion?: string;
  identificationMark?: string;
  hearAbout?: string[];
  hearAboutOther?: string;
  enclosedDocs?: string[];
}

export const RELIGION_OPTIONS = ["Hindu", "Muslim", "Sikh", "Other"] as const;

export const HEAR_ABOUT_OPTIONS = [
  "Poster",
  "Radio",
  "T.V.",
  "Newspaper",
  "Education Fair",
  "Internet",
  "Friend",
  "Other",
] as const;

export const ENCLOSURE_DOCUMENTS = [
  "Matriculation (10th) certificate/Proof of Age",
  "Detailed mark card (10+2) or Equivalent Exam",
  "Detailed mark card of Diploma/Graduation/ or equivalent Exam",
  "Domicile Certificate",
  "Employment registration Card",
  "Reservation (SC/ST/OBC/PH/Ex-Serviceman etc.) Certificate/Caste Certificate",
  "Passport/Aadhar Card/Voter Card/Driving License",
  "Proof of annual parental income from all sources (in case of candidates for Scholarship).",
  "Four Colored passport size photographs",
] as const;

export const PDF_COURSE_CHECKBOXES = [
  "DCA",
  "TallyPrime",
  "Professional Accounts",
  "Stenography (Eng/Hindi)",
  "Fashion Designing",
  "Hair & Skin Care",
  "Basic Computer",
  "CCA",
] as const;

export interface SubjectResultItem {
  subject: string;
  maxMarks: number;
  obtainedMarks: number;
  grade: string;
}

export const COURSE_CATEGORIES = [
  "All",
  "Computer & IT",
  "Vocational & Technical",
  "Management & Accounting",
  "Teacher Training",
  "Short-Term Skill",
] as const;

export const COURSE_DURATIONS = [
  "All",
  "3 Months",
  "6 Months",
  "1 Year",
  "2 Years",
] as const;

export const COURSE_ELIGIBILITIES = [
  "All",
  "10th Pass",
  "12th Pass",
  "Graduate",
] as const;

export const ACADEMIC_SESSIONS = [
  "July 2026",
  "Jan 2026",
  "Jan 2027",
] as const;

export const STUDY_MODES = [
  "Regular",
  "Online",
  "Hybrid",
] as const;

export const INSTITUTE_INFO = {
  name: "EMPIRE SKILLS INDIA",
  tagline: "An ISO 9001:2015 Certified Vocational & Skill Development Institution",
  registrationLine: "Regd. Under Govt. of NCT / MSME & National Skill Development Framework",
  regNumber: "REG. NO: ESI/IND/2018/09412 | ISO 9001:2015 CERTIFIED",
  helpline: "+91-1800-120-4589 / +91-98104-55210",
  email: "info@empireskillsindia.com",
  admissionsEmail: "admissions@empireskillsindia.com",
  website: "www.empireskillsindia.com",
  address: "Academic Block, Plot No. 14, Institutional Area, Sector 62, Noida - 201309 (NCR), India",
  officeHours: "Monday – Saturday: 09:30 AM to 06:00 PM IST",
};
