import { when, polishFileContent } from '../../utils';
import { CreateAppContext } from '../../types';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(`
import { Stream } from '@machinat/stream';
import { filter } from '@machinat/stream/operators';
import handleMessage from './handlers/handleMessage';${when(
    platforms.includes('webview')
  )`
import handleWebview from './handlers/handleWebview';`}
import {
  AppEventContext,
  ChatEventContext,${when(platforms.includes('webview'))`
  WebAppEventContext,`}
} from './types';

const main = (event$: Stream<AppEventContext>): void => {
  event$
    .pipe(
      filter(
        (ctx): ctx is ChatEventContext & { event: { category: 'message' } } =>
          ctx.event.category === 'message'
      )
    )
    .subscribe(handleMessage);
${when(platforms.includes('webview'))`
  event$
    .pipe(
      filter(
        (ctx): ctx is WebAppEventContext => ctx.event.platform === 'webview'
      )
    )
    .subscribe(handleWebview);`}
};

export default main;
`);
