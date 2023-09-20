import Sociably from '@sociably/core';
import { renderPartElement, makeTestComponent } from './utils.js';
import { GamePlayButton as _GamePlayButton } from '../GamePlayButton.js';

const GamePlayButton = makeTestComponent(_GamePlayButton);

it('match snapshot', async () => {
  await expect(
    renderPartElement(
      <GamePlayButton
        title="I want to play a game"
        payload="GAME_OVER"
        playerId="Adam"
        contextId="SAW"
      />,
    ),
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
