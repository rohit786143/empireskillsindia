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
    return $mapped;
}

function enrich_application(array $rawRow, array $mapped): array {
    $mapped['extraDetailsJson'] = $rawRow['extra_details_json'] ?? ($mapped['extraDetailsJson'] ?? null);
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
    return $mapped;
}
