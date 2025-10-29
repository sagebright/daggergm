-- Enable RLS on Archon Content Tables
-- These are read-only reference tables for documentation content
-- RLS policies allow public read access for authenticated and anonymous users

-- =============================================
-- Enable RLS on content reference tables
-- =============================================
ALTER TABLE content_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_ocr_data ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Read-only policies for public content
-- =============================================

-- Content chunks: Public read access
CREATE POLICY "Anyone can read content chunks" ON content_chunks
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Image OCR data: Public read access
CREATE POLICY "Anyone can read image OCR data" ON image_ocr_data
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- =============================================
-- Administrative policies (service role only)
-- =============================================

-- Note: Only the service role can INSERT/UPDATE/DELETE on these tables
-- This is enforced by the RLS system - no explicit policies needed for write operations
-- Write operations will be blocked for all users except service_role

COMMENT ON POLICY "Anyone can read content chunks" ON content_chunks IS
  'Public read access to documentation content chunks';
COMMENT ON POLICY "Anyone can read image OCR data" ON image_ocr_data IS
  'Public read access to OCR extracted data from documentation images';
