import { makePartSegment } from '@sociably/core/renderer';
import type { PartSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent';
import type { FacebookComponent } from '../types';

/**
 * @category Props
 */
export type PostbackButtonProps = {
  /** Button title. 20 character limit. */
  title: string;
  /** This data will be sent back to your webhook. 1000 character limit. */
  payload: string;
};

/**
 * When the postback button is tapped, the Messenger Platform sends an event to
 * your postback webhook. This is useful when you want to invoke an action in
 * your bot. This button can be used with the Button Template and Generic
 * Template.
 * @category Component
 * @props {@link PostbackButtonProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/buttons#postback)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/postback).
 */
export const PostbackButton: FacebookComponent<
  PostbackButtonProps,
  PartSegment<{}>
> = makeFacebookComponent(function PostbackButton(node, path) {
  const { title, payload } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'postback',
      title,
      payload,
    }),
  ];
});
