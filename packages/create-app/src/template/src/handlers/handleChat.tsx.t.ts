import { CreateAppContext } from '../../../types.js';
import { when } from '../../../utils.js';

export default ({ platforms }: CreateAppContext): string => `
import Sociably, { serviceContainer } from '@sociably/core';
import About from '../scenes/About.js';
import HelloWithMenu from '../components/HelloWithMenu.js';
import useIntent from '../services/useIntent.js';
import useUserProfile from '../services/useUserProfile.js';
import { ChatEventContext } from '../types.js';

const handleChat = serviceContainer({
  deps: [useIntent, useUserProfile],
})(
  (getIntent, getUserProfile) =>
    async (
      ctx: ChatEventContext & { event: { category: 'message' | 'callback' } }
    ) => {
      const { event, reply } = ctx;${when(platforms.includes('telegram'))`
      if (!event.thread) {
        return
      }`}
      const intent = await getIntent(event);

      if (intent.type === 'greeting') {
        const profile = await getUserProfile(event.channel, event.user);
        return reply(
          <HelloWithMenu to={profile?.name || 'there'} />
        );
      }

      if (intent.type === 'about') {
        return reply(<About.Start />);
      }

      return reply(
        <HelloWithMenu to={event.type === 'text' ? event.text : 'World'} />
      );
    }
)

export default handleChat;
`;
