-- ============================================================================
-- Empire Skills India — MySQL Database Schema & Initial Seed Data
-- Import this file via Hostinger phpMyAdmin into your MySQL database.
-- Default Admin Login: admin@empireskillsindia.com / Admin@123
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Admin Users Table
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(32) NOT NULL DEFAULT 'OWNER',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS `courses` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `duration` VARCHAR(64) NOT NULL,
  `eligibility` VARCHAR(100) NOT NULL,
  `fee` INT NOT NULL DEFAULT 0,
  `registration_fee` INT NOT NULL DEFAULT 500,
  `study_mode` VARCHAR(100) NOT NULL DEFAULT 'Regular / Online',
  `overview` TEXT NOT NULL,
  `syllabus_json` LONGTEXT NOT NULL,
  `career_opportunities_json` LONGTEXT NOT NULL,
  `featured` TINYINT(1) NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_course_code` (`code`),
  UNIQUE KEY `uniq_course_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Notices & Circulars Table
CREATE TABLE IF NOT EXISTS `notices` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `ref_number` VARCHAR(100) NOT NULL,
  `category` VARCHAR(64) NOT NULL DEFAULT 'General',
  `content` TEXT NOT NULL,
  `published_date` VARCHAR(32) NOT NULL,
  `is_new` TINYINT(1) NOT NULL DEFAULT 1,
  `show_in_ticker` TINYINT(1) NOT NULL DEFAULT 0,
  `attachment_label` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Admission Applications & Enrolled Students Table
