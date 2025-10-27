-- Daggerheart Content Database
-- Creates 13 tables for canonical Daggerheart game content from official SRD
-- Includes vector embeddings for semantic search and full-text search indexes
-- Total expected entries: ~900+ across all tables

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- 1. ADVERSARIES (~130 entries)
-- =============================================
CREATE TABLE daggerheart_adversaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    tier INT NOT NULL CHECK (tier BETWEEN 1 AND 3),
    type TEXT NOT NULL, -- Solo, Bruiser, Standard, Minion, Horde, Ranged, Skulk, Leader, Support, Social
    description TEXT NOT NULL,
    motives_tactics TEXT[], -- ["Burrow", "drag away", "feed"]

    -- Combat Stats
    difficulty INT NOT NULL,
    thresholds TEXT, -- "8/15" or "None"
    hp INT NOT NULL,
    stress INT NOT NULL,
    atk TEXT NOT NULL, -- "+3"
    weapon TEXT NOT NULL,
    range TEXT NOT NULL, -- Melee, Very Close, Close, Far, Very Far
    dmg TEXT NOT NULL, -- "1d12+2 phy"

    -- Skills/Abilities
    experiences JSONB, -- {"Tremor Sense": 2, "Commander": 2}
    features JSONB[], -- [{name: "Relentless (3)", type: "Passive", desc: "..."}]

    -- Search & Discovery
    searchable_text TEXT,
    embedding vector(1536),

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_adversaries_tier ON daggerheart_adversaries(tier);
CREATE INDEX idx_adversaries_type ON daggerheart_adversaries(type);
CREATE INDEX idx_adversaries_name ON daggerheart_adversaries(name);
CREATE INDEX idx_adversaries_embedding ON daggerheart_adversaries USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_adversaries_search ON daggerheart_adversaries USING GIN (to_tsvector('english', searchable_text));

COMMENT ON TABLE daggerheart_adversaries IS 'Canonical Daggerheart adversaries from official SRD (~130 entries)';

-- =============================================
-- 2. ENVIRONMENTS (~20 entries)
-- =============================================
CREATE TABLE daggerheart_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    tier INT NOT NULL CHECK (tier BETWEEN 1 AND 3),
    type TEXT DEFAULT 'Event', -- Event, Hazard, Scene Setup
    description TEXT NOT NULL,
    impulses TEXT[], -- ["Profane the land", "unite realms"]

    -- Scene Mechanics
    difficulty INT,
    potential_adversaries TEXT[], -- Suggested enemy types/names
    features JSONB[], -- [{name: "Desecrated Ground", type: "Passive", desc: "...", gm_prompts: "..."}]

    -- Search & Discovery
    searchable_text TEXT,
    embedding vector(1536),

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_environments_tier ON daggerheart_environments(tier);
CREATE INDEX idx_environments_type ON daggerheart_environments(type);
CREATE INDEX idx_environments_embedding ON daggerheart_environments USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_environments_search ON daggerheart_environments USING GIN (to_tsvector('english', searchable_text));

COMMENT ON TABLE daggerheart_environments IS 'Environmental events and hazards from official SRD (~20 entries)';

-- =============================================
-- 3. WEAPONS (~194 entries)
-- =============================================
CREATE TABLE daggerheart_weapons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    weapon_category TEXT NOT NULL, -- 'Primary' or 'Secondary'
    tier INT NOT NULL CHECK (tier BETWEEN 1 AND 3),

    -- Weapon Stats
    trait TEXT NOT NULL, -- Strength, Agility, Finesse, Instinct, Knowledge, Presence
    range TEXT NOT NULL, -- Melee, Very Close, Close, Far, Very Far
    damage TEXT NOT NULL, -- 'd10+9 phy', '2d6+5 mag'
    burden TEXT, -- Two-Handed, One-Handed, NULL

    -- Special Properties
    feature TEXT, -- Special ability or "—"

    -- Search & Discovery
    searchable_text TEXT,
    embedding vector(1536),

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weapons_tier ON daggerheart_weapons(tier);
CREATE INDEX idx_weapons_category ON daggerheart_weapons(weapon_category);
CREATE INDEX idx_weapons_trait ON daggerheart_weapons(trait);
CREATE INDEX idx_weapons_embedding ON daggerheart_weapons USING ivfflat (embedding vector_cosine_ops);

COMMENT ON TABLE daggerheart_weapons IS 'Weapons from official SRD (~194 entries)';

-- =============================================
-- 4. ARMOR (~36 entries)
-- =============================================
CREATE TABLE daggerheart_armor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    tier INT NOT NULL CHECK (tier BETWEEN 1 AND 3),

    -- Armor Stats
    base_thresholds TEXT NOT NULL, -- "13/31"
    base_score INT NOT NULL,
    feature TEXT, -- "Heavy: -1 to Evasion" or "—"

    -- Search & Discovery
    searchable_text TEXT,
    embedding vector(1536),

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_armor_tier ON daggerheart_armor(tier);
CREATE INDEX idx_armor_embedding ON daggerheart_armor USING ivfflat (embedding vector_cosine_ops);

