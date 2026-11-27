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

json_response(['error' => 'Invalid action.'], 400);
