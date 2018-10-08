import dotenv from 'dotenv';
import Machinat, { createServer } from '../../packages/machinat/src';
import LineConnector, {
  Sticker,
  Image,
} from '../../packages/machinat-line/src';

dotenv.config({ path: `${__dirname}/.env` });

const PORT = process.env.PORT || 3000;

const bot = new LineConnector({
  accessToken: process.env.TOKEN,
  channelSecret: process.env.SECRET,
});

bot.on('event', async context =>
  context.reply(
    <>
      <Image
        url="https://i.ytimg.com/vi/XEq-Y46Tlxg/maxresdefault.jpg"
        previewImage="https://i.ytimg.com/vi/XEq-Y46Tlxg/maxresdefault.jpg"
      />
      <text>Hello! I'm your father</text>
      <Sticker packageId={1} stickerId={1} />
    </>
  )
);

bot.on('error', console.error);

const server = createServer(bot);

server.listen(PORT, () => {
  console.log(`start listening to port ${PORT}`);
});
