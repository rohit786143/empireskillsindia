<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/franchise-schema.php';
require_once __DIR__ . '/enrichers.php';

$pdo = get_db();
ensure_franchise_schema($pdo);

// Auto-add study_centre and subjects_json columns to certificates table
foreach ([
    'ALTER TABLE certificates ADD COLUMN study_centre VARCHAR(255) DEFAULT NULL',
    'ALTER TABLE certificates ADD COLUMN subjects_json LONGTEXT DEFAULT NULL',
] as $sql) {
    try { $pdo->exec($sql); } catch (PDOException $e) {}
}

function enrich_cert_row(array $r): array {
    $m = map_certificate($r);
    $m['franchiseId'] = $r['joined_franchise_id'] ?? null;
    $m['franchiseName'] = $r['joined_franchise_name'] ?? null;
    $m['franchiseCode'] = $r['joined_franchise_code'] ?? null;
    $m['studyCentre'] = !empty($r['study_centre'])
        ? $r['study_centre']
        : (!empty($r['joined_franchise_name'])
            ? $r['joined_franchise_name']
            : 'Empire Institute of Skills Technology, Mandi');
    $subjects = [];
    $rawSub = !empty($r['subjects_json']) ? $r['subjects_json'] : ($r['joined_result_json'] ?? null);
    if (!empty($rawSub)) {
        $dec = json_decode($rawSub, true);
        if (is_array($dec)) {
            foreach ($dec as $item) {
                if (!is_array($item)) continue;
                $subjects[] = [
                    'subject'      => (string)($item['subject'] ?? ''),
                    'maxMarks'     => (int)($item['maxMarks'] ?? 100),
                    'minMarks'     => (int)($item['minMarks'] ?? 40),
                    'marksSecured' => (int)($item['marksSecured'] ?? $item['obtainedMarks'] ?? 0),
                ];
            }
        }
    }
    $m['subjects'] = $subjects;
    return $m;
}

function compute_official_grade(float $pct): string {
    if ($pct >= 85) return 'A+';
    if ($pct >= 75) return 'A';
    if ($pct >= 60) return 'B';
    if ($pct >= 40) return 'C';
    return 'F';
}

