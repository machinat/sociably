import { CreateAppContext } from '../../types';
import { when } from '../../utils';

export default ({
  platforms,
  withWebview,
}: CreateAppContext): string => `${when(platforms.includes('messenger'))`
import type { MessengerEventContext } from '@sociably/messenger';${when(
  withWebview
)`
import type MessengerAuth from '@sociably/messenger/webview';`}`}${when(
  platforms.includes('twitter')
)`
import type { TwitterEventContext } from '@sociably/twitter';${when(
  withWebview
)`
import type TwitterAuth from '@sociably/twitter/webview';`}`}${when(
  platforms.includes('telegram')
)`
import type { TelegramEventContext } from '@sociably/telegram';${when(
  withWebview
)`
import type TelegramAuth from '@sociably/telegram/webview';`}`}${when(
  platforms.includes('line')
)`
import type { LineEventContext } from '@sociably/line';${when(withWebview)`
import type LineAuth from '@sociably/line/webview';`}`}${when(withWebview)`
import type { WebviewEventContext } from '@sociably/webview';`}

export type ChatEventContext =${when(platforms.includes('messenger'))`
  | MessengerEventContext`}${when(platforms.includes('twitter'))`
  | TwitterEventContext`}${when(platforms.includes('telegram'))`
  | TelegramEventContext`}${when(platforms.includes('line'))`
  | LineEventContext`};
${when(withWebview)`

export type WebAppEventContext = WebviewEventContext<${when(
  platforms.includes('messenger')
)`
    | MessengerAuth`}${when(platforms.includes('twitter'))`
    | TwitterAuth`}${when(platforms.includes('telegram'))`
    | TelegramAuth`}${when(platforms.includes('line'))`
    | LineAuth`}
  >;`}

export type AppEventContext =
  | ChatEventContext${when(withWebview)`
  | WebAppEventContext`};
`;
