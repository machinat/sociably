import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeTwitterComponent from '../utils/makeTwitterComponent';
import { TwitterSegmentValue, TwitterComponent } from '../types';

/**
 * @category Props
 */
export type RetweetProps = {
  /** The tweet id to be retweeted */
  tweetId: string;
};

/**
 * Retweet a tweet
 * @category Component
 * @props {@link RetweetProps}
 * @guides Check official [guide](https://developer.twitter.com/en/docs/twitter-api/tweets/retweets/introduction).
 */
export const Retweet: TwitterComponent<
  RetweetProps,
  UnitSegment<TwitterSegmentValue>
> = makeTwitterComponent(function Retweet(node, path) {
  return [
    makeUnitSegment(node, path, {
      type: 'action',
      request: {
        method: 'POST',
        url: '2/users/:id/retweets',
        params: { tweet_id: node.props.tweetId },
      },
      accomplishRequest: (target, request) => ({
        ...request,
        url: `2/users/${target.agentId}/retweets`,
      }),
      mediaSources: null,
    }),
  ];
});
