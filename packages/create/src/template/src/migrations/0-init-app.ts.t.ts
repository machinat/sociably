import { when, polishFileContent } from '../../../templateHelper';
import { CreateAppContext } from '../../../types';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(`
import { makeContainer } from '@machinat/core/service';${when(
    platforms.includes('messenger')
  )`
import Messenger from '@machinat/messenger';`}${when(
    platforms.includes('telegram')
  )`
import Telegram from '@machinat/telegram';`}${when(platforms.includes('line'))`
import Line from '@machinat/line';`}

const {
  DOMAIN,${when(platforms.includes('telegram'))`
  MESSENGER_PAGE_ID,
  MESSENGER_APP_ID,
  MESSENGER_APP_SECRET,
  MESSENGER_VERIFY_TOKEN,`}${when(platforms.includes('telegram'))`
  TELEGRAM_SECRET_PATH,`}
} = process.env;

const ENTRY_URL = \`https://\${DOMAIN}\`;

export const up = makeContainer({
  deps: [${when(platforms.includes('messenger'))`
    Messenger.Bot,`}${when(platforms.includes('telegram'))`
    Telegram.Bot,`}${when(platforms.includes('line'))`
    Line.Bot,`}
  ] as const,
})(async (${when(platforms.includes('messenger'))`
  messengerBot,`}${when(platforms.includes('telegram'))`
  telegramBot,`}${when(platforms.includes('line'))`
  lineBot`}
) => {${when(platforms.includes('messenger'))`
  // setup page profile in Messenger
  await messengerBot.makeApiCall('POST', 'me/messenger_profile', {
    greeting: [
      { locale: 'default', text: 'Hello World!' },
    ],${when(platforms.includes('webview'))`
    whitelisted_domains: [ENTRY_URL],`}
  });
  
  // create Messenger webhook subscription, require running server in advance
  await messengerBot.makeApiCall(
    'POST',
    \`\${MESSENGER_APP_ID}/subscriptions\`,
    {
      access_token: \`\${MESSENGER_APP_ID}|\${MESSENGER_APP_SECRET}\`,
      object: 'page',
      callback_url: \`\${ENTRY_URL}/webhook/messenger\`,
      fields: ['messages', 'messaging_postbacks'],
      include_values: true,
      verify_token: MESSENGER_VERIFY_TOKEN
    }
  );

  // add the page to Messenger webhook
  await messengerBot.makeApiCall('POST', 'me/subscribed_apps', {
      subscribed_fields: ['messages', 'messaging_postbacks'],
  });`}${when(platforms.includes('telegram'))`

  // setup webhook of the Telegram bot
  await telegramBot.makeApiCall('setWebhook', {
    url: \`\${ENTRY_URL}/webhook/telegram/\${TELEGRAM_SECRET_PATH}\`,
  });`}${when(platforms.includes('line'))`

  // setup webhook of the LINE channel
  await lineBot.makeApiCall('PUT', 'v2/bot/channel/webhook/endpoint', {
    endpoint: \`\${ENTRY_URL}/webhook/line\`,
  });`}
});

export const down = makeContainer({
  deps: [${when(platforms.includes('messenger'))`
    Messenger.Bot,`}${when(platforms.includes('telegram'))`
    Telegram.Bot,`}
  ] as const,
})(async (${when(platforms.includes('messenger'))`
  messengerBot,`}${when(platforms.includes('telegram'))`
  telegramBot,`}
) => {
${when(platforms.includes('messenger'))`
  // clear page profile in Messenger
  await messengerBot.makeApiCall('DELETE', 'me/messenger_profile', {
    fields: [
      'get_started',
      'greeting',
      'persistent_menu',
      'whitelisted_domains',
    ],
  });
  
  
  // delete Messenger webhook subscription
  await messengerBot.makeApiCall(
    'DELETE',
    \`\${MESSENGER_APP_ID}/subscriptions\`,
    {
      access_token: \`\${MESSENGER_APP_ID}|\${MESSENGER_APP_SECRET}\`,
      object: 'page',
    }
  );

  // remove the page to from webhook
  await messengerBot.makeApiCall(
    'DELETE',
    \`\${MESSENGER_PAGE_ID}/subscribed_apps\`,
    { access_token: \`\${MESSENGER_APP_ID}|\${MESSENGER_APP_SECRET}\` }
  );`}
${when(platforms.includes('telegram'))`

  // delete webhook of the Telegram bot
  await telegramBot.makeApiCall('deleteWebhook');`}
});
`);
