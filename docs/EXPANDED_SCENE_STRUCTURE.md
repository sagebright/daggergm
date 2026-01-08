# Expanded Scene Content Structure

This document defines the structure for AI-generated expanded scene content. Use this as the system prompt template to ensure consistent, GM-ready output.

## Overview

Expanded scenes transform brief outlines into run-ready content with:

- Rich sensory details for immersion
- Context explaining narrative flow
- Detailed NPC profiles with stat blocks
- Read-aloud narrative sections
- Mechanical elements (DCs, encounters, rewards)

---

## Content Structure

### 1. Setting

Rich environmental description with sensory details.

**Required Properties:**

- `description` (string): 2-3 paragraph overview of the location
- `sights` (array): 3-5 visual details the party notices
- `sounds` (array): 2-3 ambient sounds
- `smells` (array): 2-3 scents (often overlooked but immersive)

**Example:**

```
## Setting: Thornhaven Village

The village of Thornhaven clings to the edge of the Witherwild like a barnacle
to a ship's hull. Wooden palisades, recently reinforced with fresh-cut timber
still weeping sap, encircle two dozen buildings.

### Sights
- Shuttered windows with pale faces peering through gaps
- A well in the village center, its rope frayed
- Hunting trophies on doorposts, but no fresh game

### Sounds
- Hushed whispers that stop when strangers approach
- Dogs whimpering, refusing to bark

### Smells
- Wood smoke with an acrid undertone
- Something rotting, faint but persistent
```

---

### 2. Context (NEW - Critical for Flow)

Bullet-point section explaining WHY the party is here and connecting to previous scenes.

**Required Properties:**

- `arrival_reason` (string): Why the party came to this location
- `previous_scene_connection` (string): How this connects to what just happened
- `key_intel` (array): Important information the party should have by now
- `pending_threads` (array): Unresolved questions or hooks

**Example:**

```
## Context

- **Why they're here**: Rumors of missing hunters reached the party in Millford;
  Elder Mora sent word requesting aid
- **What they know**: Seven hunters vanished over two weeks, all near the
  Witherwild's edge
- **Key intel from previous scene**: Finn escaped but saw "shadows with teeth"
- **Unresolved questions**: What caused this? Is it spreading? Can it be stopped?
```

---

### 3. Key NPCs

Detailed profiles for important characters with stat blocks for adversaries.

**Required Properties per NPC:**

- `name` (string): Character name
- `pronouns` (string): e.g., "she/her", "they/them"
- `role` (string): Their function in the scene
- `appearance` (string): Physical description
- `personality` (string): How they behave/speak
- `motivation` (string): What they want
- `secret` (string, optional): Hidden information
- `voice_notes` (string): How to roleplay their dialogue

**For Adversaries, add Stat Block:**

- `threat_level` (string): "Minion", "Standard", "Solo"
- `hit_points` (number)
- `armor` (number)
- `attack` (string): Primary attack description
- `special_abilities` (array): Unique abilities
- `tactics` (string): How they fight

**Example:**

```
## Key NPCs

### Elder Mora (she/her)
**Role**: Village leader, quest giver

| Trait | Description |
|-------|-------------|
| Appearance | Silver-haired woman in her 60s, weathered face, sharp eyes |
| Personality | Pragmatic, protective, hiding fear behind authority |
| Motivation | Protect her village, find her missing son |
| Secret | Her son Tomas was among the first to disappear |
| Voice | Measured, clipped sentences, occasional tremor |

---

### Blighted Stag (Adversary)
**Threat Level**: Standard | **Role**: Combat encounter leader

| Stat | Value |
|------|-------|
| HP | 18 |
| Armor | 2 |
| Attack | Goring Charge (2d8+3, push 10ft) |

**Special Abilities:**
- **Corruption Touch**: On hit, target makes Mettle save (DC 13) or takes 1d4
  necrotic damage at start of their turn for 3 rounds
- **Blight Aura**: Difficult terrain in 10ft radius from twisted undergrowth

**Tactics**: Charges the most armored target first, uses terrain to split party
```

---

### 4. Read-Aloud Narrative

Boxed text the GM can read directly to players. Formatted for easy identification.

**Required Properties:**

