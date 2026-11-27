<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/franchise-schema.php';
require_once __DIR__ . '/enrichers.php';

$pdo = get_db();
ensure_franchise_schema($pdo);
$franchise = require_franchise();
$franchiseId = $franchise['franchiseId'];
$fRowStmt = $pdo->prepare('SELECT * FROM franchises WHERE id = ? LIMIT 1');
$fRowStmt->execute([$franchiseId]);
$fRowDb = $fRowStmt->fetch() ?: [];
$isMainCenter = is_main_center_row($fRowDb);
$franchise['isMainCenter'] = $isMainCenter;
$method = $_SERVER['REQUEST_METHOD'];

// GET: List ONLY this franchise's applications (+ online fee submissions ONLY for Main Center)
if ($method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT a.*, c.duration AS joined_course_duration, c.fee AS joined_course_fee, c.fee_breakdown_json AS joined_fee_breakdown
         FROM admission_applications a
         LEFT JOIN courses c ON c.id = a.course_id
         WHERE a.franchise_id = ?
         ORDER BY a.created_at DESC'
    );
    $stmt->execute([$franchiseId]);

    $apps = [];
    while ($row = $stmt->fetch()) {
        $mapped = enrich_application($row, map_application($row));
        $mapped['courseDuration'] = $row['joined_course_duration'] ?: '1 Year';
        $apps[] = $mapped;
    }

    $feeSubmissions = [];
    $sfsStmt = $pdo->prepare('SELECT * FROM student_fee_submissions WHERE franchise_id = ? ORDER BY created_at DESC');
    $sfsStmt->execute([$franchiseId]);
    while ($sr = $sfsStmt->fetch()) {
        $feeSubmissions[] = [
            'id'               => $sr['id'],
            'applicationId'    => $sr['application_id'],
            'enrollmentNumber' => $sr['enrollment_number'],
            'studentName'      => $sr['student_name'],
            'courseName'       => $sr['course_name'],
            'feeHead'          => $sr['fee_head'],
            'amount'           => (int)$sr['amount'],
            'utr'              => $sr['utr'] ?? '',
            'paymentDate'      => $sr['payment_date'],
            'receiptUrl'       => $sr['receipt_url'],
            'status'           => $sr['status'],
            'remarks'          => $sr['remarks'] ?? '',
            'createdAt'        => $sr['created_at'],
        ];
    }

    json_response(['applications' => $apps, 'franchise' => $franchise, 'feeSubmissions' => $feeSubmissions]);
}

