import Sociably from '@sociably/core';
import { renderUnitElement, makeTestComponent } from './utils.js';
import { MediaTemplate as _MediaTemplate } from '../MediaTemplate.js';
import { UrlButton as _UrlButton } from '../UrlButton.js';
import { PostbackButton as _PostbackButton } from '../PostbackButton.js';
import { CallButton as _CallButton } from '../CallButton.js';

const MediaTemplate = makeTestComponent(_MediaTemplate);
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
      <MediaTemplate mediaType="image" url="http://..." buttons={buttons} />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <MediaTemplate
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
          mediaType="image"
          url="http://..."
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/messages",
          "params": {
            "message": {
              "attachment": {
                "payload": {
                  "elements": [
                    {
                      "attachment_id": undefined,
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
                      "media_type": "image",
                      "url": "http://...",
                    },
                  ],
                  "sharable": undefined,
                  "template_type": "media",
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
      <MediaTemplate
        mediaType="video"
        attachmentId="__ID__"
        sharable
        buttons={buttons}
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <MediaTemplate
          attachmentId="__ID__"
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
          mediaType="video"
          sharable={true}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/messages",
          "params": {
            "message": {
              "attachment": {
                "payload": {
                  "elements": [
                    {
                      "attachment_id": "__ID__",
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
                      "media_type": "video",
                      "url": undefined,
                    },
                  ],
                  "sharable": true,
                  "template_type": "media",
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
