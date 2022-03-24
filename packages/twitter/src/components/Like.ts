import { makeUnitSegment, UnitSegment } from '@machinat/core/renderer';
import { makeTwitterComponent } from '../utils';
import { TwitterSegmentValue, TwitterComponent } from '../types';

/**
 * @category Props
 */
export type LikeProps = {
  /** The tweet id to be liked */
  tweetId: string;
};

/**
 * Like a tweet
 * @category Component
 * @props {@link LikeProps}
 * @guides Check official [guide](https://developer.twitter.com/en/docs/twitter-api/tweets/likes/introduction).
 */
export const Like: TwitterComponent<
  LikeProps,
  UnitSegment<TwitterSegmentValue>
> = makeTwitterComponent(function Like(node, path) {
  return [
    makeUnitSegment(node, path, {
      type: 'action',
      request: {
        method: 'POST',
        href: '2/users/:id/likes',
        parameters: { tweet_id: node.props.tweetId },
      },
      accomplishRequest: (target, request) => ({
        ...request,
        href: `2/users/${target.agentId}/likes`,
      }),
      mediaSources: null,
    }),
  ];
});