- `scene_opener` (string): First thing to read when scene begins
- `transition_closer` (string): Text leading to next scene
- `key_moments` (array): 2-3 dramatic moments with read-aloud text

**Formatting**: Use blockquotes or special styling to distinguish from GM notes.

**Example:**

```
## Read-Aloud Narrative

> **Scene Opening:**
>
> "The forest path opens into a clearing, and your breath catches. Where there
> should be vibrant green, there is only gray—trees stand like skeletal sentries,
> their bark blackened and weeping. At the clearing's center, a figure wreathed
> in shadow raises their head at your approach."

> **When Aldric speaks:**
>
> "You... you've come to stop me. I can see it in your eyes. But you don't
> understand—I was so close. She was right there, just beyond the veil, and
> all I had to do was... was..." *His voice breaks.* "They promised. They
> PROMISED she would return."

> **Transition to Next Scene:**
>
> "As you leave the corruption behind, Finn stops at the forest's edge and
> looks back. 'It's spreading faster,' they whisper. 'We have maybe a week
> before it reaches Thornhaven.' The village lights flicker in the distance,
> and you know your next steps will determine their fate."
```

---

### 5. Scene Beats

Structured breakdown of scene progression with timing and mechanics.

**Required Properties per Beat:**

- `name` (string): Beat title
- `duration` (string): Estimated time (e.g., "5 min")
- `description` (string): What happens
- `mechanics` (string, optional): Any rolls or game mechanics
- `branching` (array, optional): Alternative paths based on player choices

**Example:**

```
## Scene Beats

### Beat 1: Arrival (5 min)
The party approaches the village gates. Guards are nervous, crossbows raised.

**Mechanics**: Presence roll (DC 12) to convince guards to lower weapons.
Failure doesn't prevent entry but creates hostile first impression.

### Beat 2: Meeting Elder Mora (5 min)
She approaches in the village square, sizing up the party.

**Branching**:
- *If party mentions payment*: She offers 50 gold + supplies
- *If party asks about her family*: Her composure cracks momentarily

### Beat 3: Gathering Intel (10 min)
Multiple NPCs to interview. Each provides different pieces of the puzzle.

**Intel Sources**:
| NPC | Information |
|-----|-------------|
| Elder Mora | 7 hunters missing, 2 weeks, no bodies found |
| Finn | Saw "shadows with teeth", barely escaped |
| Village healer | Strange wounds on returned livestock |
```

---

### 6. Transitions

How this scene connects to the next.

**Required Properties:**

- `trigger` (string): What causes the scene to end
- `next_scene_setup` (string): How the transition happens
- `information_carry` (array): What the party should know going forward

**Example:**

```
## Transition

**Trigger**: Party decides to investigate the forest

**Setup**: Finn offers to guide them to where they escaped. The forest path
grows darker as they leave the village behind...

**Carry Forward**:
- Elder Mora's son was among the missing
- Finn saw unnatural creatures but escaped
- The corruption is spreading toward the village
```

---

## Full Scene Template

```markdown
# Scene [N]: [Title]

**Type**: [Exploration/Combat/Social] | **Duration**: ~[X] min

## Setting

[Description + sights/sounds/smells]

## Context

- Why they're here: [reason]
- What they know: [intel from previous scenes]
- Unresolved questions: [hooks]

## Key NPCs

[NPC profiles with stat blocks for adversaries]

## Read-Aloud Narrative

> [Boxed text for key moments]

## Scene Beats

[Structured progression with timing and mechanics]

## Transition

[How this leads to the next scene]
```

---

## Usage Notes

1. **Context is Critical**: Always explain WHY the party is in this scene and what they know. This prevents GMs from having to invent explanations.

2. **Stat Blocks for All Adversaries**: Even if combat is optional, include stats so GMs can run it if players choose violence.

3. **Read-Aloud is Optional But Powerful**: GMs can paraphrase, but having polished text helps less experienced GMs.

4. **Timing is Approximate**: Scene beats help GMs pace the session but players will vary.

5. **Branching Shows Flexibility**: Not every choice needs branches, but key decision points should show alternatives.

---

**Version**: 2024-12-02
**Purpose**: OpenAI system prompt template for consistent expanded scene generation
