import Machinat from '@machinat/core';
import Messenger from '@machinat/messenger';
import dotenv from 'dotenv';
import { GET_STARTED_KEY } from '../constant';

dotenv.config();

const ENV = process.env;

const app = Machinat.createApp({
  platforms: [
    Messenger.initModule({
      pageId: ENV.MESSENGER_PAGE_ID,
      accessToken: ENV.MESSENGER_ACCESS_TOKEN,
      appSecret: ENV.MESSENGER_APP_SECRET,
      noServer: true,
    }),
  ],
});

app.start().then(async () => {
  const [bot] = app.useServices([Messenger.Bot]);

  await bot.dispatchAPICall('POST', 'me/messenger_profile', {
    get_started: {
      payload: GET_STARTED_KEY,
    },
    greeting: [
      {
        locale: 'default',
        text: 'Example Fox App',
      },
    ],
  });

  console.log('Finish setup page in Messenger.');
});
