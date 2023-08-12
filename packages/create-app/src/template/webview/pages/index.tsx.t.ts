import { when } from '../../../utils.js';
import { CreateAppContext } from '../../../types.js';

export default ({ platforms, withWebview }: CreateAppContext): string => when(
  withWebview
)`
import React from 'react';
import { default as Head } from 'next/head.js';
import { default as getConfig } from 'next/config.js';
import { useClient, useEventReducer } from '@sociably/webview/client';${when(
  platforms.includes('facebook')
)`
import FacebookWebview from '@sociably/facebook/webview/client';`}${when(
  platforms.includes('instagram')
)`
import InstagramWebview from '@sociably/instagram/webview/client';`}${when(
  platforms.includes('whatsapp')
)`
import WhatsAppWebview from '@sociably/whatsapp/webview/client';`}${when(
  platforms.includes('twitter')
)`
import TwitterWebview from '@sociably/twitter/webview/client';`}${when(
  platforms.includes('telegram')
)`
import TelegramWebview from '@sociably/telegram/webview/client';`}${when(
  platforms.includes('line')
)`
import LineWebview from '@sociably/line/webview/client';`}

const {
  publicRuntimeConfig: {${when(platforms.includes('telegram'))`
    TELEGRAM_BOT_ID,`}${when(platforms.includes('line'))`
    LINE_LIFF_ID,`}
  },
} = getConfig();

const WebAppHome = () => {
  const client = useClient({
    mockupMode: typeof window === 'undefined',
    authPlatforms: [${when(platforms.includes('facebook'))`
      new FacebookWebview(),`}${when(platforms.includes('instagram'))`
      new InstagramWebview(),`}${when(platforms.includes('whatsapp'))`
      new WhatsAppWebview(),`}${when(platforms.includes('twitter'))`
      new TwitterWebview(),`}${when(platforms.includes('telegram'))`
      new TelegramWebview({ botId: TELEGRAM_BOT_ID }),`}${when(
      platforms.includes('line')
    )`
      new LineWebview({ liffId: LINE_LIFF_ID }),`}
    ],
  });
  const { hello } = useEventReducer(
    client,
    (data, { event }) => {
      if (event.type === 'hello') {
        return { hello: event.payload as string };
      }
      return data;
    },
    { hello: '' }
  );

  const [isButtonTapped, setButtonTapped] = React.useState(false);

  const Button = (props: { payload: string }) => (
    <button
      disabled={!client.isConnected}
      onClick={() => {
        client.send({
          category: 'greeting',
          type: 'hello',
          payload: props.payload,
        });
        client.closeWebview();
        setButtonTapped(true);
      }}
    >
      {props.payload}
    </button>
  );

  return (
    <div>
      <Head>
        <title>Sociably Webview</title>

        <link rel="icon" href="/webview/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css"
        />
      </Head>

      <main>
        <h1>Hello In-Chat Webview!</h1>
        <p>
          Get started by editing <code>webview/pages/index.js</code>
        </p>

        <h3>{hello || 'connecting... '}</h3>
        <p>{
          isButtonTapped
            ? 'Great! Check the chatroom 👍'
            : client.isConnected
            ? 'Tap a button 👇'
            : ''
        }</p>
        <div>
          <Button payload="Foo" />
          <Button payload="Bar" />
        </div>
      </main>
    </div>
  );
};

// to activate publicRuntimeConfig
export const getServerSideProps = () => ({ props: {} });
export default WebAppHome;
`;
