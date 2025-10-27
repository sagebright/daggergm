// Type definitions for Daggerheart content parsers

// Phase 0 types (Adversaries)

export interface AdversaryFeature {
  name: string
  type: 'Passive' | 'Action' | 'Reaction'
  desc: string
}

export interface Adversary {
  name: string
  tier: number
  type: string
  description: string
  motives_tactics: string[]
  difficulty: number
  thresholds: string
  hp: number
  stress: number
  atk: string
  weapon: string
  range: string
  dmg: string
  experiences?: Record<string, number>
  features: AdversaryFeature[]
  searchable_text: string
  source_book: string
}

// Phase 1 types

export interface Weapon {
  name: string
  weapon_category: 'Primary' | 'Secondary'
  tier: number
  trait: string
  range: string
  damage: string
  burden: string | null
  feature: string | null
  searchable_text: string
  source_book: string
}

export interface ClassFeature {
  name: string
  desc: string
  cost?: number
}

export interface Class {
  name: string
  description: string
  domains: string[]
  starting_evasion: number
  starting_hp: number
  class_items?: string[]
  hope_feature?: ClassFeature
  class_feature?: ClassFeature
  background_questions?: string[]
  connection_questions?: string[]
  source_book: string
}

export interface Armor {
  name: string
  tier: number
  base_thresholds: string
  base_score: number
  feature: string | null
  searchable_text: string
  source_book: string
}

// Phase 2 types

export interface Ability {
  name: string
  ability_type: 'Foundation' | 'Specialization' | 'Pinnacle'
  parent_class?: string
  parent_subclass?: string
  domain?: string
  description: string
  level_requirement?: number
  searchable_text: string
  source_book: string
}

export interface Item {
  name: string
  description: string
  item_type: string
  searchable_text: string
  source_book: string
}

export interface Consumable {
  name: string
  description: string
  uses: number
  searchable_text: string
  source_book: string
}

// Phase 3 types

export interface AncestryFeature {
  name: string
  desc: string
}

export interface Ancestry {
  name: string
  description: string
  features: AncestryFeature[]
  source_book: string
}

export interface SubclassFeature {
  name: string
  desc: string
}

export interface Subclass {
  name: string
  parent_class: string
  description: string
  features: SubclassFeature[]
  source_book: string
}

export interface EnvironmentFeature {
  name: string
  type: 'Passive' | 'Action' | 'GM Prompt'
  desc: string
}

export interface Environment {
  name: string
  tier: number
  type: string
  description: string
  impulses?: string[]
  difficulty?: number
  potential_adversaries?: string[]
  features: EnvironmentFeature[]
  searchable_text: string
  source_book: string
}

export interface Domain {
  name: string
  description: string
  source_book: string
}

export interface Community {
  name: string
  description: string
  community_moves?: string[]
  source_book: string
}

export interface Frame {
  name: string
  description: string
  themes?: string[]
  typical_adversaries?: string[]
  lore?: string
  source_book: string
}
