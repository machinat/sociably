import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeTwitterComponent from '../utils/makeTwitterComponent.js';
import { TwitterSegmentValue, TwitterComponent } from '../types.js';

/**
 * @category Props
 */
export type UnblockProps = {
  /** The user id to be unblocked */
  userId: string;
};

/**
 * Unblock a user
 * @category Component
 * @props {@link UnblockProps}
 * @guides Check official [guide](https://developer.twitter.com/en/docs/twitter-api/users/blocks/introduction).
 */
export const Unblock: TwitterComponent<
  UnblockProps,
  UnitSegment<TwitterSegmentValue>
> = makeTwitterComponent(function Unblock(node, path) {
  return [
    makeUnitSegment(node, path, {
      type: 'action',
      request: {
        method: 'DELETE',
        url: '2/users/:source_user_id/blocking/:target_user_id',
        params: {},
      },
      accomplishRequest: (target, request) => ({
        ...request,
        url: `2/users/${target.agentId}/blocking/${node.props.userId}`,
      }),
      mediaSources: null,
    }),
  ];
});
