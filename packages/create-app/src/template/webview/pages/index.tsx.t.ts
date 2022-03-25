import { when } from '../../../utils';
import { CreateAppContext } from '../../../types';

export default ({ platforms }: CreateAppContext): string => when(
  platforms.includes('webview')
)`
import React from 'react';
import Head from 'next/head';
import getConfig from 'next/config';
import WebviewClient, { useEventReducer } from '@machinat/webview/client';${when(
  platforms.includes('messenger')
)`
import MessengerWebviewAuth from '@machinat/messenger/webview/client';`}${when(
  platforms.includes('telegram')
)`
import TelegramWebviewAuth from '@machinat/telegram/webview/client';`}${when(
  platforms.includes('line')
)`
import LineWebviewAuth from '@machinat/line/webview/client';`}

const { publicRuntimeConfig } = getConfig();

const client = new WebviewClient({
  mockupMode: typeof window === 'undefined',
  authPlatforms: [${when(platforms.includes('messenger'))`
    new MessengerWebviewAuth({
      appId: publicRuntimeConfig.messengerAppId,
    }),`}${when(platforms.includes('telegram'))`
    new TelegramWebviewAuth({
      botName: publicRuntimeConfig.telegramBotName,
    }),`}${when(platforms.includes('line'))`
    new LineWebviewAuth({
      liffId: publicRuntimeConfig.lineLiffId,
    }),`}
  ],
});

const WebAppHome = () => {
  const [isButtonTapped, setButtonTapped] = React.useState(false);
  const { hello } = useEventReducer(
    client,
    (data: { hello?: string }, { event }): { hello?: string } => {
      if (event.type === 'hello') {
        return { hello: event.payload };
      }
      return data;
    },
    { hello: undefined }
  );

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
