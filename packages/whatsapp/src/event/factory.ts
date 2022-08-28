import UserProfile from '../UserProfile';
import {
  TextProto,
  AudioProto,
  ImageProto,
  DocumentProto,
  VideoProto,
  StickerProto,
  UnknownProto,
  ReferralProto,
  InteractiveListProto,
  InteractiveButtonProto,
  QuickReplyProto,
  UserNumberChangeProto,
  UserIdentityChangeProto,
  UnsupportedProto,
  ReadProto,
  SentProto,
  DeliveredProto,
  FailedProto,
  ErrorProto,
} from './protos';
import { ContactData } from '../types';
import { WhatsAppEvent, MessageEvent } from './types';

const makeMessageEvent = (
  messageData,
  businessId: string,
  businessNumber: string,
  businessNumberDisplay: string,
  contacts: ContactData[]
): MessageEvent => {
  const messageType = messageData.type;
  const messageProto =
    messageType === 'text'
      ? TextProto
      : messageType === 'image'
      ? ImageProto
      : messageType === 'audio'
      ? AudioProto
      : messageType === 'document'
      ? DocumentProto
      : messageType === 'video'
      ? VideoProto
      : messageType === 'sticker'
      ? StickerProto
      : messageType === 'referral'
      ? ReferralProto
      : messageType === 'interactive'
      ? messageData.interactive.type === 'button_reply'
        ? InteractiveButtonProto
        : messageData.interactive.type === 'list_reply'
        ? InteractiveListProto
        : UnknownProto
      : messageType === 'button'
      ? QuickReplyProto
      : messageType === 'system'
      ? messageData.system.type === 'customer_changed_number'
        ? UserNumberChangeProto
        : messageData.system.type === 'customer_identity_changed'
        ? UserIdentityChangeProto
        : UnknownProto
      : messageType === 'unknown'
      ? UnsupportedProto
      : UnknownProto;

  const event: MessageEvent = Object.create(messageProto);

  event.payload = messageData;
  event.businessId = businessId;
  event.businessNumber = businessNumber;
  event.businessNumberDisplay = businessNumberDisplay;

  const userNumber = messageData.from;
  const contact = contacts.find(
    ({ wa_id: numberId }) => numberId === userNumber
  );
  if (contact) {
    event.userProfile = new UserProfile(userNumber, contact.profile);
  }

  return event;
};

const makeStatusEvent = (
  statusData,
  businessId: string,
  businessNumber: string,
  businessNumberDisplay: string
): MessageEvent => {
  const statusType = statusData.type;
  const statusProto =
    statusType === 'read'
      ? ReadProto
      : statusType === 'delivered'
      ? DeliveredProto
      : statusType === 'sent'
      ? SentProto
      : statusType === 'failed'
      ? FailedProto
      : UnknownProto;

  const event: MessageEvent = Object.create(statusProto);

  event.payload = statusData;
  event.businessId = businessId;
  event.businessNumber = businessNumber;
  event.businessNumberDisplay = businessNumberDisplay;

  return event;
};

const makeErrorEvent = (
  errorData,
  businessId: string,
  businessNumber: string,
  businessNumberDisplay: string
): MessageEvent => {
  const event: MessageEvent = Object.create(ErrorProto);

  event.payload = errorData;
  event.businessId = businessId;
  event.businessNumber = businessNumber;
  event.businessNumberDisplay = businessNumberDisplay;

  return event;
};

const eventFactory = (updataData): WhatsAppEvent[] => {
  const { id: businessId, changes } = updataData;
  const events: WhatsAppEvent[] = [];

  for (const change of changes) {
    const {
      value: { metadata, contacts, messages, statuses, errors },
    } = change;
    const businessNumber = metadata.phone_number_id;
    const businessNumberDisplay = metadata.display_phone_number;

    if (messages) {
      for (const message of messages) {
        events.push(
          makeMessageEvent(
            message,
            businessId,
            businessNumber,
            businessNumberDisplay,
            contacts
          )
        );
      }
    }

    if (statuses) {
      for (const status of statuses) {
        events.push(
          makeStatusEvent(
            status,
            businessId,
            businessNumber,
            businessNumberDisplay
          )
        );
      }
    }

    if (errors) {
      for (const error of errors) {
        events.push(
          makeErrorEvent(
            error,
            businessId,
            businessNumber,
            businessNumberDisplay
          )
        );
      }
    }
  }

  return events;
};

export default eventFactory;
