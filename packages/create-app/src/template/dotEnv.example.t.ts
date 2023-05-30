import { when } from '../utils.js';
import type { CreateAppContext } from '../types.js';

export const name = '.env.example';

export default ({
  platforms,
  recognizer,
  withWebview,
}: CreateAppContext): string => `
# NOTICE! This file is for reference only.
# DO NOT save any secret data here!
# The real settings should go to \`.env\` file.

# Basic Setting

# app name to display
APP_NAME= "My App"

# app environment, "production", "staging", "development", etc.
NODE_ENV= development

# subdomain of the HTTP tunnel. It's only needed in development.
DEV_TUNNEL_SUBDOMAIN= your-special-subdomain

# domain name of the server.
# use {DEV_TUNNEL_SUBDOMAIN}.t.machinat.dev in development.
DOMAIN= your-special-subdomain.t.machinat.dev

# local server port
PORT=8080

${when(platforms.includes('facebook'))`
# Facebook Settings
#   Create a Facebook app and a Facebook page for your bot:
#   1. Visit https://developers.facebook.com/apps and create an app.
#   2. Use Messenger in you app, go to:
#     App Dashboard Page > Add a Product > Messenger > Set Up
#   3. If you don't have a page ready to use, create one at:
#     Messenger Setting Page > Access Tokens > Create New Page
#   4. Connect your page to the app at:
#     Messenger Setting Page > Access Tokens > Add or Remove Pages
#   5. Press "Generate Token" at the connected page to get the token

# page access token, available at: Messenger Setting Page > Access Tokens > Tokens
FACEBOOK_ACCESS_TOKEN= AaBbCcDdEe12345...

# page id, available at: Messenger Setting Page > Access Tokens > Pages
FACEBOOK_PAGE_ID= 1234567890

# app id, available at: App Dashboard > Settings > Basic > App ID
FACEBOOK_APP_ID= 1234567890

# app secret, available at: App Dashboard > Settings > Basic > App Secret
FACEBOOK_APP_SECRET= abcde12345...

# random token for webhook verification
FACEBOOK_VERIFY_TOKEN= <random secret string>
`}${when(platforms.includes('twitter'))`

# Twitter Settings
#   Follow the first 2 sections of this official guide:
#     https://developer.twitter.com/en/docs/twitter-api/premium/account-activity-api/guides/getting-started-with-webhooks
#   You'll create a Twitter app and set up the Account Activity API.
#   Then you can get the following information in the developer portal.

# app id, available at:
#   App Page > Settings > APP ID
TWITTER_APP_ID= 123456789

# app key, available at:
#   App Page > Keys and tokens > Consumer Keys > API Key and Secret
TWITTER_APP_KEY= Aa1Bb2Cc3Dd4Ee5Ff6Gg

# app secret, available at:
#   App Page > Keys and tokens > Consumer Keys > API Key and Secret
TWITTER_APP_SECRET= Aa1Bb2Cc3Dd4Ee5Ff6Gg7Hh8Ii9Jj0

# app bearer token, available at:
#   App Page > Keys and tokens > Authentication Tokens > Bearer Token
TWITTER_BEARER_TOKEN= AAAAAAAAAAAAAAAAAAAAAa1Bb2Cc3Dd4Ee5Ff6Gg7Hh8Ii9Jj0

# user access token, available at:
#   App Page > Keys and tokens > Authentication Tokens > Authentication Tokens
TWITTER_ACCESS_TOKEN= 09876543210123456789-Aa1Bb2Cc3Dd4Ee5Ff6Gg7Hh8Ii9Jj0

# user access token secret, available at:
#   App Page > Keys and tokens > Authentication Tokens > Authentication Tokens
TWITTER_ACCESS_SECRET= Aa1Bb2Cc3Dd4Ee5Ff6Gg7Hh8Ii9Jj0Kk1Ll2Mm3Nn4Oo5Pp6

# env label for account activity API, available at:
#   Products > Premium > Dev Environments > Account Activity API
TWITTER_WEBHOOK_ENV= default
`}${when(platforms.includes('telegram'))`

# Telegram Settings
#   Go to @BotFather (https://t.me/botfather) and send '/newbot' to create a bot.

# bot token from the BotFather
TELEGRAM_BOT_TOKEN= 123456:AaBbCc12345...

# bot username
TELEGRAM_BOT_NAME= my_bot

# a secret string to protect webhook
TELEGRAM_SECRET_PATH= <random secret string>
`}${when(platforms.includes('line'))`

# LINE Settings
#   1. Create a \`Provider\` and a \`Messaging API Channel\` at https://developers.line.biz/console/
#   2. Create a LIFF app in a \`LINE Login Channel\` under the same provider.

# provider id, available at: Provider Page > Settings > Provider ID
LINE_PROVIDER_ID= 1234567890

# channel id, available at: Channel Page > Basic settings > Channel ID
LINE_CHANNEL_ID= 1234567890

# channel access token, available at: Channel Page > Messaging API > Channel access token 
LINE_ACCESS_TOKEN= AaBbCcDdEe12345...

# channel secret, available at: Channel Page > Basic settings > Channel secret
LINE_CHANNEL_SECRET = abcdef123456...

# LIFF id for webview, available at: Login Channel Page > LIFF
LINE_LIFF_ID= 1234567890-abcd1234
`}${when(withWebview)`

# Webview Settings

# secret for signing auth token
WEBVIEW_AUTH_SECRET= <random secret string>
`}${when(recognizer === 'dialogflow')`

# Dialogflow Settings
#   Follow this guide to prepare GCP auth https://cloud.google.com/dialogflow/es/docs/quick/setup

# GCP project to connect Dialogflow
DIALOGFLOW_PROJECT_ID= my-project

# path to the account credential file
GOOGLE_APPLICATION_CREDENTIALS= /path/to/credential.json`}
`;
