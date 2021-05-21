import { CreateAppContext } from '../../../types';
import { when, polishFileContent } from '../../../utils';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(when(platforms.includes('webview'))`
import Machinat from '@machinat/core';
import { makeContainer } from '@machinat/core/service';
import WithWebviewLink from '../components/WithWebviewLink';
import { WebAppEventContext } from '../types';

const handleWebview = makeContainer({ deps: [Machinat.BaseBot] })(
  (baseBot) =>
    async ({
      event,
      bot: webviewBot,
      metadata: { auth },
    }: WebAppEventContext) => {
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
          <WithWebviewLink>Hello {event.payload}!</WithWebviewLink>
        );
      }
    }
);

export default handleWebview;
`);
