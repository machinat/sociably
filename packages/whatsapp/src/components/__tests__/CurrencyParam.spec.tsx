import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { CurrencyParam } from '../CurrencyParam';
import { renderPartElement } from './utils';

it('is a valid Component', () => {
  expect(typeof CurrencyParam).toBe('function');
  expect(
    isNativeType(
      <CurrencyParam
        code="USD"
        fallbackValue="a lot of money"
        amount1000={9999}
      />
    )
  ).toBe(true);
  expect(CurrencyParam.$$platform).toBe('whatsapp');
});

test('rendering value', async () => {
  await expect(
    renderPartElement(
      <CurrencyParam
        code="USD"
        fallbackValue="a lot of money"
        amount1000={9999}
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <CurrencyParam
                amount1000={9999}
                code="USD"
                fallbackValue="a lot of money"
              />,
              "path": "$#p",
              "type": "part",
              "value": Object {
                "currency": Object {
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
