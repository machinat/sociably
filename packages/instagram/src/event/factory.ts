import { createEventFactory } from '@sociably/messenger';
import type { InstagramRawEvent } from '../types.js';
import InstagramChat from '../Chat.js';
import InstagramUser from '../User.js';
import InstagramPage from '../Page.js';

const createMessengerEvent = createEventFactory<
  InstagramPage,
  InstagramChat,
  InstagramUser
>({
  createPage: (pageId) => new InstagramPage(pageId),
  createChat: (pageId, target) => new InstagramChat(pageId, target),
  createUser: (pageId, userId) => new InstagramUser(pageId, userId),
});

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createEvent = (
  pageId: string,
  isStandBy: boolean,
  rawEvent: InstagramRawEvent
) => {
  return createMessengerEvent(pageId, isStandBy, rawEvent);
};

export default createEvent;
