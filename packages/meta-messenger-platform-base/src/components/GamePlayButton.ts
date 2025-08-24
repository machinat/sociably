import type { NativeElement, AnyNativeComponent } from '@sociably/core';
import { makePartSegment, PartSegment } from '@sociably/core/renderer';

/** @category Props */
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

export function GamePlayButton(
  node: NativeElement<GamePlayButtonProps, AnyNativeComponent>,
  path: string,
): PartSegment<{}>[] {
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
}
