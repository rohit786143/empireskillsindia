<?php
require_once __DIR__ . '/config.php';

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$pdo = get_db();

try {
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `institute_certifications` (
          `id` VARCHAR(64) NOT NULL,
          `badge` VARCHAR(120) NOT NULL DEFAULT "OFFICIAL",
          `title` VARCHAR(255) NOT NULL,
          `authority` VARCHAR(255) NOT NULL DEFAULT "",
          `cert_number` VARCHAR(120) NOT NULL DEFAULT "",
          `validity` VARCHAR(120) NOT NULL DEFAULT "",
          `description` TEXT DEFAULT NULL,
          `image_url` LONGTEXT NOT NULL,
          `pdf_url` LONGTEXT DEFAULT NULL,
          `sort_order` INT NOT NULL DEFAULT 0,
          `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
} catch (PDOException $e) {}

$defaults = [
    [
        'iso-9001-2015',
        'ISO 9001:2015 • IAF / EGAC',
        'ISO 9001:2015 Quality Management System',
        'Royal Assessments Pvt. Ltd. (IAF & EGAC Accredited)',
        'E20250319652',
        '04 Mar 2025 — 03 Mar 2028',
        'Certified for Design, Development & Implementation of Skill Development and Vocational Training Programs, Quality Assurance, and Learner Support Services.',
        '/certifications/iso-9001-2015.jpg',
        '/certifications/iso-9001-2015.pdf',
        1,
    ],
    [
        'dpiit-startup-india',
        'Govt. of India • DPIIT',
        'Startup India Certificate of Recognition',
        'Ministry of Commerce & Industry, Dept. for Promotion of Industry & Internal Trade',
        'DIPP232988',
        '08 Dec 2025 — 18 Oct 2032',
        "Officially recognized by DPIIT, Government of India, under the 'Education' Industry and 'Skill Development' Sector.",
        '/certifications/dpiit-startup-india.jpg',
        '/certifications/dpiit-startup-india.pdf',
        2,
    ],
    [
        'thsc-skill-india',
        'Skill India • NCVET • THSC',
        'THSC Training Partner Affiliation',
        'Tourism & Hospitality Skill Council (Skill India / NCVET)',
        'THSC/DA/2024-2025/662',
        '28 Feb 2025 — 28 Feb 2027',
        'Affiliated Training Partner approved to conduct THSC & NCVET-aligned vocational and skill development courses in Mandi, Himachal Pradesh.',
        '/certifications/thsc-skill-india-affiliation.jpg',
        '/certifications/thsc-skill-india-affiliation.pdf',
        3,
    ],
    [
        'mca-incorporation',
        'Govt. of India • MCA',
        'Ministry of Corporate Affairs Incorporation',
        'Ministry of Corporate Affairs, Central Registration Centre',
        'CIN: U85499HP2023NPL010054',
        'Incorporated: 01 May 2023',
        'Officially incorporated Section 8 Educational Foundation (Empire Education Foundation) under the Companies Act, 2013, Government of India.',
        '/certifications/mca-incorporation.jpg',
        '/certifications/mca-incorporation.pdf',
        4,
    ],
    [
        'gst-registration',
        'Govt. of India • GST',
        'GST Registration Certificate (Form REG-06)',
        'Goods & Services Tax Network, Government of India',
        'GSTIN: 02AAHCE2923L1ZS',
        'Effective From: 05 Jan 2026',
        'Regular Goods & Services Tax Registration for Empire Skills India Private Limited, Mandi, Himachal Pradesh.',
        '/certifications/gst-registration.jpg',
        '/certifications/gst-registration.pdf',
        5,
    ],
];

$count = (int)$pdo->query('SELECT COUNT(*) FROM institute_certifications')->fetchColumn();
if ($count === 0) {
    $ins = $pdo->prepare(
        'INSERT IGNORE INTO institute_certifications
         (id, badge, title, authority, cert_number, validity, description, image_url, pdf_url, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    foreach ($defaults as $d) {
        $ins->execute($d);
    }
}

function map_inst_cert(array $r): array {
    return [
        'id'          => $r['id'],
        'badge'       => $r['badge'],
        'title'       => $r['title'],
        'authority'   => $r['authority'],
        'certNumber'  => $r['cert_number'],
        'validity'    => $r['validity'],
        'description' => $r['description'] ?? '',
        'imageUrl'    => $r['image_url'],
        'pdfUrl'      => $r['pdf_url'] ?: $r['image_url'],
        'sortOrder'   => (int)$r['sort_order'],
        'createdAt'   => $r['created_at'],
    ];
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = $pdo->query('SELECT * FROM institute_certifications ORDER BY sort_order ASC, created_at DESC')->fetchAll();
    json_response(['certifications' => array_map('map_inst_cert', $rows)]);
}

if ($method === 'POST') {
    require_admin();
    $body = get_json_body();
    $title = trim((string)($body['title'] ?? ''));
    $imageUrl = trim((string)($body['imageUrl'] ?? ''));

    if ($title === '' || $imageUrl === '') {
        json_response(['error' => 'Certificate title and image are required.'], 400);
    }

    $id = generate_cuid();
    $maxSort = (int)$pdo->query('SELECT COALESCE(MAX(sort_order), 0) FROM institute_certifications')->fetchColumn();

    $stmt = $pdo->prepare(
        'INSERT INTO institute_certifications
         (id, badge, title, authority, cert_number, validity, description, image_url, pdf_url, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $id,
        trim((string)($body['badge'] ?? 'Govt. / Official Recognition')),
        $title,
        trim((string)($body['authority'] ?? 'Recognized Issuing Authority')),
        trim((string)($body['certNumber'] ?? 'Verified')),
        trim((string)($body['validity'] ?? 'Active')),
        trim((string)($body['description'] ?? '')),
        $imageUrl,
        !empty($body['pdfUrl']) ? (string)$body['pdfUrl'] : $imageUrl,
        $maxSort + 1,
    ]);

    $row = $pdo->prepare('SELECT * FROM institute_certifications WHERE id = ?');
    $row->execute([$id]);
    json_response(['certification' => map_inst_cert($row->fetch())], 201);
}

if ($method === 'DELETE') {
    require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Certificate id is required.'], 400);
    $pdo->prepare('DELETE FROM institute_certifications WHERE id = ?')->execute([$id]);
    json_response(['success' => true]);
}

json_response(['error' => 'Method not allowed.'], 405);
