import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { MultiProductParam } from '../MultiProductParam.js';
import { renderPartElement } from './utils.js';

it('is a valid Component', () => {
  expect(
    isNativeType(
      <MultiProductParam thumbnailProductRetailerId="" sections={[]} />,
    ),
  ).toBe(true);
  expect(MultiProductParam.$$platform).toBe('whatsapp');
  expect(MultiProductParam.$$name).toBe('MultiProductParam');
});

test('rendering value', async () => {
  await expect(
    renderPartElement(
      <MultiProductParam
        thumbnailProductRetailerId="_PRODUCT_ID_"
        sections={[
          {
            title: 'Section 1',
            productItems: [
              { productRetailerId: '_PRODUCT_ID_1_' },
              { productRetailerId: '_PRODUCT_ID_2_' },
            ],
          },
          {
            title: 'Section 2',
            productItems: [
              { productRetailerId: '_PRODUCT_ID_3_' },
              { productRetailerId: '_PRODUCT_ID_4_' },
              { productRetailerId: '_PRODUCT_ID_5_' },
            ],
          },
        ]}
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <MultiProductParam
          sections={
            [
              {
                "productItems": [
                  {
                    "productRetailerId": "_PRODUCT_ID_1_",
                  },
                  {
                    "productRetailerId": "_PRODUCT_ID_2_",
                  },
                ],
                "title": "Section 1",
              },
              {
                "productItems": [
                  {
                    "productRetailerId": "_PRODUCT_ID_3_",
                  },
                  {
                    "productRetailerId": "_PRODUCT_ID_4_",
                  },
                  {
                    "productRetailerId": "_PRODUCT_ID_5_",
                  },
                ],
                "title": "Section 2",
              },
            ]
          }
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
              "sections": [
                {
                  "product_items": [
                    {
                      "product_retailer_id": "_PRODUCT_ID_1_",
                    },
                    {
                      "product_retailer_id": "_PRODUCT_ID_2_",
                    },
                  ],
                  "title": "Section 1",
                },
                {
                  "product_items": [
                    {
                      "product_retailer_id": "_PRODUCT_ID_3_",
                    },
                    {
                      "product_retailer_id": "_PRODUCT_ID_4_",
                    },
                    {
                      "product_retailer_id": "_PRODUCT_ID_5_",
                    },
                  ],
                  "title": "Section 2",
                },
              ],
              "type": "action",
            },
          ],
          "sub_type": "mpm",
          "type": "button",
        },
      },
    ]
  `);
});
