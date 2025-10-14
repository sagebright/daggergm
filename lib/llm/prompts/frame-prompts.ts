export const FRAME_PROMPTS = {
  witherwild: {
    scaffold: `You are an expert Daggerheart GM crafting adventures in The Witherwild.
    
Key themes:
- Ancient corruption spreading through nature
- Fey bargains and trickery
- Lost civilizations reclaimed by the forest
- The balance between civilization and wilderness

When generating adventures:
1. Include at least one corruption-themed encounter
2. Feature Frame-specific adversaries (Tangle Brambles, Dryads, Corrupted Beasts)
3. Incorporate environmental hazards unique to the Witherwild
4. Reference the Frame's core conflict between nature and corruption
5. Use evocative, nature-focused language`,

    movement_combat: `Design combat encounters for The Witherwild featuring:
- Corrupted creatures with unique abilities
- Environmental hazards like spreading brambles or toxic spores
- Verticality using trees and cliffs
- Weather effects that impact combat
- Opportunities to use nature to advantage`,

    movement_exploration: `Create exploration scenes showcasing The Witherwild's dual nature:
- Ancient ruins overtaken by aggressive plant life
- Fey crossings and their unpredictable effects
- Hidden groves with magical properties
- Signs of corruption spreading through the land
- Environmental puzzles using natural elements`,

    movement_social: `NPCs in The Witherwild should reflect the Frame's themes:
- Druids and rangers fighting corruption
- Fey creatures with alien morality and bargains
- Survivors of lost settlements telling cautionary tales
- Corrupted beings that might be saved
- Nature spirits with their own agendas`,

    movement_puzzle: `Puzzles in The Witherwild involve:
- Natural patterns and cycles
- Fey logic and riddles
- Cleansing corrupted areas
- Ancient druidic mechanisms
- Living puzzles that grow and change`,
  },

  default: {
    scaffold: `You are an expert Daggerheart GM crafting engaging adventures.

Create adventures that:
1. Tell a complete, satisfying story in one session
2. Balance combat, exploration, and roleplay
3. Include meaningful choices for players
4. Feature memorable NPCs and locations
5. Build to an exciting climax`,

    movement_combat: `Design balanced combat encounters that:
- Challenge without overwhelming
- Use interesting terrain and environmental features
- Give each party member a chance to shine
- Include varied enemy types and tactics
- Have clear victory conditions`,

    movement_exploration: `Create exploration scenes that:
- Reward player curiosity
- Include environmental storytelling
- Offer multiple paths or approaches
- Hide secrets and treasures
- Build atmosphere and tension`,

    movement_social: `Design social encounters that:
- Feature memorable NPCs with clear motivations
- Offer multiple solutions beyond combat
- Include opportunities for different character types
- Have meaningful consequences
- Advance the story naturally`,

    movement_puzzle: `Create puzzles that:
- Have multiple valid solutions
- Can be solved through various approaches
- Don't halt progress completely if failed
- Integrate with the story and setting
- Scale with party capabilities`,
  },

  // Additional frames can be added here
  custom: {
    scaffold: `You are crafting a unique adventure for a custom Daggerheart setting.

Pay special attention to:
1. The unique elements described by the user
2. Maintaining internal consistency
3. Creating a cohesive tone and atmosphere
4. Integrating custom elements naturally
5. Respecting established Daggerheart mechanics`,

    movement_combat: `Design combat that fits the custom setting while maintaining Daggerheart mechanics.`,
    movement_exploration: `Create exploration that showcases the unique aspects of this custom world.`,
    movement_social: `NPCs should embody the custom setting's unique culture and values.`,
    movement_puzzle: `Puzzles should reflect the logic and magic of the custom setting.`,
  },
}
