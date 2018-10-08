import dotenv from 'dotenv';
import Machinat, { createServer } from '../../packages/machinat/src';
import MessengerConnector, {
  Image,
} from '../../packages/machinat-messenger/src';

dotenv.config({ path: `${__dirname}/.env` });

const PORT = process.env.PORT || 3000;

const bot = new MessengerConnector({
  shouldVerifyWebhook: true,
  verifyToken: '__VERIFY_TOKEN__',
  accessToken: process.env.TOKEN,
  appSecret: process.env.SECRET,
});

bot.use(context =>
  context.reply(
    <>
      <Image url="https://i.ytimg.com/vi/XEq-Y46Tlxg/maxresdefault.jpg" />
      <text>
        <code>Hello,</code> <b>Skywalker!</b>
        <br />
        You know what?
        <br />
        <i>
          I'm your <del>FATHER</del> <code>R2D2</code>.
        </i>
        <br />
        <br />
        <a href="https://R2.D2">Check here</a>
        <br />
      </text>
      <pre>
        {`
        ,-----.
      ,'_/_|_\\_\`.
     /<<::8[O]::>\\
    _|-----------|_
:::|  | ====-=- |  |:::
:::|  | -=-==== |  |:::
:::\\  | ::::|()||  /:::
::::| | ....|()|| |::::
    | |_________| |
    | |\\_______/| |
   /   \\ /   \\ /   \\
   \`---' \`---' \`---'
        `}
      </pre>
    </>
  )
);

bot.on('error', console.error);

const server = createServer(bot);

server.listen(PORT, () => {
  console.log(`start listening to port ${PORT}`);
});
