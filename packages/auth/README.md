# @machinat/auth

This package provide an interface to combine all the auth flow of chat platforms into one single web application.

## Install

```sh
npm install @machinat/core @machinat/http @machinat/auth
# or with yarn
yarn add @machinat/core @machinat/http @machinat/auth
```

## Example

In the back-end:

```js
import Machinat from '@machinat/core';
import HTTP from '@machinat/http';
import Auth from '@machinat/auth';

// add the platforms and the authorizer you need
import Messenger from '@machinat/messenger';
import { MessengerServerAuthorizer } from '@machinat/messenger/auth';
// serve the web app
import Next from '@machinat/messenger/next';

const app = Machinat.createApp({
  platforms: [
    Messenger.initModule({
      entryPath: '/webhook',
    }),
  ],
  modules: [
    HTTP.initModule({ ... }),

    Auth.initModule({
      entryPath: '/auth',
      secret: 'xxx-xxx-xxx-xxx',
    }),

    Next.initModule({
      entryPath: '/webview',
      ...
    }),
  ],
  bindings: [
    {
      porvide: Auth.AUTHORIZERS_I,
      withProvider: MessengerServerAuthorizer,
    },
  ]
});

app.start().then(() => {
  console.log('App with authorized webvieww is started...');
});
```

In the front-end:

```js
import AuthClient from '@machinat/auth/client';
import MessengerClientAuthorizer from '@machinat/messenger/auth/client';

function main () {
  const authClient = new AuthClient({
    serverURL: '/auth',
    authorizers: [new MessengerClientAuthorizer({ ... })],
  });

  // bootstrap ASAP to reduce waiting time
  authClient.bootstrap('messenger');

  // start your App
  ReactDom.render(...);

  const { token, context } = await authClient.auth();
  console.log(token);
  console.log(context);
}

main();
```

### API
