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
        'id'         => $r['id'],
        'centerCode' => $r['center_code'],
        'centerName' => $r['center_name'],
        'ownerName'  => $r['owner_name'],
        'email'      => $r['email'],
        'phone'      => $r['phone'],
        'address'    => $r['address'] ?? '',
        'city'       => $r['city'] ?? '',
        'state'      => $r['state'] ?? '',
        'status'     => $r['status'],
        'createdAt'  => $r['created_at'],
        'updatedAt'  => $r['updated_at'],
    ];
}

function require_franchise(): array {
    if (empty($_SESSION['franchise_user'])) {
        json_response(['error' => 'Unauthorized. Please sign in to Franchise Portal.'], 401);
    }
    return $_SESSION['franchise_user'];
}
