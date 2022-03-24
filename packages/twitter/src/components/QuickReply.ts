import { makePartSegment, PartSegment } from '@machinat/core/renderer';
import { makeTwitterComponent } from '../utils';
import { TwitterComponent } from '../types';

/**
 * @category Props
 */
export type QuickReplyProps = {
  /** The text label displayed on the button face. Label text is returned as the user's message response. String, max length of 36 characters including spaces. Values with URLs are not allowed and will return an error */
  label: string;
  /** Optional description text displayed under label text. All options must have this property defined if property is present in any option. Text is auto-wrapped and will display on a max of two lines and supports n for controling line breaks. Description text is not include in the user's message response. String, max length of 72 characters including spaces */
  description?: string;
  /** Metadata that will be sent back in the webhook request. String, max length of 1,000 characters including spaces */
  metadata?: string;
};

/**
 * QuickReply a tweet
 * @category Component
 * @props {@link QuickReplyProps}
 * @guides Check official [guide](https://developer.twitter.com/en/docs/twitter-api/v1/direct-messages/quick-replies/overview).
 */
export const QuickReply: TwitterComponent<
  QuickReplyProps,
  PartSegment<unknown>
> = makeTwitterComponent(function QuickReply(node, path) {
  const { label, description, metadata } = node.props;

  return [makePartSegment(node, path, { label, description, metadata })];
});
