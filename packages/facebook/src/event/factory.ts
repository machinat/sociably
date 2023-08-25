import { createEventFactory } from '@sociably/messenger';
import type { FacebookRawEvent } from '../types.js';
import FacebookChat from '../Chat.js';
import FacebookUser from '../User.js';
import FacebookPage from '../Page.js';

const createMessengerEvent = createEventFactory<
  FacebookPage,
  FacebookChat,
  FacebookUser
>({
  createChannel: (pageId) => new FacebookPage(pageId),
  createChat: (pageId, target) => new FacebookChat(pageId, target),
  createUser: (pageId, userId) => new FacebookUser(pageId, userId),
});

const createEvent = (
  pageId: string,
  isStandBy: boolean,
  rawEvent: FacebookRawEvent
) => {
  return createMessengerEvent(pageId, isStandBy, rawEvent);
};

export default createEvent;
