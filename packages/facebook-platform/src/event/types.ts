import type { FacebookMessengerEvent } from '@sociably/meta-messenger-platform-base';
import type FacebookChat from '../Chat.js';
import type FacebookUser from '../User.js';
import type FacebookPage from '../Page.js';

/** @category Event */
export type FacebookEvent = FacebookMessengerEvent<
  FacebookPage,
  FacebookChat,
  FacebookUser
>;
