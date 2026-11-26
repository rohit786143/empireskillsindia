import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const COURSES = [
  {
    code: "ESI-ADCA-101",
    slug: "adca-advanced-diploma-in-computer-applications",
    title: "ADCA - Advanced Diploma in Computer Applications",
    category: "Computer & IT",
    duration: "1 Year",
    eligibility: "10th Pass",
    fee: 12000,
    registrationFee: 500,
    studyMode: "Regular / Hybrid",
    overview:
      "A comprehensive 1-year career-oriented diploma covering computer fundamentals, office automation, financial accounting with Tally Prime, desktop publishing, web designing, and database management. Designed to make learners job-ready for government and corporate office roles.",
    syllabusJson: JSON.stringify([
      {
        moduleTitle: "Semester I: Computer Fundamentals & Office Automation",
        topics: [
          "Computer Architecture, Operating Systems (Windows & Linux Basics)",
          "MS Word (Documentation, Mail Merge, Formatting)",
          "MS Excel (Formulas, Pivot Tables, Charts, Data Validation)",
          "MS PowerPoint & Digital Presentation Skills",
          "Internet Technologies, Cyber Safety & Email Etiquette",
        ],
      },
      {
        moduleTitle: "Semester II: Accounting, DTP & Web Basics",
        topics: [
          "Tally Prime with GST Billing, Inventory & Payroll",
          "Desktop Publishing: CorelDRAW & Adobe Photoshop",
          "HTML5, CSS3 & Responsive Web Page Design",
          "Relational Database Management (MS Access / SQL Basics)",
          "Capstone Practical Project & Viva-Voce Examination",
        ],
      },
    ]),
    careerOpportunitiesJson: JSON.stringify([
      "Computer Operator & Office Executive",
      "Accounts Assistant / Tally Operator",
      "DTP & Graphic Designer",
      "Data Entry & MIS Executive",
      "Junior Web Designer",
    ]),
    featured: true,
  },
  {
    code: "ESI-DCA-102",
    slug: "dca-diploma-in-computer-applications",
    title: "DCA - Diploma in Computer Applications",
    category: "Computer & IT",
    duration: "6 Months",
    eligibility: "10th Pass",
    fee: 6500,
    registrationFee: 500,
    studyMode: "Regular / Online",
    overview:
      "A foundational 6-month diploma program equipping students with essential computer proficiency, office productivity tools, internet operations, and practical IT skills required across clerical, administrative, and banking sectors.",
    syllabusJson: JSON.stringify([
      {
        moduleTitle: "Module 1: Fundamentals & OS",
        topics: [
          "Introduction to Computers, Hardware & Software",
          "Windows OS Administration & File Management",
          "Hindi & English Typing Practice",
        ],
      },
      {
        moduleTitle: "Module 2: Office Suite & Internet",
        topics: [
          "MS Word, MS Excel, MS PowerPoint",
          "E-Governance Portals, Online Banking & Digital Payments",
          "Practical Lab Assessment & Final Project",
        ],
      },
    ]),
    careerOpportunitiesJson: JSON.stringify([
      "Office Assistant",
      "Front Desk & Reception Executive",
      "Data Entry Operator",
      "CSC / E-Mitra Operator",
    ]),
    featured: true,
  },
  {
    code: "ESI-TPG-201",
    slug: "tally-prime-with-gst-accounting",
    title: "Tally Prime with GST & Taxation",
    category: "Management & Accounting",
    duration: "6 Months",
    eligibility: "12th Pass",
    fee: 7500,
    registrationFee: 500,
    studyMode: "Regular / Online",
    overview:
      "Industry-aligned computerized accounting program focused on Tally Prime, GST compliance, e-Invoicing, TDS/TCS, payroll processing, and real-world financial reporting for SMEs and corporate accounting departments.",
    syllabusJson: JSON.stringify([
      {
        moduleTitle: "Module 1: Core Financial Accounting",
        topics: [
          "Accounting Principles, Ledgers, Vouchers & Trial Balance",
          "Inventory Management, Batch & Godown Tracking",
          "Banking Reconciliation & Cheque Management",
        ],
      },
      {
        moduleTitle: "Module 2: GST, TDS & Payroll",
        topics: [
          "CGST, SGST, IGST Computation & GSTR-1/2A/3B Filing",
          "E-Way Bill & E-Invoicing Workflows",
          "TDS, TCS, Payroll Processing & Final Balance Sheet",
        ],
      },
    ]),
    careerOpportunitiesJson: JSON.stringify([
      "Accounts Executive",
      "GST Billing & Filing Specialist",
      "Audit Assistant",
      "Inventory & Billing Manager",
    ]),
    featured: true,
  },
  {
    code: "ESI-WDM-104",
    slug: "web-development-and-digital-marketing",
    title: "Web Development & Digital Marketing",
    category: "Computer & IT",
    duration: "6 Months",
    eligibility: "12th Pass",
    fee: 10500,
    registrationFee: 500,
    studyMode: "Regular / Hybrid",
    overview:
      "Modern dual-skill diploma blending responsive web development with practical digital marketing. Students build live websites and learn SEO, Google Ads, social media strategy, and analytics.",
    syllabusJson: JSON.stringify([
      {
        moduleTitle: "Module 1: Frontend Web Development",
        topics: [
          "HTML5 Semantic Markup & Modern CSS3 / Tailwind",
          "JavaScript Fundamentals & Interactive UI",
          "WordPress CMS, Domain & Web Hosting Deployment",
        ],
      },
      {
        moduleTitle: "Module 2: Digital Marketing & Analytics",
        topics: [
          "Search Engine Optimization (On-Page & Technical SEO)",
          "Google Search & Display Advertising (SEM)",
          "Social Media Marketing & Google Analytics 4",
        ],
      },
    ]),
    careerOpportunitiesJson: JSON.stringify([
      "Junior Web Developer",
      "SEO & Digital Marketing Executive",
      "WordPress Developer",
      "Freelance Web Consultant",
    ]),
    featured: true,
  },
  {
    code: "ESI-NTT-301",
    slug: "nursery-teacher-training-ntt",
    title: "Nursery Teacher Training (NTT)",
    category: "Teacher Training",
    duration: "1 Year",
    eligibility: "12th Pass",
    fee: 14500,
    registrationFee: 500,
    studyMode: "Regular / Hybrid",
    overview:
      "Recognized early childhood care and education diploma preparing aspiring educators in child psychology, play-way pedagogy, Montessori methodologies, classroom management, and creative activity planning.",
    syllabusJson: JSON.stringify([
      {
        moduleTitle: "Semester I: Child Development & Pedagogy",
        topics: [
          "Early Childhood Psychology & Growth Milestones",
          "Principles of Pre-Primary & Montessori Education",
          "Child Health, Nutrition & Safety Standards",
        ],
      },
      {
        moduleTitle: "Semester II: Classroom Practice & Teaching Aids",
        topics: [
          "Lesson Planning, Storytelling & Rhyme Pedagogy",
          "Art, Craft & Activity-Based Learning Material Creation",
          "Supervised Practice Teaching & Viva Examination",
        ],
      },
    ]),
    careerOpportunitiesJson: JSON.stringify([
      "Pre-Primary / Nursery Teacher",
      "Montessori Educator",
      "Play School Coordinator",
      "Early Childhood Curriculum Assistant",
    ]),
    featured: true,
  },
  {
    code: "ESI-OAD-401",
    slug: "office-automation-and-data-entry",
    title: "Office Automation & Data Entry",
    category: "Short-Term Skill",
    duration: "3 Months",
    eligibility: "10th Pass",
    fee: 4000,
    registrationFee: 300,
    studyMode: "Regular / Online",
    overview:
      "Fast-track 3-month vocational certification designed to build high-accuracy typing speed, spreadsheet reporting, document preparation, and clerical office workflow skills.",
    syllabusJson: JSON.stringify([
      {
        moduleTitle: "Module 1: Document & Spreadsheet Productivity",
        topics: [
          "Touch Typing (English & Hindi) with Speed & Accuracy Drills",
          "Official Letter Drafting, Formats & PDF Workflows",
          "MS Excel Data Entry, Sorting, Filtering & Lookup Formulas",
        ],
      },
      {
        moduleTitle: "Module 2: Digital Office Operations",
        topics: [
          "Cloud Docs (Google Workspace), Scanning & Archiving",
          "Email Communication & Daily MIS Reporting",
        ],
      },
    ]),
    careerOpportunitiesJson: JSON.stringify([
      "Data Entry Operator",
      "Back-Office Executive",
      "Clerical Assistant",
      "Document Controller",
    ]),
    featured: true,
  },
  {
    code: "ESI-EST-501",
    slug: "electrical-and-solar-technician",
    title: "Electrical & Solar Technician",
    category: "Vocational & Technical",
    duration: "1 Year",
    eligibility: "10th Pass",
    fee: 15000,
    registrationFee: 500,
    studyMode: "Regular",
    overview:
      "Hands-on technical vocational diploma training learners in domestic & industrial electrical wiring, safety standards, motor winding, inverter systems, and rooftop solar PV installation & maintenance.",
    syllabusJson: JSON.stringify([
      {
        moduleTitle: "Semester I: Electrical Wiring & Safety",
        topics: [
          "Electrical Fundamentals, Ohm's Law & Measuring Instruments",
          "Domestic & Commercial Wiring, Earthing & MCB/RCCB Panels",
          "Industrial Safety, First Aid & Troubleshooting",
        ],
      },
      {
        moduleTitle: "Semester II: Solar PV Systems & Maintenance",
        topics: [
          "Solar Photovoltaic Principles, Panels, Inverters & Batteries",
          "On-Grid, Off-Grid & Hybrid Rooftop Solar Installation",
          "Field Practical Workshop & Site Safety Audit",
        ],
      },
    ]),
    careerOpportunitiesJson: JSON.stringify([
      "Certified Electrician",
      "Solar PV Installation Technician",
      "Facility Maintenance Technician",
      "Self-Employed Electrical Contractor",
    ]),
    featured: true,
  },
  {
    code: "ESI-SEP-402",
    slug: "spoken-english-and-personality-development",
    title: "Spoken English & Personality Development",
    category: "Short-Term Skill",
    duration: "3 Months",
    eligibility: "10th Pass",
    fee: 3500,
    registrationFee: 300,
    studyMode: "Regular / Online",
    overview:
      "Practical communication and soft-skills certificate course focusing on spoken English fluency, pronunciation, business etiquette, resume building, group discussions, and job interview readiness.",
    syllabusJson: JSON.stringify([
      {
        moduleTitle: "Module 1: Spoken Fluency & Grammar in Practice",
        topics: [
          "Functional Grammar, Vocabulary & Sentence Construction",
          "Pronunciation, Voice Modulation & Public Speaking",
          "Everyday & Workplace Conversation Drills",
        ],
      },
      {
        moduleTitle: "Module 2: Career & Interview Readiness",
        topics: [
          "Professional Resume Writing & LinkedIn Etiquette",
          "Group Discussions, Body Language & Mock Interviews",
        ],
      },
    ]),
    careerOpportunitiesJson: JSON.stringify([
      "Customer Support & BPO Executive",
      "Front Office & Hospitality Coordinator",
      "Sales & Business Development Associate",
      "Corporate Communication Readiness",
    ]),
    featured: true,
  },
];

