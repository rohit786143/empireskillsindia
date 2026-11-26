<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed.'], 405);
}

$body = get_json_body();
$name = trim((string)($body['name'] ?? ''));
$email = trim((string)($body['email'] ?? ''));
$phone = trim((string)($body['phone'] ?? ''));
$subject = trim((string)($body['subject'] ?? 'General Inquiry'));
$message = trim((string)($body['message'] ?? ''));

if ($name === '' || $email === '' || $phone === '' || $message === '') {
    json_response(['error' => 'Please fill in all required fields.'], 400);
}

$pdo = get_db();
$id = generate_cuid();
$stmt = $pdo->prepare(
    'INSERT INTO contact_inquiries (id, name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?, ?)'
);
$stmt->execute([$id, $name, $email, $phone, $subject, $message]);

json_response(['success' => true, 'id' => $id], 201);
