import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { CatalogParam } from '../CatalogParam.js';
import { renderPartElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<CatalogParam thumbnailProductRetailerId="" />)).toBe(
    true,
  );
  expect(CatalogParam.$$platform).toBe('whatsapp');
  expect(CatalogParam.$$name).toBe('CatalogParam');
});

test('rendering value', async () => {
  await expect(
    renderPartElement(
      <CatalogParam thumbnailProductRetailerId="_PRODUCT_ID_" />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <CatalogParam
          thumbnailProductRetailerId="_PRODUCT_ID_"
        />,
        "path": "$#container",
        "type": "part",
        "value": {
          "index": undefined,
          "parameters": [
            {
              "action": {
                "thumbnail_product_retailer_id": "_PRODUCT_ID_",
              },
              "type": "action",
            },
          ],
          "sub_type": "catalog",
          "type": "button",
        },
      },
    ]
  `);
});
