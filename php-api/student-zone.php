<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Method not allowed.'], 405);
}

$enrollmentNumber = strtoupper(trim((string)($_GET['enrollmentNumber'] ?? '')));
$dob = trim((string)($_GET['dob'] ?? ''));

if ($enrollmentNumber === '' || $dob === '') {
    json_response(['error' => 'Enrollment Number and Date of Birth are required.'], 400);
}

$pdo = get_db();
$stmt = $pdo->prepare(
    'SELECT a.*, c.duration AS joined_course_duration
     FROM admission_applications a
     LEFT JOIN courses c ON c.id = a.course_id
     WHERE UPPER(a.enrollment_number) = ? AND a.dob = ? AND a.status = "APPROVED"
     LIMIT 1'
);
$stmt->execute([$enrollmentNumber, $dob]);
$row = $stmt->fetch();

if (!$row) {
    json_response([
        'error' => 'No approved student record found for the given Enrollment Number and Date of Birth.',
    ], 404);
}

$cStmt = $pdo->prepare(
    'SELECT certificate_number AS certificateNumber, issue_date AS issueDate
     FROM certificates
     WHERE (application_id = ? OR UPPER(enrollment_number) = ?) AND status = "VALID"
     ORDER BY created_at DESC'
);
$cStmt->execute([$row['id'], $enrollmentNumber]);
$certs = $cStmt->fetchAll();

$student = map_application($row);
$student['course'] = ['duration' => $row['joined_course_duration'] ?: '1 Year'];
$student['certificates'] = $certs;

json_response(['student' => $student]);
