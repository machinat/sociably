// @flow
import { ENTRY_BROADCAST_MESSAGES, ENTRY_CUSTOM_LABELS } from '../apiEntry';
import GeneralMessengerAPIThread from './general';

export { default as ChatThread } from './chat';
export { default as MESSAGE_CREATIVES_THREAD } from './creative';

export const BROADCAST_MESSAGES_THREAD = new GeneralMessengerAPIThread(
  ENTRY_BROADCAST_MESSAGES,
  {
    messaging_type: 'MESSAGE_TAG',
    tag: 'NON_PROMOTIONAL_SUBSCRIPTION',
  }
);

export const CREATE_LABELS_THREAD = new GeneralMessengerAPIThread(
  ENTRY_CUSTOM_LABELS
);
