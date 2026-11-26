<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/official-courses-data.php';
require_once __DIR__ . '/enrichers.php';

$pdo = get_db();
$method = $_SERVER['REQUEST_METHOD'];

// GET: single course (?id=... or ?slug=...) OR filtered list
if ($method === 'GET') {
    ensure_official_courses_if_empty($pdo);
    $idOrSlug = trim((string)($_GET['id'] ?? $_GET['slug'] ?? ''));
    if ($idOrSlug !== '') {
        $stmt = $pdo->prepare('SELECT * FROM courses WHERE id = ? OR slug = ? OR code = ? LIMIT 1');
        $stmt->execute([$idOrSlug, $idOrSlug, $idOrSlug]);
        $row = $stmt->fetch();
        if (!$row) {
            json_response(['error' => 'Course not found.'], 404);
        }
        json_response(['course' => enrich_course($row, map_course($row))]);
    }

    $where = [];
    $params = [];

    if (($_GET['all'] ?? '') !== 'true') {
        $where[] = 'is_active = 1';
    }
    if (!empty($_GET['category']) && $_GET['category'] !== 'All') {
        $where[] = 'category = ?';
        $params[] = $_GET['category'];
    }
    if (!empty($_GET['duration']) && $_GET['duration'] !== 'All') {
        $where[] = 'duration = ?';
        $params[] = $_GET['duration'];
    }
    if (!empty($_GET['eligibility']) && $_GET['eligibility'] !== 'All') {
        $where[] = 'eligibility = ?';
        $params[] = $_GET['eligibility'];
    }
    if (!empty($_GET['q'])) {
        $q = '%' . trim((string)$_GET['q']) . '%';
        $where[] = '(title LIKE ? OR code LIKE ? OR category LIKE ?)';
        $params[] = $q;
        $params[] = $q;
        $params[] = $q;
    }

    $sql = 'SELECT * FROM courses';
    if (!empty($where)) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= ' ORDER BY featured DESC, created_at ASC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $courses = [];
    foreach ($stmt->fetchAll() as $rc) {
        $courses[] = enrich_course($rc, map_course($rc));
    }
    json_response(['courses' => $courses]);
}

// POST: create course [Admin]
if ($method === 'POST') {
    require_admin();
    $body = get_json_body();

    $title = trim((string)($body['title'] ?? ''));
    $code = strtoupper(trim((string)($body['code'] ?? '')));
    $overview = trim((string)($body['overview'] ?? ''));

    if ($title === '' || $code === '' || $overview === '') {
        json_response(['error' => 'Course title, code, and overview are required.'], 400);
    }

    $baseSlug = slugify((string)($body['slug'] ?? $title));
    $check = $pdo->prepare('SELECT id FROM courses WHERE slug = ? LIMIT 1');
    $check->execute([$baseSlug]);
    $slug = $check->fetch() ? $baseSlug . '-' . substr((string)time(), -4) : $baseSlug;

    $syllabusJson = is_string($body['syllabus'] ?? null)
        ? $body['syllabus']
        : json_encode($body['syllabus'] ?? [], JSON_UNESCAPED_UNICODE);
    $careersJson = is_string($body['careerOpportunities'] ?? null)
        ? $body['careerOpportunities']
        : json_encode($body['careerOpportunities'] ?? [], JSON_UNESCAPED_UNICODE);
    $feeBreakdownJson = isset($body['feeBreakdown'])
        ? (is_string($body['feeBreakdown']) ? $body['feeBreakdown'] : json_encode($body['feeBreakdown'], JSON_UNESCAPED_UNICODE))
        : null;

    try { $pdo->exec('ALTER TABLE courses ADD COLUMN fee_breakdown_json LONGTEXT DEFAULT NULL'); } catch (PDOException $e) {}

    $id = generate_cuid();
    try {
        $stmt = $pdo->prepare(
            'INSERT INTO courses (id, code, slug, title, category, duration, eligibility, fee, registration_fee, study_mode, overview, syllabus_json, career_opportunities_json, fee_breakdown_json, featured, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $id,
            $code,
            $slug,
            $title,
            trim((string)($body['category'] ?? 'Computer & IT')),
            trim((string)($body['duration'] ?? '6 Months')),
            trim((string)($body['eligibility'] ?? '10th Pass')),
            (int)($body['fee'] ?? 0),
            (int)($body['registrationFee'] ?? 500),
            trim((string)($body['studyMode'] ?? 'Regular / Online')),
            $overview,
            $syllabusJson,
            $careersJson,
            $feeBreakdownJson,
            isset($body['featured']) ? ($body['featured'] ? 1 : 0) : 1,
            isset($body['isActive']) ? ($body['isActive'] ? 1 : 0) : 1,
        ]);
    } catch (PDOException $e) {
        json_response(['error' => 'A course with this code or slug already exists.'], 400);
    }

    $row = $pdo->prepare('SELECT * FROM courses WHERE id = ?');
    $row->execute([$id]);
    $created = $row->fetch();
    json_response(['course' => enrich_course($created, map_course($created))], 201);
}

