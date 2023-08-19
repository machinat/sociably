import { moxy } from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { MessageSegmentValue, TemplateMessageParams } from '../../types.js';
import { ConfirmTemplate, ConfirmTemplateProps } from '../ConfirmTemplate.js';
import { UriAction } from '../Action.js';
import { renderUnitElement } from './utils.js';

test('is valid native component', () => {
  expect(
    isNativeType(<ConfirmTemplate {...({} as ConfirmTemplateProps)} />)
  ).toBe(true);
  expect(ConfirmTemplate.$$platform).toBe('line');
  expect(ConfirmTemplate.$$name).toBe('ConfirmTemplate');
});

it('match snapshot', async () => {
  await expect(
    renderUnitElement(
      <ConfirmTemplate
        altText="xxx"
        actions={[
          <UriAction uri="https://matrix.io/login" label="Blue pill" />,
          <UriAction uri="https://matrix.io/leave" label="Red pill" />,
        ]}
      >
        Take a pill
      </ConfirmTemplate>
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ConfirmTemplate
          actions={
            [
              <UriAction
                label="Blue pill"
                uri="https://matrix.io/login"
              />,
              <UriAction
                label="Red pill"
                uri="https://matrix.io/leave"
              />,
            ]
          }
          altText="xxx"
        >
          Take a pill
        </ConfirmTemplate>,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "altText": "xxx",
            "template": {
              "actions": [
                {
                  "label": "Blue pill",
                  "type": "uri",
                  "uri": "https://matrix.io/login",
                },
                {
                  "label": "Red pill",
                  "type": "uri",
                  "uri": "https://matrix.io/leave",
                },
              ],
              "text": "Take a pill",
              "type": "confirm",
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
    <ConfirmTemplate
      altText={altTextGetter}
      actions={[
        <UriAction uri="https://..." label="foo" />,
        <UriAction uri="https://..." label="bar" />,
      ]}
    >
      hello world
    </ConfirmTemplate>
  );
  const messageSegValue = segemnts?.[0].value as MessageSegmentValue;
  const templateValue = messageSegValue.params as TemplateMessageParams;

  expect(templateValue.altText).toBe('ALT_TEXT_FOO');
  expect(altTextGetter).toHaveBeenCalledTimes(1);
  expect(altTextGetter).toHaveBeenCalledWith(templateValue.template);
});
