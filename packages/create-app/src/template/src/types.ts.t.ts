import { CreateAppContext } from '../../types.js';
import { when } from '../../utils.js';

export default ({
  platforms,
  withWebview,
}: CreateAppContext): string => `${when(platforms.includes('facebook'))`
import type { FacebookEventContext } from '@sociably/facebook';${when(
  withWebview
)`
import type FacebookAuth from '@sociably/facebook/webview';`}`}${when(
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

export type ChatEventContext =${when(platforms.includes('facebook'))`
  | FacebookEventContext`}${when(platforms.includes('twitter'))`
  | TwitterEventContext`}${when(platforms.includes('telegram'))`
  | TelegramEventContext`}${when(platforms.includes('line'))`
  | LineEventContext`};
${when(withWebview)`

export type WebAppEventContext = WebviewEventContext<${when(
  platforms.includes('facebook')
)`
    | FacebookAuth`}${when(platforms.includes('twitter'))`
    | TwitterAuth`}${when(platforms.includes('telegram'))`
    | TelegramAuth`}${when(platforms.includes('line'))`
    | LineAuth`}
  >;`}

export type AppEventContext =
  | ChatEventContext${when(withWebview)`
  | WebAppEventContext`};
`;
