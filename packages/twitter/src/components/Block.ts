import { makeUnitSegment, UnitSegment } from '@machinat/core/renderer';
import { makeTwitterComponent } from '../utils';
import { TwitterSegmentValue, TwitterComponent } from '../types';

/**
 * @category Props
 */
export type BlockProps = {
  /** The user id to be blocked */
  userId: string;
};

/**
 * Block a user
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
        href: '2/users/:id/blocking',
        parameters: { target_user_id: node.props.userId },
      },
      accomplishRequest: (target, request) => ({
        ...request,
        href: `2/users/${target.agentId}/blocking`,
      }),
      mediaSources: null,
    }),
  ];
});
