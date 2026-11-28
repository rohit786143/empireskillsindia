<?php
require_once __DIR__ . '/config.php';

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$pdo = get_db();

try {
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `about_page_content` (
          `id` VARCHAR(32) NOT NULL,
          `content_json` LONGTEXT NOT NULL,
          `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
} catch (PDOException $e) {}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare('SELECT content_json, updated_at FROM about_page_content WHERE id = ? LIMIT 1');
    $stmt->execute(['main']);
    $row = $stmt->fetch();
    if (!$row || empty($row['content_json'])) {
        json_response(['content' => null]);
    }
    $decoded = json_decode($row['content_json'], true);
    json_response([
        'content'   => is_array($decoded) ? $decoded : null,
        'updatedAt' => $row['updated_at'] ?? null,
    ]);
}

if ($method === 'POST' || $method === 'PUT') {
    require_admin();
    $body = get_json_body();
    $content = $body['content'] ?? null;
    if (!is_array($content)) {
        json_response(['error' => 'Valid About Us content payload is required.'], 400);
    }
    $encoded = json_encode($content, JSON_UNESCAPED_UNICODE);
    $stmt = $pdo->prepare(
        'INSERT INTO about_page_content (id, content_json) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE content_json = VALUES(content_json)'
    );
    $stmt->execute(['main', $encoded]);
    json_response(['success' => true, 'content' => $content]);
}

json_response(['error' => 'Method not allowed.'], 405);
