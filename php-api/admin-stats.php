<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/franchise-schema.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Method not allowed.'], 405);
}

require_admin();
$pdo = get_db();
ensure_franchise_schema($pdo);

// Main Admin only sees applications that have been forwarded by Franchise Centers (or legacy direct records)
$visibleCond = '(franchise_id IS NULL OR franchise_status IN ("FORWARDED_TO_MAIN", "MAIN_APPROVED", "MAIN_REJECTED"))';

$totalApplications = (int)$pdo->query("SELECT COUNT(*) FROM admission_applications WHERE {$visibleCond}")->fetchColumn();
$pendingApprovals = (int)$pdo->query('SELECT COUNT(*) FROM admission_applications WHERE status = "PENDING" AND (franchise_id IS NULL OR franchise_status = "FORWARDED_TO_MAIN")')->fetchColumn();
$activeStudents = (int)$pdo->query('SELECT COUNT(*) FROM admission_applications WHERE status = "APPROVED" AND (franchise_id IS NULL OR franchise_status = "MAIN_APPROVED")')->fetchColumn();
$certificatesIssued = (int)$pdo->query('SELECT COUNT(*) FROM certificates WHERE status = "VALID"')->fetchColumn();
$totalCourses = (int)$pdo->query('SELECT COUNT(*) FROM courses WHERE is_active = 1')->fetchColumn();
$totalNotices = (int)$pdo->query('SELECT COUNT(*) FROM notices WHERE is_active = 1')->fetchColumn();

$recentApps = array_map(
    'map_application',
    $pdo->query("SELECT * FROM admission_applications WHERE {$visibleCond} ORDER BY created_at DESC LIMIT 6")->fetchAll()
);
$recentCerts = array_map(
    'map_certificate',
    $pdo->query('SELECT * FROM certificates ORDER BY created_at DESC LIMIT 6')->fetchAll()
);

json_response([
    'stats' => [
        'totalApplications'  => $totalApplications,
        'pendingApprovals'   => $pendingApprovals,
        'activeStudents'     => $activeStudents,
        'certificatesIssued' => $certificatesIssued,
        'totalCourses'       => $totalCourses,
        'totalNotices'       => $totalNotices,
    ],
    'recentApplications' => $recentApps,
    'recentCertificates' => $recentCerts,
]);
