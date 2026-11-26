-- ============================================================================
-- Empire Skills India — Optional SQL Update (v3: Fee Tracking Columns)
-- Note: php-api/admissions.php ALSO auto-creates these columns automatically!
-- ============================================================================
ALTER TABLE `admission_applications`
  ADD COLUMN IF NOT EXISTS `total_fee` INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `fee_paid` INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `fee_payments_json` LONGTEXT DEFAULT NULL;
