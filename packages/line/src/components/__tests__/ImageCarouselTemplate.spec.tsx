import { moxy } from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { MessageSegmentValue, TemplateMessageParams } from '../../types.js';
import { UriAction } from '../Action.js';
import { renderUnitElement } from './utils.js';
import {
  ImageCarouselItem,
  ImageCarouselItemProps,
  ImageCarouselTemplate,
  ImageCarouselTemplateProps,
} from '../ImageCarouselTemplate.js';

test('is valid native component', () => {
  expect(
    isNativeType(<ImageCarouselItem {...({} as ImageCarouselItemProps)} />)
  ).toBe(true);
  expect(
    isNativeType(
      <ImageCarouselTemplate {...({} as ImageCarouselTemplateProps)} />
    )
  ).toBe(true);
  expect(ImageCarouselItem.$$platform).toBe('line');
  expect(ImageCarouselTemplate.$$platform).toBe('line');
  expect(ImageCarouselItem.$$name).toBe('ImageCarouselItem');
  expect(ImageCarouselTemplate.$$name).toBe('ImageCarouselTemplate');
});

it('match snapshot', async () => {
  await expect(
    renderUnitElement(
      <ImageCarouselTemplate altText="xxx">
        <ImageCarouselItem
          imageUrl="https://..."
          action={<UriAction uri="https://..." label="foo" />}
        />

        <ImageCarouselItem
          imageUrl="https://..."
          action={<UriAction uri="https://..." label="bar" />}
        />
      </ImageCarouselTemplate>
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ImageCarouselTemplate
          altText="xxx"
        >
          <ImageCarouselItem
            action={
              <UriAction
                label="foo"
                uri="https://..."
              />
            }
            imageUrl="https://..."
          />
          <ImageCarouselItem
            action={
              <UriAction
                label="bar"
                uri="https://..."
              />
            }
            imageUrl="https://..."
          />
        </ImageCarouselTemplate>,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "altText": "xxx",
            "template": {
              "columns": [
                {
                  "action": {
                    "label": "foo",
                    "type": "uri",
                    "uri": "https://...",
                  },
                  "imageUrl": "https://...",
                },
                {
                  "action": {
                    "label": "bar",
                    "type": "uri",
                    "uri": "https://...",
                  },
                  "imageUrl": "https://...",
                },
              ],
              "type": "image_carousel",
            },
            "type": "template",
          },
          "type": "message",
        },
      },
    ]
  `);
});

test('altText as function', async () => {
  const altTextGetter = moxy(() => 'ALT_TEXT_FOO');

  const segemnts = await renderUnitElement(
    <ImageCarouselTemplate altText={altTextGetter}>
      <ImageCarouselItem
        imageUrl="https://..."
        action={<UriAction uri="https://..." label="foo" />}
      />
    </ImageCarouselTemplate>
  );
  const messageSegValue = segemnts?.[0].value as MessageSegmentValue;
  const templateValue = messageSegValue.params as TemplateMessageParams;

  expect(templateValue.altText).toBe('ALT_TEXT_FOO');
  expect(altTextGetter).toHaveBeenCalledTimes(1);
  expect(altTextGetter).toHaveBeenCalledWith(templateValue.template);
});
