import { CreateAppContext } from '../../types';
import { when } from '../../utils';

export default ({ platforms }: CreateAppContext): string => `${when(
  platforms.includes('messenger')
)`
import type { MessengerEventContext } from '@machinat/messenger';${when(
  platforms.includes('webview')
)`
import type MessengerWebviewAuth from '@machinat/messenger/webview';`}`}${when(
  platforms.includes('twitter')
)`
import type { TwitterEventContext } from '@machinat/twitter';${when(
  platforms.includes('webview')
)`
import type TwitterWebviewAuth from '@machinat/twitter/webview';`}`}${when(
  platforms.includes('telegram')
)`
import type { TelegramEventContext } from '@machinat/telegram';${when(
  platforms.includes('webview')
)`
import type TelegramWebviewAuth from '@machinat/telegram/webview';`}`}${when(
  platforms.includes('line')
)`
import type { LineEventContext } from '@machinat/line';${when(
  platforms.includes('webview')
)`
import type LineWebviewAuth from '@machinat/line/webview';`}`}${when(
  platforms.includes('webview')
)`
import type { WebviewEventContext } from '@machinat/webview';`}

export type ChatEventContext =${when(platforms.includes('messenger'))`
  | MessengerEventContext`}${when(platforms.includes('twitter'))`
  | TwitterEventContext`}${when(platforms.includes('telegram'))`
  | TelegramEventContext`}${when(platforms.includes('line'))`
  | LineEventContext`};
${when(platforms.includes('webview'))`

export type WebAppEventContext = WebviewEventContext<${when(
  platforms.includes('messenger')
)`
    | MessengerWebviewAuth`}${when(platforms.includes('twitter'))`
    | TwitterWebviewAuth`}${when(platforms.includes('telegram'))`
    | TelegramWebviewAuth`}${when(platforms.includes('line'))`
    | LineWebviewAuth`}
  >;`}

export type AppEventContext =
  | ChatEventContext${when(platforms.includes('webview'))`
  | WebAppEventContext`};
`;
