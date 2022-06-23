import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeTwitterComponent from '../utils/makeTwitterComponent';
import { TwitterSegmentValue, TwitterComponent } from '../types';

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
        href: '2/users/:id/retweets/:source_tweet_id',
        parameters: null,
      },
      accomplishRequest: (target, request) => ({
        ...request,
        href: `2/users/${target.agentId}/retweets/${node.props.tweetId}`,
      }),
      mediaSources: null,
    }),
  ];
});