// PATCH / PUT: update course [Admin]
if ($method === 'PATCH' || $method === 'PUT') {
    require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Course id is required.'], 400);

    $body = get_json_body();
    $fields = [];
    $params = [];

    $mapCols = [
        'title'           => 'title',
        'code'            => 'code',
        'category'        => 'category',
        'duration'        => 'duration',
        'eligibility'     => 'eligibility',
        'fee'             => 'fee',
        'registrationFee' => 'registration_fee',
        'studyMode'       => 'study_mode',
        'overview'        => 'overview',
    ];

    foreach ($mapCols as $jsonKey => $col) {
        if (array_key_exists($jsonKey, $body)) {
            $val = $body[$jsonKey];
            if ($jsonKey === 'code') $val = strtoupper(trim((string)$val));
            elseif ($jsonKey === 'fee' || $jsonKey === 'registrationFee') $val = (int)$val;
            else $val = trim((string)$val);
            $fields[] = "`{$col}` = ?";
            $params[] = $val;
        }
    }

    if (array_key_exists('featured', $body)) {
        $fields[] = '`featured` = ?';
        $params[] = $body['featured'] ? 1 : 0;
    }
    if (array_key_exists('isActive', $body)) {
        $fields[] = '`is_active` = ?';
        $params[] = $body['isActive'] ? 1 : 0;
    }
    if (array_key_exists('syllabus', $body)) {
        $fields[] = '`syllabus_json` = ?';
        $params[] = is_string($body['syllabus']) ? $body['syllabus'] : json_encode($body['syllabus'], JSON_UNESCAPED_UNICODE);
    }
    if (array_key_exists('careerOpportunities', $body)) {
        $fields[] = '`career_opportunities_json` = ?';
        $params[] = is_string($body['careerOpportunities']) ? $body['careerOpportunities'] : json_encode($body['careerOpportunities'], JSON_UNESCAPED_UNICODE);
    }
    if (array_key_exists('feeBreakdown', $body)) {
        try { $pdo->exec('ALTER TABLE courses ADD COLUMN fee_breakdown_json LONGTEXT DEFAULT NULL'); } catch (PDOException $e) {}
        $fields[] = '`fee_breakdown_json` = ?';
        $params[] = is_string($body['feeBreakdown']) ? $body['feeBreakdown'] : json_encode($body['feeBreakdown'], JSON_UNESCAPED_UNICODE);
    }

    if (!empty($fields)) {
        $params[] = $id;
        $stmt = $pdo->prepare('UPDATE courses SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($params);
    }

    $row = $pdo->prepare('SELECT * FROM courses WHERE id = ?');
    $row->execute([$id]);
    $found = $row->fetch();
    if (!$found) json_response(['error' => 'Course not found.'], 404);
    json_response(['course' => enrich_course($found, map_course($found))]);
}

// DELETE: delete course [Admin]
if ($method === 'DELETE') {
    require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Course id is required.'], 400);
    $stmt = $pdo->prepare('DELETE FROM courses WHERE id = ?');
    $stmt->execute([$id]);
    json_response(['success' => true]);
}

json_response(['error' => 'Method not allowed.'], 405);
