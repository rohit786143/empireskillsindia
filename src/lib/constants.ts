export interface SyllabusModule {
  moduleTitle: string;
  topics: string[];
}

export interface QualificationItem {
  level: string;
  board: string;
  passingYear: string;
  percentage: string;
}

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
