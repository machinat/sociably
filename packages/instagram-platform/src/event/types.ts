import type { FacebookMessengerEvent } from '@sociably/meta-messenger-platform-base';
import type InstagramChat from '../Chat.js';
import type InstagramUser from '../User.js';
import type InstagramAgent from '../Agent.js';

/** @category Event */
export type InstagramEvent = FacebookMessengerEvent<
  InstagramAgent,
  InstagramChat,
  InstagramUser
>;
