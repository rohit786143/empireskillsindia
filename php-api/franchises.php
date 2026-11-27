<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/franchise-schema.php';

$pdo = get_db();
ensure_franchise_schema($pdo);
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
$method = $_SERVER['REQUEST_METHOD'];

// GET: public active list (?public=true) OR full Admin list with stats
if ($method === 'GET') {
    if (($_GET['public'] ?? '') === 'true') {
        $rows = $pdo->query(
            'SELECT id, center_code, center_name, city, state, address,
                    payment_qr_url, upi_id, bank_name, account_holder_name, account_number, ifsc_code, registration_fee
             FROM franchises
             WHERE status = "ACTIVE"
             ORDER BY center_name ASC'
        )->fetchAll();
        $list = array_map(function ($r) {
            return [
                'id'                => $r['id'],
                'centerCode'        => $r['center_code'],
                'centerName'        => $r['center_name'],
                'city'              => $r['city'],
                'state'             => $r['state'],
                'address'           => $r['address'],
                'paymentQrUrl'      => $r['payment_qr_url'] ?? '',
                'upiId'             => $r['upi_id'] ?? '',
                'bankName'          => $r['bank_name'] ?? '',
                'accountHolderName' => $r['account_holder_name'] ?? '',
                'accountNumber'     => $r['account_number'] ?? '',
                'ifscCode'          => $r['ifsc_code'] ?? '',
                'registrationFee'   => isset($r['registration_fee']) && (int)$r['registration_fee'] > 0 ? (int)$r['registration_fee'] : 500,
            ];
        }, $rows);
        json_response(['franchises' => $list]);
    }

    require_admin();
    $rows = $pdo->query('SELECT * FROM franchises ORDER BY created_at DESC')->fetchAll();

    // Attach application counts per franchise
    $countsStmt = $pdo->query(
        'SELECT franchise_id,
                COUNT(*) AS total_apps,
                SUM(CASE WHEN franchise_status = "FORWARDED_TO_MAIN" THEN 1 ELSE 0 END) AS forwarded_apps,
                SUM(CASE WHEN status = "APPROVED" THEN 1 ELSE 0 END) AS approved_apps
         FROM admission_applications
         WHERE franchise_id IS NOT NULL
         GROUP BY franchise_id'
    );
    $countMap = [];
    while ($c = $countsStmt->fetch()) {
        $countMap[$c['franchise_id']] = [
            'totalApps'     => (int)$c['total_apps'],
            'forwardedApps' => (int)$c['forwarded_apps'],
            'approvedApps'  => (int)$c['approved_apps'],
        ];
    }

    $franchises = [];
    foreach ($rows as $r) {
        $m = map_franchise($r);
        $m['stats'] = $countMap[$r['id']] ?? ['totalApps' => 0, 'forwardedApps' => 0, 'approvedApps' => 0];
        $franchises[] = $m;
    }

    json_response(['franchises' => $franchises]);
}

