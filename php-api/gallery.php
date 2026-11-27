<?php
require_once __DIR__ . '/config.php';

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$pdo = get_db();

try {
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `gallery_photos` (
          `id` VARCHAR(64) NOT NULL,
          `title` VARCHAR(255) NOT NULL,
          `event_name` VARCHAR(255) NOT NULL DEFAULT "",
          `category` VARCHAR(100) NOT NULL DEFAULT "Annual Function & Team",
          `image_url` LONGTEXT NOT NULL,
          `sort_order` INT NOT NULL DEFAULT 0,
          `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
} catch (PDOException $e) {}

// Seed default 25 photos if table is empty
$defaultPhotos = [
    ['gal_01', 'Chief Guest Felicitation Ceremony', 'Annual Function — Empire Skills India', 'Chief Guest & Felicitation', '/gallery/gallery-01.jpg', 1],
    ['gal_02', 'Traditional Group Folk Dance Performance', 'Empire Skills India Annual Celebration', 'Cultural Performances', '/gallery/gallery-02.jpg', 2],
    ['gal_03', 'Himachali Traditional Cultural Showcase', 'Annual Function Stage Performance', 'Cultural Performances', '/gallery/gallery-03.jpg', 3],
    ['gal_04', 'Honouring Leadership with Traditional Himachali Cap', 'Annual Function 2025', 'Chief Guest & Felicitation', '/gallery/gallery-04.jpg', 4],
    ['gal_05', 'Devotional Welcome Dance by Students', 'Annual Function 2025', 'Cultural Performances', '/gallery/gallery-05.jpg', 5],
    ['gal_06', 'Vibrant Student Dance Presentation', 'Annual Function 2025', 'Cultural Performances', '/gallery/gallery-06.jpg', 6],
    ['gal_07', "Director's Address — Sankalp: Skills for Success", 'Annual Function 2025', 'Annual Function & Team', '/gallery/gallery-07.jpg', 7],
    ['gal_08', 'Traditional Himachali Natti Performance', 'Annual Function 2025', 'Cultural Performances', '/gallery/gallery-08.jpg', 8],
    ['gal_09', 'Memento Presentation with Chief Guest & Faculty', 'Annual Function 2025', 'Chief Guest & Felicitation', '/gallery/gallery-09.jpg', 9],
    ['gal_10', 'Empire Skills India Faculty with Chief Guest', 'Annual Function 2025', 'Annual Function & Team', '/gallery/gallery-10.jpg', 10],
    ['gal_11', 'Institute Leadership & Organizing Team', 'Annual Function 2025', 'Annual Function & Team', '/gallery/gallery-11.jpg', 11],
    ['gal_12', 'Warm Welcome Reception', 'Empire Innovate Fest & Annual Day', 'Annual Function & Team', '/gallery/gallery-12.jpg', 12],
    ['gal_13', 'Arrival of Chief Guest & Dignitaries', 'Empire Innovate Fest — Annual Day', 'Chief Guest & Felicitation', '/gallery/gallery-13.jpg', 13],
    ['gal_14', 'Traditional Himachali Cap & Shawl Honour', 'Empire Innovate Fest — Annual Day Celebration', 'Chief Guest & Felicitation', '/gallery/gallery-14.jpg', 14],
    ['gal_15', 'Presenting Sacred Souvenir to Chief Guest', 'Empire Innovate Fest — Annual Day Celebration', 'Chief Guest & Felicitation', '/gallery/gallery-15.jpg', 15],
    ['gal_16', 'Guest of Honour Award Presentation', 'Empire Innovate Fest — Annual Prize Distribution', 'Chief Guest & Felicitation', '/gallery/gallery-16.jpg', 16],
    ['gal_17', "Director's Keynote Speech at Annual Day", 'Empire Innovate Fest — Annual Day Celebration', 'Annual Function & Team', '/gallery/gallery-17.jpg', 17],
    ['gal_18', 'Honouring Guest of Honour with Memento', 'Empire Innovate Fest — Annual Prize Distribution', 'Chief Guest & Felicitation', '/gallery/gallery-18.jpg', 18],
    ['gal_19', 'Empire Skills India Team with Chief Guest', 'Empire Innovate Fest — Annual Day Celebration', 'Annual Function & Team', '/gallery/gallery-19.jpg', 19],
    ['gal_20', 'Faculty & Dignitaries Stage Felicitation', 'Annual Day & Prize Distribution Ceremony', 'Chief Guest & Felicitation', '/gallery/gallery-20.jpg', 20],
    ['gal_21', 'Traditional Lamp Welcome by Students & Faculty', 'Empire Innovate Fest — Annual Day', 'Cultural Performances', '/gallery/gallery-21.jpg', 21],
    ['gal_22', 'Certificate Distribution to Meritorious Student', 'Empire Innovate Fest — Annual Day Celebration', 'Chief Guest & Felicitation', '/gallery/gallery-22.jpg', 22],
    ['gal_23', 'Floral Welcome of Dignitaries', 'Empire Innovate Fest — Annual Day', 'Annual Function & Team', '/gallery/gallery-23.jpg', 23],
    ['gal_24', 'Empire Skills India Faculty Group Photo', 'Empire Innovate Fest — Annual Day', 'Annual Function & Team', '/gallery/gallery-24.jpg', 24],
    ['gal_25', 'Traditional Deep-Prajwalan & Cultural Welcome Dance', 'Empire Innovate Fest — Annual Day Celebration', 'Cultural Performances', '/gallery/gallery-25.jpg', 25],
];

$count = (int)$pdo->query('SELECT COUNT(*) FROM gallery_photos')->fetchColumn();
if ($count === 0) {
    $ins = $pdo->prepare(
        'INSERT IGNORE INTO gallery_photos (id, title, event_name, category, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    );
    foreach ($defaultPhotos as $p) {
        $ins->execute($p);
    }
}

$method = $_SERVER['REQUEST_METHOD'];

function map_gallery_row(array $r): array {
    return [
        'id'        => $r['id'],
        'title'     => $r['title'],
        'event'     => $r['event_name'],
        'category'  => $r['category'],
        'src'       => $r['image_url'],
        'sortOrder' => (int)$r['sort_order'],
        'createdAt' => $r['created_at'],
    ];
}

// GET: Public list of all gallery photos
if ($method === 'GET') {
    $rows = $pdo->query('SELECT * FROM gallery_photos ORDER BY sort_order ASC, created_at DESC')->fetchAll();
    json_response(['photos' => array_map('map_gallery_row', $rows)]);
}

// POST: Add a new photo [Admin]
if ($method === 'POST') {
    require_admin();
    $body = get_json_body();
    $title = trim((string)($body['title'] ?? ''));
    $event = trim((string)($body['event'] ?? 'Empire Skills India Event'));
    $category = trim((string)($body['category'] ?? 'Annual Function & Team'));
    $imageUrl = trim((string)($body['src'] ?? ''));

    if ($title === '' || $imageUrl === '') {
        json_response(['error' => 'Photo title and image are required.'], 400);
    }

    $id = generate_cuid();
    $maxSort = (int)$pdo->query('SELECT COALESCE(MAX(sort_order), 0) FROM gallery_photos')->fetchColumn();

    $stmt = $pdo->prepare(
        'INSERT INTO gallery_photos (id, title, event_name, category, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$id, $title, $event, $category, $imageUrl, $maxSort + 1]);

    $row = $pdo->prepare('SELECT * FROM gallery_photos WHERE id = ?');
    $row->execute([$id]);
    json_response(['photo' => map_gallery_row($row->fetch())], 201);
}

// PATCH: Update photo title/event/category [Admin]
if ($method === 'PATCH' || $method === 'PUT') {
    require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Photo id is required.'], 400);
    $body = get_json_body();

    $fields = [];
    $params = [];
    if (array_key_exists('title', $body)) {
        $fields[] = '`title` = ?';
        $params[] = trim((string)$body['title']);
    }
    if (array_key_exists('event', $body)) {
        $fields[] = '`event_name` = ?';
        $params[] = trim((string)$body['event']);
    }
    if (array_key_exists('category', $body)) {
        $fields[] = '`category` = ?';
        $params[] = trim((string)$body['category']);
    }
    if (!empty($fields)) {
        $params[] = $id;
        $pdo->prepare('UPDATE gallery_photos SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    }

    $row = $pdo->prepare('SELECT * FROM gallery_photos WHERE id = ?');
    $row->execute([$id]);
    $found = $row->fetch();
    if (!$found) json_response(['error' => 'Photo not found.'], 404);
    json_response(['photo' => map_gallery_row($found)]);
}

// DELETE: Remove a photo [Admin]
if ($method === 'DELETE') {
    require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Photo id is required.'], 400);
    $pdo->prepare('DELETE FROM gallery_photos WHERE id = ?')->execute([$id]);
    json_response(['success' => true]);
}

json_response(['error' => 'Method not allowed.'], 405);
