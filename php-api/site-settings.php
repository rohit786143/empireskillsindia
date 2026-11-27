<?php
require_once __DIR__ . '/config.php';

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$pdo = get_db();

try {
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `site_settings` (
          `id` VARCHAR(32) NOT NULL,
          `settings_json` LONGTEXT NOT NULL,
          `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
} catch (PDOException $e) {}

$defaults = [
    'helpline'           => '7560001910 / 9882269009 / 01905356777',
    'email'              => 'info@empireskillsindia.com',
    'admissionsEmail'    => 'admissions@empireskillsindia.com',
    'address'            => 'Academic Block, Plot No. 14, Institutional Area, Sector 62, Noida - 201309 (NCR), India',
    'officeHours'        => 'Monday – Saturday: 09:30 AM to 06:00 PM IST',
    'facebook'           => 'https://www.facebook.com/share/1A9d2LWUKC/',
    'instagram'          => 'https://www.instagram.com/empire_skillsindia?utm_source=qr&jplx=MWp1dXZrYmU0OWcycg==',
    'adminPaymentQrUrl'  => '/payment-qr/empire-main-qr.png',
    'adminUpiId'         => '46769601@ubin',
    'adminBankName'      => 'Union Bank of India',
    'adminAccountHolder' => 'EMPIRE EDUCATION FOUNDATION',
    'adminAccountNumber' => '628101010055997',
    'adminIfscCode'      => 'UBIN0536211',
];

function load_site_settings(PDO $pdo, array $defaults): array {
    $stmt = $pdo->prepare('SELECT settings_json FROM site_settings WHERE id = "main" LIMIT 1');
    $stmt->execute();
    $row = $stmt->fetch();
    if ($row && !empty($row['settings_json'])) {
        $decoded = json_decode($row['settings_json'], true);
        if (is_array($decoded)) {
            $merged = array_merge($defaults, $decoded);
            // Fall back to official Main Admin QR/UPI if stored values are empty
            foreach (['adminPaymentQrUrl', 'adminUpiId', 'adminBankName', 'adminAccountHolder', 'adminAccountNumber', 'adminIfscCode'] as $pk) {
                if (empty($merged[$pk])) $merged[$pk] = $defaults[$pk];
            }
            return $merged;
        }
    }
    return $defaults;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET: Public site settings (contact info, social links)
if ($method === 'GET') {
    json_response(['settings' => load_site_settings($pdo, $defaults)]);
}

// POST / PATCH / PUT: Update site settings [Admin]
if ($method === 'POST' || $method === 'PATCH' || $method === 'PUT') {
    require_admin();
    $body = get_json_body();
    $current = load_site_settings($pdo, $defaults);

    foreach (array_keys($defaults) as $k) {
        if (array_key_exists($k, $body)) {
            $current[$k] = trim((string)$body[$k]);
        }
    }

    $json = json_encode($current, JSON_UNESCAPED_UNICODE);
    $stmt = $pdo->prepare(
        'INSERT INTO site_settings (id, settings_json) VALUES ("main", ?)
         ON DUPLICATE KEY UPDATE settings_json = VALUES(settings_json)'
    );
    $stmt->execute([$json]);

    json_response(['settings' => $current, 'message' => 'Contact details updated successfully.']);
}

json_response(['error' => 'Method not allowed.'], 405);
