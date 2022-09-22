import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { renderPartElement } from './utils';
import { CallButton } from '../CallButton';

it('is valid Component', () => {
  expect(typeof CallButton).toBe('function');
  expect(isNativeType(<CallButton title="" number="" />)).toBe(true);
  expect(CallButton.$$platform).toBe('facebook');
});

it('match snapshot', async () => {
  await expect(
    renderPartElement(
      <CallButton title="call me maybe" number="+15105551234" />
    )
  ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <CallButton
                  number="+15105551234"
                  title="call me maybe"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "number": "+15105551234",
                  "title": "call me maybe",
                  "type": "phone_number",
                },
              },
            ]
          `);
});
