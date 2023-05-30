import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { renderPartElement } from './utils.js';
import { LoginButton } from '../LoginButton.js';

it('is valid Component', () => {
  expect(typeof LoginButton).toBe('function');
  expect(isNativeType(<LoginButton url="" />)).toBe(true);
  expect(LoginButton.$$platform).toBe('facebook');
});

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
