import { makePartSegment, PartSegment } from '@sociably/core/renderer';
import makeTwitterComponent from '../utils/makeTwitterComponent.js';
import { TwitterComponent } from '../types.js';

/**
 * @category Props
 */
export type UrlButtonProps = {
  /** The text that will be displayed to the user on each button. Max string length of 36 characters */
  label: string;
  /** A valid http or https target URL of the button */
  url: string;
};

/**
 * Attach a button for opening a URL to the direct message
 * @category Component
 * @props {@link UrlButtonProps}
 * @guides Check official [reference](https://developer.twitter.com/en/docs/twitter-api/v1/direct-messages/buttons/api-reference/buttons).
 */
export const UrlButton: TwitterComponent<
  UrlButtonProps,
  PartSegment<unknown>
> = makeTwitterComponent(function UrlButton(node, path) {
  const { label, url } = node.props;
  return [makePartSegment(node, path, { type: 'web_url', label, url })];
});
