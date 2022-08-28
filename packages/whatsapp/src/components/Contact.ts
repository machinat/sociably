import { snakeCase } from 'snake-case';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent';
import { WhatsAppSegmentValue, WhatsAppComponent } from '../types';

export type ContactProps = {
  /** Full contact addresses */
  addresses?: {
    /** Type of address */
    type?: 'HOME' | 'WORK';
    /** Street number and name. */
    street?: string;
    /** City name. */
    city?: string;
    /** State abbreviation. */
    state?: string;
    /** ZIP code. */
    zip?: string;
    /** Full country name. */
    country?: string;
    /** Two-letter country abbreviation. */
    countryCode?: string;
  }[];
  /** YYYY-MM-DD formatted string */
  birthday?: string;
  emails?: {
    /** Type of email */
    type?: 'HOME' | 'WORK';
    /** Email address */
    email?: string;
  }[];
  /**
   * Full contact name. At least one of the optional parameters needs to be
   * included with `formattedName`
   */
  name: {
    /** Full name, as it normally appears. */
    formattedName: string;
    /** First name. */
    firstName?: string;
    /** Last name. */
    lastName?: string;
    /** Middle name. */
    middleName?: string;
    /** Name suffix. */
    suffix?: string;
    /** Name prefix. */
    prefix?: string;
  };
  /** Contact organization information */
  org?: {
    /** Name of the contact's company. */
    company?: string;
    /** Name of the contact's department. */
    department?: string;
    /** Contact's business title. */
    title?: string;
  };
  /** Contact phone numbers */
  phones?: {
    /** Phone type */
    type?: 'CELL' | 'MAIN' | 'IPHONE' | 'HOME' | 'WORK';
    /**
     * Automatically populated with the `wa_id` value as a formatted phone
     * number.
     */
    phone?: string;
    /** WhatsApp ID. */
    waId?: string;
  }[];
  urls?: {
    /** URL type */
    type?: 'HOME' | 'WORK';
    /** URL. */
    url?: string;
  }[];
  /** Reply to the specified message */
  replyTo?: string;
};

const transformSnakeCaseKeys = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [snakeCase(k), v]));

/**
 * Send a contact
 * @category Component
 * @props {@link ContactProps}
 */
export const Contact: WhatsAppComponent<
  ContactProps,
  UnitSegment<WhatsAppSegmentValue>
> = makeWhatsAppComponent(function ContactProps(node, path) {
  const { addresses, birthday, emails, name, org, phones, urls, replyTo } =
    node.props;

  return [
    makeUnitSegment(node, path, {
      message: {
        type: 'contact',
        contact: {
          addresses: addresses?.map(transformSnakeCaseKeys),
          birthday,
          emails,
          name: transformSnakeCaseKeys(name),
          org,
          phones: phones?.map(transformSnakeCaseKeys),
          urls,
        },
        context: replyTo ? { message_id: replyTo } : undefined,
      },
    }),
  ];
});
