-- ============================================================================
-- Empire Skills India — Incremental Database Update (v2)
-- Run this in Hostinger phpMyAdmin -> SQL or Import tab on u453101562_empire
-- Adds extra_details_json for Official 3-Page Admission Form + 6 New Courses
-- ============================================================================

-- 1. Add extra_details_json column to admission_applications (safe if run once)
ALTER TABLE `admission_applications`
  ADD COLUMN IF NOT EXISTS `extra_details_json` LONGTEXT DEFAULT NULL;

-- 2. Add Courses listed on Official Empire Admission Form (Admin can edit fees anytime)
INSERT INTO `courses` (`id`, `code`, `slug`, `title`, `category`, `duration`, `eligibility`, `fee`, `registration_fee`, `study_mode`, `overview`, `syllabus_json`, `career_opportunities_json`, `featured`, `is_active`) VALUES
('course_proacc_202', 'ESI-PAC-202', 'professional-accounts', 'Professional Accounts', 'Management & Accounting', '1 Year', '12th Pass', 14000, 500, 'Regular / Hybrid',
 'Comprehensive professional accounting programme covering manual & computerized accounting, Tally Prime, GST returns, Income Tax, TDS/TCS, payroll, and corporate financial statements.',
 '[{"moduleTitle":"Semester I: Accounting & Tally Prime","topics":["Core Accounting Principles & Final Accounts","Tally Prime Inventory, Banking & Voucher Entry","Payroll & Cost Center Management"]},{"moduleTitle":"Semester II: Direct & Indirect Taxation","topics":["GST Registration, Billing & GSTR Filing","Income Tax Returns, TDS & TCS Compliance","Audit Preparation & Practical Case Studies"]}]',
 '["Senior Accounts Executive","Taxation & GST Practitioner","Audit Assistant","Finance & Billing Officer"]', 1, 1),

('course_steno_403', 'ESI-STN-403', 'stenography-eng-hindi', 'Stenography (Eng/Hindi)', 'Short-Term Skill', '1 Year', '10th Pass', 9500, 500, 'Regular',
 'Job-oriented English & Hindi Shorthand (Pitman / Rishi Pranali) and high-speed typing programme tailored for SSC Stenographer, High Court, and State Government clerical examinations.',
 '[{"moduleTitle":"Module 1: Shorthand Theory & Strokes","topics":["Consonants, Vowels, Diphthongs & Grammalogues","Phraseography & Contractions (English / Hindi)","Basic Speed Building (40-60 WPM)"]},{"moduleTitle":"Module 2: Dictation & Transcription","topics":["80-100 WPM Dictation Practice","Computer Transcription & Error-Free Formatting","Mock SSC / Court Skill Tests"]}]',
 '["SSC & Government Stenographer","Court Personal Assistant","Executive Secretary","Office Reporter"]', 1, 1),

('course_fash_502', 'ESI-FSD-502', 'fashion-designing', 'Fashion Designing', 'Vocational & Technical', '1 Year', '10th Pass', 16000, 500, 'Regular',
 'Creative vocational diploma covering fashion illustration, pattern making, garment construction, textile science, boutique management, and traditional & western apparel designing.',
 '[{"moduleTitle":"Semester I: Fashion Illustration & Textiles","topics":["Elements of Design, Color Theory & Sketching","Fabric Study, Weaving & Surface Ornamentation","Measurements & Basic Block Drafting"]},{"moduleTitle":"Semester II: Pattern Making & Garment Construction","topics":["Indian Ethnic & Western Wear Pattern Making","Cutting, Stitching & Finishing Techniques","Boutique Management & Portfolio Showcase"]}]',
 '["Fashion Designer","Boutique Owner & Entrepreneur","Apparel Pattern Maker","Garment Production Coordinator"]', 1, 1),

('course_hair_503', 'ESI-HSC-503', 'hair-and-skin-care', 'Hair & Skin Care', 'Vocational & Technical', '6 Months', '10th Pass', 11000, 500, 'Regular',
 'Hands-on cosmetology and beauty wellness programme covering skin anatomy, facial therapies, hair cutting & styling, bridal makeup, salon hygiene, and client consultation.',
 '[{"moduleTitle":"Module 1: Skin Care & Aesthetics","topics":["Skin Types, Facial Treatments & Cleanup Protocols","Threading, Waxing, Manicure & Pedicure","Herbal & Clinical Skin Care Practices"]},{"moduleTitle":"Module 2: Hair Styling & Makeup","topics":["Hair Cutting, Coloring, Spa & Chemical Treatments","Party & Bridal Makeup Techniques","Salon Management & Hygiene Standards"]}]',
 '["Certified Beautician & Cosmetologist","Hair Stylist & Makeup Artist","Salon Manager","Self-Employed Beauty Studio Owner"]', 1, 1),

('course_basic_105', 'ESI-BSC-105', 'basic-computer', 'Basic Computer', 'Computer & IT', '3 Months', '10th Pass', 3500, 300, 'Regular / Online',
 'Beginner-friendly foundational computer course covering computer operation, Windows basics, MS Word, MS Excel, MS PowerPoint, typing, and safe internet usage.',
 '[{"moduleTitle":"Module 1: Computer & Office Basics","topics":["Computer Hardware, Keyboard & Mouse Mastery","Windows File & Folder Management","MS Word Document Creation & Formatting"]},{"moduleTitle":"Module 2: Spreadsheets & Internet","topics":["MS Excel Basic Formulas & Tables","MS PowerPoint Slides","Email, Online Forms & Cyber Safety"]}]',
 '["Office Helper / Computer Operator","Data Entry Beginner","Retail Billing Operator","Digital Literacy Readiness"]', 1, 1),

('course_cca_106', 'ESI-CCA-106', 'cca-certificate-in-computer-applications', 'CCA - Certificate in Computer Applications', 'Computer & IT', '6 Months', '10th Pass', 5500, 500, 'Regular / Online',
 'Structured 6-month certificate course in practical computer applications, office automation, digital documentation, spreadsheets, presentations, and basic accounting.',
 '[{"moduleTitle":"Module 1: Office Productivity Suite","topics":["Operating Systems & Utilities","Advanced MS Word & Mail Merge","MS Excel Formulas, Charts & Data Tables"]},{"moduleTitle":"Module 2: Digital Skills & Practicals","topics":["MS PowerPoint & Internet Applications","Basic Tally / Billing Introduction","Practical Lab Examination"]}]',
 '["Computer Operator","Clerical & Back-Office Assistant","School / Office Data Operator","Billing Executive"]', 1, 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
