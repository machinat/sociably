import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { CurrencyParam } from '../CurrencyParam.js';
import { renderPartElement } from './utils.js';

it('is a valid Component', () => {
  expect(
    isNativeType(
      <CurrencyParam
        code="USD"
        fallbackValue="a lot of money"
        amount1000={9999}
      />,
    ),
  ).toBe(true);
  expect(CurrencyParam.$$platform).toBe('whatsapp');
  expect(CurrencyParam.$$name).toBe('CurrencyParam');
});

test('rendering value', async () => {
  await expect(
    renderPartElement(
      <CurrencyParam
        code="USD"
        fallbackValue="a lot of money"
        amount1000={9999}
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <CurrencyParam
          amount1000={9999}
          code="USD"
          fallbackValue="a lot of money"
        />,
        "path": "$#container",
        "type": "part",
        "value": {
          "currency": {
            "amount_1000": 9999,
            "code": "USD",
            "fallback_value": "a lot of money",
          },
          "type": "currency",
        },
      },
    ]
  `);
});
