import { SociablyNode } from '@sociably/core';
import {
  makeUnitSegment,
  UnitSegment,
  InnerRenderFn,
} from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent.js';
import { WhatsAppSegmentValue, WhatsAppComponent } from '../types.js';

/**
 * @category Props
 */
export type InteractiveProps = {
  /**
   * The content body of the message. Emojis and markdown are supported. Maximum
   * length: 1024 characters
   */
  children: SociablyNode;
  /**
   * The footer content. Emojis, markdown, and links are supported. Maximum
   * length: 60 characters
   */
  footer?: SociablyNode;
  /**
   * Header content displayed on top of a message. It can be text or an
   * `Image`, `Document`, `Video` element
   */
  header?: SociablyNode;
  /** Reply to the specified message */
  replyTo?: string;
};

const HEADER_MEDIA_TYPES = ['image', 'document', 'video'];
const HEADER_SEGMENT_TYPES = ['text', 'unit', 'raw'];

const renderContents = async (
  { header, footer, children }: InteractiveProps,
  render: InnerRenderFn
) => {
  const [headerSegments, childrenSegments, footerSegments] = await Promise.all([
    render<WhatsAppSegmentValue>(header, '.header'),
    render(children, '.children'),
    render(footer, '.footer'),
  ]);

  if (childrenSegments) {
    for (const seg of childrenSegments) {
      if (seg.type !== 'text') {
        throw new TypeError(
          `"children" prop should contain only textual content`
        );
      }
    }
  } else {
    throw new TypeError(`"children" prop should not be empty`);
  }
  if (footerSegments) {
    for (const seg of footerSegments) {
      if (seg.type !== 'text') {
        throw new TypeError(
          `"footer" prop should contain only textual content`
        );
      }
    }
  }

  if (
    headerSegments &&
    (headerSegments.length > 1 ||
      !HEADER_SEGMENT_TYPES.includes(headerSegments[0].type) ||
      (headerSegments[0].type === 'unit' &&
        !HEADER_MEDIA_TYPES.includes(
          headerSegments[0].value.message.type as never
        )))
  ) {
    throw new TypeError(
      '"header" prop should contain only text or one <Image/>, <Video/>, <Document/> element'
    );
  }
  let headerValue;
  let headerMediaFile;
  if (headerSegments?.[0].type === 'text') {
    headerValue = {
      type: 'text',
      text: headerSegments[0].value,
    };
  } else if (headerSegments) {
    const segValue: WhatsAppSegmentValue = headerSegments[0].value;
    const headerType = segValue.message.type!;
    headerValue = {
      type: headerType,
      [headerType]: segValue.message[headerType],
    };
    headerMediaFile = segValue.mediaFile;
  }

  return {
    headerValue,
    headerMediaFile,
    bodyValue: childrenSegments
      ? { text: childrenSegments[0].value }
      : undefined,
    footerValue: footerSegments ? { text: footerSegments[0].value } : undefined,
  };
};

export type ListTemplateProps = InteractiveProps & {
  /** Button title. Emojis are supported, markdown is not. */
  buttonTitle: string;
  /**
   * `ListSection` elements for the list content. Minimum of 1, maximum of 10
   */
  sections: SociablyNode;
};

/**
 * Send a message with interactive list
 * @category Component
 * @props {@link ListTemplateProps}
 */
export const ListTemplate: WhatsAppComponent<
  ListTemplateProps,
  UnitSegment<WhatsAppSegmentValue>
> = makeWhatsAppComponent(async function ListTemplate(node, path, render) {
  const { buttonTitle, sections, replyTo } = node.props;

  const [
    sectionsSegments,
    { headerValue, headerMediaFile, bodyValue, footerValue },
  ] = await Promise.all([
    render(sections, '.sections'),
    renderContents(node.props, render),
  ]);

  if (!sectionsSegments) {
    throw new TypeError('"sections" prop should not be empty');
  }

  return [
    makeUnitSegment(node, path, {
      message: {
        type: 'interactive',
        interactive: {
          type: 'list',
          body: bodyValue,
          footer: footerValue,
          header: headerValue,
          actions: {
            button: buttonTitle,
            sections: sectionsSegments.map(({ value }) => value),
          },
        },
        context: replyTo ? { message_id: replyTo } : undefined,
      },
      mediaFile: headerMediaFile,
    }),
  ];
});

export type ButtonsTemplateProps = InteractiveProps & {
  /** Add 1 to 3 `ReplyButton` element for users to perform */
  buttons: SociablyNode;
};

/**
 * Send a message with interactive buttons
 * @category Component
 * @props {@link ButtonsTemplateProps}
 */
export const ButtonsTemplate: WhatsAppComponent<
  ButtonsTemplateProps,
  UnitSegment<WhatsAppSegmentValue>
> = makeWhatsAppComponent(async function ButtonsTemplate(node, path, render) {
  const { buttons, replyTo } = node.props;

  const [
    buttonsSegments,
    { headerValue, headerMediaFile, bodyValue, footerValue },
  ] = await Promise.all([
    render(buttons, '.buttons'),
    renderContents(node.props, render),
  ]);

  if (!buttonsSegments) {
    throw new TypeError('"buttons" prop should not be empty');
  }

  return [
    makeUnitSegment(node, path, {
      message: {
        type: 'interactive',
        interactive: {
          type: 'button',
          body: bodyValue,
          footer: footerValue,
          header: headerValue,
          action: {
            buttons: buttonsSegments.map(({ value }) => value),
          },
        },
        context: replyTo ? { message_id: replyTo } : undefined,
      },
      mediaFile: headerMediaFile,
    }),
  ];
});
