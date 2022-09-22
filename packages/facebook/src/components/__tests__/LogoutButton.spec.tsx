import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { renderPartElement } from './utils';
import { LogoutButton } from '../LogoutButton';

it('is valid Component', () => {
  expect(typeof LogoutButton).toBe('function');
  expect(isNativeType(<LogoutButton />)).toBe(true);
  expect(LogoutButton.$$platform).toBe('facebook');
});

it('match snapshot', async () => {
  await expect(renderPartElement(<LogoutButton />)).resolves
    .toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <LogoutButton />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "type": "account_unlink",
                },
              },
            ]
          `);
});
