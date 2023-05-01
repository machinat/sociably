import { when } from '../../../utils';
import { CreateAppContext } from '../../../types';

export default ({ platforms, withWebview }: CreateAppContext): string => `
import { makeContainer } from '@sociably/core';${when(
  platforms.includes('facebook')
)`
import Facebook from '@sociably/facebook';`}${when(
  platforms.includes('twitter')
)`
import Twitter from '@sociably/twitter';
import TwitterAssetManager from '@sociably/twitter/asset';`}${when(
  platforms.includes('telegram')
)`
import Telegram from '@sociably/telegram';`}${when(platforms.includes('line'))`
import Line from '@sociably/line';`}

const {
  DOMAIN,${when(platforms.includes('facebook'))`
  FACEBOOK_PAGE_ID,
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  FACEBOOK_VERIFY_TOKEN,`}${when(platforms.includes('twitter'))`
  TWITTER_WEBHOOK_ENV,`}${when(platforms.includes('telegram'))`
  TELEGRAM_SECRET_PATH,`}
} = process.env as Record<string, string>;

const ENTRY_URL = \`https://\${DOMAIN}\`;

export const up = makeContainer({
  deps: [${when(platforms.includes('facebook'))`
    Facebook.Bot,`}${when(platforms.includes('twitter'))`
    Twitter.Bot,
    TwitterAssetManager,`}${when(platforms.includes('telegram'))`
    Telegram.Bot,`}${when(platforms.includes('line'))`
    Line.Bot,`}
  ],
})(async (${when(platforms.includes('facebook'))`
  facebookBot,`}${when(platforms.includes('twitter'))`
  twitterBot,
  twitterAssetManager,`}${when(platforms.includes('telegram'))`
  telegramBot,`}${when(platforms.includes('line'))`
  lineBot`}
) => {${when(platforms.includes('facebook'))`
  // setup page profile in Messenger
  await facebookBot.requestApi('POST', 'me/messenger_profile', {
    greeting: [
      { locale: 'default', text: 'Hello World!' },
    ],${when(withWebview)`
    whitelisted_domains: [ENTRY_URL],`}
  });
  
  // create Facebook webhook subscription, require running server in advance
  await facebookBot.requestApi(
    'POST',
    \`\${FACEBOOK_APP_ID}/subscriptions\`,
    {
      access_token: \`\${FACEBOOK_APP_ID}|\${FACEBOOK_APP_SECRET}\`,
      object: 'page',
      callback_url: \`\${ENTRY_URL}/webhook/facebook\`,
      fields: ['messages', 'messaging_postbacks'],
      include_values: true,
      verify_token: FACEBOOK_VERIFY_TOKEN
    }
  );

  // add page to Facebook webhook
  await facebookBot.requestApi('POST', 'me/subscribed_apps', {
      subscribed_fields: ['messages', 'messaging_postbacks'],
  });`}${when(platforms.includes('twitter'))`

  // register webhook on Twitter
  await twitterAssetManager.setUpWebhook(
    'default',
    TWITTER_WEBHOOK_ENV,
    \`\${ENTRY_URL}/webhook/twitter\`
  );

  // subscribe to Twitter agent user
  await twitterBot.requestApi(
    'POST',
    \`1.1/account_activity/all/\${TWITTER_WEBHOOK_ENV}/subscriptions.json\`
  );`}${when(platforms.includes('telegram'))`

  // setup webhook of the Telegram bot
  await telegramBot.requestApi('setWebhook', {
    url: \`\${ENTRY_URL}/webhook/telegram/\${TELEGRAM_SECRET_PATH}\`,
  });`}${when(platforms.includes('line'))`

  // setup webhook of the LINE channel
  await lineBot.requestApi('PUT', 'v2/bot/channel/webhook/endpoint', {
    endpoint: \`\${ENTRY_URL}/webhook/line\`,
  });`}
});

export const down = makeContainer({
  deps: [${when(platforms.includes('facebook'))`
    Facebook.Bot,`}${when(platforms.includes('twitter'))`
    TwitterAssetManager,`}${when(platforms.includes('telegram'))`
    Telegram.Bot,`}
  ],
})(async (${when(platforms.includes('facebook'))`
  facebookBot,`}${when(platforms.includes('twitter'))`
  twitterAssetManager,`}${when(platforms.includes('telegram'))`
  telegramBot,`}
) => {
${when(platforms.includes('facebook'))`
  // clear page profile in Messenger
  await facebookBot.requestApi('DELETE', 'me/messenger_profile', {
    fields: [
      'get_started',
      'greeting',
      'persistent_menu',
      'whitelisted_domains',
    ],
  });

  // delete app subscriptions
  await facebookBot.requestApi(
    'DELETE',
    \`\${FACEBOOK_PAGE_ID}/subscribed_apps\`,
    { access_token: \`\${FACEBOOK_APP_ID}|\${FACEBOOK_APP_SECRET}\` }
  );
  
  // remove page from webhook subscription
  await facebookBot.requestApi(
    'DELETE',
    \`\${FACEBOOK_APP_ID}/subscriptions\`,
    {
      access_token: \`\${FACEBOOK_APP_ID}|\${FACEBOOK_APP_SECRET}\`,
      object: 'page',
    }
  );`}
${when(platforms.includes('twitter'))`

  // delete Twitter webhook
  await twitterAssetManager.deleteWebhook('default', TWITTER_WEBHOOK_ENV);`}
${when(platforms.includes('telegram'))`

  // delete Telegram webhook
  await telegramBot.requestApi('deleteWebhook');`}
});
`;
