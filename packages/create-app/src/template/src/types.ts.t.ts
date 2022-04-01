import { CreateAppContext } from '../../types';
import { when } from '../../utils';

export default ({
  platforms,
  withWebview,
}: CreateAppContext): string => `${when(platforms.includes('messenger'))`
import type { MessengerEventContext } from '@machinat/messenger';${when(
  withWebview
)`
import type MessengerWebviewAuth from '@machinat/messenger/webview';`}`}${when(
  platforms.includes('twitter')
)`
import type { TwitterEventContext } from '@machinat/twitter';${when(
  withWebview
)`
import type TwitterWebviewAuth from '@machinat/twitter/webview';`}`}${when(
  platforms.includes('telegram')
)`
import type { TelegramEventContext } from '@machinat/telegram';${when(
  withWebview
)`
import type TelegramWebviewAuth from '@machinat/telegram/webview';`}`}${when(
  platforms.includes('line')
)`
import type { LineEventContext } from '@machinat/line';${when(withWebview)`
import type LineWebviewAuth from '@machinat/line/webview';`}`}${when(
  withWebview
)`
import type { WebviewEventContext } from '@machinat/webview';`}

export type ChatEventContext =${when(platforms.includes('messenger'))`
  | MessengerEventContext`}${when(platforms.includes('twitter'))`
  | TwitterEventContext`}${when(platforms.includes('telegram'))`
  | TelegramEventContext`}${when(platforms.includes('line'))`
  | LineEventContext`};
${when(withWebview)`

export type WebAppEventContext = WebviewEventContext<${when(
  platforms.includes('messenger')
)`
    | MessengerWebviewAuth`}${when(platforms.includes('twitter'))`
    | TwitterWebviewAuth`}${when(platforms.includes('telegram'))`
    | TelegramWebviewAuth`}${when(platforms.includes('line'))`
    | LineWebviewAuth`}
  >;`}

export type AppEventContext =
  | ChatEventContext${when(withWebview)`
  | WebAppEventContext`};
`;
