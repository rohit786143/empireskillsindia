<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/enrichers.php';

$pdo = get_db();
$method = $_SERVER['REQUEST_METHOD'];

// GET: list admissions [Admin]
if ($method === 'GET') {
    require_admin();

    $id = trim((string)($_GET['id'] ?? ''));
    if ($id !== '') {
        $stmt = $pdo->prepare('SELECT * FROM admission_applications WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) json_response(['error' => 'Application not found.'], 404);
        json_response(['application' => map_application($row)]);
    }

    $where = [];
    $params = [];

    if (!empty($_GET['status']) && $_GET['status'] !== 'ALL') {
        $where[] = 'a.status = ?';
        $params[] = $_GET['status'];
    }
    if (!empty($_GET['q'])) {
        $q = '%' . trim((string)$_GET['q']) . '%';
        $where[] = '(a.full_name LIKE ? OR a.application_ref LIKE ? OR a.enrollment_number LIKE ? OR a.mobile LIKE ? OR a.course_name LIKE ?)';
        array_push($params, $q, $q, $q, $q, $q);
    }

    $sql = 'SELECT a.*, c.duration AS joined_course_duration, c.fee AS joined_course_fee, c.fee_breakdown_json AS joined_fee_breakdown
            FROM admission_applications a
            LEFT JOIN courses c ON c.id = a.course_id';
    if (!empty($where)) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= ' ORDER BY a.created_at DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $apps = [];
    while ($row = $stmt->fetch()) {
        $mapped = enrich_application($row, map_application($row));
        $mapped['courseDuration'] = $row['joined_course_duration'] ?: '1 Year';
        $apps[] = $mapped;
    }

    json_response(['applications' => $apps]);
}

// POST: public online admission submission OR admin offline student entry
if ($method === 'POST') {
    $body = get_json_body();

    $fullName = trim((string)($body['fullName'] ?? ''));
    $fatherName = trim((string)($body['fatherName'] ?? ''));
    $motherName = trim((string)($body['motherName'] ?? ''));
    $dob = trim((string)($body['dob'] ?? ''));
    $mobile = trim((string)($body['mobile'] ?? ''));
    $email = trim((string)($body['email'] ?? ''));

    if ($fullName === '' || $fatherName === '' || $dob === '' || $mobile === '') {
        json_response(['error' => "Full name, father's name, date of birth, and mobile number are required."], 400);
    }

    $courseId = !empty($body['courseId']) ? trim((string)$body['courseId']) : null;
    $courseName = trim((string)($body['courseName'] ?? ''));
    $courseCode = trim((string)($body['courseCode'] ?? ''));

    if ($courseId) {
        $cStmt = $pdo->prepare('SELECT id, title, code FROM courses WHERE id = ? LIMIT 1');
        $cStmt->execute([$courseId]);
        $cRow = $cStmt->fetch();
        if ($cRow) {
            $courseName = $cRow['title'];
            $courseCode = $cRow['code'];
        } else {
            $courseId = null;
        }
    }

    if ($courseName === '') {
        json_response(['error' => 'Please select a valid course.'], 400);
    }

    $applicationRef = generate_application_ref($pdo);
    $admin = get_optional_admin();
    $isDirectApproved = ($admin !== null && !empty($body['autoApprove']));
    $enrollmentNumber = $isDirectApproved ? generate_enrollment_number($pdo) : null;
    $approvedAt = $isDirectApproved ? date('Y-m-d H:i:s') : null;

    $qualificationsJson = is_string($body['qualifications'] ?? null)
        ? $body['qualifications']
        : json_encode($body['qualifications'] ?? [], JSON_UNESCAPED_UNICODE);

    $extraDetailsJson = null;
    if (isset($body['extraDetails'])) {
        $extraDetailsJson = is_string($body['extraDetails'])
            ? $body['extraDetails']
            : json_encode($body['extraDetails'], JSON_UNESCAPED_UNICODE);
    }

    // Ensure extra_details_json column exists even if SQL v2 wasn't manually run yet
    try {
        $pdo->exec('ALTER TABLE admission_applications ADD COLUMN extra_details_json LONGTEXT DEFAULT NULL');
    } catch (PDOException $e) {
        // Column already exists
    }

    $id = generate_cuid();
    $stmt = $pdo->prepare(
        'INSERT INTO admission_applications
        (id, application_ref, status, enrollment_number, course_id, course_name, course_code, session, study_mode,
         full_name, father_name, mother_name, dob, gender, category, aadhar_number, mobile, email,
         address, city, state, pincode, qualifications_json, extra_details_json, photo_url, signature_url, marksheet_url, id_proof_url, approved_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $id,
        $applicationRef,
        $isDirectApproved ? 'APPROVED' : 'PENDING',
        $enrollmentNumber,
        $courseId,
        $courseName,
        $courseCode ?: 'ESI-GEN',
        trim((string)($body['session'] ?? 'July 2026')),
        trim((string)($body['studyMode'] ?? 'Regular')),
        $fullName,
        $fatherName,
        $motherName ?: '—',
        $dob,
        trim((string)($body['gender'] ?? 'Male')),
        trim((string)($body['category'] ?? 'General')),
        trim((string)($body['aadharNumber'] ?? '')),
        $mobile,
        $email ?: 'not-provided@empireskillsindia.com',
        trim((string)($body['address'] ?? '')),
        trim((string)($body['city'] ?? '')),
        trim((string)($body['state'] ?? '')),
        trim((string)($body['pincode'] ?? '')),
        $qualificationsJson,
        $extraDetailsJson,
        !empty($body['photoUrl']) ? $body['photoUrl'] : null,
        !empty($body['signatureUrl']) ? $body['signatureUrl'] : null,
        !empty($body['marksheetUrl']) ? $body['marksheetUrl'] : null,
        !empty($body['idProofUrl']) ? $body['idProofUrl'] : null,
        $approvedAt,
    ]);

    $row = $pdo->prepare('SELECT * FROM admission_applications WHERE id = ?');
    $row->execute([$id]);
    json_response(['application' => map_application($row->fetch())], 201);
}

// PATCH / PUT: approve, reject, record fee payments, or update marks [Admin]
if ($method === 'PATCH' || $method === 'PUT') {
    require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Application id is required.'], 400);

    // Auto-ensure fee columns exist in MySQL without requiring manual SQL import
    foreach ([
        'ALTER TABLE admission_applications ADD COLUMN total_fee INT DEFAULT 0',
        'ALTER TABLE admission_applications ADD COLUMN fee_paid INT DEFAULT 0',
        'ALTER TABLE admission_applications ADD COLUMN fee_payments_json LONGTEXT DEFAULT NULL',
    ] as $alterSql) {
        try { $pdo->exec($alterSql); } catch (PDOException $e) {}
    }

    $stmt = $pdo->prepare('SELECT * FROM admission_applications WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $existing = $stmt->fetch();
    if (!$existing) json_response(['error' => 'Application not found.'], 404);

    $body = get_json_body();
    $fields = [];
    $params = [];

    $action = $body['action'] ?? '';
    $status = $body['status'] ?? '';

    if ($action === 'APPROVE' || $status === 'APPROVED') {
        $fields[] = '`status` = ?';
        $params[] = 'APPROVED';
        if (empty($existing['enrollment_number'])) {
            $fields[] = '`enrollment_number` = ?';
            $params[] = generate_enrollment_number($pdo);
        }
        if (empty($existing['approved_at'])) {
            $fields[] = '`approved_at` = ?';
            $params[] = date('Y-m-d H:i:s');
        }
    } elseif ($action === 'REJECT' || $status === 'REJECTED') {
        $fields[] = '`status` = ?';
        $params[] = 'REJECTED';
    } elseif ($status === 'PENDING') {
        $fields[] = '`status` = ?';
        $params[] = 'PENDING';
    }

    // Handle Fee Setup & Payment Installment Recording (on Approve or Collect Fee)
    if (array_key_exists('totalFee', $body)) {
        $fields[] = '`total_fee` = ?';
        $params[] = max(0, (int)$body['totalFee']);
    }

    if (!empty($body['payment']) && is_array($body['payment'])) {
        $payAmount = max(0, (int)($body['payment']['amount'] ?? 0));
        $existingPayments = [];
        if (!empty($existing['fee_payments_json'])) {
            $decoded = json_decode($existing['fee_payments_json'], true);
            if (is_array($decoded)) $existingPayments = $decoded;
        }
        if ($payAmount > 0) {
            $existingPayments[] = [
                'id'         => generate_cuid(),
                'amount'     => $payAmount,
                'feeType'    => trim((string)($body['payment']['feeType'] ?? 'Course Fee')),
                'mode'       => trim((string)($body['payment']['mode'] ?? 'Cash')),
                'receiptNo'  => trim((string)($body['payment']['receiptNo'] ?? '')),
                'date'       => trim((string)($body['payment']['date'] ?? '')) ?: date('Y-m-d'),
                'recordedAt' => date('Y-m-d H:i:s'),
                'remarks'    => trim((string)($body['payment']['remarks'] ?? '')),
            ];
            $totalPaid = 0;
            foreach ($existingPayments as $p) {
                $totalPaid += (int)($p['amount'] ?? 0);
            }
            $fields[] = '`fee_paid` = ?';
            $params[] = $totalPaid;
            $fields[] = '`fee_payments_json` = ?';
            $params[] = json_encode($existingPayments, JSON_UNESCAPED_UNICODE);
        }
    } elseif (array_key_exists('feePaid', $body)) {
        $fields[] = '`fee_paid` = ?';
        $params[] = max(0, (int)$body['feePaid']);
    }

    if (array_key_exists('remarks', $body)) {
        $fields[] = '`remarks` = ?';
        $params[] = (string)$body['remarks'];
    }
    if (array_key_exists('isCompleted', $body)) {
        $fields[] = '`is_completed` = ?';
        $params[] = $body['isCompleted'] ? 1 : 0;
    }
    if (array_key_exists('marksObtained', $body)) {
        $fields[] = '`marks_obtained` = ?';
        $params[] = (int)$body['marksObtained'];
    }
    if (array_key_exists('totalMarks', $body)) {
        $fields[] = '`total_marks` = ?';
        $params[] = (int)$body['totalMarks'];
    }
    if (array_key_exists('percentage', $body)) {
        $pct = (float)$body['percentage'];
        $fields[] = '`percentage` = ?';
        $params[] = $pct;
        if (!array_key_exists('grade', $body)) {
            $fields[] = '`grade` = ?';
            $params[] = compute_grade($pct);
        }
    }
    if (array_key_exists('grade', $body)) {
        $fields[] = '`grade` = ?';
        $params[] = trim((string)$body['grade']);
    }
    if (array_key_exists('completionDate', $body)) {
        $fields[] = '`completion_date` = ?';
        $params[] = trim((string)$body['completionDate']);
    }
    if (array_key_exists('resultJson', $body)) {
        $fields[] = '`result_json` = ?';
        $params[] = is_string($body['resultJson']) ? $body['resultJson'] : json_encode($body['resultJson'], JSON_UNESCAPED_UNICODE);
    }

    if (!empty($fields)) {
        $params[] = $id;
        $pdo->prepare('UPDATE admission_applications SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    }

    $upd = $pdo->prepare(
        'SELECT a.*, c.duration AS joined_course_duration, c.fee AS joined_course_fee, c.fee_breakdown_json AS joined_fee_breakdown
         FROM admission_applications a
         LEFT JOIN courses c ON c.id = a.course_id
         WHERE a.id = ?'
    );
    $upd->execute([$id]);
    $updRow = $upd->fetch();
    $mappedUpd = enrich_application($updRow, map_application($updRow));
    $mappedUpd['courseDuration'] = $updRow['joined_course_duration'] ?: '1 Year';
    json_response(['application' => $mappedUpd]);
}

// DELETE [Admin]
if ($method === 'DELETE') {
    require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Application id is required.'], 400);
    $pdo->prepare('DELETE FROM admission_applications WHERE id = ?')->execute([$id]);
    json_response(['success' => true]);
}

json_response(['error' => 'Method not allowed.'], 405);
