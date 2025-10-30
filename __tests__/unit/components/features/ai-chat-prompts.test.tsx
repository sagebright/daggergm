import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { AIChat } from '@/components/features/ai-chat'
import type { Movement } from '@/components/features/focus-mode'

// Mock the server actions
vi.mock('@/app/actions/movements', () => ({
  expandMovement: vi.fn(),
  refineMovementContent: vi.fn(),
}))

describe('AIChat - Quick Prompts', () => {
  const mockMovement: Movement = {
    id: 'mov-1',
    title: 'Test Combat',
    type: 'combat',
    content: 'This is a combat encounter with enough content to show refinement options.',
    estimatedTime: '30 minutes',
  }

  const mockOnSuggestionApply = vi.fn()
  const mockOnRefresh = vi.fn()

  describe('Scaffold phase (draft state)', () => {
    it('shows scaffold-specific prompts for combat movements', () => {
      render(
        <AIChat
          movement={mockMovement}
          adventureId="adv-1"
          adventureState="draft"
          expansionRegenerationsUsed={0}
          onSuggestionApply={mockOnSuggestionApply}
          onRefreshAdventure={mockOnRefresh}
        />,
      )

      // Should show scaffold combat-specific prompts
      expect(screen.getByText('Make enemy intelligent and strategic')).toBeInTheDocument()
      expect(screen.getByText('Add environmental combat challenges')).toBeInTheDocument()
      expect(screen.getByText('Make this boss-level encounter')).toBeInTheDocument()

      // Should show scaffold general prompts
      expect(screen.getByText('Make stakes feel higher')).toBeInTheDocument()
      expect(screen.getByText('Change tone to be more serious')).toBeInTheDocument()

      // Should NOT show expansion prompts
      expect(screen.queryByText('Include specific DC checks')).not.toBeInTheDocument()
      expect(screen.queryByText('Add tactical terrain features')).not.toBeInTheDocument()
    })

    it('shows scaffold-specific prompts for social movements', () => {
      const socialMovement: Movement = {
        ...mockMovement,
        type: 'social',
        title: 'Test Social',
      }

      render(
        <AIChat
          movement={socialMovement}
          adventureId="adv-1"
          adventureState="draft"
          expansionRegenerationsUsed={0}
          onSuggestionApply={mockOnSuggestionApply}
          onRefreshAdventure={mockOnRefresh}
        />,
      )

      // Should show scaffold social-specific prompts
      expect(screen.getByText('Add political intrigue')).toBeInTheDocument()
      expect(screen.getByText('Make NPC morally gray')).toBeInTheDocument()
      expect(screen.getByText('Add time pressure')).toBeInTheDocument()

      // Should NOT show expansion prompts
      expect(screen.queryByText('Add dialogue examples')).not.toBeInTheDocument()
      expect(screen.queryByText('Include NPC motivations')).not.toBeInTheDocument()
    })

    it('shows scaffold-specific prompts for exploration movements', () => {
      const explorationMovement: Movement = {
        ...mockMovement,
        type: 'exploration',
        title: 'Test Exploration',
      }

      render(
        <AIChat
          movement={explorationMovement}
          adventureId="adv-1"
          adventureState="draft"
          expansionRegenerationsUsed={0}
          onSuggestionApply={mockOnSuggestionApply}
          onRefreshAdventure={mockOnRefresh}
        />,
      )

      // Should show scaffold exploration-specific prompts
      expect(screen.getByText('Change to dungeon crawl')).toBeInTheDocument()
      expect(screen.getByText('Add discovery/mystery')).toBeInTheDocument()
      expect(screen.getByText('Include environmental storytelling')).toBeInTheDocument()

      // Should NOT show expansion prompts
      expect(screen.queryByText('Describe environmental hazards')).not.toBeInTheDocument()
      expect(screen.queryByText('Add hidden discoveries')).not.toBeInTheDocument()
    })

    it('shows scaffold-specific prompts for puzzle movements', () => {
      const puzzleMovement: Movement = {
        ...mockMovement,
        type: 'puzzle',
        title: 'Test Puzzle',
      }

      render(
        <AIChat
          movement={puzzleMovement}
          adventureId="adv-1"
          adventureState="draft"
          expansionRegenerationsUsed={0}
          onSuggestionApply={mockOnSuggestionApply}
          onRefreshAdventure={mockOnRefresh}
        />,
      )

      // Should show scaffold puzzle-specific prompts
      expect(screen.getByText('Add logical deduction element')).toBeInTheDocument()
      expect(screen.getByText('Include multiple solution paths')).toBeInTheDocument()
      expect(screen.getByText('Make time-sensitive')).toBeInTheDocument()

      // Should NOT show expansion prompts
      expect(screen.queryByText('Add specific clues')).not.toBeInTheDocument()
      expect(screen.queryByText('Include failure consequences')).not.toBeInTheDocument()
    })
  })

  describe('Expansion phase (ready state)', () => {
    it('shows expansion-specific prompts for combat movements', () => {
      render(
        <AIChat
          movement={mockMovement}
          adventureId="adv-1"
          adventureState="ready"
          expansionRegenerationsUsed={0}
          onSuggestionApply={mockOnSuggestionApply}
          onRefreshAdventure={mockOnRefresh}
        />,
      )

      // Should show expansion combat-specific prompts
      expect(screen.getByText('Include specific DC checks')).toBeInTheDocument()
      expect(screen.getByText('Add tactical terrain features')).toBeInTheDocument()
      expect(screen.getByText('Describe enemy tactics')).toBeInTheDocument()

      // Should show expansion general prompts
      expect(screen.getByText('Add more sensory details')).toBeInTheDocument()
      expect(screen.getByText('Include specific mechanics')).toBeInTheDocument()

      // Should NOT show scaffold prompts
      expect(screen.queryByText('Make enemy intelligent and strategic')).not.toBeInTheDocument()
      expect(screen.queryByText('Make this boss-level encounter')).not.toBeInTheDocument()
    })

    it('shows expansion-specific prompts for social movements', () => {
      const socialMovement: Movement = {
        ...mockMovement,
        type: 'social',
        title: 'Test Social',
      }

      render(
        <AIChat
          movement={socialMovement}
          adventureId="adv-1"
          adventureState="ready"
          expansionRegenerationsUsed={0}
          onSuggestionApply={mockOnSuggestionApply}
          onRefreshAdventure={mockOnRefresh}
        />,
      )

      // Should show expansion social-specific prompts
      expect(screen.getByText('Add dialogue examples')).toBeInTheDocument()
      expect(screen.getByText('Include NPC motivations')).toBeInTheDocument()
      expect(screen.getByText('Add persuasion mechanics')).toBeInTheDocument()

      // Should NOT show scaffold prompts
      expect(screen.queryByText('Add political intrigue')).not.toBeInTheDocument()
      expect(screen.queryByText('Make NPC morally gray')).not.toBeInTheDocument()
    })

    it('shows expansion-specific prompts for exploration movements', () => {
      const explorationMovement: Movement = {
        ...mockMovement,
        type: 'exploration',
        title: 'Test Exploration',
      }

      render(
        <AIChat
          movement={explorationMovement}
          adventureId="adv-1"
          adventureState="ready"
          expansionRegenerationsUsed={0}
          onSuggestionApply={mockOnSuggestionApply}
          onRefreshAdventure={mockOnRefresh}
        />,
      )

      // Should show expansion exploration-specific prompts
      expect(screen.getByText('Describe environmental hazards')).toBeInTheDocument()
      expect(screen.getByText('Add hidden discoveries')).toBeInTheDocument()
      expect(screen.getByText('Include skill check requirements')).toBeInTheDocument()

      // Should NOT show scaffold prompts
      expect(screen.queryByText('Change to dungeon crawl')).not.toBeInTheDocument()
      expect(screen.queryByText('Add discovery/mystery')).not.toBeInTheDocument()
    })

    it('shows expansion-specific prompts for puzzle movements', () => {
      const puzzleMovement: Movement = {
        ...mockMovement,
        type: 'puzzle',
        title: 'Test Puzzle',
      }

      render(
        <AIChat
          movement={puzzleMovement}
          adventureId="adv-1"
          adventureState="ready"
          expansionRegenerationsUsed={0}
          onSuggestionApply={mockOnSuggestionApply}
          onRefreshAdventure={mockOnRefresh}
        />,
      )

      // Should show expansion puzzle-specific prompts
      expect(screen.getByText('Add specific clues')).toBeInTheDocument()
      expect(screen.getByText('Include failure consequences')).toBeInTheDocument()
      expect(screen.getByText('Describe puzzle mechanics')).toBeInTheDocument()

      // Should NOT show scaffold prompts
      expect(screen.queryByText('Add logical deduction element')).not.toBeInTheDocument()
      expect(screen.queryByText('Include multiple solution paths')).not.toBeInTheDocument()
    })
  })

  describe('Archived state', () => {
    it('treats archived state as expansion phase', () => {
      render(
        <AIChat
          movement={mockMovement}
          adventureId="adv-1"
          adventureState="archived"
          expansionRegenerationsUsed={0}
          onSuggestionApply={mockOnSuggestionApply}
          onRefreshAdventure={mockOnRefresh}
        />,
      )

      // Should show expansion prompts (archived is treated as expansion)
      expect(screen.getByText('Include specific DC checks')).toBeInTheDocument()
      expect(screen.getByText('Add more sensory details')).toBeInTheDocument()

      // Should NOT show scaffold prompts
      expect(screen.queryByText('Make enemy intelligent and strategic')).not.toBeInTheDocument()
    })
  })
})
