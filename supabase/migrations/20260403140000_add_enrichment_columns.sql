-- Add enrichment data columns to scans table
-- Apify social metrics + Meta/Google ad detection results
-- These were previously computed but never persisted to DB

ALTER TABLE scans
  ADD COLUMN IF NOT EXISTS social_enrichment jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ad_detection jsonb DEFAULT NULL;

COMMENT ON COLUMN scans.social_enrichment IS 'Apify social profile metrics (followers, engagement, etc.)';
COMMENT ON COLUMN scans.ad_detection IS 'Meta Ad Library + Google Ads Transparency detection results';
