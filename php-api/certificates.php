<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/franchise-schema.php';

$pdo = get_db();
ensure_franchise_schema($pdo);
$method = $_SERVER['REQUEST_METHOD'];

// GET: list all certificates [Admin]
if ($method === 'GET') {
    require_admin();

    $id = trim((string)($_GET['id'] ?? ''));
    if ($id !== '') {
        $stmt = $pdo->prepare('SELECT * FROM certificates WHERE id = ? OR certificate_number = ? LIMIT 1');
        $stmt->execute([$id, $id]);
        $row = $stmt->fetch();
        if (!$row) json_response(['error' => 'Certificate not found.'], 404);
        json_response(['certificate' => map_certificate($row)]);
    }

    $where = [];
    $params = [];
    if (!empty($_GET['status']) && $_GET['status'] !== 'ALL') {
        $where[] = 'c.status = ?';
        $params[] = $_GET['status'];
    }
    if (!empty($_GET['q'])) {
        $q = '%' . trim((string)$_GET['q']) . '%';
        $where[] = '(c.certificate_number LIKE ? OR c.enrollment_number LIKE ? OR c.student_name LIKE ? OR c.course_name LIKE ?)';
        array_push($params, $q, $q, $q, $q);
    }

    $sql = 'SELECT c.*, a.franchise_id AS joined_franchise_id, a.franchise_name AS joined_franchise_name, a.franchise_code AS joined_franchise_code
            FROM certificates c
            LEFT JOIN admission_applications a ON (c.application_id = a.id OR (c.application_id IS NULL AND c.enrollment_number = a.enrollment_number))';
    if (!empty($where)) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY c.created_at DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $certs = [];
    while ($r = $stmt->fetch()) {
        $m = map_certificate($r);
        $m['franchiseId'] = $r['joined_franchise_id'] ?? null;
        $m['franchiseName'] = $r['joined_franchise_name'] ?? null;
        $m['franchiseCode'] = $r['joined_franchise_code'] ?? null;
        $certs[] = $m;
    }
    json_response(['certificates' => $certs]);
}

