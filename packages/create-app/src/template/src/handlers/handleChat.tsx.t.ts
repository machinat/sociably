import { CreateAppContext } from '../../../types.js';
import { when } from '../../../utils.js';

export default ({ platforms }: CreateAppContext): string => `
import Sociably, { serviceContainer } from '@sociably/core';
import About from '../scenes/About';
import WithMenu from '../components/WithMenu';
import useIntent from '../services/useIntent';
import useUserProfile from '../services/useUserProfile';
import { ChatEventContext } from '../types';

const handleChat = serviceContainer({
  deps: [useIntent, useUserProfile],
})(
  (getIntent, getUserProfile) =>
    async (
      ctx: ChatEventContext & { event: { category: 'message' | 'postback' } }
    ) => {
      const { event, reply } = ctx;${when(platforms.includes('telegram'))`
      if (!event.thread) {
        return
      }`}
      const intent = await getIntent(event);

      if (intent.type === 'greeting') {
        const profile = await getUserProfile(event.user);
        return reply(
          <WithMenu>Hello {profile?.name || 'there'}!</WithMenu>
        );
      }

      if (intent.type === 'about') {
        return reply(<About.Start />);
      }

      return reply(
        <WithMenu>
          Hello {event.type === 'text' ? event.text : 'World'}!
        </WithMenu>
      );
    }
)

export default handleChat;
`;
