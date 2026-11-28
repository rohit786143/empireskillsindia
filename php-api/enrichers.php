<?php
// Shared row enrichers (auto-deployed via FTP even while php-api/config.php stays untouched on Hostinger)

function enrich_course(array $rawRow, array $mapped): array {
    $fbJson = $rawRow['fee_breakdown_json'] ?? ($mapped['feeBreakdownJson'] ?? null);
    $fb = $fbJson ? json_decode($fbJson, true) : [];
    if (!is_array($fb)) $fb = [];

    // Ensure 'O' Level (NIELIT) always includes Sem1 (9000), Sem2 (9000) & Exam Fee (4200 = 2100 + 2100)
    $code = strtoupper((string)($mapped['code'] ?? ''));
    if ($code === 'NIELIT-OLV-201' && empty($fb['examFee'])) {
        $fb['registrationFee'] = $fb['registrationFee'] ?? 500;
        $fb['admissionFee']    = $fb['admissionFee'] ?? 5000;
        $fb['sem1Fee']         = $fb['sem1Fee'] ?? 9000;
        $fb['sem2Fee']         = $fb['sem2Fee'] ?? 9000;
        $fb['courseFee']       = (int)$mapped['fee'];
        $fb['examFee']         = 4200;
        $fb['examFeeNote']     = '₹4,200 (₹2,100 + ₹2,100)';
        $fbJson = json_encode($fb, JSON_UNESCAPED_UNICODE);
    }

    $mapped['feeBreakdownJson'] = $fbJson;
    $examFee = isset($fb['examFee']) ? (int)$fb['examFee'] : 0;
    $mapped['examFee'] = $examFee;
    $mapped['grandTotalFee'] = (int)$mapped['fee'] + $examFee;
    $mapped['enrollmentPrefix'] = !empty($rawRow['enrollment_prefix']) ? trim((string)$rawRow['enrollment_prefix']) : '';
    $mapped['serialPrefix'] = !empty($rawRow['serial_prefix']) ? trim((string)$rawRow['serial_prefix']) : '';
    return $mapped;
}

function next_prefixed_sequence(PDO $pdo, string $prefix, array $sources, int $padLen = 4): string {
    $cleanPrefix = strtoupper(trim($prefix));
    $maxNum = 0;
    $prefixLen = strlen($cleanPrefix);

    foreach ($sources as $src) {
        $table = $src[0];
        $col = $src[1];
        try {
            $stmt = $pdo->prepare("SELECT `{$col}` FROM `{$table}` WHERE `{$col}` LIKE ?");
            $stmt->execute([$cleanPrefix . '%']);
            while ($val = $stmt->fetchColumn()) {
                $valStr = strtoupper((string)$val);
                if (strpos($valStr, $cleanPrefix) === 0) {
                    $suffix = substr($valStr, $prefixLen);
                    if ($suffix !== '' && ctype_digit($suffix)) {
                        $n = (int)$suffix;
                        if ($n > $maxNum) $maxNum = $n;
                    }
                }
            }
        } catch (PDOException $e) {}
    }

    return $cleanPrefix . str_pad((string)($maxNum + 1), $padLen, '0', STR_PAD_LEFT);
}

function generate_course_enrollment_and_serial(
    PDO $pdo,
    ?string $courseId,
    ?string $courseCode = null,
    ?string $existingEnrollment = null,
    ?string $existingSerial = null
): array {
    foreach ([
        'ALTER TABLE courses ADD COLUMN enrollment_prefix VARCHAR(64) DEFAULT NULL',
        'ALTER TABLE courses ADD COLUMN serial_prefix VARCHAR(64) DEFAULT NULL',
        'ALTER TABLE admission_applications ADD COLUMN serial_number VARCHAR(64) DEFAULT NULL',
    ] as $sql) {
        try { $pdo->exec($sql); } catch (PDOException $e) {}
    }

    $enrPrefix = '';
    $serPrefix = '';
    try {
        if (!empty($courseId)) {
            $stmt = $pdo->prepare('SELECT enrollment_prefix, serial_prefix FROM courses WHERE id = ? LIMIT 1');
            $stmt->execute([$courseId]);
            $cRow = $stmt->fetch();
            if ($cRow) {
                $enrPrefix = strtoupper(trim((string)($cRow['enrollment_prefix'] ?? '')));
                $serPrefix = strtoupper(trim((string)($cRow['serial_prefix'] ?? '')));
            }
        } elseif (!empty($courseCode)) {
            $stmt = $pdo->prepare('SELECT enrollment_prefix, serial_prefix FROM courses WHERE code = ? LIMIT 1');
            $stmt->execute([$courseCode]);
            $cRow = $stmt->fetch();
            if ($cRow) {
                $enrPrefix = strtoupper(trim((string)($cRow['enrollment_prefix'] ?? '')));
                $serPrefix = strtoupper(trim((string)($cRow['serial_prefix'] ?? '')));
            }
        }
    } catch (PDOException $e) {}

    $enrollmentNumber = !empty($existingEnrollment) ? trim($existingEnrollment) : '';
    if ($enrollmentNumber === '') {
        if ($enrPrefix !== '') {
            $enrollmentNumber = next_prefixed_sequence($pdo, $enrPrefix, [
                ['admission_applications', 'enrollment_number'],
                ['certificates', 'enrollment_number'],
            ], 4);
        } else {
            $enrollmentNumber = generate_enrollment_number($pdo);
        }
    }

    $serialNumber = !empty($existingSerial) ? trim($existingSerial) : '';
    if ($serialNumber === '') {
        if ($serPrefix !== '') {
            $serialNumber = next_prefixed_sequence($pdo, $serPrefix, [
                ['admission_applications', 'serial_number'],
                ['certificates', 'certificate_number'],
            ], 4);
        } else {
            $serialNumber = generate_certificate_number($pdo);
        }
    }

    return [
        'enrollmentNumber' => $enrollmentNumber,
        'serialNumber'     => $serialNumber,
    ];
}

