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
$franchiseId = trim((string)($_GET['franchiseId'] ?? ''));
$hasCenterFilter = ($franchiseId !== '' && $franchiseId !== 'ALL');

if ($hasCenterFilter) {
    $stmtTotal = $pdo->prepare('SELECT COUNT(*) FROM admission_applications WHERE franchise_id = ? AND franchise_status IN ("FORWARDED_TO_MAIN", "MAIN_APPROVED", "MAIN_REJECTED")');
    $stmtTotal->execute([$franchiseId]);
    $totalApplications = (int)$stmtTotal->fetchColumn();

    $stmtPend = $pdo->prepare('SELECT COUNT(*) FROM admission_applications WHERE franchise_id = ? AND status = "PENDING" AND franchise_status = "FORWARDED_TO_MAIN"');
    $stmtPend->execute([$franchiseId]);
    $pendingApprovals = (int)$stmtPend->fetchColumn();

    $stmtAct = $pdo->prepare('SELECT COUNT(*) FROM admission_applications WHERE franchise_id = ? AND status = "APPROVED" AND franchise_status = "MAIN_APPROVED"');
    $stmtAct->execute([$franchiseId]);
    $activeStudents = (int)$stmtAct->fetchColumn();

    $stmtCert = $pdo->prepare(
        'SELECT COUNT(*) FROM certificates c
         INNER JOIN admission_applications a ON (c.application_id = a.id OR c.enrollment_number = a.enrollment_number)
         WHERE c.status = "VALID" AND a.franchise_id = ?'
    );
    $stmtCert->execute([$franchiseId]);
    $certificatesIssued = (int)$stmtCert->fetchColumn();

    $stmtRecApps = $pdo->prepare('SELECT * FROM admission_applications WHERE franchise_id = ? AND franchise_status IN ("FORWARDED_TO_MAIN", "MAIN_APPROVED", "MAIN_REJECTED") ORDER BY created_at DESC LIMIT 6');
    $stmtRecApps->execute([$franchiseId]);
    $recentApps = array_map(function ($r) {
        $m = map_application($r);
        $m['franchiseName'] = $r['franchise_name'] ?? null;
        $m['franchiseCode'] = $r['franchise_code'] ?? null;
        return $m;
    }, $stmtRecApps->fetchAll());

    $stmtRecCerts = $pdo->prepare(
        'SELECT c.* FROM certificates c
         INNER JOIN admission_applications a ON (c.application_id = a.id OR c.enrollment_number = a.enrollment_number)
         WHERE a.franchise_id = ?
         ORDER BY c.created_at DESC LIMIT 6'
    );
    $stmtRecCerts->execute([$franchiseId]);
    $recentCerts = array_map('map_certificate', $stmtRecCerts->fetchAll());
} else {
    $visibleCond = '(franchise_id IS NULL OR franchise_status IN ("FORWARDED_TO_MAIN", "MAIN_APPROVED", "MAIN_REJECTED"))';
    $totalApplications = (int)$pdo->query("SELECT COUNT(*) FROM admission_applications WHERE {$visibleCond}")->fetchColumn();
    $pendingApprovals = (int)$pdo->query('SELECT COUNT(*) FROM admission_applications WHERE status = "PENDING" AND (franchise_id IS NULL OR franchise_status = "FORWARDED_TO_MAIN")')->fetchColumn();
    $activeStudents = (int)$pdo->query('SELECT COUNT(*) FROM admission_applications WHERE status = "APPROVED" AND (franchise_id IS NULL OR franchise_status = "MAIN_APPROVED")')->fetchColumn();
    $certificatesIssued = (int)$pdo->query('SELECT COUNT(*) FROM certificates WHERE status = "VALID"')->fetchColumn();
    $recentApps = array_map(
        function ($r) {
            $m = map_application($r);
            $m['franchiseName'] = $r['franchise_name'] ?? null;
            $m['franchiseCode'] = $r['franchise_code'] ?? null;
            return $m;
        },
        $pdo->query("SELECT * FROM admission_applications WHERE {$visibleCond} ORDER BY created_at DESC LIMIT 6")->fetchAll()
    );
    $recentCerts = array_map(
        'map_certificate',
        $pdo->query('SELECT * FROM certificates ORDER BY created_at DESC LIMIT 6')->fetchAll()
    );
}

$totalCourses = (int)$pdo->query('SELECT COUNT(*) FROM courses WHERE is_active = 1')->fetchColumn();
$totalNotices = (int)$pdo->query('SELECT COUNT(*) FROM notices WHERE is_active = 1')->fetchColumn();

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
