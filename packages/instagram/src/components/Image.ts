import { NativeElement, AnyNativeComponent } from '@sociably/core';
import {
  Image as MessengerImage,
  MediaProps,
} from '@sociably/messenger/components';
import makeInstagramComponent from '../utils/makeInstagramComponent.js';

export type ImageProps = Omit<MediaProps, 'file'>;

/**
 * The log out button triggers the account unlinking flow.
 *
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official send API [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const Image = makeInstagramComponent(function Image(
  node: NativeElement<ImageProps, AnyNativeComponent>,
  path: string,
) {
  return MessengerImage(node, path);
});
