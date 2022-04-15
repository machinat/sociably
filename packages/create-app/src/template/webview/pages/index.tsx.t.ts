import { when } from '../../../utils';
import { CreateAppContext } from '../../../types';

export default ({ platforms, withWebview }: CreateAppContext): string => when(
  withWebview
)`
import React from 'react';
import Head from 'next/head';
import getConfig from 'next/config';
import { useClient, useEventReducer } from '@machinat/webview/client';${when(
  platforms.includes('messenger')
)`
import MessengerAuth from '@machinat/messenger/webview/client';`}${when(
  platforms.includes('twitter')
)`
import TwitterAuth from '@machinat/twitter/webview/client';`}${when(
  platforms.includes('telegram')
)`
import TelegramAuth from '@machinat/telegram/webview/client';`}${when(
  platforms.includes('line')
)`
import LineAuth from '@machinat/line/webview/client';`}

const {
  publicRuntimeConfig: {${when(platforms.includes('messenger'))`
    MESSENGER_PAGE_ID,`}${when(platforms.includes('twitter'))`
    TWITTER_AGENT_ID,`}${when(platforms.includes('telegram'))`
    TELEGRAM_BOT_NAME,`}${when(platforms.includes('line'))`
    LINE_LIFF_ID,`}
  },
} = getConfig();

const WebAppHome = () => {
  const client = useClient({
    mockupMode: typeof window === 'undefined',
    authPlatforms: [${when(platforms.includes('messenger'))`
      new MessengerAuth({ pageId: MESSENGER_PAGE_ID }),`}${when(
  platforms.includes('twitter')
)`
      new TwitterAuth({ agentId: TWITTER_AGENT_ID }),`}${when(
  platforms.includes('telegram')
)`
      new TelegramAuth({ botName: TELEGRAM_BOT_NAME }),`}${when(
  platforms.includes('line')
)`
      new LineAuth({ liffId: LINE_LIFF_ID }),`}
    ],
  });
  const { hello } = useEventReducer(
    client,
    (data, { event }) => {
      if (event.type === 'hello') {
        return { hello: event.payload };
      }
      return data;
    },
    { hello: '' }
  );

  const [isButtonTapped, setButtonTapped] = React.useState(false);

  const Button = ({ payload }) => (
    <button
      disabled={!client.isConnected}
      onClick={() => {
        client.send({ category: 'greeting', type: 'hello', payload });
        client.closeWebview();
        setButtonTapped(true);
      }}
    >
      {payload}
    </button>
  );

  return (
    <div>
      <Head>
        <title>Machinat Webview</title>

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
