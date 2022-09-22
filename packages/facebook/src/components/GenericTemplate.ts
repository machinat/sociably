import type { SociablyNode } from '@sociably/core';
import { makeUnitSegment, makePartSegment } from '@sociably/core/renderer';
import type { UnitSegment, PartSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent';
import { PATH_MESSAGES } from '../constant';
import type { MessageValue, FacebookComponent } from '../types';

/**
 * At least one property must be set in addition to title.
 * @category Props
 */
export type GenericItemProps = {
  /** The title to display in the template. 80 character limit. */
  title: string;
  /** The URL of the image to display in the template. */
  imageUrl?: string;
  /** The subtitle to display in the template. 80 character limit. */
  subtitle?: string;
  /**
   * Button elements to append to the template. A maximum of 3 buttons is
   * supported.
   */
  buttons?: SociablyNode;
  /**
   * One {@link UrlButton} element to act as the default action executed when
   * the template is tapped.
   */
  defaultAction?: SociablyNode;
};

/**
 * The item of the {@link GenericTemplate}.
 * @category Component
 * @props {@link GenericItemProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/template/generic)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/templates/generic).
 */
export const GenericItem: FacebookComponent<
  GenericItemProps,
  PartSegment<{}>
> = makeFacebookComponent(async function GenericItem(node, path, render) {
  const {
    buttons,
    title,
    imageUrl,
    subtitle,
    defaultAction: defaultActionProp,
  } = node.props;

  const buttonSegments = await render(buttons, '.buttons');
  const buttonValues = buttonSegments?.map((segment) => segment.value);

  const defaultActionSegments = await render(
    defaultActionProp,
    '.defaultAction'
  );

  let defaultAction;
  if (defaultActionSegments !== null) {
    const { title: _, ...restOfUrlButton } = defaultActionSegments[0].value;
    defaultAction = restOfUrlButton;
  }

  return [
    makePartSegment(node, path, {
      title,
      image_url: imageUrl,
      subtitle,
      default_action: defaultAction,
      buttons: buttonValues,
    }),
  ];
});

/**
 * @category Props
 */
export type GenericTemplateProps = {
  /**
   * {@link GenericItem} elements under the template. Specifying multiple
   * elements will send a horizontally scrollable carousel of templates. A
   * maximum of 10 elements is supported.
   */
  children: SociablyNode;
  sharable?: boolean;
  /**
   * The aspect ratio used to render images specified by element.image_url.
   * Defaults to horizontal.
   */
  imageAspectRatio?: 'horizontal' | 'square';
};

/**
 * The generic template allows you to send a structured message that includes an
 * image, text and buttons. A generic template with multiple templates described
 * in the elements array will send a horizontally scrollable carousel of items,
 * each composed of an image, text and buttons.
 * @category Component
 * @props {@link GenericTemplateProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/template/generic)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/templates/generic).
 */
export const GenericTemplate: FacebookComponent<
  GenericTemplateProps,
  UnitSegment<MessageValue>
> = makeFacebookComponent(async function GenericTemplate(node, path, render) {
  const { children, sharable, imageAspectRatio } = node.props;
  const elementsSegments = await render(children, '.children');
  const elementValues = elementsSegments?.map((segment) => segment.value);

  return [
    makeUnitSegment(node, path, {
      type: 'message',
      apiPath: PATH_MESSAGES,
      params: {
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              sharable,
              image_aspect_ratio: imageAspectRatio,
              elements: elementValues,
            },
          },
        },
      },
    }),
  ];
});
