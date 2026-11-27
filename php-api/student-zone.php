<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/franchise-schema.php';
require_once __DIR__ . '/enrichers.php';

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$pdo = get_db();
ensure_franchise_schema($pdo);
$method = $_SERVER['REQUEST_METHOD'];

// POST: Submit Online Monthly Fee Receipt (ONLY for Main Center ESI-CTR-001 enrolled students)
if ($method === 'POST') {
    $body = get_json_body();
    $enrollmentNumber = strtoupper(trim((string)($body['enrollmentNumber'] ?? '')));
    $dob = trim((string)($body['dob'] ?? ''));
    $feeHead = trim((string)($body['feeHead'] ?? 'Monthly Fee'));
    $amount = (int)($body['amount'] ?? 0);
    $utr = trim((string)($body['utr'] ?? ''));
    $paymentDate = trim((string)($body['paymentDate'] ?? '')) ?: date('Y-m-d');
    $receiptUrl = trim((string)($body['receiptUrl'] ?? ''));

    if ($enrollmentNumber === '' || $dob === '' || $amount <= 0 || $receiptUrl === '') {
        json_response(['error' => 'Enrollment Number, DOB, valid fee amount, and payment receipt screenshot are required.'], 400);
    }

    $stmt = $pdo->prepare(
        'SELECT a.*, f.center_code AS f_center_code, f.is_main_center AS f_is_main_center
         FROM admission_applications a
         LEFT JOIN franchises f ON f.id = a.franchise_id
         WHERE UPPER(a.enrollment_number) = ? AND a.dob = ? AND a.status = "APPROVED"
         LIMIT 1'
    );
    $stmt->execute([$enrollmentNumber, $dob]);
    $row = $stmt->fetch();
    if (!$row) {
        json_response(['error' => 'Invalid Enrollment Number or Date of Birth.'], 404);
    }

    $isMain = (!empty($row['f_is_main_center']) && (int)$row['f_is_main_center'] === 1)
        || strtoupper((string)($row['f_center_code'] ?? $row['franchise_code'] ?? '')) === 'ESI-CTR-001';
    if (!$isMain) {
        json_response(['error' => 'Online monthly fee upload is available only for Main Center (ESI-CTR-001) students.'], 403);
    }

    $id = generate_cuid();
    $pdo->prepare(
        'INSERT INTO student_fee_submissions
         (id, application_id, franchise_id, enrollment_number, student_name, course_name, fee_head, amount, utr, payment_date, receipt_url, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "PENDING")'
    )->execute([
        $id,
        $row['id'],
        $row['franchise_id'],
        $row['enrollment_number'],
        $row['full_name'],
        $row['course_name'],
        $feeHead,
        $amount,
        $utr !== '' ? $utr : null,
        $paymentDate,
        $receiptUrl,
    ]);

    json_response([
        'submission' => [
            'id'          => $id,
            'feeHead'     => $feeHead,
            'amount'      => $amount,
            'utr'         => $utr,
            'paymentDate' => $paymentDate,
            'receiptUrl'  => $receiptUrl,
            'status'      => 'PENDING',
            'remarks'     => '',
            'createdAt'   => date('Y-m-d H:i:s'),
        ],
    ], 201);
}

if ($method !== 'GET') {
    json_response(['error' => 'Method not allowed.'], 405);
}

$enrollmentNumber = strtoupper(trim((string)($_GET['enrollmentNumber'] ?? '')));
$dob = trim((string)($_GET['dob'] ?? ''));

if ($enrollmentNumber === '' || $dob === '') {
    json_response(['error' => 'Enrollment Number and Date of Birth are required.'], 400);
}

$stmt = $pdo->prepare(
    'SELECT a.*, c.duration AS joined_course_duration, c.fee AS joined_course_fee, c.fee_breakdown_json AS joined_fee_breakdown
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

// Check if student belongs to Main Center (ESI-CTR-001)
$isMainCenterStudent = false;
$mainCenterPayment = null;
$feeSubmissions = [];

if (!empty($row['franchise_id'])) {
    $fStmt = $pdo->prepare('SELECT * FROM franchises WHERE id = ? LIMIT 1');
    $fStmt->execute([$row['franchise_id']]);
    $fRow = $fStmt->fetch();
    if ($fRow && is_main_center_row($fRow)) {
        $isMainCenterStudent = true;
        $mainCenterPayment = [
            'centerName'        => $fRow['center_name'],
            'centerCode'        => $fRow['center_code'],
            'paymentQrUrl'      => $fRow['payment_qr_url'] ?? '',
            'upiId'             => $fRow['upi_id'] ?? '',
            'bankName'          => $fRow['bank_name'] ?? '',
            'accountHolderName' => $fRow['account_holder_name'] ?? '',
            'accountNumber'     => $fRow['account_number'] ?? '',
            'ifscCode'          => $fRow['ifsc_code'] ?? '',
        ];
        $subStmt = $pdo->prepare(
            'SELECT id, fee_head AS feeHead, amount, utr, payment_date AS paymentDate, receipt_url AS receiptUrl, status, remarks, created_at AS createdAt
             FROM student_fee_submissions
             WHERE application_id = ?
             ORDER BY created_at DESC'
        );
        $subStmt->execute([$row['id']]);
        $feeSubmissions = $subStmt->fetchAll();
    }
}

$student = enrich_application($row, map_application($row));
$student['course'] = ['duration' => $row['joined_course_duration'] ?: '1 Year'];
$student['certificates'] = $certs;
$student['isMainCenterStudent'] = $isMainCenterStudent;
$student['mainCenterPayment'] = $mainCenterPayment;
$student['feeSubmissions'] = $feeSubmissions;

json_response(['student' => $student]);
