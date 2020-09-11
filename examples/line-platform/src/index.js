import Machinat from '@machinat/core';
import { container } from '@machinat/core/service';
import HTTP from '@machinat/http';
import Line from '@machinat/line';
import dotenv from 'dotenv';
import { GIMME_FOX_KEY } from './constant';
import Hello from './components/Hello';
import FoxCard from './components/FoxCard';
import ReplyMessage from './components/ReplyMessage';

dotenv.config();

const ENV = process.env;

const app = Machinat.createApp({
  modules: [
    HTTP.initModule({
      port: ENV.PORT || 8080,
    }),
  ],
  platforms: [
    Line.initModule({
      providerId: ENV.LINE_PROVIDER_ID,
      channelId: ENV.LINE_CHANNEL_ID,
      channelSecret: ENV.LINE_CHANNEL_SECRET,
      accessToken: ENV.LINE_ACCESS_TOKEN,
    }),
  ],
});

app.onEvent(
  container({
    deps: [Line.UserProfiler],
  })((profiler) => async ({ bot, channel, event, user }) => {
    if (event.type === 'follow') {
      const profile = await profiler.fetchProfile(user);
      await bot.render(channel, <Hello name={profile.name} />);
    }

    if (event.kind === 'postback' && event.data === GIMME_FOX_KEY) {
      await bot.render(channel, <FoxCard />);
    }

    // reply message
    if (event.kind === 'message') {
      if (event.type === 'text') {
        await bot.render(channel, <ReplyMessage text={event.text} />);
      } else if (event.type === 'image') {
        await bot.render(channel, <ReplyMessage image />);
      } else {
        await bot.render(channel, <ReplyMessage unknown />);
      }
    }
  })
);

app
  .start()
  .then(() => {
    console.log('webhook is ready on port 8080');
  })
  .catch(console.error);
