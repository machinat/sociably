import { CreateAppContext } from '../../../types';
import { when } from '../../../utils';

export default ({ platforms }: CreateAppContext): string => when(
  platforms.includes('webview')
)`
import Machinat, { makeContainer, BasicBot } from '@machinat/core';
import WithMenu from '../components/WithMenu';
import { WebAppEventContext } from '../types';

const handleWebview = makeContainer({ deps: [BasicBot] })(
  (baseBot) =>
    async (ctx: WebAppEventContext) => {
      const { event, bot: webviewBot, metadata: { auth } } = ctx;
      
      if (event.type === 'connect') {
        // send hello when webview connection connect
        await webviewBot.send(event.channel, {
          category: 'greeting',
          type: 'hello',
          payload: \`Hello, user from \${auth.platform}!\`,
        });
      } else if (event.type === 'hello') {
        // reflect hello to chatroom
        await baseBot.render(
          auth.channel,
          <WithMenu>Hello {event.payload}!</WithMenu>
        );
      }
    }
);

export default handleWebview;
`;
