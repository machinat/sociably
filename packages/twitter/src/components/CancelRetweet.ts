import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeTwitterComponent from '../utils/makeTwitterComponent.js';
import { TwitterSegmentValue, TwitterComponent } from '../types.js';

/**
 * @category Props
 */
export type CancelRetweetProps = {
  /** The retweeted tweet id to be canceled */
  tweetId: string;
};

/**
 * CancelRetweet a tweet
 * @category Component
 * @props {@link CancelRetweetProps}
 * @guides Check official [guide](https://developer.twitter.com/en/docs/twitter-api/tweets/retweets/introduction).
 */
export const CancelRetweet: TwitterComponent<
  CancelRetweetProps,
  UnitSegment<TwitterSegmentValue>
> = makeTwitterComponent(function CancelRetweet(node, path) {
  return [
    makeUnitSegment(node, path, {
      type: 'action',
      request: {
        method: 'DELETE',
        url: '2/users/:id/retweets/:source_tweet_id',
        params: {},
      },
      accomplishRequest: (target, request) => ({
        ...request,
        url: `2/users/${target.agentId}/retweets/${node.props.tweetId}`,
      }),
      mediaSources: null,
    }),
  ];
});
