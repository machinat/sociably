import { SociablyNode } from '@sociably/core';
import {
  makeUnitSegment,
  UnitSegment,
  IntermediateSegment,
} from '@sociably/core/renderer';
import { formatNode } from '@sociably/core/utils';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent.js';
import { WhatsAppSegmentValue, WhatsAppComponent } from '../types.js';

export type PredefinedTemplateProps = {
  /** Name of the template */
  name: string;
  /**
   * The code of the language or locale to use. Accepts both language and
   * language_locale formats (e.g., en and en_US). For all codes, see [Supported
   * Languages](https://developers.facebook.com/docs/whatsapp/api/messages/message-templates#supported-languages)
   */
  languageCode: string;
  /**
   * Header parameters. For text header, use only `TextParameter` or
   * `CurrencyParameter`. For media header, use exactly one `Image`, `Video` or
   * `Document` element.
   */
  headerParams?: SociablyNode;
  /**
   * Body parameters. It should contain only `TextParameter`,
   * `CurrencyParameter` and `DateTimeParameter`.
   */
  bodyParams?: SociablyNode;
  /**
   * Button parameters. Use only `QuickReplyParameter` or `UrlButtonParameter`
   * depends on the pre-defined button type.
   */
  buttonParams?: SociablyNode;
  /** Reply to the specified message */
  replyTo?: string;
};

const HEADER_MEDIA_TYPES = ['image', 'document', 'video'];
const TEXT_PARAM_TYPES = ['text', 'currency', 'date_time'];
const BUTTON_PARAM_TYPES = ['url', 'quick_reply'];

const checkTextParams = (segments: IntermediateSegment<unknown>[]) => {
  for (const seg of segments) {
    if (!TEXT_PARAM_TYPES.includes(seg.value.type)) {
      throw new TypeError(
        `${formatNode(seg.node)} is not a valid text parameter`,
      );
    }
  }
};

const getValue = ({ value }: IntermediateSegment<unknown>) => value;

/**
 * Send a pre-defined custom template. WhatsApp message templates are specific
 * message formats that businesses use to send out notifications or customer
 * care messages to people that have opted in to notifications. Messages can
 * include appointment reminders, shipping information, issue resolution or
 * payment updates.
 *
 * Before sending a template message, you need to create a template. See [Create
 * Message Templates for Your WhatsApp Business
 * Account](https://developers.facebook.com/micro_site/url/?click_from_context_menu=true&country=TW&destination=https%3A%2F%2Fwww.facebook.com%2Fbusiness%2Fhelp%2F2055875911147364&event_type=click&last_nav_impression_id=11qPRPLhwqt8j8VOZ&max_percent_page_viewed=9&max_viewport_height_px=859&max_viewport_width_px=1512&orig_http_referrer=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2Fwhatsapp%2Fcloud-api%2Fguides%2Fsend-message-templates&orig_request_uri=https%3A%2F%2Fdevelopers.facebook.com%2Fajax%2Fdocs%2Fnav%2F%3Fpath1%3Dwhatsapp%26path2%3Dcloud-api%26path3%3Dguides%26path4%3Dsend-message-templates&region=apac&scrolled=true&session_id=1AzR1OsntMXnFwSoY&site=developers)
 * for more information. If your account is not verified yet, you can use
 * [pre-approved
 * templates](https://developers.facebook.com/micro_site/url/?click_from_context_menu=true&country=TW&destination=https%3A%2F%2Fwww.facebook.com%2Fbusiness%2Fhelp%2F722393685250070&event_type=click&last_nav_impression_id=11qPRPLhwqt8j8VOZ&max_percent_page_viewed=9&max_viewport_height_px=859&max_viewport_width_px=1512&orig_http_referrer=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2Fwhatsapp%2Fcloud-api%2Fguides%2Fsend-message-templates&orig_request_uri=https%3A%2F%2Fdevelopers.facebook.com%2Fajax%2Fdocs%2Fnav%2F%3Fpath1%3Dwhatsapp%26path2%3Dcloud-api%26path3%3Dguides%26path4%3Dsend-message-templates&region=apac&scrolled=true&session_id=1AzR1OsntMXnFwSoY&site=developers).
 *
 * @category Component
 * @props {@link PredefinedTemplateProps}
 */
export const PredefinedTemplate: WhatsAppComponent<
  PredefinedTemplateProps,
  UnitSegment<WhatsAppSegmentValue>
> = makeWhatsAppComponent(
  async function PredefinedTemplate(node, path, render) {
    const {
      name,
      languageCode,
      headerParams,
      bodyParams,
      buttonParams,
      replyTo,
    } = node.props;

    const [headerSegments, bodySegments, buttonsSegments] = await Promise.all([
      render(headerParams, '.headerParams'),
      render(bodyParams, '.bodyParams'),
      render(buttonParams, '.buttonParams'),
    ]);

    const components: unknown[] = [];

    if (headerSegments) {
      if ('message' in headerSegments[0].value) {
        // media based header
        const messageValue = headerSegments[0].value.message;
        const messageType = messageValue.type;

        if (!HEADER_MEDIA_TYPES.includes(messageType)) {
          throw new TypeError(
            `${formatNode(headerSegments[0].node)} is not a valid parameter`,
          );
        }
        if (headerSegments.length > 1) {
          throw new TypeError(`"headerParams" prop contain more than 1 media`);
        }

        components.push({
          type: 'header',
          parameters: [
            {
              type: messageType,
              [messageType]: messageValue[messageType],
            },
          ],
        });
      } else {
        // text based header
        checkTextParams(headerSegments);

        components.push({
          type: 'header',
          parameters: headerSegments.map(getValue),
        });
      }
    }
    if (bodySegments) {
      checkTextParams(bodySegments);

      components.push({
        type: 'body',
        parameters: bodySegments.map(getValue),
      });
    }
    if (buttonsSegments) {
      buttonsSegments.forEach(({ node: buttonNode, value }, idx) => {
        if (!BUTTON_PARAM_TYPES.includes(value.type)) {
          throw new TypeError(
            `${formatNode(buttonNode)} is not a valid button parameter`,
          );
        }

        components.push({
          type: 'button',
          sub_type: value.type,
          index: typeof value.index === 'undefined' ? idx : value.index,
          parameters: [value.parameter],
        });
      });
    }

    return [
      makeUnitSegment(node, path, {
        message: {
          type: 'template',
          template: {
            name,
            language: {
              policy: 'deterministic',
              code: languageCode,
            },
            components,
          },
          context: replyTo ? { message_id: replyTo } : undefined,
        },
      }),
    ];
  },
);
