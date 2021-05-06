import { when, polishFileContent } from '../templateHelper';
import type { CreateAppContext } from '../types';

export default ({ platforms }: CreateAppContext) => polishFileContent(`
# app running environment, "production", "staging", "development"... etc.
NODE_ENV=development

# subdomain to request a https tunnel during development
DEV_TUNNEL_SUBDOMAIN=<YOUR_SPECIAL_SUBDOMAIN>

# domain name of the webhook server
DOMAIN=<DEV_TUNNEL_SUBDOMAIN>.t.machinat.dev

# local http server port
PORT=8080

${when(platforms.includes('messenger'))`
# Messenger

# Facebook page id
MESSENGER_PAGE_ID=1234567890

# Facebook app id
MESSENGER_APP_ID=1234567890

# Facebook app secret
MESSENGER_APP_SECRET=abcde12345...

# app access token of the page
MESSENGER_ACCESS_TOKEN=AaBbCcDdEe12345...

# random token for webhook verification
MESSENGER_VERIFY_TOKEN=<_SOME_RANDOM_TOKEN_>
`}${when(platforms.includes('telegram'))`
# Telegram

# full telegram bot token
TELEGRAM_BOT_TOKEN=123456:AaBbCc12345...

#
TELEGRAM_BOT_NAME=MyBot

# secret string to protect webhook
TELEGRAM_SECRET_PATH=<_SOME_RANDOM_TOKEN_>
`}${when(platforms.includes('line'))`
# Line

# line provider id
LINE_PROVIDER_ID=1234567890

# line channel id of the bot channel
LINE_BOT_CHANNEL_ID=1234567890

# official account id
LINE_OFFICIAL_ACCOUNT_ID=@abc123

# bot channel access token
LINE_ACCESS_TOKEN=AaBbCcDdEe12345...

# bot channel secret
LINE_CHANNEL_SECRET=abcdef123456...
${when(platforms.includes('webview'))`
# LIFF id for webview
LINE_LIFF_ID=1234567890-abcd1234
`}`}
${when(platforms.includes('webview'))`
# Webview

# secret for signing auth cookies
WEBVIEW_AUTH_SECRET=<_SOME_RANDOM_TOKEN_>`}
`);
