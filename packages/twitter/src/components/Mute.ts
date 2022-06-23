import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeTwitterComponent from '../utils/makeTwitterComponent';
import { TwitterSegmentValue, TwitterComponent } from '../types';

/**
 * @category Props
 */
export type MuteProps = {
  /** The user id to be muted */
  userId: string;
};

/**
 * Mute a user
 * @category Component
 * @props {@link MuteProps}
 * @guides Check official [guide](https://developer.twitter.com/en/docs/twitter-api/users/mutes/introduction).
 */
export const Mute: TwitterComponent<
  MuteProps,
  UnitSegment<TwitterSegmentValue>
> = makeTwitterComponent(function Mute(node, path) {
  return [
    makeUnitSegment(node, path, {
      type: 'action',
      request: {
        method: 'POST',
        href: '2/users/:id/muting',
        parameters: { target_user_id: node.props.userId },
      },
      accomplishRequest: (target, request) => ({
        ...request,
        href: `2/users/${target.agentId}/muting`,
      }),
      mediaSources: null,
    }),
  ];
});
