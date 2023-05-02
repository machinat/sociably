# Auth Module

This package is the underlying auth module of webview platform. You might want
to use [`@sociably/webview`](https://github.com/machinat/sociably/tree/master/packages/webview)
unless you want to serve your own web service.

## Install

```bash
npm install @sociably/core @sociably/http @sociably/auth
# or with yarn
yarn add @sociably/core @sociably/http @sociably/auth
```

## Docs

Check the [package reference](https://sociably.js.org/api/modules/auth.html).

## Setup

Here is a simple example to protect your API with auth module:

#### Back-end

```js
import Sociably, { serviceProviderFactory } from '@sociably/core';
import Http from '@sociably/http';
import Auth from '@sociably/auth';
// add the platforms and the authenticator you need
import { LineServerAuthenticator } from '@sociably/line/webview';

const app = Sociably.createApp({
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
      withProvider: serviceProviderFactory({ deps: [Auth.Controller] })(
        authController => ({
          path: '/myAPI',
          handler: async (req, res) => {
            // verify request authorization with AuthController
            const verifyResult = await authController.verifyAuth(req);

            if (verifyResult.ok) {
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
import AuthClient from '@sociably/auth/client';
import LineClientAuthenticator from '@sociably/line/webview/client';

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
