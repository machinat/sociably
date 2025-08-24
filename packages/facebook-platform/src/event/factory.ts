import { createEventFactory } from '@sociably/meta-messenger-platform-base';
import type { FacebookRawEvent } from '../types.js';
import FacebookChat from '../Chat.js';
import FacebookUser from '../User.js';
import FacebookPage from '../Page.js';

const createMessengerEvent = createEventFactory<
  FacebookPage,
  FacebookChat,
  FacebookUser
>({
  createAgent: (pageId) => new FacebookPage(pageId),
  createChat: (pageId, target) => new FacebookChat(pageId, target),
  createUser: (pageId, userId) => new FacebookUser(pageId, userId),
});

const createEvent = (
  pageId: string,
  isStandBy: boolean,
  rawEvent: FacebookRawEvent,
) => createMessengerEvent(pageId, isStandBy, rawEvent);

export default createEvent;
