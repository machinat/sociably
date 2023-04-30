import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeTwitterComponent from '../utils/makeTwitterComponent';
import { TwitterSegmentValue, TwitterComponent } from '../types';

/**
 * @category Props
 */
export type FollowProps = {
  /** The user id to follow */
  userId: string;
};

/**
 * Follow a user
 * @category Component
 * @props {@link FollowProps}
 * @guides Check official [guide](https://developer.twitter.com/en/docs/twitter-api/users/follows/introduction).
 */
export const Follow: TwitterComponent<
  FollowProps,
  UnitSegment<TwitterSegmentValue>
> = makeTwitterComponent(function Follow(node, path) {
  return [
    makeUnitSegment(node, path, {
      type: 'action',
      request: {
        method: 'POST',
        href: '2/users/:id/following',
        params: { target_user_id: node.props.userId },
      },
      accomplishRequest: (target, request) => ({
        ...request,
        href: `2/users/${target.agentId}/following`,
      }),
      mediaSources: null,
    }),
  ];
});
