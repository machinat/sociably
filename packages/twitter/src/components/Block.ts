import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeTwitterComponent from '../utils/makeTwitterComponent.js';
import { TwitterSegmentValue, TwitterComponent } from '../types.js';

/** @category Props */
export type BlockProps = {
  /** The user id to be blocked */
  userId: string;
};

/**
 * Block a user
 *
 * @category Component
 * @props {@link BlockProps}
 * @guides Check official [guide](https://developer.twitter.com/en/docs/twitter-api/users/blocks/introduction).
 */
export const Block: TwitterComponent<
  BlockProps,
  UnitSegment<TwitterSegmentValue>
> = makeTwitterComponent(function Block(node, path) {
  return [
    makeUnitSegment(node, path, {
      type: 'action',
      request: {
        method: 'POST',
        url: '2/users/:id/blocking',
        params: { target_user_id: node.props.userId },
      },
      accomplishRequest: (target, request) => ({
        ...request,
        url: `2/users/${target.agentId}/blocking`,
      }),
      mediaSources: null,
    }),
  ];
});