const NOTICES = [
  {
    title: "Online Admission Open for Academic Session July 2026 — All Diploma & Certificate Courses",
    refNumber: "ESI/ADM/2026/041",
    category: "Admission",
    content:
      "Applications are invited from eligible candidates for admission into 3-Month, 6-Month, and 1-Year Vocational, Computer, Management, and Teacher Training programmes for the July 2026 academic session. Candidates may submit their online admission form through the official portal before 30th July 2026.",
    publishedDate: "2026-06-15",
    isNew: true,
    showInTicker: true,
    attachmentLabel: "Admission Prospectus 2026 (PDF)",
  },
  {
    title: "Term-End Practical & Theory Examination Schedule — June 2026 Session Released",
    refNumber: "ESI/EXAM/2026/028",
    category: "Examination",
    content:
      "The Office of the Controller of Examinations has published the Term-End Examination timetable for ADCA, DCA, Tally Prime, NTT, and Electrical Technician batches. Students are advised to download their Student ID Card from the Student Zone prior to appearing at their allotted examination centre.",
    publishedDate: "2026-06-10",
    isNew: true,
    showInTicker: true,
    attachmentLabel: "Exam Date Sheet June 2026",
  },
  {
    title: "Declaration of Final Results & Digital Certificate Issuance for Jan 2026 Graduating Batch",
    refNumber: "ESI/RES/2026/019",
    category: "Result",
    content:
      "Results for the January 2026 graduating cohort have been declared. Students can check their marksheet in the Student Zone using their Enrollment Number and Date of Birth. QR-verified certificates are now live on the public Certificate Verification Portal.",
    publishedDate: "2026-05-28",
    isNew: true,
    showInTicker: true,
    attachmentLabel: "Result Notification Circular",
  },
  {
    title: "Mandatory Aadhar & Document Verification Guidelines for Newly Enrolled Students",
    refNumber: "ESI/REG/2026/014",
    category: "Circular",
    content:
      "All candidates whose online admissions have been provisionally approved are requested to verify that their uploaded passport photograph, marksheet, and ID proof are clear and legible for final enrollment confirmation and ID card generation.",
    publishedDate: "2026-05-12",
    isNew: false,
    showInTicker: false,
    attachmentLabel: "Document Verification Checklist",
  },
  {
    title: "Skill India & Industry Placement Drive 2026 — Registration Open for Certified Alumni",
    refNumber: "ESI/PLC/2026/009",
    category: "General",
    content:
      "Empire Skills India Placement Cell is organizing a multi-sector campus recruitment drive for certified students of IT, Accounting, and Technical trades. Eligible students with Grade B or above may register at the Administrative Office.",
    publishedDate: "2026-04-25",
    isNew: false,
    showInTicker: false,
    attachmentLabel: "Placement Drive Circular",
  },
];

