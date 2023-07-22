import Sociably from '@sociably/core';
import { renderPartElement, makeTestComponent } from './utils.js';
import { LogoutButton as _LogoutButton } from '../LogoutButton.js';

const LogoutButton = makeTestComponent(_LogoutButton);

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
