import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
import { container } from '@machinat/core/service';
import HTTP from '@machinat/http';
import Messenger from '@machinat/messenger';
import Line from '@machinat/line';
import dotenv from 'dotenv';
import { GET_STARTED_KEY, GIMME_FOX_KEY } from './constant';
import Hello from './components/Hello';
import ReplyMessage from './components/ReplyMessage';
import FoxCard from './components/FoxCard';

dotenv.config();

const ENV = process.env;

const app = Machinat.createApp({
  modules: [
    HTTP.initModule({
      port: ENV.PORT || 8080,
    }),
  ],
  platforms: [
    Messenger.initModule({
      webhookPath: '/messenger',
      pageId: ENV.MESSENGER_PAGE_ID,
      accessToken: ENV.MESSENGER_ACCESS_TOKEN,
      appSecret: ENV.MESSENGER_APP_SECRET,
      verifyToken: ENV.MESSENGER_VERIFY_TOKEN,
    }),
    Line.initModule({
      webhookPath: '/line',
      providerId: ENV.LINE_PROVIDER_ID,
      channelId: ENV.LINE_CHANNEL_ID,
      channelSecret: ENV.LINE_CHANNEL_SECRET,
      accessToken: ENV.LINE_ACCESS_TOKEN,
    }),
  ],
});

app.onEvent(
  container({
    deps: [Base.UserProfilerI],
  })((profiler) => async ({ platform, bot, channel, event, user }) => {
    if (
      (platform === 'line' && event.type === 'follow') ||
      (platform === 'messenger' &&
        event.type === 'postback' &&
        event.data === GET_STARTED_KEY)
    ) {
      // User enter the chatroom
      const profile = await profiler.fetchProfile(user);
      await bot.render(channel, <Hello name={profile.name} />);
    }

    if (event.type === 'postback' && event.data === GIMME_FOX_KEY) {
      // More fox button pressed
      await bot.render(channel, <FoxCard />);
    }

    if (event.type === 'message') {
      // reply message
      await bot.render(
        channel,
        event.subtype === 'text' ? (
          <ReplyMessage text={event.text} />
        ) : event.subtype === 'image' ? (
          <ReplyMessage image />
        ) : (
          <ReplyMessage unknown />
        )
      );
    }
  })
);

app
  .start()
  .then(() => {
    console.log('webhook is ready on port 8080');
  })
  .catch(console.error);