function sanitize_subjects($raw): array {
    if (!is_array($raw)) return [];
    $out = [];
    foreach ($raw as $item) {
        if (!is_array($item)) continue;
        $name = trim((string)($item['subject'] ?? ''));
        if ($name === '') continue;
        $max = max(1, (int)($item['maxMarks'] ?? 100));
        $min = max(0, (int)($item['minMarks'] ?? (int)round($max * 0.4)));
        $sec = max(0, min($max, (int)($item['marksSecured'] ?? $item['obtainedMarks'] ?? 0)));
        $out[] = [
            'subject'       => $name,
            'maxMarks'      => $max,
            'minMarks'      => $min,
            'marksSecured'  => $sec,
            'obtainedMarks' => $sec,
        ];
    }
    return $out;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET: list all certificates [Admin]
if ($method === 'GET') {
    require_admin();

    $id = trim((string)($_GET['id'] ?? ''));
    if ($id !== '') {
        $stmt = $pdo->prepare(
            'SELECT c.*, a.franchise_id AS joined_franchise_id, a.franchise_name AS joined_franchise_name, a.franchise_code AS joined_franchise_code, a.result_json AS joined_result_json
             FROM certificates c
             LEFT JOIN admission_applications a ON (c.application_id = a.id OR (c.application_id IS NULL AND c.enrollment_number = a.enrollment_number))
             WHERE c.id = ? OR c.certificate_number = ? LIMIT 1'
        );
        $stmt->execute([$id, $id]);
        $row = $stmt->fetch();
        if (!$row) json_response(['error' => 'Certificate not found.'], 404);
        json_response(['certificate' => enrich_cert_row($row)]);
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

    $sql = 'SELECT c.*, a.franchise_id AS joined_franchise_id, a.franchise_name AS joined_franchise_name, a.franchise_code AS joined_franchise_code, a.result_json AS joined_result_json
            FROM certificates c
            LEFT JOIN admission_applications a ON (c.application_id = a.id OR (c.application_id IS NULL AND c.enrollment_number = a.enrollment_number))';
    if (!empty($where)) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY c.created_at DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $certs = [];
    while ($r = $stmt->fetch()) {
        $certs[] = enrich_cert_row($r);
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

        // NIELIT courses are certified directly by NIELIT (not Empire Skills India)
        $isNielit = (stripos((string)($student['course_code'] ?? ''), 'NIELIT') !== false)
            || (stripos((string)($student['course_name'] ?? ''), 'NIELIT') !== false);
        if ($isNielit) {
            json_response([
                'error' => 'Certificates for NIELIT courses are issued directly by NIELIT and cannot be generated here.',
            ], 400);
        }

        $genNums = generate_course_enrollment_and_serial(
            $pdo,
            $student['course_id'] ?? null,
            $student['course_code'] ?? null,
            $student['enrollment_number'] ?? null,
            $student['serial_number'] ?? null,
            trim((string)($body['session'] ?? '')) ?: ($student['session'] ?? null)
        );
        $enrollmentNumber = $genNums['enrollmentNumber'];
        $candidateSerial = $genNums['serialNumber'];

        // Use the student's pre-assigned serial_number as certificate_number if not already used by another certificate
        $chkCert = $pdo->prepare('SELECT id FROM certificates WHERE certificate_number = ? LIMIT 1');
        $chkCert->execute([$candidateSerial]);
        if (!$chkCert->fetch()) {
            $certificateNumber = $candidateSerial;
        }
        $subjects = sanitize_subjects($body['subjects'] ?? null);
        if (count($subjects) > 0) {
            $marksObtained = 0;
            $totalMarks = 0;
            foreach ($subjects as $sub) {
                $marksObtained += (int)$sub['marksSecured'];
                $totalMarks += (int)$sub['maxMarks'];
            }
            $percentage = $totalMarks > 0 ? round(($marksObtained / $totalMarks) * 100, 2) : 0.0;
            $grade = trim((string)($body['grade'] ?? '')) ?: compute_official_grade($percentage);
            $resultJson = json_encode($subjects, JSON_UNESCAPED_UNICODE);
        } else {
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
            $grade = trim((string)($body['grade'] ?? '')) ?: compute_official_grade($percentage);
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
                    ['subject' => $student['course_name'] . ' — Theory Examination', 'maxMarks' => $theoryMax, 'minMarks' => (int)round($theoryMax * 0.4), 'marksSecured' => $theoryObt, 'obtainedMarks' => $theoryObt],
                    ['subject' => $student['course_name'] . ' — Practical & Viva-Voce', 'maxMarks' => $pracMax, 'minMarks' => (int)round($pracMax * 0.4), 'marksSecured' => $pracObt, 'obtainedMarks' => $pracObt],
                ], JSON_UNESCAPED_UNICODE);
            }
        }
        $completionDate = trim((string)($body['completionDate'] ?? '')) ?: ($student['completion_date'] ?: $issueDate);
        $sessionVal = trim((string)($body['session'] ?? '')) ?: ($student['session'] ?: 'July, 2025 To June, 2026');
        $studyCentre = trim((string)($body['studyCentre'] ?? ''))
            ?: (!empty($student['franchise_name']) ? $student['franchise_name'] : 'Empire Institute of Skills Technology, Mandi');

        // Mark student completed & save marksheet + ensure serial_number is saved
        $pdo->prepare(
            'UPDATE admission_applications
             SET status = "APPROVED", enrollment_number = ?, serial_number = ?, is_completed = 1,
                 marks_obtained = ?, total_marks = ?, percentage = ?, grade = ?,
                 completion_date = ?, result_json = ?
             WHERE id = ?'
        )->execute([
            $enrollmentNumber,
            $certificateNumber,
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
             course_name, course_code, duration, session, study_centre, subjects_json, marks_obtained, total_marks, percentage, grade, completion_date, issue_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "VALID")'
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
            $sessionVal,
            $studyCentre,
            $resultJson,
            $marksObtained,
            $totalMarks,
            $percentage,
            $grade,
            $completionDate,
            $issueDate,
        ]);

        $row = $pdo->prepare(
            'SELECT c.*, a.franchise_id AS joined_franchise_id, a.franchise_name AS joined_franchise_name, a.franchise_code AS joined_franchise_code, a.result_json AS joined_result_json
             FROM certificates c LEFT JOIN admission_applications a ON c.application_id = a.id WHERE c.id = ?'
        );
        $row->execute([$id]);
        json_response(['certificate' => enrich_cert_row($row->fetch())], 201);
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

    if (stripos($courseName, 'NIELIT') !== false || stripos((string)($body['courseCode'] ?? ''), 'NIELIT') !== false) {
        json_response([
            'error' => 'Certificates for NIELIT courses are issued directly by NIELIT and cannot be generated here.',
        ], 400);
    }

    $qCourseCode = !empty($body['courseCode']) ? trim((string)$body['courseCode']) : null;
    $qGenNums = generate_course_enrollment_and_serial(
        $pdo,
        null,
        $qCourseCode,
        !empty($body['enrollmentNumber']) ? trim((string)$body['enrollmentNumber']) : null,
        null,
        !empty($body['session']) ? trim((string)$body['session']) : null
    );
    $enrollmentNumber = $qGenNums['enrollmentNumber'];
    $certificateNumber = $qGenNums['serialNumber'];
    $subjects = sanitize_subjects($body['subjects'] ?? null);
    if (count($subjects) > 0) {
        $marksObtained = 0;
        $totalMarks = 0;
        foreach ($subjects as $sub) {
            $marksObtained += (int)$sub['marksSecured'];
            $totalMarks += (int)$sub['maxMarks'];
        }
        $percentage = $totalMarks > 0 ? round(($marksObtained / $totalMarks) * 100, 2) : 0.0;
        $grade = trim((string)($body['grade'] ?? '')) ?: compute_official_grade($percentage);
        $subjectsJson = json_encode($subjects, JSON_UNESCAPED_UNICODE);
    } else {
        $marksObtained = isset($body['marksObtained']) && $body['marksObtained'] !== '' ? (int)$body['marksObtained'] : null;
        $totalMarks = isset($body['totalMarks']) && $body['totalMarks'] !== '' ? (int)$body['totalMarks'] : 500;
        if (isset($body['percentage']) && $body['percentage'] !== '') {
            $percentage = (float)$body['percentage'];
        } elseif ($marksObtained !== null && $totalMarks > 0) {
            $percentage = round(($marksObtained / $totalMarks) * 100, 2);
        } else {
            $percentage = 80.0;
        }
        $grade = trim((string)($body['grade'] ?? '')) ?: compute_official_grade($percentage);
        $subjectsJson = null;
    }
    $completionDate = trim((string)($body['completionDate'] ?? '')) ?: $issueDate;
    $studyCentre = trim((string)($body['studyCentre'] ?? '')) ?: 'Empire Institute of Skills Technology, Mandi';

    $pdo->prepare(
        'INSERT INTO certificates
        (id, certificate_number, enrollment_number, application_id, student_name, father_name, mother_name, dob, photo_url,
         course_name, course_code, duration, session, study_centre, subjects_json, marks_obtained, total_marks, percentage, grade, completion_date, issue_date, status)
        VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "VALID")'
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
        !empty($body['session']) ? trim((string)$body['session']) : 'July, 2025 To June, 2026',
        $studyCentre,
        $subjectsJson,
        $marksObtained,
        $totalMarks,
        $percentage,
        $grade,
        $completionDate,
        $issueDate,
    ]);

    $row = $pdo->prepare('SELECT * FROM certificates WHERE id = ?');
    $row->execute([$id]);
    json_response(['certificate' => enrich_cert_row($row->fetch())], 201);
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
