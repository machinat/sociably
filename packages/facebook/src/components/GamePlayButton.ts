import { makePartSegment } from '@sociably/core/renderer';
import type { PartSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent.js';
import type { FacebookComponent } from '../types.js';

/**
 * @category Props
 */
export type GamePlayButtonProps = {
  /** Button title, 20 character limit. */
  title: string;
  /** This data will be sent to the game. */
  payload?: string;
  /** Player ID (Instant Game name-space) to play against. */
  playerId?: string;
  /** Context ID (Instant Game name-space) of the THREAD to play in. */
  contextId?: string;
};

/**
 * The game play button launches an Instant Game that is associated with the bot
 * page.
 * @category Component
 * @props {@link GamePlayButtonProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/buttons#game_play)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/game-play).
 */
export const GamePlayButton: FacebookComponent<
  GamePlayButtonProps,
  PartSegment<{}>
> = makeFacebookComponent(function GamePlayButton(node, path) {
  const { title, payload, playerId, contextId } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'game_play',
      title,
      payload,
      game_metadata:
        playerId || contextId
          ? {
              player_id: playerId,
              context_id: contextId,
            }
          : undefined,
    }),
  ];
});
