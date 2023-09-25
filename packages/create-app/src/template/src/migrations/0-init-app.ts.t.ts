import { when } from '../../../utils.js';
import { CreateAppContext } from '../../../types.js';

export default ({ platforms }: CreateAppContext): string => `
import { serviceContainer } from '@sociably/core';${when(
  platforms.includes('facebook'),
)`
import Facebook from '@sociably/facebook';`}${when(
  platforms.includes('instagram'),
)`
import Instagram from '@sociably/instagram';`}${when(
  platforms.includes('whatsapp'),
)`
import WhatsApp from '@sociably/whatsapp';`}${when(
  platforms.includes('twitter'),
)`
import Twitter from '@sociably/twitter';`}${when(
  platforms.includes('telegram'),
)`
import Telegram from '@sociably/telegram';`}${when(platforms.includes('line'))`
import Line from '@sociably/line';`}

const {
  DOMAIN,${when(platforms.includes('facebook'))`
  FACEBOOK_PAGE_ID,`}${when(platforms.includes('instagram'))`
  INSTAGRAM_AGENT_ID,`}${when(platforms.includes('twitter'))`
  TWITTER_WEBHOOK_ENV,`}${when(platforms.includes('telegram'))`
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_SECRET_PATH,`}${when(platforms.includes('line'))`
  LINE_CHANNEL_ID,`}
} = process.env as Record<string, string>;

${when(platforms.includes('telegram'))`
const TELEGRAM_BOT_ID = Number(TELEGRAM_BOT_TOKEN.split(':')[0])`}
const ENTRY_URL = \`https://\${DOMAIN}\`;

export const up = serviceContainer({
  deps: [${when(platforms.includes('facebook'))`
    Facebook.AssetsManager,`}${when(platforms.includes('instagram'))`
    Instagram.AssetsManager,`}${when(platforms.includes('whatsapp'))`
    WhatsApp.AssetsManager,`}${when(platforms.includes('twitter'))`
    Twitter.AssetsManager,`}${when(platforms.includes('telegram'))`
    Telegram.AssetsManager,`}${when(platforms.includes('line'))`
    Line.AssetsManager,`}
  ],
})(async (${when(platforms.includes('facebook'))`
  facebookManager,`}${when(platforms.includes('instagram'))`
  instagramManager,`}${when(platforms.includes('whatsapp'))`
  whatsappManager,`}${when(platforms.includes('twitter'))`
  twitterManager,`}${when(platforms.includes('telegram'))`
  telegramManager,`}${when(platforms.includes('line'))`
  lineManager`}
) => {
${when(platforms.includes('facebook'))`
  // Facebook
  await facebookManager.setAppSubscription();
  await facebookManager.setSubscribedApp(FACEBOOK_PAGE_ID);
  await facebookManager.setMessengerProfile(FACEBOOK_PAGE_ID, {
    whitelistedDomains: [ENTRY_URL],
    getStarted: { payload: JSON.stringify({ action: 'greeting' }) },
    greeting: [
      { locale: 'default', text: 'Hello World!' },
    ],
  });`}

${when(platforms.includes('instagram'))`
  // Instagram
  await instagramManager.setAppSubscription();
  await instagramManager.setSubscribedApp(INSTAGRAM_AGENT_ID);
  await instagramManager.setMessengerProfile(INSTAGRAM_AGENT_ID, {
    iceBreakers: [
      {
        callToActions: [{ question: "Hello!", payload: JSON.stringify({ action: 'greeting' }) }],
        locale: "default",
      },
    ],
  });`}

${when(platforms.includes('whatsapp'))`
  // WhatsApp
  await whatsappManager.setAppSubscription();`}

${when(platforms.includes('twitter'))``}

${when(platforms.includes('telegram'))`
  // Telegram
  await telegramManager.setBotWebhook(TELEGRAM_BOT_ID);`}

${when(platforms.includes('line'))`
  // LINE
  await lineManager.setChannelWebhook(LINE_CHANNEL_ID);`}
});

export const down = serviceContainer({
  deps: [${when(platforms.includes('facebook'))`
    Facebook.AssetsManager,`}${when(platforms.includes('instagram'))`
    Instagram.AssetsManager,`}${when(platforms.includes('whatsapp'))`
    WhatsApp.AssetsManager,`}${when(platforms.includes('twitter'))`
    Twitter.AssetsManager,`}${when(platforms.includes('telegram'))`
    Telegram.AssetsManager,`}
  ],
})(async (${when(platforms.includes('facebook'))`
  facebookManager,`}${when(platforms.includes('instagram'))`
  instagramManager,`}${when(platforms.includes('whatsapp'))`
  whatsappManager,`}${when(platforms.includes('twitter'))`
  twitterManager,`}${when(platforms.includes('telegram'))`
  telegramManager,`}
) => {
${when(platforms.includes('facebook'))`
  // Facebook
  await facebookManager.deleteAppSubscription();
  await facebookManager.setMessengerProfile(FACEBOOK_PAGE_ID, {});`}

${when(platforms.includes('instagram'))`
  // Instagram
  await instagramManager.deleteAppSubscription();
  await instagramManager.setMessengerProfile(INSTAGRAM_AGENT_ID, {});`}

${when(platforms.includes('whatsapp'))`
  // WhatsApp
  await whatsappManager.deleteAppSubscription();
  await whatsappManager.createPredefinedTemplate(WHATSAPP_BUSINESS_ACCOUNT_ID, {
    category: 'marketing',
    name: 'hello_world_example',
    language: 'en',
    body: {
      text: 'Hello, {{1}}!',
      examples: [['John'], ['there']],
    },
    buttons: [
      {
        type: 'quick_reply',
        text: 'About',
      },
      {
        type: 'url',
        text: 'Open Webview',
        url: \`https://\${DOMAIN}/webview/{{1}}\`,
        examples: [\`https://\${DOMAIN}/webview/index\`],
      },
    ],
    allowCategoryChange: true,
  });`}

${when(platforms.includes('twitter'))``}

${when(platforms.includes('telegram'))`
  // Telegram
  await telegramManager.deleteBotWebhook(TELEGRAM_BOT_ID);`}
});
`;
