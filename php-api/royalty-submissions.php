<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/franchise-schema.php';
require_once __DIR__ . '/enrichers.php';

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$pdo = get_db();
ensure_franchise_schema($pdo);
require_admin();
$method = $_SERVER['REQUEST_METHOD'];

function map_royalty_sub(array $r): array {
    return [
        'id'               => $r['id'],
        'applicationId'    => $r['application_id'],
        'franchiseId'      => $r['franchise_id'],
        'franchiseName'    => $r['franchise_name'],
        'franchiseCode'    => $r['franchise_code'],
        'enrollmentNumber' => $r['enrollment_number'],
        'studentName'      => $r['student_name'],
        'courseName'       => $r['course_name'],
        'amount'           => (int)$r['amount'],
        'utr'              => $r['utr'],
        'paymentDate'      => $r['payment_date'],
        'proofUrl'         => $r['proof_url'],
        'franchiseRemarks' => $r['franchise_remarks'] ?? '',
        'status'           => $r['status'],
        'adminRemarks'     => $r['admin_remarks'] ?? '',
        'createdAt'        => $r['created_at'],
    ];
}

if ($method === 'GET') {
    $rows = $pdo->query(
        'SELECT * FROM franchise_royalty_submissions
         ORDER BY FIELD(status, "PENDING", "REJECTED", "APPROVED"), created_at DESC'
    )->fetchAll();
    json_response(['submissions' => array_map('map_royalty_sub', $rows)]);
}

if ($method === 'PATCH' || $method === 'PUT') {
    $body = get_json_body();
    $id = trim((string)($body['id'] ?? $_GET['id'] ?? ''));
    $action = strtoupper(trim((string)($body['action'] ?? '')));
    $adminRemarks = trim((string)($body['adminRemarks'] ?? ''));

    if ($id === '' || !in_array($action, ['APPROVE', 'REJECT'], true)) {
        json_response(['error' => 'Valid submission id and action (APPROVE/REJECT) are required.'], 400);
    }

    $stmt = $pdo->prepare('SELECT * FROM franchise_royalty_submissions WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $sub = $stmt->fetch();
    if (!$sub) json_response(['error' => 'Royalty payment request not found.'], 404);

    if ($action === 'REJECT') {
        if ($adminRemarks === '') {
            json_response(['error' => 'Please enter a remark explaining why this payment is rejected.'], 400);
        }
        $pdo->prepare('UPDATE franchise_royalty_submissions SET status = "REJECTED", admin_remarks = ? WHERE id = ?')
            ->execute([$adminRemarks, $id]);

        $stmt->execute([$id]);
        json_response(['submission' => map_royalty_sub($stmt->fetch())]);
    }

    // APPROVE: Credit into admission_applications.franchise_paid_to_main + franchise_payments_json (idempotent)
    $updatedApp = null;
    if ($sub['status'] !== 'APPROVED') {
        $aStmt = $pdo->prepare(
            'SELECT a.*, c.duration AS joined_course_duration, c.fee AS joined_course_fee, c.fee_breakdown_json AS joined_fee_breakdown
             FROM admission_applications a LEFT JOIN courses c ON c.id = a.course_id WHERE a.id = ? LIMIT 1'
        );
        $aStmt->execute([$sub['application_id']]);
        $appRow = $aStmt->fetch();
        if ($appRow) {
            $enriched = enrich_application($appRow, map_application($appRow));
            $curPending = (int)($enriched['franchisePendingToMain'] ?? 0);
            $payAmt = (int)$sub['amount'];

            $existingFrPayments = [];
            if (!empty($appRow['franchise_payments_json'])) {
                $dec = json_decode($appRow['franchise_payments_json'], true);
                if (is_array($dec)) $existingFrPayments = $dec;
            }
            $existingFrPayments[] = [
                'id'            => generate_cuid(),
                'applicationId' => $appRow['id'],
                'studentName'   => $appRow['full_name'] ?? '',
                'amount'        => $payAmt,
                'feeType'       => ($curPending > 0 && $payAmt >= $curPending) ? 'Final Royalty Settlement' : '15% Royalty Installment',
                'mode'          => 'UPI / Bank',
                'receiptNo'     => $sub['utr'],
                'date'          => $sub['payment_date'] ?: date('Y-m-d'),
                'recordedAt'    => date('Y-m-d H:i:s'),
                'remarks'       => $adminRemarks !== '' ? $adminRemarks : ($sub['franchise_remarks'] ?: 'Verified & Approved by Main Admin'),
                'proofUrl'      => $sub['proof_url'],
            ];
            $totalFrPaid = 0;
            foreach ($existingFrPayments as $ep) {
                $totalFrPaid += (int)($ep['amount'] ?? 0);
            }
            $pdo->prepare('UPDATE admission_applications SET franchise_paid_to_main = ?, franchise_payments_json = ? WHERE id = ? AND franchise_id = ?')
                ->execute([$totalFrPaid, json_encode($existingFrPayments, JSON_UNESCAPED_UNICODE), $appRow['id'], $sub['franchise_id']]);

            $aStmt->execute([$appRow['id']]);
            $updRow = $aStmt->fetch();
            $updatedApp = enrich_application($updRow, map_application($updRow));
        }

        $pdo->prepare('UPDATE franchise_royalty_submissions SET status = "APPROVED", admin_remarks = ? WHERE id = ?')
            ->execute([$adminRemarks !== '' ? $adminRemarks : 'Verified & Approved', $id]);
    }

    $stmt->execute([$id]);
    json_response([
        'submission'  => map_royalty_sub($stmt->fetch()),
        'application' => $updatedApp,
    ]);
}

json_response(['error' => 'Method not allowed.'], 405);
