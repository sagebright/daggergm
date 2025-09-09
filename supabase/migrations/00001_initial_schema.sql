-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- User profiles with credit system
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    credits INT DEFAULT 1 CHECK (credits >= 0),
    total_purchased INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adventures with comprehensive metadata
CREATE TABLE adventures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users,
    guest_email TEXT,
    guest_token UUID DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    frame TEXT NOT NULL,
    focus TEXT NOT NULL,
    state TEXT DEFAULT 'draft' CHECK (state IN ('draft', 'finalized', 'exported')),
    config JSONB NOT NULL DEFAULT '{}',
    movements JSONB[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    exported_at TIMESTAMPTZ,
    
    -- Ensure guest adventures have email
    CONSTRAINT guest_adventure_email CHECK (
        (user_id IS NOT NULL) OR (guest_email IS NOT NULL)
    )
);

-- Frame-aware content with vector embeddings
CREATE TABLE game_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL,
    frame TEXT,
    source_book TEXT NOT NULL,
    game_element JSONB NOT NULL,
    searchable_text TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semantic caching for LLM responses
CREATE TABLE llm_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_hash TEXT UNIQUE NOT NULL,
    prompt_params JSONB NOT NULL,
    response TEXT NOT NULL,
    response_metadata JSONB DEFAULT '{}',
    model TEXT NOT NULL,
    temperature NUMERIC(3,2),
    token_count INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    access_count INT DEFAULT 1
);

-- Purchase history for auditing
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users,
    guest_email TEXT,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    amount INT NOT NULL,
    credits INT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_adventures_user_id ON adventures(user_id);
CREATE INDEX idx_adventures_guest_email ON adventures(guest_email);
CREATE INDEX idx_adventures_state ON adventures(state);
CREATE INDEX idx_game_content_frame ON game_content(frame);
CREATE INDEX idx_game_content_type ON game_content(content_type);
CREATE INDEX idx_game_content_embedding ON game_content USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_llm_cache_prompt_hash ON llm_cache(prompt_hash);
CREATE INDEX idx_llm_cache_accessed ON llm_cache(accessed_at);

-- Full-text search indexes
CREATE INDEX idx_game_content_search ON game_content USING GIN (to_tsvector('english', searchable_text));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_adventures_updated_at BEFORE UPDATE ON adventures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();