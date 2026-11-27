<?php
// Auto-migrating MySQL schema & helpers for Franchise / Study Center Management

function ensure_franchise_schema(PDO $pdo): void {
    try {
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `franchises` (
              `id` VARCHAR(64) NOT NULL,
              `center_code` VARCHAR(32) NOT NULL,
              `center_name` VARCHAR(191) NOT NULL,
              `owner_name` VARCHAR(191) NOT NULL,
              `email` VARCHAR(191) NOT NULL,
              `password_hash` VARCHAR(255) NOT NULL,
              `phone` VARCHAR(32) NOT NULL DEFAULT "",
              `address` TEXT DEFAULT NULL,
              `city` VARCHAR(100) NOT NULL DEFAULT "",
              `state` VARCHAR(100) NOT NULL DEFAULT "",
              `status` VARCHAR(32) NOT NULL DEFAULT "ACTIVE",
              `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              UNIQUE KEY `uniq_franchise_code` (`center_code`),
              UNIQUE KEY `uniq_franchise_email` (`email`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    } catch (PDOException $e) {}

    $alters = [
        'ALTER TABLE admission_applications ADD COLUMN franchise_id VARCHAR(64) DEFAULT NULL',
        'ALTER TABLE admission_applications ADD COLUMN franchise_name VARCHAR(191) DEFAULT NULL',
        'ALTER TABLE admission_applications ADD COLUMN franchise_code VARCHAR(32) DEFAULT NULL',
        'ALTER TABLE admission_applications ADD COLUMN franchise_status VARCHAR(32) NOT NULL DEFAULT "DIRECT"',
        'ALTER TABLE admission_applications ADD COLUMN franchise_remarks TEXT DEFAULT NULL',
        'ALTER TABLE admission_applications ADD COLUMN forwarded_at DATETIME DEFAULT NULL',
        'ALTER TABLE admission_applications ADD COLUMN payment_screenshot_url LONGTEXT DEFAULT NULL',
        'ALTER TABLE admission_applications ADD COLUMN payment_utr VARCHAR(120) DEFAULT NULL',
        'ALTER TABLE admission_applications ADD COLUMN registration_fee_paid INT NOT NULL DEFAULT 0',
        'ALTER TABLE admission_applications ADD COLUMN franchise_forward_proof_url LONGTEXT DEFAULT NULL',
        'ALTER TABLE admission_applications ADD COLUMN franchise_forward_utr VARCHAR(120) DEFAULT NULL',
        'ALTER TABLE admission_applications ADD COLUMN franchise_paid_to_main INT NOT NULL DEFAULT 0',
        'ALTER TABLE admission_applications ADD COLUMN franchise_payments_json LONGTEXT DEFAULT NULL',
        'ALTER TABLE franchises ADD COLUMN payment_qr_url LONGTEXT DEFAULT NULL',
        'ALTER TABLE franchises ADD COLUMN upi_id VARCHAR(191) DEFAULT NULL',
        'ALTER TABLE franchises ADD COLUMN bank_name VARCHAR(191) DEFAULT NULL',
        'ALTER TABLE franchises ADD COLUMN account_holder_name VARCHAR(191) DEFAULT NULL',
        'ALTER TABLE franchises ADD COLUMN account_number VARCHAR(64) DEFAULT NULL',
        'ALTER TABLE franchises ADD COLUMN ifsc_code VARCHAR(32) DEFAULT NULL',
        'ALTER TABLE franchises ADD COLUMN registration_fee INT NOT NULL DEFAULT 500',
        'ALTER TABLE franchises ADD COLUMN is_main_center TINYINT(1) NOT NULL DEFAULT 0',
    ];
    foreach ($alters as $sql) {
        try { $pdo->exec($sql); } catch (PDOException $e) {}
    }

    // Ensure ESI-CTR-001 is always marked as the Main Center and has its official Union Bank UPI QR & details
    try {
        $pdo->exec('UPDATE franchises SET is_main_center = 1 WHERE UPPER(center_code) = "ESI-CTR-001"');
        $pdo->exec(
            'UPDATE franchises
             SET payment_qr_url = CASE WHEN payment_qr_url IS NULL OR payment_qr_url = "" THEN "/payment-qr/empire-main-qr.png" ELSE payment_qr_url END,
                 upi_id = CASE WHEN upi_id IS NULL OR upi_id = "" THEN "46769601@ubin" ELSE upi_id END,
                 bank_name = CASE WHEN bank_name IS NULL OR bank_name = "" THEN "Union Bank of India" ELSE bank_name END,
                 account_holder_name = CASE WHEN account_holder_name IS NULL OR account_holder_name = "" THEN "EMPIRE EDUCATION FOUNDATION" ELSE account_holder_name END,
                 account_number = CASE WHEN account_number IS NULL OR account_number = "" THEN "628101010055997" ELSE account_number END,
                 ifsc_code = CASE WHEN ifsc_code IS NULL OR ifsc_code = "" THEN "UBIN0536211" ELSE ifsc_code END
             WHERE is_main_center = 1 OR UPPER(center_code) = "ESI-CTR-001"'
        );
    } catch (PDOException $e) {}

    // Online Monthly Fee Submissions table (Exclusive to Main Center students)
    try {
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `student_fee_submissions` (
              `id` VARCHAR(64) NOT NULL,
              `application_id` VARCHAR(64) NOT NULL,
              `franchise_id` VARCHAR(64) NOT NULL,
              `enrollment_number` VARCHAR(64) NOT NULL,
              `student_name` VARCHAR(191) NOT NULL,
              `course_name` VARCHAR(191) NOT NULL,
              `fee_head` VARCHAR(120) NOT NULL,
              `amount` INT NOT NULL DEFAULT 0,
              `utr` VARCHAR(120) DEFAULT NULL,
              `payment_date` VARCHAR(32) NOT NULL,
              `receipt_url` LONGTEXT NOT NULL,
              `status` VARCHAR(32) NOT NULL DEFAULT "PENDING",
              `remarks` TEXT DEFAULT NULL,
              `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              KEY `idx_sfs_app` (`application_id`),
              KEY `idx_sfs_fr` (`franchise_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    } catch (PDOException $e) {}

    // Franchise-to-Main-Admin Royalty Payment Requests (requires Main Admin Approve / Reject with remark)
    try {
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `franchise_royalty_submissions` (
              `id` VARCHAR(64) NOT NULL,
              `application_id` VARCHAR(64) NOT NULL,
              `franchise_id` VARCHAR(64) NOT NULL,
              `franchise_name` VARCHAR(191) NOT NULL DEFAULT "",
              `franchise_code` VARCHAR(32) NOT NULL DEFAULT "",
              `enrollment_number` VARCHAR(64) NOT NULL DEFAULT "",
              `student_name` VARCHAR(191) NOT NULL,
              `course_name` VARCHAR(191) NOT NULL DEFAULT "",
              `amount` INT NOT NULL DEFAULT 0,
              `utr` VARCHAR(120) NOT NULL,
              `payment_date` VARCHAR(32) NOT NULL,
              `proof_url` LONGTEXT NOT NULL,
              `franchise_remarks` TEXT DEFAULT NULL,
              `status` VARCHAR(32) NOT NULL DEFAULT "PENDING",
              `admin_remarks` TEXT DEFAULT NULL,
              `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              KEY `idx_frs_app` (`application_id`),
              KEY `idx_frs_fr` (`franchise_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    } catch (PDOException $e) {}
}

function is_main_center_row(array $r): bool {
    if (!empty($r['is_main_center']) && (int)$r['is_main_center'] === 1) return true;
    return strtoupper((string)($r['center_code'] ?? '')) === 'ESI-CTR-001';
}

function generate_center_code(PDO $pdo): string {
    $prefix = 'ESI-CTR-';
    $stmt = $pdo->prepare('SELECT center_code FROM franchises WHERE center_code LIKE ?');
    $stmt->execute([$prefix . '%']);
    $max = 0;
    while ($row = $stmt->fetch()) {
        $num = (int)str_replace($prefix, '', $row['center_code']);
        if ($num > $max) $max = $num;
    }
    return $prefix . str_pad((string)($max + 1), 3, '0', STR_PAD_LEFT);
}

function map_franchise(array $r): array {
    return [
        'id'                => $r['id'],
        'centerCode'        => $r['center_code'],
        'centerName'        => $r['center_name'],
        'ownerName'         => $r['owner_name'],
        'email'             => $r['email'],
        'phone'             => $r['phone'],
        'address'           => $r['address'] ?? '',
        'city'              => $r['city'] ?? '',
        'state'             => $r['state'] ?? '',
        'status'            => $r['status'],
        'paymentQrUrl'      => $r['payment_qr_url'] ?? '',
        'upiId'             => $r['upi_id'] ?? '',
        'bankName'          => $r['bank_name'] ?? '',
        'accountHolderName' => $r['account_holder_name'] ?? '',
        'accountNumber'     => $r['account_number'] ?? '',
        'ifscCode'          => $r['ifsc_code'] ?? '',
        'registrationFee'   => isset($r['registration_fee']) && (int)$r['registration_fee'] > 0 ? (int)$r['registration_fee'] : 500,
        'isMainCenter'      => is_main_center_row($r),
        'createdAt'         => $r['created_at'],
        'updatedAt'         => $r['updated_at'],
    ];
}

function require_franchise(): array {
    if (empty($_SESSION['franchise_user'])) {
        json_response(['error' => 'Unauthorized. Please sign in to Franchise Portal.'], 401);
    }
    return $_SESSION['franchise_user'];
}
