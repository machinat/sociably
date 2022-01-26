export default () => `
import Machinat, { makeContainer } from '@machinat/core';
import About from '../scenes/About';
import WithMenu from '../components/WithMenu';
import useIntent from '../services/useIntent';
import useUserProfile from '../services/useUserProfile';
import { ChatEventContext } from '../types';

const handleChat = makeContainer({
  deps: [useIntent, useUserProfile],
})(
  (getIntent, getUserProfile) =>
    async (
      ctx: ChatEventContext & { event: { category: 'message' } }
    ) => {
      const { event, reply } = ctx;
      const intent = await getIntent(event);

      if (intent.type === 'greeting') {
        const profile = await getUserProfile(event.user);
        return reply(
          <WithMenu>Hello {profile?.name || 'there'}!</WithMenu>
        );
      }

      if (intent.type === 'about') {
        return reply(<About.Start channel={event.channel} />);
      }

      await reply(
        <WithMenu>
          Hello {event.type === 'text' ? event.text : 'World'}!
        </WithMenu>
      );
    }
)

export default handleChat;
`;
