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
import { factory } from '@machinat/core/service';
import Http from '@machinat/http';
import Auth from '@machinat/auth';
// add the platforms and the authorizer you need
import Messenger from '@machinat/messenger';
import { MessengerServerAuthorizer } from '@machinat/messenger/auth';

Machinat.createApp({
  platforms: [
    Messenger.initModule({
      webhookPath: '/webhook',
    }),
  ],
  modules: [
    Http.initModule({ ... }),

    Auth.initModule({
      apiPath: '/auth',
      secret: 'xxx-xxx-xxx-xxx',
    }),
  ],
  services: [
    {
      porvide: Auth.AuthorizerList,
      withProvider: MessengerServerAuthorizer,
    },
    {
      provide: Http.RequestRouteList,
      withProvider: factory({
        lifetime: 'transient',
        deps: [Auth.Controller]
      })(
        authController => ({
          path: '/myAPI',
          handler: async (req, res) => {
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
}).start();
```

In the front-end:

```js
import AuthClient from '@machinat/auth/client';
import MessengerClientAuthorizer from '@machinat/messenger/auth/client';

(async function main () {
  const authClient = new AuthClient({
    platform: 'messenger',
    serverUrl: '/auth',
    authorizers: [new MessengerClientAuthorizer({ ... })],
  });

  const { token, context } = await authClient.auth();

  const response = await fetch({
    url: '/myAPI',
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json();
  console.log(result);
})();
```

### API
