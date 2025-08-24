import type {
  SociablyNode,
  NativeElement,
  AnyNativeComponent,
} from '@sociably/core';
import {
  makeUnitSegment,
  makePartSegment,
  InnerRenderFn,
  UnitSegment,
  PartSegment,
} from '@sociably/core/renderer';
import { PATH_MESSAGES } from '../constant.js';
import type { MessageValue } from '../types.js';

/**
 * At least one property must be set in addition to title.
 *
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
   * One {@link UrlButton} element to act as the default action executed when the
   * template is tapped.
   */
  defaultAction?: SociablyNode;
};

export async function GenericItem(
  node: NativeElement<GenericItemProps, AnyNativeComponent>,
  path: string,
  render: InnerRenderFn,
): Promise<PartSegment<{}>[]> {
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
    '.defaultAction',
  );

  let defaultAction;
  if (defaultActionSegments) {
    const { title: _, ...restOfUrlButton } = defaultActionSegments[0]
      .value as Record<string, string>;
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
}

/** @category Props */
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

export async function GenericTemplate(
  node: NativeElement<GenericTemplateProps, AnyNativeComponent>,
  path: string,
  render: InnerRenderFn,
): Promise<UnitSegment<MessageValue>[]> {
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
}
