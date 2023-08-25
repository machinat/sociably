import { createEventFactory } from '@sociably/messenger';
import type { InstagramRawEvent } from '../types.js';
import InstagramChat from '../Chat.js';
import InstagramUser from '../User.js';
import InstagramAgent from '../Agent.js';

const createMessengerEvent = createEventFactory<
  InstagramAgent,
  InstagramChat,
  InstagramUser
>({
  createChannel: (agentId) => new InstagramAgent(agentId),
  createChat: (agentId, target) => new InstagramChat(agentId, target),
  createUser: (agentId, userId) => new InstagramUser(agentId, userId),
});

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createEvent = (
  agentId: string,
  isStandBy: boolean,
  rawEvent: InstagramRawEvent
) => {
  return createMessengerEvent(agentId, isStandBy, rawEvent);
};

export default createEvent;
