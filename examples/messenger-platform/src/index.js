import Machinat from '@machinat/core';
import container from '@machinat/core/service';
import HTTP from '@machinat/http';
import Messenger from '@machinat/messenger';
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
    Messenger.initModule({
      pageId: ENV.MESSENGER_PAGE_ID,
      accessToken: ENV.MESSENGER_ACCESS_TOKEN,
      appSecret: ENV.MESSENGER_APP_SECRET,
      verifyToken: ENV.MESSENGER_VERIFY_TOKEN,
    }),
  ],
});

app.onEvent(
  container({
    deps: [Messenger.UserProfiler],
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
