import {
  TextMessageEvent,
  AudioMessageEvent,
  ImageMessageEvent,
  DocumentMessageEvent,
  VideoMessageEvent,
  StickerMessageEvent,
  ListInteractiveEvent,
  ButtonInteractiveEvent,
  QuickReplyEvent,
  UserNumberChangeEvent,
  UserIdentityChangeEvent,
  ReadEvent,
  SentEvent,
  DeliveredEvent,
  FailedEvent,
  ErrorEvent,
  UnknownEvent,
  ContactsMessageEvent,
  WhatsAppEvent,
  MessageEvent,
  UnknownMessageEvent,
} from './events.js';
import {
  ContactData,
  MessageData,
  StatusData,
  ErrorData,
  WhatsAppRawEvent,
} from '../types.js';

const makeMessageEvent = (
  messageData: MessageData,
  businessAccountId: string,
  agentNumberId: string,
  agentNumberDisplay: string,
  contacts: ContactData[],
): MessageEvent => {
  const messageType = messageData.type;
  const MessageConstructor =
    messageType === 'text'
      ? TextMessageEvent
      : messageType === 'image'
      ? ImageMessageEvent
      : messageType === 'audio'
      ? AudioMessageEvent
      : messageType === 'document'
      ? DocumentMessageEvent
      : messageType === 'video'
      ? VideoMessageEvent
      : messageType === 'sticker'
      ? StickerMessageEvent
      : messageType === 'contacts'
      ? ContactsMessageEvent
      : messageType === 'interactive'
      ? messageData.interactive?.button_reply
        ? ButtonInteractiveEvent
        : messageData.interactive?.list_reply
        ? ListInteractiveEvent
        : UnknownMessageEvent
      : messageType === 'button'
      ? QuickReplyEvent
      : messageType === 'system'
      ? messageData.system?.new_wa_id
        ? UserNumberChangeEvent
        : messageData.system?.identity
        ? UserIdentityChangeEvent
        : UnknownMessageEvent
      : messageType === 'unknown'
      ? UnknownMessageEvent
      : UnknownMessageEvent;

  const userNumber = messageData.from;
  const contact = contacts.find(
    ({ wa_id: numberId }) => numberId === userNumber,
  );

  const event = new MessageConstructor(
    businessAccountId,
    agentNumberId,
    agentNumberDisplay,
    messageData,
    contact?.profile,
  );
  return event;
};

const makeStatusEvent = (
  statusData: StatusData,
  businessAccountId: string,
  agentNumberId: string,
  agentNumberDisplay: string,
): WhatsAppEvent => {
  const statusType = statusData.status;
  const StatusConstructor =
    statusType === 'read'
      ? ReadEvent
      : statusType === 'delivered'
      ? DeliveredEvent
      : statusType === 'sent'
      ? SentEvent
      : statusType === 'failed'
      ? FailedEvent
      : UnknownEvent;

  const event = new StatusConstructor(
    businessAccountId,
    agentNumberId,
    agentNumberDisplay,
    statusData,
  );
  return event;
};

const makeErrorEvent = (
  errorData: ErrorData,
  businessAccountId: string,
  agentNumberId: string,
  agentNumberDisplay: string,
) => {
  const event = new ErrorEvent(
    businessAccountId,
    agentNumberId,
    agentNumberDisplay,
    errorData,
  );
  return event;
};

const eventFactory = (
  updateData: WhatsAppRawEvent['entry'][0],
): WhatsAppEvent[] => {
  const { id: businessAccountId, changes } = updateData;
  const events: WhatsAppEvent[] = [];

  for (const change of changes) {
    const {
      value: { metadata, contacts, messages, statuses, errors },
    } = change;
    const agentNumberId = metadata.phone_number_id;
    const agentNumberDisplay = metadata.display_phone_number;

    if (messages) {
      for (const message of messages) {
        events.push(
          makeMessageEvent(
            message,
            businessAccountId,
            agentNumberId,
            agentNumberDisplay,
            contacts || [],
          ),
        );
      }
    }

    if (statuses) {
      for (const status of statuses) {
        events.push(
          makeStatusEvent(
            status,
            businessAccountId,
            agentNumberId,
            agentNumberDisplay,
          ),
        );
      }
    }

    if (errors) {
      for (const error of errors) {
        events.push(
          makeErrorEvent(
            error,
            businessAccountId,
            agentNumberId,
            agentNumberDisplay,
          ),
        );
      }
    }
  }

  return events;
};

export default eventFactory;
