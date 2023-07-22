import Sociably from '@sociably/core';
import { renderPartElement, makeTestComponent } from './utils.js';
import { LoginButton as _LoginButton } from '../LoginButton.js';

const LoginButton = makeTestComponent(_LoginButton);

it('match snapshot', async () => {
  await expect(renderPartElement(<LoginButton url="https://council.elrond" />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <LoginButton
          url="https://council.elrond"
        />,
        "path": "$#container",
        "type": "part",
        "value": {
          "type": "account_link",
          "url": "https://council.elrond",
        },
      },
    ]
  `);
});
