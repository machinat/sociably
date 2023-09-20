import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeTwitterComponent from '../utils/makeTwitterComponent.js';
import { TwitterSegmentValue, TwitterComponent } from '../types.js';

/** @category Props */
export type UnlikeProps = {
  /** The tweet id to be unliked */
  tweetId: string;
};

/**
 * Unlike a tweet
 *
 * @category Component
 * @props {@link UnlikeProps}
 * @guides Check official [guide](https://developer.twitter.com/en/docs/twitter-api/tweets/likes/introduction).
 */
export const Unlike: TwitterComponent<
  UnlikeProps,
  UnitSegment<TwitterSegmentValue>
> = makeTwitterComponent(function Unlike(node, path) {
  return [
    makeUnitSegment(node, path, {
      type: 'action',
      request: {
        method: 'DELETE',
        url: '2/users/:id/likes/:tweet_id',
        params: {},
      },
      accomplishRequest: (target, request) => ({
        ...request,
        url: `2/users/${target.agentId}/likes/${node.props.tweetId}`,
      }),
      mediaSources: null,
    }),
  ];
});
