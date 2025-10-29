-- Enable RLS on Daggerheart Content Tables
-- These are read-only reference tables from the official Daggerheart SRD
-- RLS policies allow public read access for authenticated and anonymous users

-- =============================================
-- Enable RLS on all Daggerheart content tables
-- =============================================
ALTER TABLE daggerheart_adversaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daggerheart_environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daggerheart_weapons ENABLE ROW LEVEL SECURITY;
ALTER TABLE daggerheart_armor ENABLE ROW LEVEL SECURITY;
ALTER TABLE daggerheart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daggerheart_consumables ENABLE ROW LEVEL SECURITY;
ALTER TABLE daggerheart_ancestries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daggerheart_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daggerheart_subclasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE daggerheart_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE daggerheart_abilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE daggerheart_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE daggerheart_frames ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Read-only policies for public game content
-- =============================================

-- Adversaries: Public read access
CREATE POLICY "Anyone can read adversaries" ON daggerheart_adversaries
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Environments: Public read access
CREATE POLICY "Anyone can read environments" ON daggerheart_environments
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Weapons: Public read access
CREATE POLICY "Anyone can read weapons" ON daggerheart_weapons
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Armor: Public read access
CREATE POLICY "Anyone can read armor" ON daggerheart_armor
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Items: Public read access
CREATE POLICY "Anyone can read items" ON daggerheart_items
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Consumables: Public read access
CREATE POLICY "Anyone can read consumables" ON daggerheart_consumables
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Ancestries: Public read access
CREATE POLICY "Anyone can read ancestries" ON daggerheart_ancestries
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Classes: Public read access
CREATE POLICY "Anyone can read classes" ON daggerheart_classes
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Subclasses: Public read access
CREATE POLICY "Anyone can read subclasses" ON daggerheart_subclasses
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Domains: Public read access
CREATE POLICY "Anyone can read domains" ON daggerheart_domains
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Abilities: Public read access
CREATE POLICY "Anyone can read abilities" ON daggerheart_abilities
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Communities: Public read access
CREATE POLICY "Anyone can read communities" ON daggerheart_communities
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Frames: Public read access
CREATE POLICY "Anyone can read frames" ON daggerheart_frames
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- =============================================
-- Administrative policies (service role only)
-- =============================================

-- Note: Only the service role can INSERT/UPDATE/DELETE on these tables
-- This is enforced by the RLS system - no explicit policies needed for write operations
-- Write operations will be blocked for all users except service_role

COMMENT ON POLICY "Anyone can read adversaries" ON daggerheart_adversaries IS
  'Public read access to Daggerheart adversaries from official SRD';
COMMENT ON POLICY "Anyone can read environments" ON daggerheart_environments IS
  'Public read access to Daggerheart environments from official SRD';
COMMENT ON POLICY "Anyone can read weapons" ON daggerheart_weapons IS
  'Public read access to Daggerheart weapons from official SRD';
COMMENT ON POLICY "Anyone can read armor" ON daggerheart_armor IS
  'Public read access to Daggerheart armor from official SRD';
COMMENT ON POLICY "Anyone can read items" ON daggerheart_items IS
  'Public read access to Daggerheart items from official SRD';
COMMENT ON POLICY "Anyone can read consumables" ON daggerheart_consumables IS
  'Public read access to Daggerheart consumables from official SRD';
COMMENT ON POLICY "Anyone can read ancestries" ON daggerheart_ancestries IS
  'Public read access to Daggerheart ancestries from official SRD';
COMMENT ON POLICY "Anyone can read classes" ON daggerheart_classes IS
  'Public read access to Daggerheart classes from official SRD';
COMMENT ON POLICY "Anyone can read subclasses" ON daggerheart_subclasses IS
  'Public read access to Daggerheart subclasses from official SRD';
COMMENT ON POLICY "Anyone can read domains" ON daggerheart_domains IS
  'Public read access to Daggerheart domains from official SRD';
COMMENT ON POLICY "Anyone can read abilities" ON daggerheart_abilities IS
  'Public read access to Daggerheart abilities from official SRD';
COMMENT ON POLICY "Anyone can read communities" ON daggerheart_communities IS
  'Public read access to Daggerheart communities from official SRD';
COMMENT ON POLICY "Anyone can read frames" ON daggerheart_frames IS
  'Public read access to Daggerheart frames from official SRD';
