<?php
// Shared official 19 courses dataset (13 Empire Skills + 6 NIELIT) with exact fee structure

function get_official_19_courses(): array {
    return [
        ['esi_dca_1y', 'ESI-DCA-101', 'diploma-in-computer-application-dca', 'Diploma in Computer Application (DCA)', 'Computer & IT', '1 Year', '10th Pass', 21500, 500, 'Regular / Hybrid',
         'Comprehensive 1-Year Diploma in Computer Application covering computer fundamentals, MS Office suite, internet, accounting basics, DTP, and practical lab training.',
         '[{"moduleTitle":"Semester I: Computer Fundamentals & Office Suite","topics":["Computer Fundamentals & Operating Systems","MS Word, MS Excel, MS PowerPoint","Internet, Email & E-Governance"]},{"moduleTitle":"Semester II: Applications, Accounting & Practical","topics":["Database & Office Automation","Basic Tally / Accounting & DTP","Capstone Practical Project & Examination"]}]',
         '["Computer Operator","Office Executive","Data Entry Operator","Back-Office Assistant"]',
         '{"registrationFee":500,"admissionFee":3000,"monthlyFee":1500,"courseFee":21500,"examFee":1500}'],

        ['esi_dpat_1y', 'ESI-PAT-102', 'diploma-in-professional-accounting-and-taxation', 'Diploma in Professional Accounting and Taxation', 'Accounting & Finance', '1 Year', '12th Pass', 32400, 500, 'Regular / Hybrid',
         'Career-focused 1-Year Diploma in Professional Accounting and Taxation covering financial accounting, Tally Prime, GST compliance, Income Tax, TDS/TCS, and payroll management.',
         '[{"moduleTitle":"Semester I: Financial Accounting & Tally Prime","topics":["Accounting Fundamentals, Ledgers & Final Accounts","Tally Prime Inventory, Banking & Payroll","Corporate Billing & Vouchers"]},{"moduleTitle":"Semester II: Direct & Indirect Taxation","topics":["GST Registration, GSTR-1/2A/3B & E-Invoicing","Income Tax, TDS & TCS Filing","Practical Audit & Taxation Case Studies"]}]',
         '["Accounts Executive","Taxation & GST Specialist","Tally Accountant","Audit & Finance Assistant"]',
         '{"registrationFee":500,"admissionFee":5500,"monthlyFee":2200,"courseFee":32400,"examFee":2500}'],

        ['esi_steno_1y', 'ESI-STN-103', 'diploma-in-stenography', 'Diploma in Stenography', 'Stenography', '1 Year', '10th Pass', 22000, 500, 'Regular',
         '1-Year Diploma in Stenography (English/Hindi Shorthand) designed for SSC Stenographer, High Court, and Government clerical & secretarial examinations.',
         '[{"moduleTitle":"Semester I: Shorthand Foundations","topics":["Consonants, Vowels, Grammalogues & Phrases","Speed Building Drills (40-60 WPM)","Typing Accuracy & Formatting"]},{"moduleTitle":"Semester II: High-Speed Dictation & Transcription","topics":["80-100 WPM Shorthand Dictation","Computer Transcription & Proofreading","Mock SSC & Court Skill Tests"]}]',
         '["Government Stenographer","Court Personal Assistant","Executive Secretary","Office Reporter"]',
         '{"registrationFee":500,"admissionFee":3500,"monthlyFee":1500,"courseFee":22000,"examFee":1500}'],

        ['esi_tally_3m', 'ESI-TLY-104', 'tally-prime', 'Tally PRIME', 'Accounting & Finance', '3 Months', '10th Pass', 9000, 500, 'Regular / Online',
         'Focused 3-Month practical Tally PRIME training covering company creation, vouchers, inventory, GST billing, banking reconciliation, and financial reporting.',
         '[{"moduleTitle":"Module 1: Core Accounting & Inventory","topics":["Company Creation, Ledgers & Accounting Vouchers","Inventory, Godown & Batch Management"]},{"moduleTitle":"Module 2: GST & Reporting","topics":["GST Billing, E-Way Bill & Return Reports","Balance Sheet & Profit & Loss Analysis"]}]',
         '["Tally Operator","Billing Executive","Junior Accounts Assistant"]',
         '{"registrationFee":500,"admissionFee":2500,"monthlyFee":2000,"courseFee":9000,"examFee":0}'],

        ['esi_btally_6m', 'ESI-BTP-105', 'basic-plus-tally-prime', 'Basic + Tally PRIME', 'Accounting & Finance', '6 Months', '10th Pass', 15500, 500, 'Regular / Hybrid',
         '6-Month combined programme starting from Computer Basics & MS Office and progressing into complete computerized accounting with Tally PRIME & GST.',
         '[{"moduleTitle":"Module 1: Basic Computer & MS Office","topics":["Windows OS, File Management & Internet","MS Word, MS Excel & MS PowerPoint"]},{"moduleTitle":"Module 2: Tally PRIME with GST","topics":["Accounting Vouchers, Inventory & Banking","GST Compliance, Payroll & Final Accounts"]}]',
         '["Computer & Accounts Operator","Office Billing Executive","Accounts Assistant"]',
         '{"registrationFee":500,"admissionFee":3000,"monthlyFee":2000,"courseFee":15500,"examFee":1500}'],

        ['esi_ccc_3m', 'ESI-CCC-106', 'certificate-in-computer-concepts-ccc', 'Certificate in Computer Concepts (CCC)', 'Computer & IT', '3 Months', '10th Pass', 6000, 500, 'Regular / Online',
         '3-Month Certificate in Computer Concepts building essential digital literacy, office productivity, internet, and digital financial services proficiency.',
         '[{"moduleTitle":"Module 1: Fundamentals & Office Tools","topics":["Computer Basics & Operating System","Word Processing, Spreadsheets & Presentations"]},{"moduleTitle":"Module 2: Internet & Digital Services","topics":["Email, Social Media & E-Governance","Digital Payments & Cyber Security Basics"]}]',
         '["Office Assistant","Data Entry Operator","Digital Literacy Readiness"]',
         '{"registrationFee":500,"admissionFee":1000,"monthlyFee":1500,"courseFee":6000,"examFee":0}'],

        ['esi_cca_6m', 'ESI-CCA-107', 'certificate-in-computer-application-cca', 'Certificate in Computer Application (CCA)', 'Computer & IT', '6 Months', '10th Pass', 11000, 500, 'Regular / Online',
         '6-Month Certificate in Computer Application providing practical skills in office automation, documentation, spreadsheet analysis, presentations, and internet operations.',
         '[{"moduleTitle":"Module 1: Office Productivity","topics":["Operating Systems & Computer Utilities","Advanced MS Word & MS Excel Formulas"]},{"moduleTitle":"Module 2: Presentations & Practical Lab","topics":["MS PowerPoint, Internet & Cloud Tools","Practical Lab Assessment & Exam"]}]',
         '["Computer Operator","Clerical Assistant","Back-Office Executive"]',
         '{"registrationFee":500,"admissionFee":1500,"monthlyFee":1500,"courseFee":11000,"examFee":1000}'],

        ['esi_dhsc_1y', 'ESI-HSC-108', 'diploma-in-hair-and-skin-care', 'Diploma in Hair & Skin Care', 'Hair & Skin Care', '1 Year', '10th Pass', 21000, 500, 'Regular',
         '1-Year professional Diploma in Hair & Skin Care covering advanced aesthetics, skin therapies, hair cutting, chemical treatments, bridal makeup, and salon management.',
         '[{"moduleTitle":"Semester I: Skin Anatomy & Aesthetics","topics":["Skin Analysis, Facials & Clinical Treatments","Threading, Waxing, Manicure & Pedicure"]},{"moduleTitle":"Semester II: Hair Styling, Makeup & Salon Ops","topics":["Hair Cutting, Coloring, Keratin & Spa","Bridal & Party Makeup, Salon Management"]}]',
         '["Senior Beautician & Cosmetologist","Bridal Makeup Artist","Hair Stylist","Salon Owner"]',
         '{"registrationFee":500,"admissionFee":2500,"monthlyFee":1500,"courseFee":21000,"examFee":1000}'],

        ['esi_chsc_6m', 'ESI-HSC-109', 'certificate-in-hair-and-skin-care', 'Certificate in Hair & Skin Care', 'Hair & Skin Care', '6 Months', '10th Pass', 11000, 500, 'Regular',
         '6-Month practical Certificate in Hair & Skin Care training learners in essential beauty care, facials, hair styling, grooming, and salon hygiene.',
         '[{"moduleTitle":"Module 1: Skin & Beauty Basics","topics":["Basic Skin Care, Cleanup & Facials","Threading, Waxing & Grooming"]},{"moduleTitle":"Module 2: Hair Care & Styling","topics":["Hair Wash, Basic Cuts, Blow Dry & Styling","Client Hygiene & Practical Assessment"]}]',
         '["Beautician","Salon Assistant","Hair & Skin Care Technician"]',
         '{"registrationFee":500,"admissionFee":1500,"monthlyFee":1500,"courseFee":11000,"examFee":500}'],

        ['esi_dfd_1y', 'ESI-FSD-110', 'diploma-in-fashion-designing', 'Diploma in Fashion Designing', 'Fashion Designing', '1 Year', '10th Pass', 21500, 500, 'Regular',
         '1-Year Diploma in Fashion Designing covering fashion illustration, textile study, pattern making, garment construction, ethnic & western wear, and boutique skills.',
         '[{"moduleTitle":"Semester I: Fashion Illustration & Textiles","topics":["Sketching, Color Theory & Elements of Design","Fabric Science & Surface Ornamentation"]},{"moduleTitle":"Semester II: Pattern Making & Garment Construction","topics":["Drafting, Cutting & Stitching Techniques","Indian Ethnic & Western Apparel Portfolio"]}]',
         '["Fashion Designer","Boutique Entrepreneur","Apparel Pattern Maker"]',
         '{"registrationFee":500,"admissionFee":3000,"monthlyFee":1500,"courseFee":21500,"examFee":1000}'],

        ['esi_adfd_1y', 'ESI-FSD-111', 'advance-diploma-in-fashion-designing', 'Advance Diploma in Fashion Designing', 'Fashion Designing', '1 Year', '10th Pass', 29000, 500, 'Regular',
         '1-Year Advance Diploma in Fashion Designing with intensive couture draping, designer wear construction, embroidery, merchandising, and fashion portfolio creation.',
         '[{"moduleTitle":"Semester I: Advanced Illustration & Draping","topics":["Fashion Illustration, CAD Basics & Styling","Draping & Couture Pattern Engineering"]},{"moduleTitle":"Semester II: Designer Collection & Merchandising","topics":["Bridal & Designer Wear Construction","Fashion Merchandising & Boutique Management"]}]',
         '["Senior Fashion Designer","Boutique Founder","Fashion Stylist & Merchandiser"]',
         '{"registrationFee":500,"admissionFee":4500,"monthlyFee":2000,"courseFee":29000,"examFee":1000}'],

        ['esi_cfd_6m', 'ESI-FSD-112', 'certificate-in-fashion-designing', 'Certificate in Fashion Designing', 'Fashion Designing', '6 Months', '10th Pass', 12000, 500, 'Regular',
         '6-Month Certificate in Fashion Designing focusing on foundational garment drafting, cutting, stitching, and creative tailoring techniques.',
         '[{"moduleTitle":"Module 1: Drafting & Basic Sewing","topics":["Body Measurements & Basic Pattern Drafting","Sewing Machine Operation & Seam Finishes"]},{"moduleTitle":"Module 2: Garment Stitching","topics":["Kurtis, Suits, Blouses & Basic Western Wear","Finishing & Practical Project"]}]',
         '["Tailoring & Boutique Specialist","Assistant Fashion Designer","Self-Employed Designer"]',
         '{"registrationFee":500,"admissionFee":2500,"monthlyFee":1500,"courseFee":12000,"examFee":1000}'],

        ['esi_bc_1m', 'ESI-BSC-113', 'basic-computer', 'Basic Computer', 'Computer & IT', '1 Month', '10th Pass', 2000, 0, 'Regular / Online',
         'Fast-track 1-Month Basic Computer course for beginners covering computer operation, typing, MS Word, MS Excel basics, and internet usage.',
         '[{"moduleTitle":"Module 1: Computer Essentials","topics":["Operating Computer, Windows & File Handling","MS Word, Basic Excel & Internet Browsing"]}]',
         '["Basic Computer Literacy","Office Beginner"]',
         '{"registrationFee":0,"admissionFee":0,"monthlyFee":0,"courseFee":2000,"examFee":0}'],

        ['nielit_olevel', 'NIELIT-OLV-201', 'o-level-nielit', "'O' Level (NIELIT)", 'NIELIT Courses', '1 Year', '12th Pass', 23500, 500, 'Regular',
         "Government-recognized NIELIT 'O' Level (1 Year / 2 Semesters) IT foundation diploma widely accepted for Government & PSU computer jobs.",
         '[{"moduleTitle":"1st Semester (M1-R5 & M2-R5)","topics":["IT Tools and Network Basics (M1-R5)","Web Designing & Publishing (M2-R5)"]},{"moduleTitle":"2nd Semester (M3-R5, M4-R5 & Project)","topics":["Programming and Problem Solving through Python (M3-R5)","Internet of Things (IoT) & Applications (M4-R5)","Practical Exams & Project Submission"]}]',
         '["Government Junior Programmer / IT Assistant","Web Designer","Python Junior Developer","Office Automation Specialist"]',
         '{"registrationFee":500,"admissionFee":5000,"sem1Fee":9000,"sem2Fee":9000,"courseFee":23500,"examFee":4200,"examFeeNote":"₹4,200 (₹2,100 + ₹2,100)"}'],

        ['nielit_acc', 'NIELIT-ACC-202', 'acc-awareness-in-computer-concepts', 'ACC - Awareness in Computer Concepts', 'NIELIT Courses', '20 Hours', '10th Pass', 1500, 0, 'Regular',
         'NIELIT 20-Hour Awareness in Computer Concepts programme introducing basic computer skills, internet, and digital services.',
         '[{"moduleTitle":"NIELIT ACC Curriculum (20 Hours)","topics":["Knowing Computer & Operating System","Using Word Processing, Internet & Digital Payments"]}]',
         '["Digital Literacy Certification (NIELIT)"]',
         '{"registrationFee":0,"admissionFee":0,"courseFee":1500,"examFee":0}'],

        ['nielit_bcc', 'NIELIT-BCC-203', 'bcc-basic-computer-course', 'BCC - Basic Computer Course', 'NIELIT Courses', '36 Hours', '10th Pass', 3000, 0, 'Regular',
         'NIELIT 36-Hour Basic Computer Course designed to impart fundamental computer literacy and practical office skills.',
         '[{"moduleTitle":"NIELIT BCC Curriculum (36 Hours)","topics":["Computer Fundamentals & GUI Operating System","Word Processing, Spreadsheets & Internet Communication"]}]',
         '["NIELIT Basic Computer Certified","Clerical Computer Literacy"]',
         '{"registrationFee":0,"admissionFee":0,"courseFee":3000,"examFee":0}'],

        ['nielit_ccc', 'NIELIT-CCC-204', 'ccc-course-on-computer-concepts-nielit', 'CCC - Course on Computer Concepts', 'NIELIT Courses', '80 Hours', '10th Pass', 5500, 0, 'Regular',
         'NIELIT 80-Hour Course on Computer Concepts (CCC) — mandatory computer proficiency certification for numerous State & Central Government recruitments.',
         '[{"moduleTitle":"NIELIT CCC Curriculum (80 Hours)","topics":["Introduction to Computer, OS & LibreOffice/MS Office","Internet, WWW, Email, Social Networking & e-Governance","Digital Financial Tools & Cyber Security"]}]',
         '["Government Clerical & Patwari / Lekhpal Eligibility","Office Computer Operator"]',
         '{"registrationFee":0,"admissionFee":0,"courseFee":5500,"examFee":0}'],

        ['nielit_cccp', 'NIELIT-CCCP-205', 'ccc-plus-course-on-computer-concepts-plus', 'CCC Plus - Course on Computer Concepts Plus', 'NIELIT Courses', '126 Hours', '10th Pass', 7000, 0, 'Regular',
         'NIELIT 126-Hour CCC Plus programme offering upgraded practical proficiency in office productivity, IT applications, and digital workplace skills.',
         '[{"moduleTitle":"NIELIT CCC Plus Curriculum (126 Hours)","topics":["Advanced Word Processing, Spreadsheets & Presentations","Database Management, Internet Security & e-Governance"]}]',
         '["Advanced Government IT Literacy","Office Coordinator"]',
         '{"registrationFee":0,"admissionFee":0,"courseFee":7000,"examFee":0}'],

        ['nielit_ecc', 'NIELIT-ECC-206', 'ecc-expert-computer-course', 'ECC - Expert Computer Course', 'NIELIT Courses', '200 Hours', '12th Pass', 12500, 0, 'Regular',
         'NIELIT 200-Hour Expert Computer Course (ECC) providing in-depth office automation, database, web tools, networking, and IT troubleshooting skills.',
         '[{"moduleTitle":"NIELIT ECC Curriculum (200 Hours)","topics":["Advanced Office Automation, Database & Reporting","Networking, Web Publishing, Cyber Safety & Soft Skills"]}]',
         '["IT Support Executive","Senior Computer Operator","MIS Coordinator"]',
         '{"registrationFee":0,"admissionFee":0,"courseFee":12500,"examFee":0}'],
    ];
}

function ensure_official_courses_if_empty(PDO $pdo): void {
    try {
        $count = (int)$pdo->query('SELECT COUNT(*) FROM courses')->fetchColumn();
        if ($count > 0) return;

        try {
            $pdo->exec('ALTER TABLE courses ADD COLUMN fee_breakdown_json LONGTEXT DEFAULT NULL');
        } catch (PDOException $e) {}

        $stmt = $pdo->prepare(
            'INSERT INTO courses (id, code, slug, title, category, duration, eligibility, fee, registration_fee, study_mode, overview, syllabus_json, career_opportunities_json, fee_breakdown_json, featured, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)'
        );
        foreach (get_official_19_courses() as $c) {
            $stmt->execute($c);
        }
    } catch (Throwable $e) {
        // Ignore if table not ready
    }
}
