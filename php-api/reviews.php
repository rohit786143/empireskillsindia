<?php
require_once __DIR__ . '/config.php';

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$pdo = get_db();

try {
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `student_reviews` (
          `id` VARCHAR(64) NOT NULL,
          `student_name` VARCHAR(191) NOT NULL,
          `course_name` VARCHAR(191) NOT NULL DEFAULT "",
          `batch_label` VARCHAR(120) NOT NULL DEFAULT "",
          `rating` INT NOT NULL DEFAULT 5,
          `review_text` TEXT NOT NULL,
          `photo_url` LONGTEXT DEFAULT NULL,
          `is_active` TINYINT(1) NOT NULL DEFAULT 1,
          `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
} catch (PDOException $e) {}

$defaults = [
    [
        'rev_01',
        'Aarav Thakur',
        'Diploma in Computer Application (DCA)',
        'Mandi • Batch 2025',
        5,
        'The practical computer lab sessions and faculty guidance at Empire Skills India helped me build real office automation skills and land my first job.',
        '/reviews/student-01.jpg',
        1,
    ],
    [
        'rev_02',
        'Priya Sharma',
        'Diploma in Professional Accounting & Taxation',
        'Sundarnagar • Batch 2025',
        5,
        'Learning Tally PRIME with live GST filing and accounting case studies gave me complete confidence to work independently as an accounts executive.',
        '/reviews/student-02.jpg',
        1,
    ],
    [
        'rev_03',
        'Rohan Verma',
        "'O' Level (NIELIT)",
        'Mandi • Batch 2025',
        5,
        'Structured syllabus coverage, regular mock tests, and supportive teachers made preparing for NIELIT examinations smooth and stress-free.',
        '/reviews/student-03.jpg',
        1,
    ],
    [
        'rev_04',
        'Meenakshi Devi',
        'Diploma in Fashion Designing',
        'Mandi • Batch 2025',
        5,
        'Hands-on garment drafting, stitching labs, and annual showcase events gave me the skills and confidence to start my own boutique.',
        '/reviews/student-04.jpg',
        1,
    ],
    [
        'rev_05',
        'Karan Chauhan',
        'Basic + Tally PRIME',
        'Mandi • Batch 2026',
        5,
        'Transparent fee structure, friendly atmosphere, and step-by-step practical training make Empire Skills India the best skill institute in Himachal.',
        '/reviews/student-05.jpg',
        1,
    ],
    [
        'rev_06',
        'Simran Kaur',
        'Diploma in Hair & Skin Care',
        'Mandi • Batch 2025',
        5,
        'Every module focuses on real practical demonstrations and modern beauty techniques. I am truly grateful to the trainers for their constant support.',
        '/reviews/student-06.jpg',
        1,
    ],
];

$count = (int)$pdo->query('SELECT COUNT(*) FROM student_reviews')->fetchColumn();
if ($count === 0) {
    $ins = $pdo->prepare(
        'INSERT IGNORE INTO student_reviews
         (id, student_name, course_name, batch_label, rating, review_text, photo_url, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    foreach ($defaults as $d) {
        $ins->execute($d);
    }
} else {
    // Backfill default Indian student portraits for seeded reviews that have no photo yet
    $upd = $pdo->prepare(
        "UPDATE student_reviews SET photo_url = ? WHERE id = ? AND (photo_url IS NULL OR photo_url = '')"
    );
    foreach ($defaults as $d) {
        $upd->execute([$d[6], $d[0]]);
    }
}

function map_review(array $r): array {
    return [
        'id'          => $r['id'],
        'studentName' => $r['student_name'],
        'courseName'  => $r['course_name'],
        'batchLabel'  => $r['batch_label'],
        'rating'      => max(1, min(5, (int)$r['rating'])),
        'reviewText'  => $r['review_text'],
        'photoUrl'    => $r['photo_url'] ?: null,
        'isActive'    => (bool)$r['is_active'],
        'createdAt'   => $r['created_at'],
    ];
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $all = ($_GET['all'] ?? '') === 'true';
    if ($all) {
        require_admin();
        $rows = $pdo->query('SELECT * FROM student_reviews ORDER BY created_at DESC')->fetchAll();
    } else {
        $rows = $pdo->query('SELECT * FROM student_reviews WHERE is_active = 1 ORDER BY created_at DESC')->fetchAll();
    }
    json_response(['reviews' => array_map('map_review', $rows)]);
}

if ($method === 'POST') {
    require_admin();
    $body = get_json_body();
    $studentName = trim((string)($body['studentName'] ?? ''));
    $reviewText = trim((string)($body['reviewText'] ?? ''));
    if ($studentName === '' || $reviewText === '') {
        json_response(['error' => 'Student name and review text are required.'], 400);
    }

    $id = generate_cuid();
    $rating = max(1, min(5, (int)($body['rating'] ?? 5)));
    $stmt = $pdo->prepare(
        'INSERT INTO student_reviews
         (id, student_name, course_name, batch_label, rating, review_text, photo_url, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
    );
    $stmt->execute([
        $id,
        $studentName,
        trim((string)($body['courseName'] ?? '')),
        trim((string)($body['batchLabel'] ?? '')),
        $rating,
        $reviewText,
        !empty($body['photoUrl']) ? (string)$body['photoUrl'] : null,
    ]);

    $row = $pdo->prepare('SELECT * FROM student_reviews WHERE id = ?');
    $row->execute([$id]);
    json_response(['review' => map_review($row->fetch())], 201);
}

if ($method === 'PATCH' || $method === 'PUT') {
    require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Review id is required.'], 400);
    $body = get_json_body();

    $fields = [];
    $params = [];
    foreach ([
        'studentName' => 'student_name',
        'courseName'  => 'course_name',
        'batchLabel'  => 'batch_label',
        'reviewText'  => 'review_text',
        'photoUrl'    => 'photo_url',
    ] as $k => $col) {
        if (array_key_exists($k, $body)) {
            $fields[] = "`{$col}` = ?";
            $params[] = $k === 'photoUrl' ? ($body[$k] ?: null) : trim((string)$body[$k]);
        }
    }
    if (array_key_exists('rating', $body)) {
        $fields[] = '`rating` = ?';
        $params[] = max(1, min(5, (int)$body['rating']));
    }
    if (array_key_exists('isActive', $body)) {
        $fields[] = '`is_active` = ?';
        $params[] = $body['isActive'] ? 1 : 0;
    }

    if (!empty($fields)) {
        $params[] = $id;
        $pdo->prepare('UPDATE student_reviews SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    }

    $row = $pdo->prepare('SELECT * FROM student_reviews WHERE id = ?');
    $row->execute([$id]);
    $found = $row->fetch();
    if (!$found) json_response(['error' => 'Review not found.'], 404);
    json_response(['review' => map_review($found)]);
}

if ($method === 'DELETE') {
    require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Review id is required.'], 400);
    $pdo->prepare('DELETE FROM student_reviews WHERE id = ?')->execute([$id]);
    json_response(['success' => true]);
}

json_response(['error' => 'Method not allowed.'], 405);