// POST: generate certificate (From Enrolled Student OR Direct Quick Generator) [Admin]
if ($method === 'POST') {
    require_admin();
    $body = get_json_body();
    $certificateNumber = generate_certificate_number($pdo);
    $issueDate = trim((string)($body['issueDate'] ?? '')) ?: date('Y-m-d');
    $id = generate_cuid();

    // Mode 1: From Enrolled Student
    if (!empty($body['applicationId'])) {
        $appId = trim((string)$body['applicationId']);
        $stmt = $pdo->prepare(
            'SELECT a.*, c.duration AS joined_duration
             FROM admission_applications a
             LEFT JOIN courses c ON c.id = a.course_id
             WHERE a.id = ? LIMIT 1'
        );
        $stmt->execute([$appId]);
        $student = $stmt->fetch();

        if (!$student) {
            json_response(['error' => 'Enrolled student record not found.'], 404);
        }

        $enrollmentNumber = $student['enrollment_number'] ?: generate_enrollment_number($pdo);
        $marksObtained = isset($body['marksObtained']) && $body['marksObtained'] !== ''
            ? (int)$body['marksObtained']
            : ($student['marks_obtained'] !== null ? (int)$student['marks_obtained'] : null);
        $totalMarks = isset($body['totalMarks']) && $body['totalMarks'] !== ''
            ? (int)$body['totalMarks']
            : ($student['total_marks'] !== null ? (int)$student['total_marks'] : 500);
        if (isset($body['percentage']) && $body['percentage'] !== '') {
            $percentage = (float)$body['percentage'];
        } elseif ($marksObtained !== null && $totalMarks > 0) {
            $percentage = round(($marksObtained / $totalMarks) * 100, 2);
        } else {
            $percentage = $student['percentage'] !== null ? (float)$student['percentage'] : 80.0;
        }
        $grade = trim((string)($body['grade'] ?? '')) ?: compute_grade($percentage);
        $completionDate = trim((string)($body['completionDate'] ?? '')) ?: ($student['completion_date'] ?: $issueDate);

        $resultJson = $student['result_json'];
        if (empty($resultJson)) {
            $theoryMax = (int)round($totalMarks * 0.6);
            $pracMax = $totalMarks - $theoryMax;
            $theoryObt = $marksObtained !== null
                ? (int)round($marksObtained * 0.6)
                : (int)round(($percentage / 100) * $theoryMax);
            $pracObt = $marksObtained !== null
                ? ($marksObtained - $theoryObt)
                : (int)round(($percentage / 100) * $pracMax);
            $resultJson = json_encode([
                ['subject' => $student['course_name'] . ' — Theory Examination', 'maxMarks' => $theoryMax, 'obtainedMarks' => $theoryObt, 'grade' => $grade],
                ['subject' => $student['course_name'] . ' — Practical & Viva-Voce', 'maxMarks' => $pracMax, 'obtainedMarks' => $pracObt, 'grade' => $grade],
            ], JSON_UNESCAPED_UNICODE);
        }

        // Mark student completed & save marksheet
        $pdo->prepare(
            'UPDATE admission_applications
             SET status = "APPROVED", enrollment_number = ?, is_completed = 1,
                 marks_obtained = ?, total_marks = ?, percentage = ?, grade = ?,
                 completion_date = ?, result_json = ?
             WHERE id = ?'
        )->execute([
            $enrollmentNumber,
            $marksObtained,
            $totalMarks,
            $percentage,
            $grade,
            $completionDate,
            $resultJson,
            $student['id'],
        ]);

        $duration = trim((string)($body['duration'] ?? '')) ?: ($student['joined_duration'] ?: '1 Year');
        $photoUrl = !empty($body['photoUrl']) ? $body['photoUrl'] : $student['photo_url'];

        $pdo->prepare(
            'INSERT INTO certificates
            (id, certificate_number, enrollment_number, application_id, student_name, father_name, mother_name, dob, photo_url,
             course_name, course_code, duration, session, marks_obtained, total_marks, percentage, grade, completion_date, issue_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "VALID")'
        )->execute([
            $id,
            $certificateNumber,
            $enrollmentNumber,
            $student['id'],
            $student['full_name'],
            $student['father_name'],
            $student['mother_name'],
            $student['dob'],
            $photoUrl,
            $student['course_name'],
            $student['course_code'],
            $duration,
            $student['session'],
            $marksObtained,
            $totalMarks,
            $percentage,
            $grade,
            $completionDate,
            $issueDate,
        ]);

        $row = $pdo->prepare('SELECT * FROM certificates WHERE id = ?');
        $row->execute([$id]);
        json_response(['certificate' => map_certificate($row->fetch())], 201);
    }

    // Mode 2: Direct Quick Generator
    $studentName = trim((string)($body['studentName'] ?? ''));
    $fatherName = trim((string)($body['fatherName'] ?? ''));
    $courseName = trim((string)($body['courseName'] ?? ''));
    $duration = trim((string)($body['duration'] ?? ''));
    $dob = trim((string)($body['dob'] ?? '2000-01-01'));

    if ($studentName === '' || $fatherName === '' || $courseName === '' || $duration === '') {
        json_response(['error' => "Student name, father's name, course name, and duration are required."], 400);
    }

    $enrollmentNumber = trim((string)($body['enrollmentNumber'] ?? '')) ?: generate_enrollment_number($pdo);
    $marksObtained = isset($body['marksObtained']) && $body['marksObtained'] !== '' ? (int)$body['marksObtained'] : null;
    $totalMarks = isset($body['totalMarks']) && $body['totalMarks'] !== '' ? (int)$body['totalMarks'] : 500;
    if (isset($body['percentage']) && $body['percentage'] !== '') {
        $percentage = (float)$body['percentage'];
    } elseif ($marksObtained !== null && $totalMarks > 0) {
        $percentage = round(($marksObtained / $totalMarks) * 100, 2);
    } else {
        $percentage = 80.0;
    }
    $grade = trim((string)($body['grade'] ?? '')) ?: compute_grade($percentage);
    $completionDate = trim((string)($body['completionDate'] ?? '')) ?: $issueDate;

    $pdo->prepare(
        'INSERT INTO certificates
        (id, certificate_number, enrollment_number, application_id, student_name, father_name, mother_name, dob, photo_url,
         course_name, course_code, duration, session, marks_obtained, total_marks, percentage, grade, completion_date, issue_date, status)
        VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "VALID")'
    )->execute([
        $id,
        $certificateNumber,
        $enrollmentNumber,
        $studentName,
        $fatherName,
        !empty($body['motherName']) ? trim((string)$body['motherName']) : null,
        $dob,
        !empty($body['photoUrl']) ? $body['photoUrl'] : null,
        $courseName,
        !empty($body['courseCode']) ? trim((string)$body['courseCode']) : null,
        $duration,
        !empty($body['session']) ? trim((string)$body['session']) : '2026',
        $marksObtained,
        $totalMarks,
        $percentage,
        $grade,
        $completionDate,
        $issueDate,
    ]);

    $row = $pdo->prepare('SELECT * FROM certificates WHERE id = ?');
    $row->execute([$id]);
    json_response(['certificate' => map_certificate($row->fetch())], 201);
}

// PATCH / PUT: edit / revoke / restore certificate [Admin]
if ($method === 'PATCH' || $method === 'PUT') {
    require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Certificate id is required.'], 400);

    $body = get_json_body();
    $fields = [];
    $params = [];

    $cols = [
        'studentName'    => 'student_name',
        'fatherName'     => 'father_name',
        'dob'            => 'dob',
        'courseName'     => 'course_name',
        'duration'       => 'duration',
        'session'        => 'session',
        'grade'          => 'grade',
        'issueDate'      => 'issue_date',
        'completionDate' => 'completion_date',
        'status'         => 'status',
        'photoUrl'       => 'photo_url',
    ];
    foreach ($cols as $k => $col) {
        if (array_key_exists($k, $body)) {
            $fields[] = "`{$col}` = ?";
            $params[] = $body[$k] !== null ? trim((string)$body[$k]) : null;
        }
    }
    if (array_key_exists('percentage', $body)) {
        $fields[] = '`percentage` = ?';
        $params[] = (float)$body['percentage'];
    }

    if (!empty($fields)) {
        $params[] = $id;
        $pdo->prepare('UPDATE certificates SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    }

    $row = $pdo->prepare('SELECT * FROM certificates WHERE id = ?');
    $row->execute([$id]);
    $found = $row->fetch();
    if (!$found) json_response(['error' => 'Certificate not found.'], 404);
    json_response(['certificate' => map_certificate($found)]);
}

// DELETE [Admin]
if ($method === 'DELETE') {
    require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '') json_response(['error' => 'Certificate id is required.'], 400);
    $pdo->prepare('DELETE FROM certificates WHERE id = ?')->execute([$id]);
    json_response(['success' => true]);
}

json_response(['error' => 'Method not allowed.'], 405);
