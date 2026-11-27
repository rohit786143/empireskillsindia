<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/franchise-schema.php';

$pdo = get_db();
ensure_franchise_schema($pdo);

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($action === 'me' && $method === 'GET') {
    if (empty($_SESSION['franchise_user'])) {
        json_response(['authenticated' => false, 'franchise' => null], 401);
    }
    json_response(['authenticated' => true, 'franchise' => $_SESSION['franchise_user']]);
}

if ($action === 'login' && $method === 'POST') {
    $body = get_json_body();
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $password = (string)($body['password'] ?? '');

    if ($email === '' || $password === '') {
        json_response(['error' => 'Email and password are required.'], 400);
    }

    $stmt = $pdo->prepare('SELECT * FROM franchises WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($password, $row['password_hash'])) {
        json_response(['error' => 'Invalid franchise email or password.'], 401);
    }

    if ($row['status'] !== 'ACTIVE') {
        json_response(['error' => 'This franchise account is currently suspended. Contact Main Institute.'], 403);
    }

    $sessionFranchise = [
        'franchiseId' => $row['id'],
        'centerCode'  => $row['center_code'],
        'centerName'  => $row['center_name'],
        'ownerName'   => $row['owner_name'],
        'email'       => $row['email'],
        'city'        => $row['city'],
        'state'       => $row['state'],
    ];
    $_SESSION['franchise_user'] = $sessionFranchise;

    json_response(['franchise' => $sessionFranchise]);
}

if ($action === 'logout' && $method === 'POST') {
    unset($_SESSION['franchise_user']);
    json_response(['success' => true]);
}

if ($action === 'change-password' && $method === 'POST') {
    $fr = require_franchise();
    $body = get_json_body();
    $currentPassword = (string)($body['currentPassword'] ?? '');
    $newPassword = (string)($body['newPassword'] ?? '');

    if ($currentPassword === '' || strlen($newPassword) < 6) {
        json_response(['error' => 'Current password and new password (min 6 chars) are required.'], 400);
    }

    $stmt = $pdo->prepare('SELECT id, password_hash FROM franchises WHERE id = ? LIMIT 1');
    $stmt->execute([$fr['franchiseId']]);
    $row = $stmt->fetch();
    if (!$row || !password_verify($currentPassword, $row['password_hash'])) {
        json_response(['error' => 'Current password is incorrect.'], 400);
    }

    $pdo->prepare('UPDATE franchises SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($newPassword, PASSWORD_BCRYPT), $row['id']]);
    json_response(['success' => true, 'message' => 'Franchise password updated successfully.']);
}

if ($action === 'payment-settings' && $method === 'GET') {
    $fr = require_franchise();
    $stmt = $pdo->prepare('SELECT * FROM franchises WHERE id = ? LIMIT 1');
    $stmt->execute([$fr['franchiseId']]);
    $row = $stmt->fetch();
    if (!$row) json_response(['error' => 'Center not found.'], 404);
    json_response(['franchise' => map_franchise($row)]);
}

if ($action === 'payment-settings' && ($method === 'POST' || $method === 'PATCH')) {
    $fr = require_franchise();
    $body = get_json_body();
    $fields = [];
    $params = [];
    foreach ([
        'paymentQrUrl'      => 'payment_qr_url',
        'upiId'             => 'upi_id',
        'bankName'          => 'bank_name',
        'accountHolderName' => 'account_holder_name',
        'accountNumber'     => 'account_number',
        'ifscCode'          => 'ifsc_code',
    ] as $k => $col) {
        if (array_key_exists($k, $body)) {
            $val = $k === 'paymentQrUrl' ? (string)$body[$k] : trim((string)$body[$k]);
            if ($k === 'ifscCode') $val = strtoupper($val);
            $fields[] = "`{$col}` = ?";
            $params[] = $val;
        }
    }
    if (array_key_exists('registrationFee', $body)) {
        $fields[] = '`registration_fee` = ?';
        $params[] = max(0, (int)$body['registrationFee']);
    }
    if (!empty($fields)) {
        $params[] = $fr['franchiseId'];
        $pdo->prepare('UPDATE franchises SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    }
    $stmt = $pdo->prepare('SELECT * FROM franchises WHERE id = ? LIMIT 1');
    $stmt->execute([$fr['franchiseId']]);
    json_response(['franchise' => map_franchise($stmt->fetch()), 'message' => 'Payment QR & Bank details updated successfully.']);
}

json_response(['error' => 'Invalid action.'], 400);