function enrich_application(array $rawRow, array $mapped): array {
    $mapped['extraDetailsJson'] = $rawRow['extra_details_json'] ?? ($mapped['extraDetailsJson'] ?? null);
    $mapped['serialNumber'] = !empty($rawRow['serial_number']) ? trim((string)$rawRow['serial_number']) : null;
    $mapped['franchiseId'] = $rawRow['franchise_id'] ?? null;
    $mapped['franchiseName'] = $rawRow['franchise_name'] ?? null;
    $mapped['franchiseCode'] = $rawRow['franchise_code'] ?? null;
    $mapped['franchiseStatus'] = $rawRow['franchise_status'] ?? 'DIRECT';
    $mapped['franchiseRemarks'] = $rawRow['franchise_remarks'] ?? null;
    $mapped['forwardedAt'] = $rawRow['forwarded_at'] ?? null;
    $mapped['paymentScreenshotUrl'] = $rawRow['payment_screenshot_url'] ?? null;
    $mapped['paymentUtr'] = $rawRow['payment_utr'] ?? null;
    $mapped['registrationFeePaid'] = isset($rawRow['registration_fee_paid']) ? (int)$rawRow['registration_fee_paid'] : 0;
    $mapped['totalFee'] = isset($rawRow['total_fee']) && $rawRow['total_fee'] !== null
        ? (int)$rawRow['total_fee']
        : (int)($mapped['totalFee'] ?? 0);
    $mapped['feePaid'] = isset($rawRow['fee_paid']) && $rawRow['fee_paid'] !== null
        ? (int)$rawRow['fee_paid']
        : (int)($mapped['feePaid'] ?? 0);
    $mapped['feePaymentsJson'] = $rawRow['fee_payments_json'] ?? ($mapped['feePaymentsJson'] ?? null);

    $fbJson = $rawRow['joined_fee_breakdown'] ?? null;
    $mapped['courseFeeBreakdownJson'] = $fbJson;

    $examFee = 0;
    if ($fbJson) {
        $fb = json_decode($fbJson, true);
        if (is_array($fb) && isset($fb['examFee'])) {
            $examFee = (int)$fb['examFee'];
        }
    }
    $courseBaseFee = isset($rawRow['joined_course_fee']) && $rawRow['joined_course_fee'] !== null
        ? (int)$rawRow['joined_course_fee']
        : 0;
    $courseGrandTotal = $courseBaseFee + $examFee;
    $mapped['courseTotalFee'] = $courseGrandTotal;

    if ($mapped['totalFee'] <= 0 && $courseGrandTotal > 0) {
        $mapped['totalFee'] = $courseGrandTotal;
    }

    // Franchise-to-Main-Admin Settlement Math: ₹500 on forward + 15% of remaining course fee
    $effectiveTotal = max(0, (int)$mapped['totalFee']);
    $forwardFee = 500;
    $remainingBase = max(0, $effectiveTotal - $forwardFee);
    $royalty15 = (int)round($remainingBase * 0.15);
    $franchiseTotalDue = $forwardFee + $royalty15;
    $franchisePaid = isset($rawRow['franchise_paid_to_main']) ? (int)$rawRow['franchise_paid_to_main'] : 0;

    $mapped['franchiseForwardFee'] = $forwardFee;
    $mapped['franchiseRemainingBase'] = $remainingBase;
    $mapped['franchiseRoyalty15'] = $royalty15;
    $mapped['franchiseTotalDue'] = $franchiseTotalDue;
    $mapped['franchisePaidToMain'] = $franchisePaid;
    $mapped['franchisePendingToMain'] = max(0, $franchiseTotalDue - $franchisePaid);
    $mapped['franchisePaymentsJson'] = $rawRow['franchise_payments_json'] ?? null;
    $mapped['franchiseForwardProofUrl'] = $rawRow['franchise_forward_proof_url'] ?? null;
    $mapped['franchiseForwardUtr'] = $rawRow['franchise_forward_utr'] ?? null;

    return $mapped;
}
