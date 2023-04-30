import { CreateAppContext } from '../../../types';
import { when } from '../../../utils';

export default ({ platforms, withWebview }: CreateAppContext): string => when(
  withWebview
)`
import Sociably, { makeContainer, BaseBot } from '@sociably/core';
import WithMenu from '../components/WithMenu';
import { WebAppEventContext } from '../types';

const handleWebview = makeContainer({ deps: [BaseBot] })(
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
