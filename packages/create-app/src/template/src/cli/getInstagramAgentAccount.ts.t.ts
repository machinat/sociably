import { when } from '../../../utils.js';
import { CreateAppContext } from '../../../types.js';

export default ({ platforms }: CreateAppContext): string => when(
  platforms.includes('instagram'),
)`
#!/usr/bin/env node
import Instagram from '@sociably/instagram';
import createApp from '../app.js';

const { INSTAGRAM_ACCESS_TOKEN } = process.env;

const app = createApp({ noServer: true });
app.start().then(async () => {
  const [instagramBot] = app.useServices([Instagram.Bot]);
  const data = await instagramBot.requestApi({
    accessToken: INSTAGRAM_ACCESS_TOKEN,
    method: 'GET',
    url: 'me',
    params: {
      fields: 'instagram_business_account{id,name,username,website,biography,profile_picture_url,follows_count,followers_count,media_count,ig_id}',
    }
  });

  console.log(\`Instagram agent account bound on the page:\`);
  console.log(JSON.stringify(data.instagram_business_account, null, 2));
  await app.stop();
});
`;
