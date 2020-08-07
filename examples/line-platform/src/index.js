import Machinat from '@machinat/core';
import container from '@machinat/core/service';
import HTTP from '@machinat/http';
import Line from '@machinat/line';
import dotenv from 'dotenv';
import { GET_STARTED_KEY, GIMME_FOX_KEY } from './constant';
import Hello from './components/Hello';
import FoxCard from './components/FoxCard';
import ReplyText from './components/ReplyText';
import ReplyUnknown from './components/ReplyUnknown';

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
    if (event.type === 'postback') {
      if (event.data === GET_STARTED_KEY) {
        const profile = await profiler.fetchProfile(user);
        return bot.render(channel, <Hello name={profile.name} />);
      }

      if (event.data === GIMME_FOX_KEY) {
        return bot.render(channel, <FoxCard />);
      }
    }

    if (event.type === 'message') {
      if (event.subtype === 'text') {
        return bot.render(channel, <ReplyText text={event.text} />);
      }

      if (event.subtype === 'image') {
        return bot.render(channel, <FoxCard />);
      }
    }

    return bot.render(channel, <ReplyUnknown />);
  })
);

app
  .start()
  .then(() => {
    console.log('webhook is ready on port 8080');
  })
  .catch(console.error);
