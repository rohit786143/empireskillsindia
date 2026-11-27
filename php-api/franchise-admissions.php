<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/franchise-schema.php';
require_once __DIR__ . '/enrichers.php';

$pdo = get_db();
ensure_franchise_schema($pdo);
$franchise = require_franchise();
$franchiseId = $franchise['franchiseId'];
$method = $_SERVER['REQUEST_METHOD'];

// GET: List ONLY this franchise's applications
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

    json_response(['applications' => $apps, 'franchise' => $franchise]);
}

// PATCH: Franchise Approve, Reject, or Forward to Main Institute
if ($method === 'PATCH' || $method === 'PUT') {
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Application id is required.'], 400);

    $stmt = $pdo->prepare('SELECT * FROM admission_applications WHERE id = ? AND franchise_id = ? LIMIT 1');
    $stmt->execute([$id, $franchiseId]);
    $existing = $stmt->fetch();
    if (!$existing) {
        json_response(['error' => 'Application not found for your center.'], 404);
    }

    // Do not allow franchise to modify once Main Institute has already finalized
    if ($existing['franchise_status'] === 'MAIN_APPROVED') {
        json_response(['error' => 'This application has already been approved & enrolled by Main Institute.'], 400);
    }

    $body = get_json_body();
    $action = strtoupper(trim((string)($body['action'] ?? '')));
    $remarks = trim((string)($body['remarks'] ?? ''));

    $fields = [];
    $params = [];

    if ($action === 'FRANCHISE_APPROVE') {
        $fields[] = '`franchise_status` = ?';
        $params[] = 'FRANCHISE_APPROVED';
        $fields[] = '`status` = ?';
        $params[] = 'PENDING';
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
