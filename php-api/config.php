<?php
// ============================================================================
// Empire Skills India — PHP API Configuration (Hostinger Shared Hosting)
// ============================================================================

// 1. MySQL Database Credentials (Update these in Hostinger hPanel -> Databases)
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'u123456789_empireskills');
define('DB_USER', getenv('DB_USER') ?: 'u123456789_admin');
define('DB_PASS', getenv('DB_PASS') ?: 'YOUR_MYSQL_PASSWORD_HERE');
define('DB_CHARSET', 'utf8mb4');

// 2. CORS & JSON Headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 3. Secure Session Configuration
if (session_status() === PHP_SESSION_NONE) {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['SERVER_PORT'] ?? '') == 443);

    session_set_cookie_params([
        'lifetime' => 60 * 60 * 24 * 7, // 7 days
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name('esi_admin_session');
    session_start();
}

// 4. PDO MySQL Connection Singleton
function get_db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            json_response(['error' => 'Database connection failed. Check php-api/config.php credentials.'], 500);
        }
    }
    return $pdo;
}

// 5. Response & Request Helpers
function json_response(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function get_json_body(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function require_admin(): array {
    if (empty($_SESSION['admin_user'])) {
        json_response(['error' => 'Unauthorized. Please sign in as Institute Owner.'], 401);
    }
    return $_SESSION['admin_user'];
}

function get_optional_admin(): ?array {
    return !empty($_SESSION['admin_user']) ? $_SESSION['admin_user'] : null;
}

// 6. ID & Utility Generators
function generate_cuid(): string {
    return 'esi_' . bin2hex(random_bytes(10));
}

function generate_application_ref(PDO $pdo): string {
    $year = date('Y');
    $prefix = "ESI-APP-{$year}-";
    $stmt = $pdo->prepare("SELECT application_ref FROM admission_applications WHERE application_ref LIKE ?");
    $stmt->execute([$prefix . '%']);
    $max = 1000;
    while ($row = $stmt->fetch()) {
        $num = (int) str_replace($prefix, '', $row['application_ref']);
        if ($num > $max) $max = $num;
    }
    return $prefix . ($max + 1);
}

function generate_enrollment_number(PDO $pdo): string {
    $year = date('Y');
    $prefix = "ESI{$year}";
    $stmt = $pdo->prepare("SELECT enrollment_number FROM admission_applications WHERE enrollment_number LIKE ?");
    $stmt->execute([$prefix . '%']);
    $max = 0;
    while ($row = $stmt->fetch()) {
        if (!$row['enrollment_number']) continue;
        $num = (int) str_replace($prefix, '', $row['enrollment_number']);
        if ($num > $max) $max = $num;
    }
    return $prefix . str_pad((string)($max + 1), 3, '0', STR_PAD_LEFT);
}

function generate_certificate_number(PDO $pdo): string {
    $year = date('Y');
    $prefix = "CERT-ESI-{$year}-";
    $stmt = $pdo->prepare("SELECT certificate_number FROM certificates WHERE certificate_number LIKE ?");
    $stmt->execute([$prefix . '%']);
    $max = 0;
    while ($row = $stmt->fetch()) {
        $num = (int) str_replace($prefix, '', $row['certificate_number']);
        if ($num > $max) $max = $num;
    }
    return $prefix . str_pad((string)($max + 1), 4, '0', STR_PAD_LEFT);
}

function compute_grade(float $percentage): string {
    if ($percentage >= 85) return 'A+';
    if ($percentage >= 75) return 'A';
    if ($percentage >= 65) return 'B+';
    if ($percentage >= 55) return 'B';
    if ($percentage >= 45) return 'C';
    return 'Pass';
}

function slugify(string $text): string {
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    return trim((string)$text, '-');
}

// 7. Row Mappers (snake_case MySQL -> camelCase Frontend JSON)
function map_course(array $r): array {
    return [
        'id'                      => $r['id'],
        'code'                    => $r['code'],
        'slug'                    => $r['slug'],
        'title'                   => $r['title'],
        'category'                => $r['category'],
        'duration'                => $r['duration'],
        'eligibility'             => $r['eligibility'],
        'fee'                     => (int)$r['fee'],
        'registrationFee'         => (int)$r['registration_fee'],
        'studyMode'               => $r['study_mode'],
        'overview'                => $r['overview'],
        'syllabusJson'            => $r['syllabus_json'],
        'careerOpportunitiesJson' => $r['career_opportunities_json'],
        'featured'                => (bool)$r['featured'],
        'isActive'                => (bool)$r['is_active'],
        'createdAt'               => $r['created_at'],
        'updatedAt'               => $r['updated_at'],
    ];
}

function map_notice(array $r): array {
    return [
        'id'              => $r['id'],
        'title'           => $r['title'],
        'refNumber'       => $r['ref_number'],
        'category'        => $r['category'],
        'content'         => $r['content'],
        'publishedDate'   => $r['published_date'],
        'isNew'           => (bool)$r['is_new'],
        'showInTicker'    => (bool)$r['show_in_ticker'],
        'attachmentLabel' => $r['attachment_label'],
        'isActive'        => (bool)$r['is_active'],
        'createdAt'       => $r['created_at'],
        'updatedAt'       => $r['updated_at'],
    ];
}

function map_application(array $r): array {
    return [
        'id'                 => $r['id'],
        'applicationRef'     => $r['application_ref'],
        'status'             => $r['status'],
        'enrollmentNumber'   => $r['enrollment_number'],
        'courseId'           => $r['course_id'],
        'courseName'         => $r['course_name'],
        'courseCode'         => $r['course_code'],
        'session'            => $r['session'],
        'studyMode'          => $r['study_mode'],
        'fullName'           => $r['full_name'],
        'fatherName'         => $r['father_name'],
        'motherName'         => $r['mother_name'],
        'dob'                => $r['dob'],
        'gender'             => $r['gender'],
        'category'           => $r['category'],
        'aadharNumber'       => $r['aadhar_number'],
        'mobile'             => $r['mobile'],
        'email'              => $r['email'],
        'address'            => $r['address'],
        'city'               => $r['city'],
        'state'              => $r['state'],
        'pincode'            => $r['pincode'],
        'qualificationsJson' => $r['qualifications_json'],
        'extraDetailsJson'   => $r['extra_details_json'] ?? null,
        'photoUrl'           => $r['photo_url'],
        'signatureUrl'       => $r['signature_url'],
        'marksheetUrl'       => $r['marksheet_url'],
        'idProofUrl'         => $r['id_proof_url'],
        'isCompleted'        => (bool)$r['is_completed'],
        'marksObtained'      => $r['marks_obtained'] !== null ? (int)$r['marks_obtained'] : null,
        'totalMarks'         => $r['total_marks'] !== null ? (int)$r['total_marks'] : null,
        'percentage'         => $r['percentage'] !== null ? (float)$r['percentage'] : null,
        'grade'              => $r['grade'],
        'resultJson'         => $r['result_json'],
        'completionDate'     => $r['completion_date'],
        'remarks'            => $r['remarks'],
        'approvedAt'         => $r['approved_at'],
        'createdAt'          => $r['created_at'],
        'updatedAt'          => $r['updated_at'],
    ];
}

function map_certificate(array $r): array {
    return [
        'id'                => $r['id'],
        'certificateNumber' => $r['certificate_number'],
        'enrollmentNumber'  => $r['enrollment_number'],
        'applicationId'     => $r['application_id'],
        'studentName'       => $r['student_name'],
        'fatherName'        => $r['father_name'],
        'motherName'        => $r['mother_name'],
        'dob'               => $r['dob'],
        'photoUrl'          => $r['photo_url'],
        'courseName'        => $r['course_name'],
        'courseCode'        => $r['course_code'],
        'duration'          => $r['duration'],
        'session'           => $r['session'],
        'marksObtained'     => $r['marks_obtained'] !== null ? (int)$r['marks_obtained'] : null,
        'totalMarks'        => $r['total_marks'] !== null ? (int)$r['total_marks'] : null,
        'percentage'        => $r['percentage'] !== null ? (float)$r['percentage'] : null,
        'grade'             => $r['grade'],
        'completionDate'    => $r['completion_date'],
        'issueDate'         => $r['issue_date'],
        'status'            => $r['status'],
        'createdAt'         => $r['created_at'],
        'updatedAt'         => $r['updated_at'],
    ];
}
