import { CreateAppContext } from '../../../types.js';
import { when } from '../../../utils.js';

export default ({ platforms, withWebview }: CreateAppContext): string => when(
  withWebview
)`
import Sociably, { serviceContainer, BaseBot } from '@sociably/core';
import WithMenu from '../components/WithMenu';
import { WebAppEventContext } from '../types';

const handleWebview = serviceContainer({ deps: [BaseBot] })(
  (baseBot) =>
    async (ctx: WebAppEventContext) => {
      const { event, bot: webviewBot, metadata: { auth } } = ctx;
      
      if (event.type === 'connect') {
        // send hello when webview connection connect
        await webviewBot.send(event.thread, {
          category: 'greeting',
          type: 'hello',
          payload: \`Hello, user from \${auth.platform}!\`,
        });
      } else if (event.type === 'hello') {
        // reflect hello to chatroom
        await baseBot.render(
          auth.thread,
          <WithMenu>Hello {event.payload}!</WithMenu>
        );
      }
    }
);

export default handleWebview;
`;
