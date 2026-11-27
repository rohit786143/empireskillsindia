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
    ];
    foreach ($alters as $sql) {
        try { $pdo->exec($sql); } catch (PDOException $e) {}
    }
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
