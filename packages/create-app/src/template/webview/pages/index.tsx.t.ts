import { when, polishFileContent } from '../../../utils';
import { CreateAppContext } from '../../../types';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(when(platforms.includes('webview'))`
import React from 'react';
import Head from 'next/head';
import getConfig from 'next/config';
import WebviewClient, { useEventReducer } from '@machinat/webview/client';${when(
    platforms.includes('messenger')
  )`
import { MessengerClientAuthenticator } from '@machinat/messenger/webview';`}${when(
    platforms.includes('telegram')
  )`
import { TelegramClientAuthenticator } from '@machinat/telegram/webview';`}${when(
    platforms.includes('line')
  )`
import { LineClientAuthenticator } from '@machinat/line/webview';`}

const { publicRuntimeConfig } = getConfig();

const client =  new WebviewClient(
  typeof window === 'undefined'
    ? { mockupMode: true, authenticators: [] }
    : {
        authenticators: [${when(platforms.includes('messenger'))`
          new MessengerClientAuthenticator({
            appId: publicRuntimeConfig.messengerAppId,
          }),`}${when(platforms.includes('telegram'))`
          new TelegramClientAuthenticator(),`}${when(
    platforms.includes('line')
  )`
          new LineClientAuthenticator({
            liffId: publicRuntimeConfig.lineLiffId,
          }),`}
        ],
      }
);

const WebAppHome = () => {
  const data = useEventReducer(
    client,
    (currentData: { hello?: string }, { event }): { hello?: string } => {
      if (event.type === 'hello') {
        return { hello: event.payload };
      }
      return currentData;
    },
    { hello: undefined }
  );

  const [isButtonTapped, setButtonTapped] = React.useState(false);

  const Button = ({ payload }) => (
    <button
      disabled={!client.isConnected}
      onClick={() => {
        client.send({ category: 'greeting', type: 'hello', payload });
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

        <h3>{data.hello || 'connecting... '}</h3>
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
`);
