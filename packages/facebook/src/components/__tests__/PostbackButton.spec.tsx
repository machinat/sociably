import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { renderPartElement } from './utils';
import { PostbackButton } from '../PostbackButton';

it('is valid Component', () => {
  expect(typeof PostbackButton).toBe('function');
  expect(isNativeType(<PostbackButton title="" payload="" />)).toBe(true);
  expect(PostbackButton.$$platform).toBe('facebook');
});

it('match snapshot', async () => {
  await expect(
    renderPartElement(
      <PostbackButton title="my button" payload="_MY_PAYLOAD_" />
    )
  ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <PostbackButton
                  payload="_MY_PAYLOAD_"
                  title="my button"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "payload": "_MY_PAYLOAD_",
                  "title": "my button",
                  "type": "postback",
                },
              },
            ]
          `);
});