// POST: Create a new Franchise Center [Main Admin]
if ($method === 'POST') {
    require_admin();
    $body = get_json_body();

    $centerName = trim((string)($body['centerName'] ?? ''));
    $ownerName = trim((string)($body['ownerName'] ?? ''));
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $password = (string)($body['password'] ?? '');
    $phone = trim((string)($body['phone'] ?? ''));

    if ($centerName === '' || $ownerName === '' || $email === '' || strlen($password) < 6) {
        json_response(['error' => 'Center name, owner name, email, and password (min 6 chars) are required.'], 400);
    }

    $centerCode = strtoupper(trim((string)($body['centerCode'] ?? ''))) ?: generate_center_code($pdo);
    $id = generate_cuid();
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    try {
        $regFee = isset($body['registrationFee']) && (int)$body['registrationFee'] > 0 ? (int)$body['registrationFee'] : 500;
        $stmt = $pdo->prepare(
            'INSERT INTO franchises (id, center_code, center_name, owner_name, email, password_hash, phone, address, city, state,
                                     payment_qr_url, upi_id, bank_name, account_holder_name, account_number, ifsc_code, registration_fee, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "ACTIVE")'
        );
        $stmt->execute([
            $id,
            $centerCode,
            $centerName,
            $ownerName,
            $email,
            $passwordHash,
            $phone,
            trim((string)($body['address'] ?? '')),
            trim((string)($body['city'] ?? '')),
            trim((string)($body['state'] ?? '')),
            !empty($body['paymentQrUrl']) ? (string)$body['paymentQrUrl'] : null,
            trim((string)($body['upiId'] ?? '')),
            trim((string)($body['bankName'] ?? '')),
            trim((string)($body['accountHolderName'] ?? '')),
            trim((string)($body['accountNumber'] ?? '')),
            strtoupper(trim((string)($body['ifscCode'] ?? ''))),
            $regFee,
        ]);
    } catch (PDOException $e) {
        json_response(['error' => 'A franchise with this email or center code already exists.'], 400);
    }

    $row = $pdo->prepare('SELECT * FROM franchises WHERE id = ?');
    $row->execute([$id]);
    $mapped = map_franchise($row->fetch());
    $mapped['stats'] = ['totalApps' => 0, 'forwardedApps' => 0, 'approvedApps' => 0];
    json_response(['franchise' => $mapped], 201);
}

// PATCH / PUT: Update franchise or toggle ACTIVE/SUSPENDED or reset password [Main Admin]
if ($method === 'PATCH' || $method === 'PUT') {
    require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Franchise id is required.'], 400);

    $body = get_json_body();
    $fields = [];
    $params = [];

    foreach ([
        'centerName'        => 'center_name',
        'ownerName'         => 'owner_name',
        'email'             => 'email',
        'phone'             => 'phone',
        'address'           => 'address',
        'city'              => 'city',
        'state'             => 'state',
        'status'            => 'status',
        'paymentQrUrl'      => 'payment_qr_url',
        'upiId'             => 'upi_id',
        'bankName'          => 'bank_name',
        'accountHolderName' => 'account_holder_name',
        'accountNumber'     => 'account_number',
        'ifscCode'          => 'ifsc_code',
    ] as $k => $col) {
        if (array_key_exists($k, $body)) {
            $val = $k === 'paymentQrUrl' ? (string)$body[$k] : trim((string)$body[$k]);
            if ($k === 'email') $val = strtolower($val);
            if ($k === 'ifscCode') $val = strtoupper($val);
            $fields[] = "`{$col}` = ?";
            $params[] = $val;
        }
    }
    if (array_key_exists('registrationFee', $body)) {
        $fields[] = '`registration_fee` = ?';
        $params[] = max(0, (int)$body['registrationFee']);
    }
    if (!empty($body['newPassword']) && strlen((string)$body['newPassword']) >= 6) {
        $fields[] = '`password_hash` = ?';
        $params[] = password_hash((string)$body['newPassword'], PASSWORD_BCRYPT);
    }

    if (!empty($fields)) {
        $params[] = $id;
        $pdo->prepare('UPDATE franchises SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    }

    $row = $pdo->prepare('SELECT * FROM franchises WHERE id = ?');
    $row->execute([$id]);
    $found = $row->fetch();
    if (!$found) json_response(['error' => 'Franchise not found.'], 404);
    json_response(['franchise' => map_franchise($found)]);
}

// DELETE [Main Admin]
if ($method === 'DELETE') {
    require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Franchise id is required.'], 400);
    $chk = $pdo->prepare('SELECT id, center_code, is_main_center FROM franchises WHERE id = ? LIMIT 1');
    $chk->execute([$id]);
    $found = $chk->fetch();
    if ($found && is_main_center_row($found)) {
        json_response(['error' => 'Main Center (ESI-CTR-001) is protected and cannot be deleted.'], 403);
    }
    $pdo->prepare('DELETE FROM franchises WHERE id = ?')->execute([$id]);
    json_response(['success' => true]);
}

json_response(['error' => 'Method not allowed.'], 405);
