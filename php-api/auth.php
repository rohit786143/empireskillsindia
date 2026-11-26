<?php
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($action === 'me' && $method === 'GET') {
    $admin = get_optional_admin();
    if (!$admin) {
        json_response(['authenticated' => false, 'user' => null], 401);
    }
    json_response(['authenticated' => true, 'user' => $admin]);
}

if ($action === 'login' && $method === 'POST') {
    $body = get_json_body();
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $password = (string)($body['password'] ?? '');

    if ($email === '' || $password === '') {
        json_response(['error' => 'Email and password are required.'], 400);
    }

    $pdo = get_db();
    $stmt = $pdo->prepare('SELECT id, name, email, password_hash, role FROM admin_users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $admin = $stmt->fetch();

    if (!$admin || !password_verify($password, $admin['password_hash'])) {
        json_response(['error' => 'Invalid email or password.'], 401);
    }

    $sessionUser = [
        'userId' => $admin['id'],
        'id'     => $admin['id'],
        'name'   => $admin['name'],
        'email'  => $admin['email'],
        'role'   => $admin['role'],
    ];
    $_SESSION['admin_user'] = $sessionUser;

    json_response(['user' => $sessionUser]);
}

if ($action === 'logout' && $method === 'POST') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', $params['secure'], $params['httponly']);
    }
    session_destroy();
    json_response(['success' => true]);
}

if ($action === 'change-password' && $method === 'POST') {
    $admin = require_admin();
    $body = get_json_body();
    $currentPassword = (string)($body['currentPassword'] ?? '');
    $newPassword = (string)($body['newPassword'] ?? '');

    if ($currentPassword === '' || strlen($newPassword) < 6) {
        json_response(['error' => 'Current password and a new password (min 6 characters) are required.'], 400);
    }

    $pdo = get_db();
    $stmt = $pdo->prepare('SELECT id, password_hash FROM admin_users WHERE id = ? LIMIT 1');
    $stmt->execute([$admin['userId']]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($currentPassword, $row['password_hash'])) {
        json_response(['error' => 'Current password is incorrect.'], 400);
    }

    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
    $upd = $pdo->prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?');
    $upd->execute([$newHash, $row['id']]);

    json_response(['success' => true, 'message' => 'Password updated successfully.']);
}

json_response(['error' => 'Invalid auth action.'], 400);
