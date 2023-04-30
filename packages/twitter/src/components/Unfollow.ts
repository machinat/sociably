import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeTwitterComponent from '../utils/makeTwitterComponent';
import { TwitterSegmentValue, TwitterComponent } from '../types';

/**
 * @category Props
 */
export type UnfollowProps = {
  /** The user id to unfollow */
  userId: string;
};

/**
 * Unfollow a user
 * @category Component
 * @props {@link UnfollowProps}
 * @guides Check official [guide](https://developer.twitter.com/en/docs/twitter-api/users/follows/introduction).
 */
export const Unfollow: TwitterComponent<
  UnfollowProps,
  UnitSegment<TwitterSegmentValue>
> = makeTwitterComponent(function Unfollow(node, path) {
  return [
    makeUnitSegment(node, path, {
      type: 'action',
      request: {
        method: 'DELETE',
        url: '2/users/:source_user_id/following/:target_user_id',
        params: {},
      },
      accomplishRequest: (target, request) => ({
        ...request,
        url: `2/users/${target.agentId}/following/${node.props.userId}`,
      }),
      mediaSources: null,
    }),
  ];
});
