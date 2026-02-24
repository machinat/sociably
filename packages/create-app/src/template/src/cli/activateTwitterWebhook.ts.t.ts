import { when } from '../../../utils.js';
import { CreateAppContext } from '../../../types.js';

export default ({ platforms }: CreateAppContext): string => when(
  platforms.includes('twitter'),
)`
#!/usr/bin/env node
import Twitter from '@sociably/twitter-platform';
import createApp from '../app.js';

const { TWITTER_WEBHOOK_ENV } = process.env;

const app = createApp({ noServer: true });
app.start().then(async () => {
  const [twitterSender, twitterAssetManager] = app.useServices([
    Twitter.Sender,
    Twitter.AssetManager,
  ]);
  const webhookId = await twitterAssetManager.getWebhook('default');
  await twitterSender.requestApi(
    'PUT',
    \`1.1/account_activity/all/\${TWITTER_WEBHOOK_ENV}/webhooks/\${webhookId}.json\`
  );

  console.log(\`[twitter] webhook \${webhookId} is being active\`);
  await app.stop();
});
`;
