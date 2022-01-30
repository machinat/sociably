import { when } from '../utils';
import type { CreateAppContext } from '../types';

export const name = '.env.example';

export default ({ platforms, recognizer }: CreateAppContext) => `
# NOTICE! This file is an example for references.
# DO NOT save any secret data here!
# Your real settings should go to \`.env\` file.

# Basic Setting

# App running environment, "production", "staging", "development", etc.
NODE_ENV= development

# Subdomain to request a https tunnel during development
DEV_TUNNEL_SUBDOMAIN= <your special subdomain>

# Domain name of your webhook server. You can use Machinat's localtunnel service
# in development.
DOMAIN= <value of DEV_TUNNEL_SUBDOMAIN>.t.machinat.dev

# Local http server port
PORT=8080

${when(platforms.includes('messenger'))`
# Messenger Settings
#
#   Configure an app and a page for your bot:
#   1. Visit https://developers.facebook.com/apps and create an app.
#   2. Use Messneger in you app, go to:
#     App Dashboard Page > Add a Product > Messenger > Set Up
#   3. If you don't have a page ready to use, create one at:
#     Messenger Setting Page > Access Tokens > Create New Page
#   4. Connect your page to the app at:
#     Messenger Setting Page > Access Tokens > Add or Remove Pages
#   5. Press "Generate Token" at the connected page to get the token

# Page access token, available at: Messenger Setting Page > Access Tokens > Tokens
MESSENGER_ACCESS_TOKEN= AaBbCcDdEe12345...

# Page id, available at: Messenger Setting Page > Access Tokens > Pages
MESSENGER_PAGE_ID= 1234567890

# App id, available at: App Dashboard > Settings > Basic > App ID
MESSENGER_APP_ID= 1234567890

# App secret, available at: App Dashboard > Settings > Basic > App Secret
MESSENGER_APP_SECRET= abcde12345...

# Random token for webhook verification
MESSENGER_VERIFY_TOKEN= <random secret string>
`}${when(platforms.includes('telegram'))`

# Telegram Settings
#
#   Go to @BotFather (https://t.me/botfather) and send '/newbot' to create a bot.

# Bot token
TELEGRAM_BOT_TOKEN= 123456:AaBbCc12345...

# Bot name
TELEGRAM_BOT_NAME= my_bot

# Secret path string to protect webhook
TELEGRAM_SECRET_PATH= <random secret string>
`}${when(platforms.includes('line'))`

# LINE Settings
#
#   Create a Provider and a Messaging API Channel at https://developers.line.biz/console/

# Provider id, available at: Provider Page > Settings > Provider ID
LINE_PROVIDER_ID= 1234567890

# Channel id, available at: Channel Page > Basic settings > Channel ID
LINE_CHANNEL_ID= 1234567890

# Channel access token, available at: Channel Page > Messaging API > Channel access token 
LINE_ACCESS_TOKEN= AaBbCcDdEe12345...

# Channel secret, available at: Channel Page > Basic settings > Channel secret
LINE_CHANNEL_SECRET = abcdef123456...${when(platforms.includes('webview'))`

# LIFF id for webview, available at: Login Channel Page > LIFF
# You have to create a separated LINE Login channel under the same provider.
LINE_LIFF_ID= 1234567890-abcd1234
`}`}${when(platforms.includes('webview'))`

# Webview Settings

# Secret for signing auth cookies
WEBVIEW_AUTH_SECRET= <random secret string>
`}${when(recognizer === 'dialogflow')`

# Dialogflow Settings
#
#   Follow this guide to prepare GCP auth https://cloud.google.com/dialogflow/es/docs/quick/setup

# GCP project to connect Dialogflow with
DIALOGFLOW_PROJECT_ID= <gcp project id>
# Path to the GCP credential file
GOOGLE_APPLICATION_CREDENTIALS= <credential location>`}
`;
