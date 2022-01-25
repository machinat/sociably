# Auth Module

This package is the underlying auth module of webview platform. You might want
to use [`@machinat/webview`](https://github.com/machinat/machinat/tree/master/packages/webview)
unless you want to serve your own web service.

## Install

```bash
npm install @machinat/core @machinat/http @machinat/auth
# or with yarn
yarn add @machinat/core @machinat/http @machinat/auth
```

## Docs

Check the [package reference](https://machinat.com/api/modules/auth.html).

## Setup

Here is a simple example to protect your API with auth module:

#### Back-end

```js
import Machinat, { makeFactoryProvider } from '@machinat/core';
import Http from '@machinat/http';
import Auth from '@machinat/auth';
// add the platforms and the authenticator you need
import { LineServerAuthenticator } from '@machinat/line/auth';

const app = Machinat.createApp({
  modules: [
    Http.initModule({ /* ... */ }),
    Auth.initModule({
      apiPath: '/auth',
      secret: 'xxx-xxx-xxx-xxx',
    }),
  ],
  services: [
    // provide authenticators of chat platforms
    { porvide: Auth.AuthenticatorList, withProvider: LineServerAuthenticator },
    { // a simple API route
      provide: Http.RequestRouteList,
      withProvider: makeFactoryProvider({ deps: [Auth.Controller] })(
        authController => ({
          path: '/myAPI',
          handler: async (req, res) => {
            // verify request authorization with AuthController
            const verifyResult = await authController.verifyAuth(req);

            if (verifyResult.success) {
              res.end(JSON.string({ hello: verifyResult.auth.user.uid }));
            } else {
              res.writeHead(verifyResult.code);
              res.end(JSON.string({ error: verifyResult.reason }));
            }
          }
        })
      }),
    }
  ]
});

app.start();
```

#### Front-end

```js
import AuthClient from '@machinat/auth/client';
import LineClientAuthenticator from '@machinat/line/auth/client';

(async function main () {
  const authClient = new AuthClient({
    platform: 'line',
    serverUrl: '/auth',
    authenticators: [new LineClientAuthenticator({ /* ... */ })],
  });

  const { token, context } = await authClient.auth();

  // use the bearer token to call your API
  const response = await fetch({
    url: '/myAPI',
    headers: { Authorization: `Bearer ${token}` },
  });
  // use response...
})();
```
