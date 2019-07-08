// @flow
export const MESSENGER = 'messenger';
export const MESSENGER_NAMESPACE = 'Messenger';
export const MESSENGER_NATIVE_TYPE = Symbol.for('machinat.messenger.native');

export const ATTACHED_FILE_DATA = Symbol(
  'machinat.messenger.job.attached_file_data'
);

export const ATTACHED_FILE_INFO = Symbol(
  'machinat.messenger.job.attached_file_info'
);

export const ENTRY_MESSAGES = 'me/messages';

export const ENTRY_PASS_THREAD_CONTROL = 'me/pass_thread_control';
export const ENTRY_REQUEST_THREAD_CONTROL = 'me/request_thread_control';
export const ENTRY_TAKE_THREAD_CONTROL = 'me/take_thread_control';

export const ENTRY_MESSAGE_CREATIVES = 'me/message_creatives';
export const ENTRY_BROADCAST_MESSAGES = 'me/broadcast_messages';
export const ENTRY_CUSTOM_LABELS = 'me/custom_labels';
