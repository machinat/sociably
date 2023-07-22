import type {
  SociablyNode,
  NativeElement,
  AnyNativeComponent,
} from '@sociably/core';
import { formatNode } from '@sociably/core/utils';
import {
  makeUnitSegment,
  InnerRenderFn,
  UnitSegment,
} from '@sociably/core/renderer';
import { PATH_MESSAGES } from '../constant.js';
import type { MessageValue } from '../types.js';

/**
 * @category Props
 */
export type ButtonTemplateProps = {
  /**
   * Textual node with content up to 640 characters. Text will appear above the
   * buttons.
   */
  children: SociablyNode;
  /** 1-3 button elements to append after the text. */
  buttons: SociablyNode;
  sharable?: boolean;
};

export async function ButtonTemplate(
  node: NativeElement<ButtonTemplateProps, AnyNativeComponent>,
  path: string,
  render: InnerRenderFn
): Promise<UnitSegment<MessageValue>[]> {
  const { children, buttons, sharable } = node.props;
  const textSegments = await render(children, '.children');

  if (!textSegments) {
    throw new TypeError(`"children" prop should not be empty`);
  }
  for (const segment of textSegments) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-textual node ${formatNode(
          segment.node
        )} received, only textual nodes allowed`
      );
    }
  }

  const buttonSegments = await render(buttons, '.buttons');
  const buttonValues = buttonSegments?.map((segment) => segment.value);

  return [
    makeUnitSegment(node, path, {
      type: 'message',
      apiPath: PATH_MESSAGES,
      params: {
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'button',
              text: textSegments[0].value,
              sharable,
              buttons: buttonValues,
            },
          },
        },
      },
    }),
  ];
}