CREATE TABLE IF NOT EXISTS `admission_applications` (
  `id` VARCHAR(64) NOT NULL,
  `application_ref` VARCHAR(64) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  `enrollment_number` VARCHAR(64) DEFAULT NULL,
  `course_id` VARCHAR(64) DEFAULT NULL,
  `course_name` VARCHAR(255) NOT NULL,
  `course_code` VARCHAR(64) NOT NULL,
  `session` VARCHAR(64) NOT NULL,
  `study_mode` VARCHAR(64) NOT NULL,
  `full_name` VARCHAR(191) NOT NULL,
  `father_name` VARCHAR(191) NOT NULL,
  `mother_name` VARCHAR(191) NOT NULL,
  `dob` VARCHAR(32) NOT NULL,
  `gender` VARCHAR(32) NOT NULL,
  `category` VARCHAR(32) NOT NULL,
  `aadhar_number` VARCHAR(64) NOT NULL DEFAULT '',
  `mobile` VARCHAR(32) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `address` TEXT NOT NULL,
  `city` VARCHAR(100) NOT NULL DEFAULT '',
  `state` VARCHAR(100) NOT NULL DEFAULT '',
  `pincode` VARCHAR(20) NOT NULL DEFAULT '',
  `qualifications_json` LONGTEXT NOT NULL,
  `extra_details_json` LONGTEXT DEFAULT NULL,
  `photo_url` LONGTEXT DEFAULT NULL,
  `signature_url` LONGTEXT DEFAULT NULL,
  `marksheet_url` LONGTEXT DEFAULT NULL,
  `id_proof_url` LONGTEXT DEFAULT NULL,
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0,
  `marks_obtained` INT DEFAULT NULL,
  `total_marks` INT DEFAULT NULL,
  `percentage` DECIMAL(5,2) DEFAULT NULL,
  `grade` VARCHAR(16) DEFAULT NULL,
  `result_json` LONGTEXT DEFAULT NULL,
  `completion_date` VARCHAR(32) DEFAULT NULL,
  `remarks` TEXT DEFAULT NULL,
  `approved_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_application_ref` (`application_ref`),
  UNIQUE KEY `uniq_enrollment_number` (`enrollment_number`),
  KEY `idx_app_status` (`status`),
  KEY `idx_app_course_id` (`course_id`),
  CONSTRAINT `fk_app_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Certificates Registry Table
CREATE TABLE IF NOT EXISTS `certificates` (
  `id` VARCHAR(64) NOT NULL,
  `certificate_number` VARCHAR(64) NOT NULL,
  `enrollment_number` VARCHAR(64) NOT NULL,
  `application_id` VARCHAR(64) DEFAULT NULL,
  `student_name` VARCHAR(191) NOT NULL,
  `father_name` VARCHAR(191) NOT NULL,
  `mother_name` VARCHAR(191) DEFAULT NULL,
  `dob` VARCHAR(32) NOT NULL,
  `photo_url` LONGTEXT DEFAULT NULL,
  `course_name` VARCHAR(255) NOT NULL,
  `course_code` VARCHAR(64) DEFAULT NULL,
  `duration` VARCHAR(64) NOT NULL,
  `session` VARCHAR(64) DEFAULT NULL,
  `marks_obtained` INT DEFAULT NULL,
  `total_marks` INT DEFAULT NULL,
  `percentage` DECIMAL(5,2) DEFAULT NULL,
  `grade` VARCHAR(16) NOT NULL,
  `completion_date` VARCHAR(32) DEFAULT NULL,
  `issue_date` VARCHAR(32) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'VALID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_certificate_number` (`certificate_number`),
  KEY `idx_cert_enrollment` (`enrollment_number`),
  CONSTRAINT `fk_cert_application` FOREIGN KEY (`application_id`) REFERENCES `admission_applications` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Contact Inquiries Table
CREATE TABLE IF NOT EXISTS `contact_inquiries` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `subject` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- Default Institute Owner Admin Account (Password: Admin@123)
INSERT INTO `admin_users` (`id`, `name`, `email`, `password_hash`, `role`)
VALUES (
  'admin_owner_01',
  'Director, Empire Skills India',
  'admin@empireskillsindia.com',
  '$2y$10$jusyoee0AMFDSkUOs8O1FeDKPfUow6.zzjhRoIcD/ID0/ohJaxTmW',
  'OWNER'
)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Seed 8 Skill & Vocational Courses
INSERT INTO `courses` (`id`, `code`, `slug`, `title`, `category`, `duration`, `eligibility`, `fee`, `registration_fee`, `study_mode`, `overview`, `syllabus_json`, `career_opportunities_json`, `featured`, `is_active`) VALUES
('course_adca_101', 'ESI-ADCA-101', 'adca-advanced-diploma-in-computer-applications', 'ADCA - Advanced Diploma in Computer Applications', 'Computer & IT', '1 Year', '10th Pass', 12000, 500, 'Regular / Hybrid',
 'A comprehensive 1-year career-oriented diploma covering computer fundamentals, office automation, financial accounting with Tally Prime, desktop publishing, web designing, and database management.',
 '[{"moduleTitle":"Semester I: Computer Fundamentals & Office Automation","topics":["Computer Architecture & Operating Systems","MS Word, MS Excel, MS PowerPoint","Internet Technologies & Email Etiquette"]},{"moduleTitle":"Semester II: Accounting, DTP & Web Basics","topics":["Tally Prime with GST Billing & Inventory","CorelDRAW & Adobe Photoshop","HTML5, CSS3 & Capstone Project"]}]',
 '["Computer Operator & Office Executive","Accounts Assistant / Tally Operator","DTP & Graphic Designer","Data Entry & MIS Executive"]', 1, 1),

('course_dca_102', 'ESI-DCA-102', 'dca-diploma-in-computer-applications', 'DCA - Diploma in Computer Applications', 'Computer & IT', '6 Months', '10th Pass', 6500, 500, 'Regular / Online',
 'A foundational 6-month diploma program equipping students with essential computer proficiency, office productivity tools, internet operations, and practical IT skills.',
 '[{"moduleTitle":"Module 1: Fundamentals & OS","topics":["Introduction to Computers, Hardware & Software","Windows OS Administration","Hindi & English Typing Practice"]},{"moduleTitle":"Module 2: Office Suite & Internet","topics":["MS Word, MS Excel, MS PowerPoint","E-Governance Portals & Digital Payments","Practical Lab Assessment"]}]',
 '["Office Assistant","Front Desk Executive","Data Entry Operator","CSC / E-Mitra Operator"]', 1, 1),

('course_tpg_201', 'ESI-TPG-201', 'tally-prime-with-gst-accounting', 'Tally Prime with GST & Taxation', 'Management & Accounting', '6 Months', '12th Pass', 7500, 500, 'Regular / Online',
 'Industry-aligned computerized accounting program focused on Tally Prime, GST compliance, e-Invoicing, TDS/TCS, payroll processing, and real-world financial reporting.',
 '[{"moduleTitle":"Module 1: Core Financial Accounting","topics":["Accounting Principles, Ledgers & Vouchers","Inventory & Godown Management","Banking Reconciliation"]},{"moduleTitle":"Module 2: GST, TDS & Payroll","topics":["CGST, SGST, IGST & GSTR Filing","E-Way Bill & E-Invoicing","TDS, TCS & Payroll Processing"]}]',
 '["Accounts Executive","GST Billing Specialist","Audit Assistant","Inventory & Billing Manager"]', 1, 1),

('course_wdm_104', 'ESI-WDM-104', 'web-development-and-digital-marketing', 'Web Development & Digital Marketing', 'Computer & IT', '6 Months', '12th Pass', 10500, 500, 'Regular / Hybrid',
 'Modern dual-skill diploma blending responsive web development with practical digital marketing, SEO, Google Ads, social media strategy, and analytics.',
 '[{"moduleTitle":"Module 1: Frontend Web Development","topics":["HTML5 & Modern CSS3","JavaScript Fundamentals","WordPress CMS & Hosting Deployment"]},{"moduleTitle":"Module 2: Digital Marketing & Analytics","topics":["Search Engine Optimization (SEO)","Google Search & Display Ads","Social Media Marketing & GA4"]}]',
 '["Junior Web Developer","SEO & Digital Marketing Executive","WordPress Developer","Freelance Web Consultant"]', 1, 1),

('course_ntt_301', 'ESI-NTT-301', 'nursery-teacher-training-ntt', 'Nursery Teacher Training (NTT)', 'Teacher Training', '1 Year', '12th Pass', 14500, 500, 'Regular / Hybrid',
 'Recognized early childhood care and education diploma preparing aspiring educators in child psychology, play-way pedagogy, Montessori methodologies, and classroom management.',
 '[{"moduleTitle":"Semester I: Child Development & Pedagogy","topics":["Early Childhood Psychology","Pre-Primary & Montessori Education","Child Health, Nutrition & Safety"]},{"moduleTitle":"Semester II: Classroom Practice","topics":["Lesson Planning & Storytelling","Teaching Aids & Activity Learning","Supervised Practice Teaching"]}]',
 '["Pre-Primary / Nursery Teacher","Montessori Educator","Play School Coordinator","Curriculum Assistant"]', 1, 1),

('course_oad_401', 'ESI-OAD-401', 'office-automation-and-data-entry', 'Office Automation & Data Entry', 'Short-Term Skill', '3 Months', '10th Pass', 4000, 300, 'Regular / Online',
 'Fast-track 3-month vocational certification designed to build high-accuracy typing speed, spreadsheet reporting, document preparation, and clerical office workflow skills.',
 '[{"moduleTitle":"Module 1: Document & Spreadsheet Productivity","topics":["Touch Typing (English & Hindi)","Official Letter Drafting & PDF Workflows","MS Excel Data Entry & Lookup Formulas"]},{"moduleTitle":"Module 2: Digital Office Operations","topics":["Google Workspace & Cloud Docs","Email Communication & MIS Reporting"]}]',
 '["Data Entry Operator","Back-Office Executive","Clerical Assistant","Document Controller"]', 1, 1),

('course_est_501', 'ESI-EST-501', 'electrical-and-solar-technician', 'Electrical & Solar Technician', 'Vocational & Technical', '1 Year', '10th Pass', 15000, 500, 'Regular',
 'Hands-on technical vocational diploma training learners in domestic & industrial electrical wiring, safety standards, inverter systems, and rooftop solar PV installation.',
 '[{"moduleTitle":"Semester I: Electrical Wiring & Safety","topics":["Electrical Fundamentals & Measuring Instruments","Domestic & Commercial Wiring, Earthing & Panels","Industrial Safety & Troubleshooting"]},{"moduleTitle":"Semester II: Solar PV Systems","topics":["Solar PV Panels, Inverters & Batteries","On-Grid & Off-Grid Rooftop Installation","Field Practical Workshop"]}]',
 '["Certified Electrician","Solar PV Installation Technician","Facility Maintenance Technician","Electrical Contractor"]', 1, 1),

('course_sep_402', 'ESI-SEP-402', 'spoken-english-and-personality-development', 'Spoken English & Personality Development', 'Short-Term Skill', '3 Months', '10th Pass', 3500, 300, 'Regular / Online',
 'Practical communication and soft-skills certificate course focusing on spoken English fluency, pronunciation, business etiquette, resume building, and job interview readiness.',
 '[{"moduleTitle":"Module 1: Spoken Fluency","topics":["Functional Grammar & Vocabulary","Pronunciation & Public Speaking","Workplace Conversation Drills"]},{"moduleTitle":"Module 2: Career Readiness","topics":["Professional Resume Writing","Group Discussions & Mock Interviews"]}]',
 '["Customer Support Executive","Front Office Coordinator","Sales Associate","Corporate Communication Readiness"]', 1, 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- Seed 5 Official Institutional Notices
INSERT INTO `notices` (`id`, `title`, `ref_number`, `category`, `content`, `published_date`, `is_new`, `show_in_ticker`, `attachment_label`, `is_active`) VALUES
('notice_01', 'Online Admission Open for Academic Session July 2026 — All Diploma & Certificate Courses', 'ESI/ADM/2026/041', 'Admission', 'Applications are invited from eligible candidates for admission into 3-Month, 6-Month, and 1-Year Vocational, Computer, Management, and Teacher Training programmes for the July 2026 academic session.', '2026-06-15', 1, 1, 'Admission Prospectus 2026 (PDF)', 1),
('notice_02', 'Term-End Practical & Theory Examination Schedule — June 2026 Session Released', 'ESI/EXAM/2026/028', 'Examination', 'The Office of the Controller of Examinations has published the Term-End Examination timetable for ADCA, DCA, Tally Prime, NTT, and Electrical Technician batches.', '2026-06-10', 1, 1, 'Exam Date Sheet June 2026', 1),
('notice_03', 'Declaration of Final Results & Digital Certificate Issuance for Jan 2026 Graduating Batch', 'ESI/RES/2026/019', 'Result', 'Results for the January 2026 graduating cohort have been declared. Students can check their marksheet in the Student Zone and verify QR certificates online.', '2026-05-28', 1, 1, 'Result Notification Circular', 1),
('notice_04', 'Mandatory Aadhar & Document Verification Guidelines for Newly Enrolled Students', 'ESI/REG/2026/014', 'Circular', 'All candidates whose online admissions have been provisionally approved are requested to verify their uploaded passport photograph, marksheet, and ID proof.', '2026-05-12', 0, 0, 'Document Verification Checklist', 1),
('notice_05', 'Skill India & Industry Placement Drive 2026 — Registration Open for Certified Alumni', 'ESI/PLC/2026/009', 'General', 'Empire Skills India Placement Cell is organizing a multi-sector campus recruitment drive for certified students of IT, Accounting, and Technical trades.', '2026-04-25', 0, 0, 'Placement Drive Circular', 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- Seed 3 Approved Students + 1 Pending Application
INSERT INTO `admission_applications`
(`id`, `application_ref`, `status`, `enrollment_number`, `course_id`, `course_name`, `course_code`, `session`, `study_mode`, `full_name`, `father_name`, `mother_name`, `dob`, `gender`, `category`, `aadhar_number`, `mobile`, `email`, `address`, `city`, `state`, `pincode`, `qualifications_json`, `is_completed`, `marks_obtained`, `total_marks`, `percentage`, `grade`, `result_json`, `completion_date`, `approved_at`) VALUES
('app_001', 'ESI-APP-2026-1001', 'APPROVED', 'ESI2026001', 'course_adca_101', 'ADCA - Advanced Diploma in Computer Applications', 'ESI-ADCA-101', 'Jan 2026', 'Regular', 'Aarav Sharma', 'Rajesh Sharma', 'Sunita Sharma', '2002-05-14', 'Male', 'General', '4521-8890-3312', '9876543210', 'aarav.sharma@example.com', 'House No. 42, Sector 14, Civil Lines', 'Lucknow', 'Uttar Pradesh', '226001',
 '[{"level":"10th","board":"CBSE","passingYear":"2018","percentage":"84%"},{"level":"12th","board":"CBSE","passingYear":"2020","percentage":"81%"}]',
 1, 442, 500, 88.40, 'A+',
 '[{"subject":"Computer Fundamentals & OS","maxMarks":100,"obtainedMarks":90,"grade":"A+"},{"subject":"MS Office & Productivity Suite","maxMarks":100,"obtainedMarks":88,"grade":"A+"},{"subject":"Tally Prime with GST","maxMarks":100,"obtainedMarks":86,"grade":"A+"},{"subject":"DTP & Web Designing","maxMarks":100,"obtainedMarks":89,"grade":"A+"},{"subject":"Practical Project & Viva","maxMarks":100,"obtainedMarks":89,"grade":"A+"}]',
 '2026-05-20', '2026-01-12 10:00:00'),

('app_002', 'ESI-APP-2026-1002', 'APPROVED', 'ESI2026002', 'course_tpg_201', 'Tally Prime with GST & Taxation', 'ESI-TPG-201', 'Jan 2026', 'Hybrid', 'Priya Verma', 'Mahesh Verma', 'Kavita Verma', '2001-11-22', 'Female', 'OBC', '6612-4421-9087', '9811223344', 'priya.verma@example.com', '18/B Shastri Nagar, Near Central Park', 'Jaipur', 'Rajasthan', '302016',
 '[{"level":"10th","board":"RBSE","passingYear":"2017","percentage":"79%"},{"level":"12th","board":"RBSE","passingYear":"2019","percentage":"85%"}]',
 1, 328, 400, 82.00, 'A',
 '[{"subject":"Financial Accounting & Inventory","maxMarks":100,"obtainedMarks":84,"grade":"A"},{"subject":"GST Compliance & E-Filing","maxMarks":100,"obtainedMarks":80,"grade":"A"},{"subject":"TDS, TCS & Payroll Management","maxMarks":100,"obtainedMarks":81,"grade":"A"},{"subject":"Practical Assessment","maxMarks":100,"obtainedMarks":83,"grade":"A"}]',
 '2026-05-25', '2026-01-15 10:00:00'),

('app_003', 'ESI-APP-2026-1003', 'APPROVED', 'ESI2026003', 'course_ntt_301', 'Nursery Teacher Training (NTT)', 'ESI-NTT-301', 'July 2026', 'Regular', 'Neha Kulkarni', 'Suresh Kulkarni', 'Meena Kulkarni', '2000-08-05', 'Female', 'General', '7890-1234-5678', '9765432109', 'neha.kulkarni@example.com', 'Flat 304, Saraswati Residency, Kothrud', 'Pune', 'Maharashtra', '411038',
 '[{"level":"10th","board":"Maharashtra State Board","passingYear":"2016","percentage":"82%"}]',
 0, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-01 10:00:00'),

('app_004', 'ESI-APP-2026-1004', 'PENDING', NULL, 'course_dca_102', 'DCA - Diploma in Computer Applications', 'ESI-DCA-102', 'July 2026', 'Online', 'Rohan Kumar', 'Vinod Kumar', 'Rekha Devi', '2003-03-19', 'Male', 'SC', '3344-5566-7788', '9988776655', 'rohan.kumar@example.com', 'Plot 12, Boring Road', 'Patna', 'Bihar', '800001',
 '[{"level":"10th","board":"BSEB","passingYear":"2019","percentage":"74%"}]',
 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- Seed 2 Pre-Generated Verifiable Certificates
INSERT INTO `certificates`
(`id`, `certificate_number`, `enrollment_number`, `application_id`, `student_name`, `father_name`, `mother_name`, `dob`, `course_name`, `course_code`, `duration`, `session`, `marks_obtained`, `total_marks`, `percentage`, `grade`, `completion_date`, `issue_date`, `status`) VALUES
('cert_001', 'CERT-ESI-2026-0001', 'ESI2026001', 'app_001', 'Aarav Sharma', 'Rajesh Sharma', 'Sunita Sharma', '2002-05-14', 'ADCA - Advanced Diploma in Computer Applications', 'ESI-ADCA-101', '1 Year', 'Jan 2026', 442, 500, 88.40, 'A+', '2026-05-20', '2026-05-28', 'VALID'),
('cert_002', 'CERT-ESI-2026-0002', 'ESI2026002', 'app_002', 'Priya Verma', 'Mahesh Verma', 'Kavita Verma', '2001-11-22', 'Tally Prime with GST & Taxation', 'ESI-TPG-201', '6 Months', 'Jan 2026', 328, 400, 82.00, 'A', '2026-05-25', '2026-05-30', 'VALID')
ON DUPLICATE KEY UPDATE `student_name` = VALUES(`student_name`);

SET FOREIGN_KEY_CHECKS = 1;
