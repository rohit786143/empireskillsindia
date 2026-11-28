<?php
require_once __DIR__ . '/config.php';

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$pdo = get_db();

try {
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `team_members` (
          `id` VARCHAR(64) NOT NULL,
          `name` VARCHAR(191) NOT NULL,
          `designation` VARCHAR(191) NOT NULL DEFAULT "",
          `short_intro` TEXT NOT NULL,
          `photo_url` LONGTEXT DEFAULT NULL,
          `sort_order` INT NOT NULL DEFAULT 0,
          `is_active` TINYINT(1) NOT NULL DEFAULT 1,
          `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
} catch (PDOException $e) {}

function map_team_member(array $r): array {
    return [
        'id'          => $r['id'],
        'name'        => $r['name'],
        'designation' => $r['designation'],
        'shortIntro'  => $r['short_intro'],
        'photoUrl'    => $r['photo_url'] ?: null,
        'sortOrder'   => (int)$r['sort_order'],
        'isActive'    => (bool)$r['is_active'],
        'createdAt'   => $r['created_at'],
    ];
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $all = ($_GET['all'] ?? '') === 'true';
    if ($all) {
        require_admin();
        $rows = $pdo->query('SELECT * FROM team_members ORDER BY sort_order ASC, created_at ASC')->fetchAll();
    } else {
        $rows = $pdo->query('SELECT * FROM team_members WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC')->fetchAll();
    }
    json_response(['members' => array_map('map_team_member', $rows)]);
}

if ($method === 'POST') {
    require_admin();
    $body = get_json_body();
    $name = trim((string)($body['name'] ?? ''));
    $shortIntro = trim((string)($body['shortIntro'] ?? ''));
    if ($name === '' || $shortIntro === '') {
        json_response(['error' => 'Member name and short intro are required.'], 400);
    }

    $id = generate_cuid();
    $designation = trim((string)($body['designation'] ?? ''));
    $sortOrder = (int)($body['sortOrder'] ?? 0);
    $photoUrl = !empty($body['photoUrl']) ? (string)$body['photoUrl'] : null;

    $stmt = $pdo->prepare(
        'INSERT INTO team_members
         (id, name, designation, short_intro, photo_url, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)'
    );
    $stmt->execute([$id, $name, $designation, $shortIntro, $photoUrl, $sortOrder]);

    $row = $pdo->prepare('SELECT * FROM team_members WHERE id = ?');
    $row->execute([$id]);
    json_response(['member' => map_team_member($row->fetch())], 201);
}

if ($method === 'PATCH' || $method === 'PUT') {
    require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Team member id is required.'], 400);
    $body = get_json_body();

    $fields = [];
    $params = [];
    foreach ([
        'name'        => 'name',
        'designation' => 'designation',
        'shortIntro'  => 'short_intro',
        'photoUrl'    => 'photo_url',
    ] as $k => $col) {
        if (array_key_exists($k, $body)) {
            $fields[] = "`{$col}` = ?";
            $params[] = $k === 'photoUrl' ? ($body[$k] ?: null) : trim((string)$body[$k]);
        }
    }
    if (array_key_exists('sortOrder', $body)) {
        $fields[] = '`sort_order` = ?';
        $params[] = (int)$body['sortOrder'];
    }
    if (array_key_exists('isActive', $body)) {
        $fields[] = '`is_active` = ?';
        $params[] = $body['isActive'] ? 1 : 0;
    }

    if (!empty($fields)) {
        $params[] = $id;
        $pdo->prepare('UPDATE team_members SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    }

    $row = $pdo->prepare('SELECT * FROM team_members WHERE id = ?');
    $row->execute([$id]);
    $found = $row->fetch();
    if (!$found) json_response(['error' => 'Team member not found.'], 404);
    json_response(['member' => map_team_member($found)]);
}

if ($method === 'DELETE') {
    require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Team member id is required.'], 400);
    $pdo->prepare('DELETE FROM team_members WHERE id = ?')->execute([$id]);
    json_response(['success' => true]);
}

json_response(['error' => 'Method not allowed.'], 405);
