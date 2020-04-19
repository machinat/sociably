// @flow
import { namedInterface } from '@machinat/core/service';
import type {
  MessengerPlatformMounter,
  MessengerPlatformConfigs,
} from './types';

export const MESSENGER = 'messenger';

export const ATTACHMENT_DATA = Symbol('messenger.segment.attachment_data');

export const ATTACHMENT_INFO = Symbol('messenger.segment.attachment_info');

export const ASSET_TAG = Symbol.for('messenger.segment.asset_tag');
export const ENTRY_PATH = Symbol.for('messenger.segment.entry');

export const PATH_MESSAGES = 'me/messages';

export const PATH_PASS_THREAD_CONTROL = 'me/pass_thread_control';
export const PATH_REQUEST_THREAD_CONTROL = 'me/request_thread_control';
export const PATH_TAKE_THREAD_CONTROL = 'me/take_thread_control';

export const PATH_MESSAGE_ATTACHMENTS = 'me/message_attachments';
export const PATH_MESSENGER_PROFILE = 'me/messenger_profile';
export const PATH_PERSONAS = 'me/personas';
export const PATH_MESSAGE_CREATIVES = 'me/message_creatives';
export const PATH_BROADCAST_MESSAGES = 'me/broadcast_messages';
export const PATH_CUSTOM_LABELS = 'me/custom_labels';

export const MESSENGER_PLATFORM_CONFIGS_I = namedInterface<MessengerPlatformConfigs>(
  { name: 'MessengerPlatformConfigs' }
);

export const MESSENGER_PLATFORM_MOUNTER_I = namedInterface<MessengerPlatformMounter>(
  { name: 'MessengerPlatformMounter' }
);
