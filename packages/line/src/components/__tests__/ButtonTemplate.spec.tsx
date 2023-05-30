import { moxy } from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { MessageSegmentValue, TemplateMessageParams } from '../../types.js';
import { ButtonTemplate } from '../ButtonTemplate.js';
import { UriAction } from '../Action.js';
import { renderUnitElement } from './utils.js';

test('is valid native component', () => {
  expect(typeof ButtonTemplate).toBe('function');
  expect(isNativeType(<ButtonTemplate {...({} as never)} />)).toBe(true);
  expect(ButtonTemplate.$$platform).toBe('line');
});

it('match snapshot', async () => {
  await expect(
    renderUnitElement(
      <ButtonTemplate
        altText="xxx"
        thumbnailImageUrl="https://..."
        imageAspectRatio="square"
        imageSize="contain"
        imageBackgroundColor="#aaaaaa"
        title="HELLO"
        defaultAction={<UriAction uri="https://..." label="???" />}
        actions={[
          <UriAction uri="https://..." label="foo" />,
          <UriAction uri="https://..." label="bar" />,
        ]}
      >
        world
      </ButtonTemplate>
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ButtonTemplate
          actions={
            [
              <UriAction
                label="foo"
                uri="https://..."
              />,
              <UriAction
                label="bar"
                uri="https://..."
              />,
            ]
          }
          altText="xxx"
          defaultAction={
            <UriAction
              label="???"
              uri="https://..."
            />
          }
          imageAspectRatio="square"
          imageBackgroundColor="#aaaaaa"
          imageSize="contain"
          thumbnailImageUrl="https://..."
          title="HELLO"
        >
          world
        </ButtonTemplate>,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "altText": "xxx",
            "template": {
              "actions": [
                {
                  "label": "foo",
                  "type": "uri",
                  "uri": "https://...",
                },
                {
                  "label": "bar",
                  "type": "uri",
                  "uri": "https://...",
                },
              ],
              "defaultAction": {
                "label": "???",
                "type": "uri",
                "uri": "https://...",
              },
              "imageAspectRatio": "square",
              "imageBackgroundColor": "#aaaaaa",
              "imageSize": "contain",
              "text": "world",
              "thumbnailImageUrl": "https://...",
              "title": "HELLO",
              "type": "buttons",
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
    <ButtonTemplate
      altText={altTextGetter}
      actions={[
        <UriAction uri="https://..." label="foo" />,
        <UriAction uri="https://..." label="bar" />,
      ]}
    >
      hello world
    </ButtonTemplate>
  );
  const messageSegValue = segemnts?.[0].value as MessageSegmentValue;
  const templateValue = messageSegValue.params as TemplateMessageParams;

  expect(templateValue.altText).toBe('ALT_TEXT_FOO');
  expect(altTextGetter).toHaveBeenCalledTimes(1);
  expect(altTextGetter).toHaveBeenCalledWith(templateValue.template);
});
