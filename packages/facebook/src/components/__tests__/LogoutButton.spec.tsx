import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { renderPartElement } from './utils.js';
import { LogoutButton } from '../LogoutButton.js';

it('is valid Component', () => {
  expect(typeof LogoutButton).toBe('function');
  expect(isNativeType(<LogoutButton />)).toBe(true);
  expect(LogoutButton.$$platform).toBe('facebook');
});

it('match snapshot', async () => {
  await expect(renderPartElement(<LogoutButton />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <LogoutButton />,
        "path": "$#container",
        "type": "part",
        "value": {
          "type": "account_unlink",
        },
      },
    ]
  `);
});