// Clean SVG data-URL avatar placeholders for seeded students so photos render crisply offline
function makeStudentAvatar(initials: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="280" viewBox="0 0 240 280">
    <rect width="240" height="280" fill="${bg}"/>
    <circle cx="120" cy="100" r="46" fill="#E2E8F0"/>
    <path d="M48 250 C48 188 192 188 192 250 Z" fill="#CBD5E1"/>
    <text x="120" y="114" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="#0F2C59" text-anchor="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function main() {
  console.log("Seeding Empire Skills India database...");

  // 1. Seed Institute Owner Admin Account
  const passwordHash = await bcrypt.hash("Admin@123", 10);
  await prisma.adminUser.upsert({
    where: { email: "admin@empireskillsindia.com" },
    update: {
      name: "Director, Empire Skills India",
      role: "OWNER",
    },
    create: {
      name: "Director, Empire Skills India",
      email: "admin@empireskillsindia.com",
      passwordHash,
      role: "OWNER",
    },
  });

  // 2. Seed Courses
  const courseMap: Record<string, { id: string; code: string; title: string; duration: string }> = {};
  for (const c of COURSES) {
    const record = await prisma.course.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
    courseMap[c.code] = {
      id: record.id,
      code: record.code,
      title: record.title,
      duration: record.duration,
    };
  }

  // 3. Seed Notices
  for (const n of NOTICES) {
    const existing = await prisma.notice.findFirst({ where: { refNumber: n.refNumber } });
    if (!existing) {
      await prisma.notice.create({ data: n });
    }
  }

  // 4. Seed 3 Approved Students + 1 Pending Application
  const adca = courseMap["ESI-ADCA-101"];
  const tally = courseMap["ESI-TPG-201"];
  const ntt = courseMap["ESI-NTT-301"];
  const dca = courseMap["ESI-DCA-102"];

  const student1 = await prisma.admissionApplication.upsert({
    where: { applicationRef: "ESI-APP-2026-1001" },
    update: {},
    create: {
      applicationRef: "ESI-APP-2026-1001",
      status: "APPROVED",
      enrollmentNumber: "ESI2026001",
      courseId: adca.id,
      courseName: adca.title,
      courseCode: adca.code,
      session: "Jan 2026",
      studyMode: "Regular",
      fullName: "Aarav Sharma",
      fatherName: "Rajesh Sharma",
      motherName: "Sunita Sharma",
      dob: "2002-05-14",
      gender: "Male",
      category: "General",
      aadharNumber: "4521-8890-3312",
      mobile: "9876543210",
      email: "aarav.sharma@example.com",
      address: "House No. 42, Sector 14, Civil Lines",
      city: "Lucknow",
      state: "Uttar Pradesh",
      pincode: "226001",
      qualificationsJson: JSON.stringify([
        { level: "10th", board: "CBSE", passingYear: "2018", percentage: "84%" },
        { level: "12th", board: "CBSE", passingYear: "2020", percentage: "81%" },
      ]),
      photoUrl: makeStudentAvatar("AS", "#EFF6FF"),
      isCompleted: true,
      marksObtained: 442,
      totalMarks: 500,
      percentage: 88.4,
      grade: "A+",
      completionDate: "2026-05-20",
      resultJson: JSON.stringify([
        { subject: "Computer Fundamentals & OS", maxMarks: 100, obtainedMarks: 90, grade: "A+" },
        { subject: "MS Office & Productivity Suite", maxMarks: 100, obtainedMarks: 88, grade: "A+" },
        { subject: "Tally Prime with GST", maxMarks: 100, obtainedMarks: 86, grade: "A+" },
        { subject: "DTP & Web Designing", maxMarks: 100, obtainedMarks: 89, grade: "A+" },
        { subject: "Practical Project & Viva", maxMarks: 100, obtainedMarks: 89, grade: "A+" },
      ]),
      approvedAt: new Date("2026-01-12T10:00:00Z"),
    },
  });

  const student2 = await prisma.admissionApplication.upsert({
    where: { applicationRef: "ESI-APP-2026-1002" },
    update: {},
    create: {
      applicationRef: "ESI-APP-2026-1002",
      status: "APPROVED",
      enrollmentNumber: "ESI2026002",
      courseId: tally.id,
      courseName: tally.title,
      courseCode: tally.code,
      session: "Jan 2026",
      studyMode: "Hybrid",
      fullName: "Priya Verma",
      fatherName: "Mahesh Verma",
      motherName: "Kavita Verma",
      dob: "2001-11-22",
      gender: "Female",
      category: "OBC",
      aadharNumber: "6612-4421-9087",
      mobile: "9811223344",
      email: "priya.verma@example.com",
      address: "18/B Shastri Nagar, Near Central Park",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302016",
      qualificationsJson: JSON.stringify([
        { level: "10th", board: "RBSE", passingYear: "2017", percentage: "79%" },
        { level: "12th", board: "RBSE", passingYear: "2019", percentage: "85%" },
        { level: "Graduation", board: "University of Rajasthan", passingYear: "2022", percentage: "76%" },
      ]),
      photoUrl: makeStudentAvatar("PV", "#FEF3C7"),
      isCompleted: true,
      marksObtained: 328,
      totalMarks: 400,
      percentage: 82.0,
      grade: "A",
      completionDate: "2026-05-25",
      resultJson: JSON.stringify([
        { subject: "Financial Accounting & Inventory", maxMarks: 100, obtainedMarks: 84, grade: "A" },
        { subject: "GST Compliance & E-Filing", maxMarks: 100, obtainedMarks: 80, grade: "A" },
        { subject: "TDS, TCS & Payroll Management", maxMarks: 100, obtainedMarks: 81, grade: "A" },
        { subject: "Practical Assessment & Case Study", maxMarks: 100, obtainedMarks: 83, grade: "A" },
      ]),
      approvedAt: new Date("2026-01-15T10:00:00Z"),
    },
  });

  await prisma.admissionApplication.upsert({
    where: { applicationRef: "ESI-APP-2026-1003" },
    update: {},
    create: {
      applicationRef: "ESI-APP-2026-1003",
      status: "APPROVED",
      enrollmentNumber: "ESI2026003",
      courseId: ntt.id,
      courseName: ntt.title,
      courseCode: ntt.code,
      session: "July 2026",
      studyMode: "Regular",
      fullName: "Neha Kulkarni",
      fatherName: "Suresh Kulkarni",
      motherName: "Meena Kulkarni",
      dob: "2000-08-05",
      gender: "Female",
      category: "General",
      aadharNumber: "7890-1234-5678",
      mobile: "9765432109",
      email: "neha.kulkarni@example.com",
      address: "Flat 304, Saraswati Residency, Kothrud",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411038",
      qualificationsJson: JSON.stringify([
        { level: "10th", board: "Maharashtra State Board", passingYear: "2016", percentage: "82%" },
        { level: "12th", board: "Maharashtra State Board", passingYear: "2018", percentage: "78%" },
      ]),
      photoUrl: makeStudentAvatar("NK", "#F0FDF4"),
      isCompleted: false,
      approvedAt: new Date("2026-06-01T10:00:00Z"),
    },
  });

  // 1 Pending application for testing approval workflow in Admin panel
  await prisma.admissionApplication.upsert({
    where: { applicationRef: "ESI-APP-2026-1004" },
    update: {},
    create: {
      applicationRef: "ESI-APP-2026-1004",
      status: "PENDING",
      courseId: dca.id,
      courseName: dca.title,
      courseCode: dca.code,
      session: "July 2026",
      studyMode: "Online",
      fullName: "Rohan Kumar",
      fatherName: "Vinod Kumar",
      motherName: "Rekha Devi",
      dob: "2003-03-19",
      gender: "Male",
      category: "SC",
      aadharNumber: "3344-5566-7788",
      mobile: "9988776655",
      email: "rohan.kumar@example.com",
      address: "Plot 12, Boring Road",
      city: "Patna",
      state: "Bihar",
      pincode: "800001",
      qualificationsJson: JSON.stringify([
        { level: "10th", board: "BSEB", passingYear: "2019", percentage: "74%" },
        { level: "12th", board: "BSEB", passingYear: "2021", percentage: "72%" },
      ]),
      photoUrl: makeStudentAvatar("RK", "#F8FAFC"),
      isCompleted: false,
    },
  });

  // 5. Seed 2 Pre-Generated Verifiable Certificates
  await prisma.certificate.upsert({
    where: { certificateNumber: "CERT-ESI-2026-0001" },
    update: {},
    create: {
      certificateNumber: "CERT-ESI-2026-0001",
      enrollmentNumber: "ESI2026001",
      applicationId: student1.id,
      studentName: student1.fullName,
      fatherName: student1.fatherName,
      motherName: student1.motherName,
      dob: student1.dob,
      photoUrl: student1.photoUrl,
      courseName: adca.title,
      courseCode: adca.code,
      duration: adca.duration,
      session: "Jan 2026",
      marksObtained: 442,
      totalMarks: 500,
      percentage: 88.4,
      grade: "A+",
      completionDate: "2026-05-20",
      issueDate: "2026-05-28",
      status: "VALID",
    },
  });

  await prisma.certificate.upsert({
    where: { certificateNumber: "CERT-ESI-2026-0002" },
    update: {},
    create: {
      certificateNumber: "CERT-ESI-2026-0002",
      enrollmentNumber: "ESI2026002",
      applicationId: student2.id,
      studentName: student2.fullName,
      fatherName: student2.fatherName,
      motherName: student2.motherName,
      dob: student2.dob,
      photoUrl: student2.photoUrl,
      courseName: tally.title,
      courseCode: tally.code,
      duration: tally.duration,
      session: "Jan 2026",
      marksObtained: 328,
      totalMarks: 400,
      percentage: 82.0,
      grade: "A",
      completionDate: "2026-05-25",
      issueDate: "2026-05-30",
      status: "VALID",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
