import Sociably from '@sociably/core';
import { renderPartElement, makeTestComponent } from './utils.js';
import { CallButton as _CallButton } from '../CallButton.js';

const CallButton = makeTestComponent(_CallButton);

it('match snapshot', async () => {
  await expect(
    renderPartElement(
      <CallButton title="call me maybe" number="+15105551234" />
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <CallButton
          number="+15105551234"
          title="call me maybe"
        />,
        "path": "$#container",
        "type": "part",
        "value": {
          "number": "+15105551234",
          "title": "call me maybe",
          "type": "phone_number",
        },
      },
    ]
  `);
});
