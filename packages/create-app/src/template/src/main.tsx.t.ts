import { when } from '../../utils.js';
import { CreateAppContext } from '../../types.js';

export default ({ platforms, withWebview }: CreateAppContext): string => `
import ${when(platforms.includes('telegram'))`Sociably, `}{
    serviceContainer,
} from '@sociably/core';${when(platforms.includes('telegram'))`
import { AnswerCallbackQuery } from '@sociably/telegram/components';`}
import { Stream } from '@sociably/stream';
import { filter } from '@sociably/stream/operators';
import Script from '@sociably/script';
import handleChat from './handlers/handleChat.js';${when(withWebview)`
import handleWebview from './handlers/handleWebview.js';`}
import { AppEventContext, ChatEventContext } from './types.js';

const main = (event$: Stream<AppEventContext>): void => {
  // continue running scripts
  const chat$ = event$
    .pipe(${when(withWebview)`
      filter((ctx) => ctx.event.platform !== 'webview'),`}
      filter(
        (ctx) =>
          ctx.event.category === 'message' || ctx.event.category === 'postback'
      ),
      filter(
        serviceContainer({ deps: [Script.Processor] })(
          (processor) => async (ctx: ChatEventContext) => {
            if (!ctx.event.thread) {
              return true;
            }
            const runtime = await processor.continue(ctx.event.thread, ctx);
            if (runtime) {
              await ctx.reply(runtime.output());
            }
            return !runtime;
          }
        )
      )
    );

  // handle messages and postbacks from chat platforms
  chat$
    .subscribe(handleChat)
    .catch(console.error);${when(platforms.includes('telegram'))`

  // answer Telegram callback_query
  event$
    .pipe(filter((ctx) => ctx.event.type === 'callback_query'))
    .subscribe(
      (ctx: ChatEventContext & { event: { type: 'callback_query' } }) =>
        ctx.reply(<AnswerCallbackQuery queryId={ctx.event.queryId} />)
    )
    .catch(console.error);`}${when(withWebview)`

  // handle events from webview
  event$
    .pipe(filter((ctx) => ctx.event.platform === 'webview'))
    .subscribe(handleWebview)
    .catch(console.error);`}
};

export default main;
`;
