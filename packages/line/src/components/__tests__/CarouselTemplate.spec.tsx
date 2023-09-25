import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { MessageSegmentValue, TemplateMessageParams } from '../../types.js';
import {
  CarouselTemplate,
  CarouselItem,
  CarouselItemProps,
  CarouselTemplateProps,
} from '../CarouselTemplate.js';
import { UriAction } from '../Action.js';
import { renderUnitElement } from './utils.js';

test('is valid native component', () => {
  expect(isNativeType(<CarouselItem {...({} as CarouselItemProps)} />)).toBe(
    true,
  );
  expect(
    isNativeType(<CarouselTemplate {...({} as CarouselTemplateProps)} />),
  ).toBe(true);
  expect(CarouselItem.$$platform).toBe('line');
  expect(CarouselTemplate.$$platform).toBe('line');
  expect(CarouselItem.$$name).toBe('CarouselItem');
  expect(CarouselTemplate.$$name).toBe('CarouselTemplate');
});

it('match snapshot', async () => {
  await expect(
    renderUnitElement(
      <CarouselTemplate
        altText="xxx"
        imageAspectRatio="square"
        imageSize="contain"
      >
        <CarouselItem
          text="Burger"
          actions={[
            <UriAction uri="https://..." label="with fries" />,
            <UriAction uri="https://..." label="with salad" />,
          ]}
        />

        <CarouselItem
          thumbnailImageUrl="https://..."
          imageBackgroundColor="#bbbbbb"
          title="Pasta"
          text="Naporitan"
          actions={[
            <UriAction uri="https://..." label="with soup" />,
            <UriAction uri="https://..." label="with salad" />,
          ]}
        />
      </CarouselTemplate>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <CarouselTemplate
          altText="xxx"
          imageAspectRatio="square"
          imageSize="contain"
        >
          <CarouselItem
            actions={
              [
                <UriAction
                  label="with fries"
                  uri="https://..."
                />,
                <UriAction
                  label="with salad"
                  uri="https://..."
                />,
              ]
            }
            text="Burger"
          />
          <CarouselItem
            actions={
              [
                <UriAction
                  label="with soup"
                  uri="https://..."
                />,
                <UriAction
                  label="with salad"
                  uri="https://..."
                />,
              ]
            }
            imageBackgroundColor="#bbbbbb"
            text="Naporitan"
            thumbnailImageUrl="https://..."
            title="Pasta"
          />
        </CarouselTemplate>,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "altText": "xxx",
            "template": {
              "columns": [
                {
                  "actions": [
                    {
                      "label": "with fries",
                      "type": "uri",
                      "uri": "https://...",
                    },
                    {
                      "label": "with salad",
                      "type": "uri",
                      "uri": "https://...",
                    },
                  ],
                  "defaultAction": undefined,
                  "imageBackgroundColor": undefined,
                  "text": "Burger",
                  "thumbnailImageUrl": undefined,
                  "title": undefined,
                },
                {
                  "actions": [
                    {
                      "label": "with soup",
                      "type": "uri",
                      "uri": "https://...",
                    },
                    {
                      "label": "with salad",
                      "type": "uri",
                      "uri": "https://...",
                    },
                  ],
                  "defaultAction": undefined,
                  "imageBackgroundColor": "#bbbbbb",
                  "text": "Naporitan",
                  "thumbnailImageUrl": "https://...",
                  "title": "Pasta",
                },
              ],
              "imageAspectRatio": "square",
              "imageSize": "contain",
              "type": "carousel",
            },
            "type": "template",
          },
          "type": "message",
        },
      },
    ]
  `);
});

test('default altText', async () => {
  const segemnts = await renderUnitElement(
    <CarouselTemplate imageAspectRatio="square" imageSize="contain">
      <CarouselItem
        title="HELLO"
        text="world"
        actions={<UriAction uri="https://..." label="with fries" />}
      />
    </CarouselTemplate>,
  );

  expect((segemnts?.[0].value as any).params.altText).toMatchInlineSnapshot(`
    "HELLO
    world
    "
  `);
});

test('altText as function', async () => {
  const altTextGetter = moxy(() => 'ALT_TEXT_FOO');

  const segemnts = await renderUnitElement(
    <CarouselTemplate
      altText={altTextGetter}
      imageAspectRatio="square"
      imageSize="contain"
    >
      <CarouselItem
        text="Burger"
        actions={<UriAction uri="https://..." label="with fries" />}
      />
    </CarouselTemplate>,
  );
  const messageSegValue = segemnts?.[0].value as MessageSegmentValue;
  const templateValue = messageSegValue.params as TemplateMessageParams;

  expect(templateValue.altText).toBe('ALT_TEXT_FOO');
  expect(altTextGetter).toHaveBeenCalledTimes(1);
  expect(altTextGetter).toHaveBeenCalledWith({ ...templateValue, altText: '' });
});
