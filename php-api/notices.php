<?php
require_once __DIR__ . '/config.php';

$pdo = get_db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $includeAll = ($_GET['all'] ?? '') === 'true';
    $tickerOnly = ($_GET['ticker'] ?? '') === 'true';

    $where = [];
    if (!$includeAll) $where[] = 'is_active = 1';
    if ($tickerOnly) $where[] = 'show_in_ticker = 1';

    $sql = 'SELECT * FROM notices';
    if (!empty($where)) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY published_date DESC, created_at DESC';

    $rows = $pdo->query($sql)->fetchAll();
    json_response(['notices' => array_map('map_notice', $rows)]);
}

if ($method === 'POST') {
    require_admin();
    $body = get_json_body();
    $title = trim((string)($body['title'] ?? ''));
    $content = trim((string)($body['content'] ?? ''));

    if ($title === '' || $content === '') {
        json_response(['error' => 'Notice title and details are required.'], 400);
    }

    $id = generate_cuid();
    $publishedDate = trim((string)($body['publishedDate'] ?? '')) ?: date('Y-m-d');
    $refNumber = trim((string)($body['refNumber'] ?? '')) ?: ('ESI/NTC/' . date('Y') . '/' . rand(100, 999));

    $stmt = $pdo->prepare(
        'INSERT INTO notices (id, title, ref_number, category, content, published_date, is_new, show_in_ticker, attachment_label, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $id,
        $title,
        $refNumber,
        trim((string)($body['category'] ?? 'General')),
        $content,
        $publishedDate,
        isset($body['isNew']) ? ($body['isNew'] ? 1 : 0) : 1,
        !empty($body['showInTicker']) ? 1 : 0,
        !empty($body['attachmentLabel']) ? trim((string)$body['attachmentLabel']) : null,
        isset($body['isActive']) ? ($body['isActive'] ? 1 : 0) : 1,
    ]);

    $row = $pdo->prepare('SELECT * FROM notices WHERE id = ?');
    $row->execute([$id]);
    json_response(['notice' => map_notice($row->fetch())], 201);
}

if ($method === 'PATCH' || $method === 'PUT') {
    require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Notice id is required.'], 400);

    $body = get_json_body();
    $fields = [];
    $params = [];

    foreach (['title' => 'title', 'refNumber' => 'ref_number', 'category' => 'category', 'content' => 'content', 'publishedDate' => 'published_date', 'attachmentLabel' => 'attachment_label'] as $k => $col) {
        if (array_key_exists($k, $body)) {
            $fields[] = "`{$col}` = ?";
            $params[] = $body[$k] !== null ? trim((string)$body[$k]) : null;
        }
    }
    foreach (['isNew' => 'is_new', 'showInTicker' => 'show_in_ticker', 'isActive' => 'is_active'] as $k => $col) {
        if (array_key_exists($k, $body)) {
            $fields[] = "`{$col}` = ?";
            $params[] = $body[$k] ? 1 : 0;
        }
    }

    if (!empty($fields)) {
        $params[] = $id;
        $pdo->prepare('UPDATE notices SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    }

    $row = $pdo->prepare('SELECT * FROM notices WHERE id = ?');
    $row->execute([$id]);
    $found = $row->fetch();
    if (!$found) json_response(['error' => 'Notice not found.'], 404);
    json_response(['notice' => map_notice($found)]);
}

if ($method === 'DELETE') {
    require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Notice id is required.'], 400);
    $pdo->prepare('DELETE FROM notices WHERE id = ?')->execute([$id]);
    json_response(['success' => true]);
}

json_response(['error' => 'Method not allowed.'], 405);
