import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { UrlButtonParam } from '../UrlButtonParam.js';
import { renderPartElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<UrlButtonParam urlPostfix="" />)).toBe(true);
  expect(UrlButtonParam.$$platform).toBe('whatsapp');
  expect(UrlButtonParam.$$name).toBe('UrlButtonParam');
});

test('rendering value', async () => {
  await expect(
    renderPartElement(<UrlButtonParam urlPostfix="/foo#bar?baz=true" />),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <UrlButtonParam
          urlPostfix="/foo#bar?baz=true"
        />,
        "path": "$#container",
        "type": "part",
        "value": {
          "index": undefined,
          "parameters": [
            {
              "text": "/foo#bar?baz=true",
              "type": "text",
            },
          ],
          "sub_type": "url",
          "type": "button",
        },
      },
    ]
  `);
  await expect(
    renderPartElement(<UrlButtonParam urlPostfix="/boo" index={2} />),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <UrlButtonParam
          index={2}
          urlPostfix="/boo"
        />,
        "path": "$#container",
        "type": "part",
        "value": {
          "index": 2,
          "parameters": [
            {
              "text": "/boo",
              "type": "text",
            },
          ],
          "sub_type": "url",
          "type": "button",
        },
      },
    ]
  `);
});
