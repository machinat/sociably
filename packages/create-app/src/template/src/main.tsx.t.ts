import { when, polishFileContent } from '../../templateHelper';
import { CreateAppContext } from '../../types';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(`
import Machinat from '@machinat/core';${when(platforms.includes('webview'))`
import { makeContainer } from '@machinat/core/service';`}
import { Stream } from '@machinat/stream';
import { filter } from '@machinat/stream/operators';${when(
    platforms.includes('webview')
  )`
import WithWebviewLink from './components/WithWebviewLink';`}
import type {
  AppEventContext,
  ChatEventContext,${when(platforms.includes('webview'))`
  WebAppEventContext,`}
} from './types';

const main = (event$: Stream<AppEventContext>): void => {
  event$
    .pipe(filter(({ event }) => event.category === 'message'))
    .subscribe(async ({ event, reply }: ChatEventContext) => {
      await reply(${
        platforms.includes('webview')
          ? `
        <WithWebviewLink>
          Hello {event.type === 'text' ? event.text : 'World'}!
        </WithWebviewLink>`
          : `
        <p>Hello {event.type === 'text' ? event.text : 'World'}!</p>`
      }
      );
    });
${when(platforms.includes('webview'))`
  event$
    .pipe(filter(({ event }) => event.platform === 'webview'))
    .subscribe(
      makeContainer({
        deps: [Machinat.BaseBot],
      })(
        (baseBot) => async ({
          event,
          bot: webviewBot,
          metadata: { auth },
        }: WebAppEventContext) => {
          if (event.type === 'connect') {
            await webviewBot.send(event.channel, {
              type: 'hello',
              payload: \`Hello, user from \${auth.platform}!\`,
            });
          } else if (event.type === 'hello') {
            await baseBot.render(
              auth.channel,
              <WithWebviewLink>Hello {event.payload}!</WithWebviewLink>
            );
          }
        }
      )
    );`}
};

export default main;
`);
