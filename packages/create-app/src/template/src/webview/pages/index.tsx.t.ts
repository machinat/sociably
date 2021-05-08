import { when, polishFileContent } from '../../../../utils';
import { CreateAppContext } from '../../../../types';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(when(platforms.includes('webview'))`
import React from 'react';
import Head from 'next/head';
import getConfig from 'next/config';
import WebviewClient from '@machinat/webview/client';${when(
    platforms.includes('messenger')
  )`
import { MessengerClientAuthorizer } from '@machinat/messenger/webview';`}${when(
    platforms.includes('telegram')
  )`
import { TelegramClientAuthorizer } from '@machinat/telegram/webview';`}${when(
    platforms.includes('line')
  )`
import { LineClientAuthorizer } from '@machinat/line/webview';`}

const { publicRuntimeConfig } = getConfig();

const client =  new WebviewClient(
  typeof window === 'undefined'
    ? { mockupMode: true, authorizers: [] }
    : {
        authorizers: [${when(platforms.includes('messenger'))`
          new MessengerClientAuthorizer({
            appId: publicRuntimeConfig.messengerAppId,
          }),`}${when(platforms.includes('telegram'))`
          new TelegramClientAuthorizer(),`}${when(platforms.includes('line'))`
          new LineClientAuthorizer({
            liffId: publicRuntimeConfig.lineLiffId,
          }),`}
        ],
      }
);

const WebAppHome = () => {
  const [helloWords, setHelloWords] = React.useState(null);
  const [isButtonTapped, setButtonTapped] = React.useState(false);

  React.useEffect(() => {
    client.onEvent(({ event }) => {
      if (event.type === 'hello') {
        setHelloWords(event.payload);
      }
    });
  }, []);

  const sayHello = (payload: string) => {
    client.send({ type: 'hello', payload });
    setButtonTapped(true);
  };
  
  const Button = ({ payload }) => (
    <button disabled={!client.isConnected} onClick={() => sayHello(payload)}>
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
          Get started by editing <code>src/webview/pages/index.js</code>
        </p>

        <h3>{helloWords || 'connecting... '}</h3>
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
