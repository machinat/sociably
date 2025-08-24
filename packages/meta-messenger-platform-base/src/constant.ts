export const MESSENGER_MESSAGING_TYPE_RESPONSE = 'RESPONSE';

export const PATH_MESSAGES = 'me/messages' as const;

export const PATH_PASS_THREAD_CONTROL = 'me/pass_thread_control' as const;
export const PATH_REQUEST_THREAD_CONTROL = 'me/request_thread_control' as const;
export const PATH_TAKE_THREAD_CONTROL = 'me/take_thread_control' as const;

export const PATH_MESSAGE_ATTACHMENTS = 'me/message_attachments' as const;
export const PATH_MESSENGER_PROFILE = 'me/messenger_profile' as const;

export const MESSENGER_PAGE_SUBSCRIPTION_FIELDS = [
  'messages',
  'messaging_postbacks',
  'messaging_optins',
  'messaging_handovers',
  'messaging_policy_enforcement',
  'messaging_account_linking',
  'messaging_game_plays',
  'messaging_referrals',
];
