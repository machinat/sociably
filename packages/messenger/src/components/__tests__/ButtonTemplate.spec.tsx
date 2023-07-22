import Sociably from '@sociably/core';
import { renderUnitElement, makeTestComponent } from './utils.js';
import { ButtonTemplate as _ButtonTemplate } from '../ButtonTemplate.js';
import { UrlButton as _UrlButton } from '../UrlButton.js';
import { PostbackButton as _PostbackButton } from '../PostbackButton.js';
import { CallButton as _CallButton } from '../CallButton.js';

const ButtonTemplate = makeTestComponent(_ButtonTemplate);
const UrlButton = makeTestComponent(_UrlButton);
const PostbackButton = makeTestComponent(_PostbackButton);
const CallButton = makeTestComponent(_CallButton);

it('match snapshot', async () => {
  const buttons = [
    <UrlButton title="check" url="http://xxx.yy.z" />,
    <PostbackButton title="more" payload="_MORE_" />,
    <CallButton title="call us" number="+12345678" />,
  ];

  await expect(
    renderUnitElement(
      <ButtonTemplate buttons={buttons}>hello button template</ButtonTemplate>
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ButtonTemplate
          buttons={
            [
              <UrlButton
                title="check"
                url="http://xxx.yy.z"
              />,
              <PostbackButton
                payload="_MORE_"
                title="more"
              />,
              <CallButton
                number="+12345678"
                title="call us"
              />,
            ]
          }
        >
          hello button template
        </ButtonTemplate>,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/messages",
          "params": {
            "message": {
              "attachment": {
                "payload": {
                  "buttons": [
                    {
                      "fallback_url": undefined,
                      "messenger_extensions": undefined,
                      "title": "check",
                      "type": "web_url",
                      "url": "http://xxx.yy.z",
                      "webview_height_ratio": undefined,
                      "webview_share_button": undefined,
                    },
                    {
                      "payload": "_MORE_",
                      "title": "more",
                      "type": "postback",
                    },
                    {
                      "number": "+12345678",
                      "title": "call us",
                      "type": "phone_number",
                    },
                  ],
                  "sharable": undefined,
                  "template_type": "button",
                  "text": "hello button template",
                },
                "type": "template",
              },
            },
          },
          "type": "message",
        },
      },
    ]
  `);
  await expect(
    renderUnitElement(
      <ButtonTemplate buttons={buttons} sharable>
        foo
        {'bar'}
        <>baz</>
      </ButtonTemplate>
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ButtonTemplate
          buttons={
            [
              <UrlButton
                title="check"
                url="http://xxx.yy.z"
              />,
              <PostbackButton
                payload="_MORE_"
                title="more"
              />,
              <CallButton
                number="+12345678"
                title="call us"
              />,
            ]
          }
          sharable={true}
        >
          foo
          bar
          <Sociably.Fragment>
            baz
          </Sociably.Fragment>
        </ButtonTemplate>,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/messages",
          "params": {
            "message": {
              "attachment": {
                "payload": {
                  "buttons": [
                    {
                      "fallback_url": undefined,
                      "messenger_extensions": undefined,
                      "title": "check",
                      "type": "web_url",
                      "url": "http://xxx.yy.z",
                      "webview_height_ratio": undefined,
                      "webview_share_button": undefined,
                    },
                    {
                      "payload": "_MORE_",
                      "title": "more",
                      "type": "postback",
                    },
                    {
                      "number": "+12345678",
                      "title": "call us",
                      "type": "phone_number",
                    },
                  ],
                  "sharable": true,
                  "template_type": "button",
                  "text": "foobarbaz",
                },
                "type": "template",
              },
            },
          },
          "type": "message",
        },
      },
    ]
  `);
});

it('throw if children is empty', async () => {
  await expect(
    renderUnitElement(
      <ButtonTemplate buttons={<PostbackButton title="foo" payload="foo" />}>
        {null}
      </ButtonTemplate>
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""children" prop should not be empty"`
  );
});

it('throw if none texual child received', async () => {
  expect(
    renderUnitElement(
      <ButtonTemplate buttons={[]}>
        foo
        <UrlButton title="" url="" />
      </ButtonTemplate>
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <UrlButton /> received, only textual nodes allowed"`
  );
});
