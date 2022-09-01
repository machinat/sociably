import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { MessageSegmentValue, TemplateMessageParams } from '../../types';
import { ConfirmTemplate } from '../ConfirmTemplate';
import { UriAction } from '../Action';
import { renderUnitElement } from './utils';

test('is valid native component', () => {
  expect(typeof ConfirmTemplate).toBe('function');
  expect(isNativeType(<ConfirmTemplate {...({} as never)} />)).toBe(true);
  expect(ConfirmTemplate.$$platform).toBe('line');
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
          Array [
            Object {
              "node": <ConfirmTemplate
                actions={
                  Array [
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
              "value": Object {
                "params": Object {
                  "altText": "xxx",
                  "template": Object {
                    "actions": Array [
                      Object {
                        "label": "Blue pill",
                        "type": "uri",
                        "uri": "https://matrix.io/login",
                      },
                      Object {
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
  expect(altTextGetter.mock).toHaveBeenCalledTimes(1);
  expect(altTextGetter.mock).toHaveBeenCalledWith(templateValue.template);
});
