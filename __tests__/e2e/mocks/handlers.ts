import { http, HttpResponse } from 'msw'

/**
 * MSW Handlers for E2E Tests
 *
 * Mock OpenAI API responses to prevent real API calls during E2E tests.
 * This ensures tests run quickly and don't consume OpenAI credits.
 */

export const handlers = [
  // Mock OpenAI chat completion for adventure generation
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      id: 'chatcmpl-test-123',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-4-turbo-preview',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              title: 'The Shadowfen Conspiracy',
              frame: 'witherwild',
              focus: 'High Fantasy',
              movements: [
                {
                  id: 'scene-1',
                  title: 'The Whispering Woods',
                  description:
                    'Your party discovers an ancient grove where the trees seem to whisper secrets of a forgotten age. Dark shadows move between the trunks, and the air grows thick with magical energy.',
                  location: 'The Witherwild - Ancient Grove',
                  npcs: [
                    {
                      name: 'Elder Thornweave',
                      role: 'Guardian of the Grove',
                      motivation: 'Protect the sacred forest from corruption',
                    },
                  ],
                  complications: [
                    {
                      type: 'environmental',
                      description: 'The corrupted magic makes navigation difficult',
                    },
                  ],
                },
                {
                  id: 'scene-2',
                  title: 'The Shadowfen Swamp',
                  description:
                    'Following the trail of corruption, your party enters a murky swamp where reality itself seems to warp and twist. Strange creatures emerge from the mists.',
                  location: 'The Witherwild - Shadowfen Swamp',
                  npcs: [
                    {
                      name: 'Murk the Toadkin',
                      role: 'Swamp Guide',
                      motivation: 'Escape the spreading corruption',
                    },
                  ],
                  complications: [
                    {
                      type: 'combat',
                      description: 'Corrupted swamp creatures attack the party',
                    },
                  ],
                },
                {
                  id: 'scene-3',
                  title: 'The Heart of Darkness',
                  description:
                    'At the center of the corruption, your party discovers a ritual site where a dark cult attempts to summon an ancient evil. The final confrontation begins.',
                  location: 'The Witherwild - Ritual Circle',
                  npcs: [
                    {
                      name: 'Cultist Leader Vex',
                      role: 'Antagonist',
                      motivation: 'Complete the dark ritual at any cost',
                    },
                  ],
                  complications: [
                    {
                      type: 'combat',
                      description: 'The ritual must be stopped before completion',
                    },
                  ],
                },
              ],
            }),
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 150,
        completion_tokens: 250,
        total_tokens: 400,
      },
    })
  }),
]
