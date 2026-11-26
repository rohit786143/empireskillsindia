<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/official-courses-data.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Method not allowed.'], 405);
}

$pdo = get_db();
ensure_official_courses_if_empty($pdo);

$notices = array_map(
    'map_notice',
    $pdo->query('SELECT * FROM notices WHERE is_active = 1 ORDER BY published_date DESC, created_at DESC')->fetchAll()
);
$courses = array_map(
    'map_course',
    $pdo->query('SELECT * FROM courses WHERE is_active = 1 ORDER BY featured DESC, created_at ASC')->fetchAll()
);
$studentCount = (int)$pdo->query('SELECT COUNT(*) FROM admission_applications WHERE status = "APPROVED"')->fetchColumn();
$certCount = (int)$pdo->query('SELECT COUNT(*) FROM certificates WHERE status = "VALID"')->fetchColumn();

json_response([
    'notices'      => $notices,
    'courses'      => $courses,
    'studentCount' => $studentCount,
    'certCount'    => $certCount,
]);
