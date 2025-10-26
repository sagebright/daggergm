// Type definitions for Daggerheart content parsers

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