// PATCH: Franchise Approve, Reject, Forward to Main Institute, OR Main Center Fee Actions
if ($method === 'PATCH' || $method === 'PUT') {
    $body = get_json_body();
    $action = strtoupper(trim((string)($body['action'] ?? '')));

    // Approve or Reject a Student's Online Fee Submission belonging to this Study Center
    if ($action === 'APPROVE_FEE_SUBMISSION' || $action === 'REJECT_FEE_SUBMISSION') {
        $subId = trim((string)($body['submissionId'] ?? ''));
        if ($subId === '') json_response(['error' => 'submissionId is required.'], 400);

        $sStmt = $pdo->prepare('SELECT * FROM student_fee_submissions WHERE id = ? AND franchise_id = ? LIMIT 1');
        $sStmt->execute([$subId, $franchiseId]);
        $sub = $sStmt->fetch();
        if (!$sub) json_response(['error' => 'Fee submission not found.'], 404);

        $subRemarks = trim((string)($body['remarks'] ?? ''));
        if ($action === 'REJECT_FEE_SUBMISSION') {
            $pdo->prepare('UPDATE student_fee_submissions SET status = "REJECTED", remarks = ? WHERE id = ?')
                ->execute([$subRemarks ?: 'Rejected by Main Center', $subId]);
            json_response(['success' => true, 'status' => 'REJECTED']);
        }

        // Approve & add directly to student's fee_paid + fee_payments_json
        if ($sub['status'] !== 'APPROVED') {
            $appStmt = $pdo->prepare('SELECT * FROM admission_applications WHERE id = ? LIMIT 1');
            $appStmt->execute([$sub['application_id']]);
            $appRow = $appStmt->fetch();
            if ($appRow) {
                $existingPayments = [];
                if (!empty($appRow['fee_payments_json'])) {
                    $dec = json_decode($appRow['fee_payments_json'], true);
                    if (is_array($dec)) $existingPayments = $dec;
                }
                $existingPayments[] = [
                    'id'         => generate_cuid(),
                    'amount'     => (int)$sub['amount'],
                    'feeType'    => $sub['fee_head'],
                    'mode'       => 'Online UPI/Bank',
                    'receiptNo'  => $sub['utr'] ?: '',
                    'date'       => $sub['payment_date'] ?: date('Y-m-d'),
                    'recordedAt' => date('Y-m-d H:i:s'),
                    'remarks'    => $subRemarks ?: 'Verified Online Fee Receipt',
                    'proofUrl'   => $sub['receipt_url'] ?: null,
                ];
                $totalPaid = 0;
                foreach ($existingPayments as $p) {
                    $totalPaid += (int)($p['amount'] ?? 0);
                }
                $pdo->prepare('UPDATE admission_applications SET fee_paid = ?, fee_payments_json = ? WHERE id = ?')
                    ->execute([$totalPaid, json_encode($existingPayments, JSON_UNESCAPED_UNICODE), $appRow['id']]);
            }
            $pdo->prepare('UPDATE student_fee_submissions SET status = "APPROVED", remarks = ? WHERE id = ?')
                ->execute([$subRemarks ?: 'Verified & Approved', $subId]);
        }
        json_response(['success' => true, 'status' => 'APPROVED']);
    }

    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Application id is required.'], 400);

    $stmt = $pdo->prepare('SELECT * FROM admission_applications WHERE id = ? AND franchise_id = ? LIMIT 1');
    $stmt->execute([$id, $franchiseId]);
    $existing = $stmt->fetch();
    if (!$existing) {
        json_response(['error' => 'Application not found for your center.'], 404);
    }

    // Collect / Record Student Fee directly from Study Center Dashboard (both Main Center & Partner Franchises track student course fees)
    if ($action === 'COLLECT_FEE') {
        $payment = $body['payment'] ?? null;
        if (!is_array($payment) || (int)($payment['amount'] ?? 0) <= 0) {
            json_response(['error' => 'Valid payment amount is required.'], 400);
        }
        $existingPayments = [];
        if (!empty($existing['fee_payments_json'])) {
            $dec = json_decode($existing['fee_payments_json'], true);
            if (is_array($dec)) $existingPayments = $dec;
        }
        $existingPayments[] = [
            'id'         => generate_cuid(),
            'amount'     => (int)$payment['amount'],
            'feeType'    => trim((string)($payment['feeType'] ?? 'Monthly Fee')),
            'mode'       => trim((string)($payment['mode'] ?? 'Cash')),
            'receiptNo'  => trim((string)($payment['receiptNo'] ?? '')),
            'date'       => trim((string)($payment['date'] ?? '')) ?: date('Y-m-d'),
            'recordedAt' => date('Y-m-d H:i:s'),
            'remarks'    => trim((string)($payment['remarks'] ?? '')),
            'proofUrl'   => !empty($payment['proofUrl']) ? (string)$payment['proofUrl'] : null,
        ];
        $totalPaid = 0;
        foreach ($existingPayments as $p) {
            $totalPaid += (int)($p['amount'] ?? 0);
        }
        $pdo->prepare('UPDATE admission_applications SET fee_paid = ?, fee_payments_json = ? WHERE id = ?')
            ->execute([$totalPaid, json_encode($existingPayments, JSON_UNESCAPED_UNICODE), $id]);

        $upd = $pdo->prepare(
            'SELECT a.*, c.duration AS joined_course_duration, c.fee AS joined_course_fee, c.fee_breakdown_json AS joined_fee_breakdown
             FROM admission_applications a LEFT JOIN courses c ON c.id = a.course_id WHERE a.id = ?'
        );
        $upd->execute([$id]);
        $updRow = $upd->fetch();
        $mapped = enrich_application($updRow, map_application($updRow));
        $mapped['courseDuration'] = $updRow['joined_course_duration'] ?: '1 Year';
        json_response(['application' => $mapped]);
    }

    // Franchise pays remaining 15% Royalty Balance to Main Admin (with mandatory UTR & screenshot proof)
    if ($action === 'PAY_ADMIN_ROYALTY') {
        if ($isMainCenter) {
            json_response(['error' => 'Main Center does not pay franchise royalty.'], 400);
        }
        $payAmt = max(0, (int)($body['amount'] ?? 0));
        $payUtr = trim((string)($body['utr'] ?? ''));
        $payProof = trim((string)($body['proofUrl'] ?? ''));
        $payDate = trim((string)($body['date'] ?? '')) ?: date('Y-m-d');
        $payRemarks = trim((string)($body['remarks'] ?? ''));

        if ($payAmt <= 0 || $payUtr === '' || $payProof === '') {
            json_response(['error' => 'Valid amount, UTR / Transaction Number, and payment screenshot are all mandatory.'], 400);
        }

        // Compute current pending admin share
        $cStmt = $pdo->prepare(
            'SELECT a.*, c.duration AS joined_course_duration, c.fee AS joined_course_fee, c.fee_breakdown_json AS joined_fee_breakdown
             FROM admission_applications a LEFT JOIN courses c ON c.id = a.course_id WHERE a.id = ?'
        );
        $cStmt->execute([$id]);
        $cRow = $cStmt->fetch();
        $enrichedCur = enrich_application($cRow, map_application($cRow));
        $curPending = (int)($enrichedCur['franchisePendingToMain'] ?? 0);

        if ($curPending <= 0) {
            json_response(['error' => 'Admin royalty share is already completely paid for this student.'], 400);
        }
        if ($payAmt > $curPending) {
            $payAmt = $curPending;
        }

        $existingFrPayments = [];
        if (!empty($existing['franchise_payments_json'])) {
            $dec = json_decode($existing['franchise_payments_json'], true);
            if (is_array($dec)) $existingFrPayments = $dec;
        }
        $existingFrPayments[] = [
            'id'         => generate_cuid(),
            'amount'     => $payAmt,
            'feeType'    => ($payAmt >= $curPending) ? 'Final Royalty Settlement' : '15% Royalty Installment',
            'mode'       => 'UPI / Bank',
            'receiptNo'  => $payUtr,
            'date'       => $payDate,
            'recordedAt' => date('Y-m-d H:i:s'),
            'remarks'    => $payRemarks !== '' ? $payRemarks : 'Royalty balance paid by franchise to Main Admin',
            'proofUrl'   => $payProof,
        ];
        $totalFrPaid = 0;
        foreach ($existingFrPayments as $ep) {
            $totalFrPaid += (int)($ep['amount'] ?? 0);
        }
        $pdo->prepare('UPDATE admission_applications SET franchise_paid_to_main = ?, franchise_payments_json = ? WHERE id = ?')
            ->execute([$totalFrPaid, json_encode($existingFrPayments, JSON_UNESCAPED_UNICODE), $id]);

        $cStmt->execute([$id]);
        $updRow = $cStmt->fetch();
        $mapped = enrich_application($updRow, map_application($updRow));
        $mapped['courseDuration'] = $updRow['joined_course_duration'] ?: '1 Year';
        json_response(['application' => $mapped]);
    }

    // Do not allow franchise to modify once Main Institute has already finalized
    if ($existing['franchise_status'] === 'MAIN_APPROVED') {
        json_response(['error' => 'This application has already been approved & enrolled by Main Institute.'], 400);
    }

    $remarks = trim((string)($body['remarks'] ?? ''));

    $fields = [];
    $params = [];

    if ($action === 'FRANCHISE_APPROVE') {
        if ($isMainCenter) {
            // Main Center Accept -> Automatically Enrolled & Visible in Main Admin (No forwarding step needed)
            $fields[] = '`franchise_status` = ?';
            $params[] = 'MAIN_APPROVED';
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
            if (empty($existing['forwarded_at'])) {
                $fields[] = '`forwarded_at` = ?';
                $params[] = date('Y-m-d H:i:s');
            }
        } else {
            $fields[] = '`franchise_status` = ?';
            $params[] = 'FRANCHISE_APPROVED';
            $fields[] = '`status` = ?';
            $params[] = 'PENDING';
        }

        // Record initial student fee received on Accept (e.g. ₹500 registration fee) into student's fee ledger
        $initialFeeAmt = isset($body['initialFeeReceived']) ? max(0, (int)$body['initialFeeReceived']) : 0;
        if ($initialFeeAmt > 0) {
            $existingPayments = [];
            if (!empty($existing['fee_payments_json'])) {
                $dec = json_decode($existing['fee_payments_json'], true);
                if (is_array($dec)) $existingPayments = $dec;
            }
            $existingPayments[] = [
                'id'         => generate_cuid(),
                'amount'     => $initialFeeAmt,
                'feeType'    => 'Registration / Initial Fee',
                'mode'       => trim((string)($body['initialFeeMode'] ?? 'UPI / Online')) ?: 'UPI / Online',
                'receiptNo'  => trim((string)($body['initialFeeReceipt'] ?? ($existing['payment_utr'] ?? ''))),
                'date'       => date('Y-m-d'),
                'recordedAt' => date('Y-m-d H:i:s'),
                'remarks'    => $remarks !== '' ? $remarks : 'Initial fee received at admission acceptance',
                'proofUrl'   => $existing['payment_screenshot_url'] ?? null,
            ];
            $totalStudentPaid = 0;
            foreach ($existingPayments as $sp) {
                $totalStudentPaid += (int)($sp['amount'] ?? 0);
            }
            $fields[] = '`fee_paid` = ?';
            $params[] = $totalStudentPaid;
            $fields[] = '`fee_payments_json` = ?';
            $params[] = json_encode($existingPayments, JSON_UNESCAPED_UNICODE);
        }
    } elseif ($action === 'FRANCHISE_REJECT') {
        $fields[] = '`franchise_status` = ?';
        $params[] = 'FRANCHISE_REJECTED';
        $fields[] = '`status` = ?';
        $params[] = 'REJECTED';
    } elseif ($action === 'FORWARD_TO_MAIN' || $action === 'APPROVE_AND_FORWARD') {
        $forwardProof = !empty($body['forwardPaymentProofUrl'])
            ? (string)$body['forwardPaymentProofUrl']
            : (string)($existing['franchise_forward_proof_url'] ?? '');
        $forwardUtr = trim((string)($body['forwardPaymentUtr'] ?? ''));

        if ($forwardProof === '') {
            json_response([
                'error' => 'Please pay ₹500 Registration Share to Main Admin and upload the payment screenshot before forwarding.',
            ], 400);
        }
        if ($forwardUtr === '' && empty($existing['franchise_forward_utr'])) {
            json_response([
                'error' => 'UTR / Transaction Reference Number is mandatory before forwarding.',
            ], 400);
        }

        $fields[] = '`franchise_status` = ?';
        $params[] = 'FORWARDED_TO_MAIN';
        $fields[] = '`status` = ?';
        $params[] = 'PENDING';
        $fields[] = '`forwarded_at` = ?';
        $params[] = date('Y-m-d H:i:s');
        $fields[] = '`franchise_forward_proof_url` = ?';
        $params[] = $forwardProof;
        if ($forwardUtr !== '') {
            $fields[] = '`franchise_forward_utr` = ?';
            $params[] = $forwardUtr;
        }

        // Auto-record the initial ₹500 Forward Registration Share in Franchise Ledger (only once)
        $existingFrPayments = [];
        if (!empty($existing['franchise_payments_json'])) {
            $dec = json_decode($existing['franchise_payments_json'], true);
            if (is_array($dec)) $existingFrPayments = $dec;
        }
        $hasInitial500 = false;
        foreach ($existingFrPayments as $ep) {
            if (($ep['feeType'] ?? '') === 'Initial Forward Fee (₹500)') {
                $hasInitial500 = true;
                break;
            }
        }
        if (!$hasInitial500) {
            $existingFrPayments[] = [
                'id'         => generate_cuid(),
                'amount'     => 500,
                'feeType'    => 'Initial Forward Fee (₹500)',
                'mode'       => 'UPI / Bank',
                'receiptNo'  => $forwardUtr,
                'date'       => date('Y-m-d'),
                'recordedAt' => date('Y-m-d H:i:s'),
                'remarks'    => $remarks !== '' ? $remarks : 'Paid ₹500 to Main Admin on application forward',
                'proofUrl'   => $forwardProof,
            ];
            $totalFrPaid = 0;
            foreach ($existingFrPayments as $ep) {
                $totalFrPaid += (int)($ep['amount'] ?? 0);
            }
            $fields[] = '`franchise_paid_to_main` = ?';
            $params[] = $totalFrPaid;
            $fields[] = '`franchise_payments_json` = ?';
            $params[] = json_encode($existingFrPayments, JSON_UNESCAPED_UNICODE);
        }
    } else {
        json_response(['error' => 'Invalid franchise action.'], 400);
    }

    if ($remarks !== '') {
        $fields[] = '`franchise_remarks` = ?';
        $params[] = $remarks;
    }

    $params[] = $id;
    $pdo->prepare('UPDATE admission_applications SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);

    $upd = $pdo->prepare(
        'SELECT a.*, c.duration AS joined_course_duration, c.fee AS joined_course_fee, c.fee_breakdown_json AS joined_fee_breakdown
         FROM admission_applications a
         LEFT JOIN courses c ON c.id = a.course_id
         WHERE a.id = ?'
    );
    $upd->execute([$id]);
    $updRow = $upd->fetch();
    $mapped = enrich_application($updRow, map_application($updRow));
    $mapped['courseDuration'] = $updRow['joined_course_duration'] ?: '1 Year';

    json_response(['application' => $mapped]);
}

json_response(['error' => 'Method not allowed.'], 405);
