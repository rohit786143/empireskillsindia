<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Method not allowed.'], 405);
}

$identifier = trim((string)($_GET['cert'] ?? $_GET['identifier'] ?? ''));
$dob = trim((string)($_GET['dob'] ?? ''));
$name = strtolower(trim((string)($_GET['name'] ?? '')));
$qrMode = ($_GET['qr'] ?? '') === '1';

if ($identifier === '') {
    json_response(['error' => 'Please enter a Certificate Number or Enrollment Number.'], 400);
}

$pdo = get_db();
$upperId = strtoupper($identifier);
$stmt = $pdo->prepare(
    'SELECT * FROM certificates
     WHERE UPPER(certificate_number) = ? OR UPPER(enrollment_number) = ?
     ORDER BY created_at DESC LIMIT 1'
);
$stmt->execute([$upperId, $upperId]);
$cert = $stmt->fetch();

if (!$cert) {
    json_response([
        'verified' => false,
        'error' => 'Record Not Found. No certificate matches the provided Certificate or Enrollment Number.',
    ], 404);
}

if ($cert['status'] === 'REVOKED') {
    json_response([
        'verified' => false,
        'revoked' => true,
        'error' => 'This certificate has been revoked by the Institute Administration.',
    ], 404);
}

if (!$qrMode) {
    if ($dob !== '' && !empty($cert['dob']) && $cert['dob'] !== $dob) {
        json_response([
            'verified' => false,
            'error' => 'Record Not Found. Date of Birth does not match our official institutional records.',
        ], 404);
    }
    if ($name !== '' && strpos(strtolower($cert['student_name']), $name) === false) {
        json_response([
            'verified' => false,
            'error' => 'Record Not Found. Student Name does not match our official institutional records.',
        ], 404);
    }
}

json_response([
    'verified' => true,
    'certificate' => map_certificate($cert),
]);
