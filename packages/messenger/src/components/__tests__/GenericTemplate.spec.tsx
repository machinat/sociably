import Sociably from '@sociably/core';
import { renderUnitElement, makeTestComponent } from './utils.js';
import {
  GenericItem as _GenericItem,
  GenericTemplate as _GenericTemplate,
} from '../GenericTemplate.js';
import { UrlButton as _UrlButton } from '../UrlButton.js';
import { PostbackButton as _PostbackButton } from '../PostbackButton.js';
import { CallButton as _CallButton } from '../CallButton.js';

const GenericItem = makeTestComponent(_GenericItem);
const GenericTemplate = makeTestComponent(_GenericTemplate);
const UrlButton = makeTestComponent(_UrlButton);
const PostbackButton = makeTestComponent(_PostbackButton);
const CallButton = makeTestComponent(_CallButton);

const items = [
  <GenericItem
    title="foo"
    imageUrl="http://foo.bar/image"
    buttons={[<UrlButton title="check" url="http://xxx.yy.z" />]}
  />,
  <GenericItem
    title="foo"
    subtitle="bar"
    imageUrl="http://foo.bar/image"
    defaultAction={<UrlButton title="TITLE!" url="http://foo.bar/" />}
    buttons={[
      <UrlButton title="check" url="http://xxx.yy.z" />,
      <PostbackButton title="more" payload="_MORE_" />,
      <CallButton title="call us" number="+12345678" />,
    ]}
  />,
];

it('match snapshot', async () => {
  await expect(renderUnitElement(<GenericTemplate>{items}</GenericTemplate>))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <GenericTemplate>
          <GenericItem
            buttons={
              [
                <UrlButton
                  title="check"
                  url="http://xxx.yy.z"
                />,
              ]
            }
            imageUrl="http://foo.bar/image"
            title="foo"
          />
          <GenericItem
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
            defaultAction={
              <UrlButton
                title="TITLE!"
                url="http://foo.bar/"
              />
            }
            imageUrl="http://foo.bar/image"
            subtitle="bar"
            title="foo"
          />
        </GenericTemplate>,
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
                      ],
                      "default_action": undefined,
                      "image_url": "http://foo.bar/image",
                      "subtitle": undefined,
                      "title": "foo",
                    },
                    {
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
                      "default_action": {
                        "fallback_url": undefined,
                        "messenger_extensions": undefined,
                        "type": "web_url",
                        "url": "http://foo.bar/",
                        "webview_height_ratio": undefined,
                        "webview_share_button": undefined,
                      },
                      "image_url": "http://foo.bar/image",
                      "subtitle": "bar",
                      "title": "foo",
                    },
                  ],
                  "image_aspect_ratio": undefined,
                  "sharable": undefined,
                  "template_type": "generic",
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
      <GenericTemplate imageAspectRatio="square" sharable>
        {items}
      </GenericTemplate>
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <GenericTemplate
          imageAspectRatio="square"
          sharable={true}
        >
          <GenericItem
            buttons={
              [
                <UrlButton
                  title="check"
                  url="http://xxx.yy.z"
                />,
              ]
            }
            imageUrl="http://foo.bar/image"
            title="foo"
          />
          <GenericItem
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
            defaultAction={
              <UrlButton
                title="TITLE!"
                url="http://foo.bar/"
              />
            }
            imageUrl="http://foo.bar/image"
            subtitle="bar"
            title="foo"
          />
        </GenericTemplate>,
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
                      ],
                      "default_action": undefined,
                      "image_url": "http://foo.bar/image",
                      "subtitle": undefined,
                      "title": "foo",
                    },
                    {
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
                      "default_action": {
                        "fallback_url": undefined,
                        "messenger_extensions": undefined,
                        "type": "web_url",
                        "url": "http://foo.bar/",
                        "webview_height_ratio": undefined,
                        "webview_share_button": undefined,
                      },
                      "image_url": "http://foo.bar/image",
                      "subtitle": "bar",
                      "title": "foo",
                    },
                  ],
                  "image_aspect_ratio": "square",
                  "sharable": true,
                  "template_type": "generic",
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
