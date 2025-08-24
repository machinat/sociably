import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { CopyCodeParam } from '../CopyCodeParam.js';
import { renderPartElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<CopyCodeParam code="" />)).toBe(true);
  expect(CopyCodeParam.$$platform).toBe('whatsapp');
  expect(CopyCodeParam.$$name).toBe('CopyCodeParam');
});

test('rendering value', async () => {
  await expect(renderPartElement(<CopyCodeParam code="HELLO_WORLD" />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <CopyCodeParam
          code="HELLO_WORLD"
        />,
        "path": "$#container",
        "type": "part",
        "value": {
          "index": undefined,
          "parameters": [
            {
              "coupon_code": "HELLO_WORLD",
              "type": "coupon_code",
            },
          ],
          "sub_type": "copy_code",
          "type": "button",
        },
      },
    ]
  `);
});