COMMENT ON TABLE daggerheart_armor IS 'Armor from official SRD (~36 entries)';

-- =============================================
-- 5. ITEMS (~62 entries)
-- =============================================
CREATE TABLE daggerheart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    item_type TEXT DEFAULT 'Item', -- Item, Relic, Charm

    -- Search & Discovery
    searchable_text TEXT,
    embedding vector(1536),

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_items_type ON daggerheart_items(item_type);
CREATE INDEX idx_items_embedding ON daggerheart_items USING ivfflat (embedding vector_cosine_ops);

COMMENT ON TABLE daggerheart_items IS 'Items from official SRD (~62 entries)';

-- =============================================
-- 6. CONSUMABLES (~62 entries)
-- =============================================
CREATE TABLE daggerheart_consumables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    uses INT DEFAULT 1, -- Number of uses before consumed

    -- Search & Discovery
    searchable_text TEXT,
    embedding vector(1536),

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consumables_embedding ON daggerheart_consumables USING ivfflat (embedding vector_cosine_ops);

COMMENT ON TABLE daggerheart_consumables IS 'Consumables from official SRD (~62 entries)';

-- =============================================
-- 7. ANCESTRIES (~20 entries)
-- =============================================
CREATE TABLE daggerheart_ancestries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    features JSONB[], -- [{name: "Purposeful Design", desc: "..."}]

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE daggerheart_ancestries IS 'Character ancestries from official SRD (~20 entries)';

-- =============================================
-- 8. CLASSES (~11 entries)
-- =============================================
CREATE TABLE daggerheart_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,

    -- Class Stats
    domains TEXT[], -- ['Grace', 'Codex']
    starting_evasion INT NOT NULL,
    starting_hp INT NOT NULL,
    class_items TEXT[],

    -- Class Features
    hope_feature JSONB, -- {name: "Make a Scene", desc: "...", cost: 3}
    class_feature JSONB, -- {name: "Rally", desc: "..."}

    -- Flavor
    background_questions TEXT[],
    connection_questions TEXT[],

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE daggerheart_classes IS 'Character classes from official SRD (~11 entries)';

-- =============================================
-- 9. SUBCLASSES (~20 entries)
-- =============================================
CREATE TABLE daggerheart_subclasses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    parent_class TEXT NOT NULL, -- Class name (FK would require seeding order)
    description TEXT NOT NULL,
    features JSONB[], -- Subclass-specific features

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subclasses_class ON daggerheart_subclasses(parent_class);

COMMENT ON TABLE daggerheart_subclasses IS 'Character subclasses from official SRD (~20 entries)';

-- =============================================
-- 10. DOMAINS (~11 entries)
-- =============================================
CREATE TABLE daggerheart_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE daggerheart_domains IS 'Domain cards from official SRD (~11 entries)';

-- =============================================
-- 11. ABILITIES (~191 entries)
-- =============================================
CREATE TABLE daggerheart_abilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ability_type TEXT NOT NULL, -- Foundation, Specialization, Pinnacle
    parent_class TEXT, -- Class name
    parent_subclass TEXT, -- Subclass name
    domain TEXT, -- Which domain card this belongs to

    -- Ability Details
    description TEXT NOT NULL,
    prerequisites TEXT[], -- Other abilities required
    level_requirement INT,

    -- Search & Discovery
    searchable_text TEXT,

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_abilities_class ON daggerheart_abilities(parent_class);
CREATE INDEX idx_abilities_subclass ON daggerheart_abilities(parent_subclass);
CREATE INDEX idx_abilities_type ON daggerheart_abilities(ability_type);
CREATE INDEX idx_abilities_domain ON daggerheart_abilities(domain);

COMMENT ON TABLE daggerheart_abilities IS 'Character abilities from official SRD (~191 entries)';

-- =============================================
-- 12. COMMUNITIES (~11 entries)
-- =============================================
CREATE TABLE daggerheart_communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    community_moves TEXT[], -- Downtime/community actions

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE daggerheart_communities IS 'Community types from official SRD (~11 entries)';

-- =============================================
-- 13. FRAMES (~3 entries)
-- =============================================
CREATE TABLE daggerheart_frames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    themes TEXT[],
    typical_adversaries TEXT[],
    lore TEXT,

    -- Search & Discovery
    embedding vector(1536),

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_frames_name ON daggerheart_frames(name);
CREATE INDEX idx_frames_embedding ON daggerheart_frames USING ivfflat (embedding vector_cosine_ops);

COMMENT ON TABLE daggerheart_frames IS 'Adventure frames from official SRD (Supernatural Horror, Profane Ritual, Protect the Realm)';
