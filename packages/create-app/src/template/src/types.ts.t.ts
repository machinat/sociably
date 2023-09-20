import { CreateAppContext } from '../../types.js';
import { when } from '../../utils.js';

export default ({
  platforms,
  withWebview,
}: CreateAppContext): string => `${when(platforms.includes('facebook'))`
import type { FacebookEventContext } from '@sociably/facebook';${when(
  withWebview,
)`
import type FacebookWebview from '@sociably/facebook/webview';`}`}${when(
  platforms.includes('instagram'),
)`
import type { InstagramEventContext } from '@sociably/instagram';${when(
  withWebview,
)`
import type InstagramWebview from '@sociably/instagram/webview';`}`}${when(
  platforms.includes('whatsapp'),
)`
import type { WhatsAppEventContext } from '@sociably/whatsapp';${when(
  withWebview,
)`
import type WhatsAppWebview from '@sociably/whatsapp/webview';`}`}${when(
  platforms.includes('twitter'),
)`
import type { TwitterEventContext } from '@sociably/twitter';${when(
  withWebview,
)`
import type TwitterWebview from '@sociably/twitter/webview';`}`}${when(
  platforms.includes('telegram'),
)`
import type { TelegramEventContext } from '@sociably/telegram';${when(
  withWebview,
)`
import type TelegramWebview from '@sociably/telegram/webview';`}`}${when(
  platforms.includes('line'),
)`
import type { LineEventContext } from '@sociably/line';${when(withWebview)`
import type LineWebview from '@sociably/line/webview';`}`}${when(withWebview)`
import type { WebviewEventContext } from '@sociably/webview';`}

export type ChatEventContext =${when(platforms.includes('facebook'))`
  | FacebookEventContext`}${when(platforms.includes('instagram'))`
  | InstagramEventContext`}${when(platforms.includes('whatsapp'))`
  | WhatsAppEventContext`}${when(platforms.includes('twitter'))`
  | TwitterEventContext`}${when(platforms.includes('telegram'))`
  | TelegramEventContext`}${when(platforms.includes('line'))`
  | LineEventContext`};
${when(withWebview)`

export type WebAppEventContext = WebviewEventContext<${when(
  platforms.includes('facebook'),
)`
    | FacebookWebview`}${when(platforms.includes('instagram'))`
    | InstagramWebview`}${when(platforms.includes('whatsapp'))`
    | WhatsAppWebview`}${when(platforms.includes('twitter'))`
    | TwitterWebview`}${when(platforms.includes('telegram'))`
    | TelegramWebview`}${when(platforms.includes('line'))`
    | LineWebview`}
  >;`}

export type AppEventContext =
  | ChatEventContext${when(withWebview)`
  | WebAppEventContext`};
`;
