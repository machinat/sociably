import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { renderUnitElement } from './utils';
import { GenericItem, GenericTemplate } from '../GenericTemplate';
import { UrlButton } from '../UrlButton';
import { PostbackButton } from '../PostbackButton';
import { CallButton } from '../CallButton';

it('is valid component', () => {
  expect(typeof GenericItem).toBe('function');
  expect(typeof GenericTemplate).toBe('function');
  expect(isNativeType(<GenericItem title="" />)).toBe(true);
  expect(isNativeType(<GenericTemplate> </GenericTemplate>)).toBe(true);
  expect(GenericItem.$$platform).toBe('facebook');
  expect(GenericTemplate.$$platform).toBe('facebook');
});

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
          Array [
            Object {
              "node": <GenericTemplate>
                <GenericItem
                  buttons={
                    Array [
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
                    Array [
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
              "value": Object {
                "apiPath": "me/messages",
                "params": Object {
                  "message": Object {
                    "attachment": Object {
                      "payload": Object {
                        "elements": Array [
                          Object {
                            "buttons": Array [
                              Object {
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
                          Object {
                            "buttons": Array [
                              Object {
                                "fallback_url": undefined,
                                "messenger_extensions": undefined,
                                "title": "check",
                                "type": "web_url",
                                "url": "http://xxx.yy.z",
                                "webview_height_ratio": undefined,
                                "webview_share_button": undefined,
                              },
                              Object {
                                "payload": "_MORE_",
                                "title": "more",
                                "type": "postback",
                              },
                              Object {
                                "number": "+12345678",
                                "title": "call us",
                                "type": "phone_number",
                              },
                            ],
                            "default_action": Object {
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
          Array [
            Object {
              "node": <GenericTemplate
                imageAspectRatio="square"
                sharable={true}
              >
                <GenericItem
                  buttons={
                    Array [
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
                    Array [
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
              "value": Object {
                "apiPath": "me/messages",
                "params": Object {
                  "message": Object {
                    "attachment": Object {
                      "payload": Object {
                        "elements": Array [
                          Object {
                            "buttons": Array [
                              Object {
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
                          Object {
                            "buttons": Array [
                              Object {
                                "fallback_url": undefined,
                                "messenger_extensions": undefined,
                                "title": "check",
                                "type": "web_url",
                                "url": "http://xxx.yy.z",
                                "webview_height_ratio": undefined,
                                "webview_share_button": undefined,
                              },
                              Object {
                                "payload": "_MORE_",
                                "title": "more",
                                "type": "postback",
                              },
                              Object {
                                "number": "+12345678",
                                "title": "call us",
                                "type": "phone_number",
                              },
                            ],
                            "default_action": Object {
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
