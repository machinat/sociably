import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeTwitterComponent from '../utils/makeTwitterComponent';
import { TwitterSegmentValue, TwitterComponent } from '../types';

/**
 * @category Props
 */
export type UnmuteProps = {
  /** The user id to be unmuted */
  userId: string;
};

/**
 * Unmute a user
 * @category Component
 * @props {@link UnmuteProps}
 * @guides Check official [guide](https://developer.twitter.com/en/docs/twitter-api/users/mutes/introduction).
 */
export const Unmute: TwitterComponent<
  UnmuteProps,
  UnitSegment<TwitterSegmentValue>
> = makeTwitterComponent(function Unmute(node, path) {
  return [
    makeUnitSegment(node, path, {
      type: 'action',
      request: {
        method: 'DELETE',
        href: '2/users/:source_user_id/muting/:target_user_id',
        params: {},
      },
      accomplishRequest: (target, request) => ({
        ...request,
        href: `2/users/${target.agentId}/muting/${node.props.userId}`,
      }),
      mediaSources: null,
    }),
  ];
});
