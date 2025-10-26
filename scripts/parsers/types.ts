/**
 * TypeScript type definitions for Daggerheart SRD content parsers
 * These types match the database schema in 00008_daggerheart_content_tables.sql
 */

// =============================================
// ADVERSARIES
// =============================================
export interface AdversaryFeature {
  name: string
  type: 'Passive' | 'Action' | 'Reaction'
  desc: string
}

export interface Adversary {
  name: string
  tier: number // 1-3
  type: string // Solo, Bruiser, Standard, Minion, Horde, Ranged, Skulk, Leader, Support, Social
  description: string
  motives_tactics: string[]
  difficulty: number
  thresholds: string // "8/15" or "None"
  hp: number
  stress: number
  atk: string // "+3"
  weapon: string
  range: string // Melee, Very Close, Close, Far, Very Far
  dmg: string // "1d12+2 phy"
  experiences?: Record<string, number> // {"Tremor Sense": 2}
  features: AdversaryFeature[]
  searchable_text: string
  source_book?: string
}

// =============================================
// ENVIRONMENTS
// =============================================
export interface EnvironmentFeature {
  name: string
  type: 'Passive' | 'Action' | 'GM Prompt'
  desc: string
  gm_prompts?: string
}

export interface Environment {
  name: string
  tier: number // 1-3
  type?: string // Event, Hazard, Scene Setup
  description: string
  impulses?: string[]
  difficulty?: number
  potential_adversaries?: string[]
  features?: EnvironmentFeature[]
  searchable_text: string
  source_book?: string
}

// =============================================
// WEAPONS
// =============================================
export interface Weapon {
  name: string
  weapon_category: 'Primary' | 'Secondary'
  tier: number // 1-3
  trait: string // Strength, Agility, Finesse, Instinct, Knowledge, Presence
  range: string // Melee, Very Close, Close, Far, Very Far
  damage: string // 'd10+9 phy'
  burden?: string // Two-Handed, One-Handed, or null
  feature?: string // Special ability or "—"
  searchable_text: string
  source_book?: string
}

// =============================================
// ARMOR
// =============================================
export interface Armor {
  name: string
  tier: number // 1-3
  base_thresholds: string // "13/31"
  base_score: number
  feature?: string // "Heavy: -1 to Evasion" or "—"
  searchable_text: string
  source_book?: string
}

// =============================================
// ITEMS
// =============================================
export interface Item {
  name: string
  description: string
  item_type?: string // Item, Relic, Charm
  searchable_text: string
  source_book?: string
}

// =============================================
// CONSUMABLES
// =============================================
export interface Consumable {
  name: string
  description: string
  uses?: number
  searchable_text: string
  source_book?: string
}

// =============================================
// ANCESTRIES
// =============================================
export interface AncestryFeature {
  name: string
  desc: string
}

export interface Ancestry {
  name: string
  description: string
  features?: AncestryFeature[]
  source_book?: string
}

// =============================================
// CLASSES
// =============================================
export interface ClassFeature {
  name: string
  desc: string
  cost?: number
}

export interface Class {
  name: string
  description: string
  domains: string[] // ['Grace', 'Codex']
  starting_evasion: number
  starting_hp: number
  class_items?: string[]
  hope_feature?: ClassFeature
  class_feature?: ClassFeature
  background_questions?: string[]
  connection_questions?: string[]
  source_book?: string
}

// =============================================
// SUBCLASSES
// =============================================
export interface SubclassFeature {
  name: string
  desc: string
}

export interface Subclass {
  name: string
  parent_class: string
  description: string
  features?: SubclassFeature[]
  source_book?: string
}

// =============================================
// DOMAINS
// =============================================
export interface Domain {
  name: string
  description: string
  source_book?: string
}

// =============================================
// ABILITIES
// =============================================
export interface Ability {
  name: string
  ability_type: 'Foundation' | 'Specialization' | 'Pinnacle'
  parent_class?: string
  parent_subclass?: string
  domain?: string
  description: string
  prerequisites?: string[]
  level_requirement?: number
  searchable_text: string
  source_book?: string
}

// =============================================
// COMMUNITIES
// =============================================
export interface Community {
  name: string
  description: string
  community_moves?: string[]
  source_book?: string
}

// =============================================
// FRAMES
// =============================================
export interface Frame {
  name: string
  description: string
  themes?: string[]
  typical_adversaries?: string[]
  lore?: string
  source_book?: string
}
