import Machinat from '@machinat/core';
import { container } from '@machinat/core/service';
import HTTP from '@machinat/http';
import Messenger from '@machinat/messenger';
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
      pageId: ENV.MESSENGER_PAGE_ID,
      accessToken: ENV.MESSENGER_ACCESS_TOKEN,
      appSecret: ENV.MESSENGER_APP_SECRET,
      verifyToken: ENV.MESSENGER_VERIFY_TOKEN,
    }),
  ],
});

app.onEvent(
  container({
    deps: [Messenger.Profiler],
  })((profiler) => async ({ bot, event }) => {
    if (event.kind === 'postback') {
      if (event.data === GET_STARTED_KEY) {
        // Get Started button pressed
        const profile = await profiler.getUserProfile(event.user);
        await bot.render(event.channel, <Hello name={profile.name} />);
      } else if (event.data === GIMME_FOX_KEY) {
        // More fox button pressed
        await bot.render(event.channel, <FoxCard />);
      }
    }

    // reply message
    if (event.kind === 'message') {
      if (event.type === 'text') {
        await bot.render(event.channel, <ReplyMessage text={event.text} />);
      } else if (event.type === 'image') {
        await bot.render(event.channel, <ReplyMessage image />);
      } else {
        await bot.render(event.channel, <ReplyMessage unknown />);
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
