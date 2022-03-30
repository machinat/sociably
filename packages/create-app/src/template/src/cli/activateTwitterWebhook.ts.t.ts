import { when } from '../../../utils';
import { CreateAppContext } from '../../../types';

export default ({ platforms }: CreateAppContext): string => when(
  platforms.includes('twitter')
)`
#!/usr/bin/env node
import Twitter from '@machinat/twitter';
import TwitterAssetManager from '@machinat/twitter/asset';
import createApp from '../app';

const { TWITTER_WEBHOOK_ENV } = process.env;

const app = createApp({ noServer: true });
app.start().then(async () => {
  const [twitterBot, twitterAssetManager] = app.useServices([
    Twitter.Bot,
    TwitterAssetManager,
  ]);
  const webhookId = await twitterAssetManager.getWebhook('default');
  await twitterBot.makeApiCall(
    'PUT',
    \`1.1/account_activity/all/\${TWITTER_WEBHOOK_ENV}/webhooks/\${webhookId}.json\`
  );

  console.log(\`[twitter] webhook \${webhookId} is being active\`);
  await app.stop();
});
`;
