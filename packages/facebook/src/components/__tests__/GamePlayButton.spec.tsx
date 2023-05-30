import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { renderPartElement } from './utils.js';
import { GamePlayButton } from '../GamePlayButton.js';

it('is valid Component', () => {
  expect(typeof GamePlayButton).toBe('function');
  expect(isNativeType(<GamePlayButton title="" />)).toBe(true);
  expect(GamePlayButton.$$platform).toBe('facebook');
});

it('match snapshot', async () => {
  await expect(
    renderPartElement(
      <GamePlayButton
        title="I want to play a game"
        payload="GAME_OVER"
        playerId="Adam"
        contextId="SAW"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <GamePlayButton
          contextId="SAW"
          payload="GAME_OVER"
          playerId="Adam"
          title="I want to play a game"
        />,
        "path": "$#container",
        "type": "part",
        "value": {
          "game_metadata": {
            "context_id": "SAW",
            "player_id": "Adam",
          },
          "payload": "GAME_OVER",
          "title": "I want to play a game",
          "type": "game_play",
        },
      },
    ]
  `);
});
