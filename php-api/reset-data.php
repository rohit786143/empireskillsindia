<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/franchise-schema.php';

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$pdo = get_db();
ensure_franchise_schema($pdo);
require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed.'], 405);
}

$body = get_json_body();
$confirm = strtoupper(trim((string)($body['confirmText'] ?? '')));
if ($confirm !== 'DELETE ALL') {
    json_response(['error' => 'Please type "DELETE ALL" to confirm deleting all students and payment records.'], 400);
}

$deleted = [
    'studentFeeSubmissions'     => 0,
    'franchiseRoyaltyRequests'  => 0,
    'studentsAndAdmissions'     => 0,
];

try {
    $stmt1 = $pdo->prepare('DELETE FROM student_fee_submissions');
    $stmt1->execute();
    $deleted['studentFeeSubmissions'] = $stmt1->rowCount();
} catch (PDOException $e) {}

try {
    $stmt2 = $pdo->prepare('DELETE FROM franchise_royalty_submissions');
    $stmt2->execute();
    $deleted['franchiseRoyaltyRequests'] = $stmt2->rowCount();
} catch (PDOException $e) {}

try {
    $stmt3 = $pdo->prepare('DELETE FROM admission_applications');
    $stmt3->execute();
    $deleted['studentsAndAdmissions'] = $stmt3->rowCount();
} catch (PDOException $e) {}

json_response([
    'success' => true,
    'deleted' => $deleted,
    'message' => 'All enrolled students, admission applications, and franchise/admin payment entries have been permanently deleted.',
]);
