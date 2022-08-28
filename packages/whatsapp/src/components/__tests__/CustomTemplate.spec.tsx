import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { CustomTemplate } from '../CustomTemplate';
import { Image, Audio } from '../Media';
import { TextParam } from '../TextParam';
import { CurrencyParam } from '../CurrencyParam';
import { QuickReplyParam } from '../QuickReplyParam';
import { UrlButtonParam } from '../UrlButtonParam';
import { renderUnitElement } from './utils';

it('is a valid Component', () => {
  expect(typeof CustomTemplate).toBe('function');
  expect(isNativeType(<CustomTemplate name="" languageCode="" />)).toBe(true);
  expect(CustomTemplate.$$platform).toBe('whatsapp');
});

test('rendering value', async () => {
  await expect(
    renderUnitElement(<CustomTemplate name="FOO" languageCode="en" />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <CustomTemplateProps
                languageCode="en"
                name="FOO"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "message": Object {
                  "context": undefined,
                  "template": Object {
                    "components": Array [],
                    "language": Object {
                      "code": "en",
                      "policy": "deterministic",
                    },
                    "name": "FOO",
                  },
                  "type": "template",
                },
              },
            },
          ]
        `);
  await expect(
    renderUnitElement(
      <CustomTemplate
        name="MY_TEMPLATE"
        languageCode="ja"
        headerParams={
          <>
            <TextParam>FOO</TextParam>
            <TextParam>BAR</TextParam>
          </>
        }
        bodyParams={
          <>
            <TextParam>BAZ</TextParam>
            <CurrencyParam code="TWD" amount1000={999000} fallbackValue="$_$" />
          </>
        }
        buttonParams={<UrlButtonParam index={1} urlSuffix="/baz" />}
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <CustomTemplateProps
                bodyParams={
                  <Sociably.Fragment>
                    <TextParam>
                      BAZ
                    </TextParam>
                    <CurrencyParam
                      amount1000={999000}
                      code="TWD"
                      fallbackValue="$_$"
                    />
                  </Sociably.Fragment>
                }
                buttonParams={
                  <UrlButtonParam
                    index={1}
                    urlSuffix="/baz"
                  />
                }
                headerParams={
                  <Sociably.Fragment>
                    <TextParam>
                      FOO
                    </TextParam>
                    <TextParam>
                      BAR
                    </TextParam>
                  </Sociably.Fragment>
                }
                languageCode="ja"
                name="MY_TEMPLATE"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "message": Object {
                  "context": undefined,
                  "template": Object {
                    "components": Array [
                      Object {
                        "parameters": Array [
                          Object {
                            "text": "FOO",
                            "type": "text",
                          },
                          Object {
                            "text": "BAR",
                            "type": "text",
                          },
                        ],
                        "type": "header",
                      },
                      Object {
                        "parameters": Array [
                          Object {
                            "text": "BAZ",
                            "type": "text",
                          },
                          Object {
                            "currency": Object {
                              "amount_1000": 999000,
                              "code": "TWD",
                              "fallback_value": "$_$",
                            },
                            "type": "currency",
                          },
                        ],
                        "type": "body",
                      },
                      Object {
                        "index": 1,
                        "parameters": Array [
                          Object {
                            "text": "/baz",
                            "type": "text",
                          },
                        ],
                        "sub_type": "url",
                        "type": "button",
                      },
                    ],
                    "language": Object {
                      "code": "ja",
                      "policy": "deterministic",
                    },
                    "name": "MY_TEMPLATE",
                  },
                  "type": "template",
                },
              },
            },
          ]
        `);
  await expect(
    renderUnitElement(
      <CustomTemplate
        name="MY_TEMPLATE"
        languageCode="CA"
        headerParams={<Image url="http://foo.bar/baz.jpg" />}
        bodyParams={
          <>
            <TextParam>hello</TextParam>
            <TextParam>world</TextParam>
          </>
        }
        buttonParams={
          <>
            <QuickReplyParam payload="FOO" />
            <QuickReplyParam payload="BAR" />
            <QuickReplyParam payload="BAZ" />
          </>
        }
        replyTo="REPLY_TO_MESSAGE_ID"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <CustomTemplateProps
                bodyParams={
                  <Sociably.Fragment>
                    <TextParam>
                      hello
                    </TextParam>
                    <TextParam>
                      world
                    </TextParam>
                  </Sociably.Fragment>
                }
                buttonParams={
                  <Sociably.Fragment>
                    <QuickReplyParam
                      payload="FOO"
                    />
                    <QuickReplyParam
                      payload="BAR"
                    />
                    <QuickReplyParam
                      payload="BAZ"
                    />
                  </Sociably.Fragment>
                }
                headerParams={
                  <Image
                    url="http://foo.bar/baz.jpg"
                  />
                }
                languageCode="CA"
                name="MY_TEMPLATE"
                replyTo="REPLY_TO_MESSAGE_ID"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "message": Object {
                  "context": Object {
                    "message_id": "REPLY_TO_MESSAGE_ID",
                  },
                  "template": Object {
                    "components": Array [
                      Object {
                        "parameters": Array [
                          Object {
                            "image": Object {
                              "caption": undefined,
                              "filename": undefined,
                              "id": undefined,
                              "link": "http://foo.bar/baz.jpg",
                            },
                            "type": "image",
                          },
                        ],
                        "type": "header",
                      },
                      Object {
                        "parameters": Array [
                          Object {
                            "text": "hello",
                            "type": "text",
                          },
                          Object {
                            "text": "world",
                            "type": "text",
                          },
                        ],
                        "type": "body",
                      },
                      Object {
                        "index": 0,
                        "parameters": Array [
                          Object {
                            "payload": "FOO",
                            "type": "payload",
                          },
                        ],
                        "sub_type": "quick_reply",
                        "type": "button",
                      },
                      Object {
                        "index": 1,
                        "parameters": Array [
                          Object {
                            "payload": "BAR",
                            "type": "payload",
                          },
                        ],
                        "sub_type": "quick_reply",
                        "type": "button",
                      },
                      Object {
                        "index": 2,
                        "parameters": Array [
                          Object {
                            "payload": "BAZ",
                            "type": "payload",
                          },
                        ],
                        "sub_type": "quick_reply",
                        "type": "button",
                      },
                    ],
                    "language": Object {
                      "code": "CA",
                      "policy": "deterministic",
                    },
                    "name": "MY_TEMPLATE",
                  },
                  "type": "template",
                },
              },
            },
          ]
        `);
});

it('throw if invalid params received', async () => {
  await expect(
    renderUnitElement(
      <CustomTemplate
        name="FOO"
        languageCode="en"
        headerParams={<Audio mediaId="123" />}
      />
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<Audio /> is not a valid parameter"`
  );
  await expect(
    renderUnitElement(
      <CustomTemplate
        name="FOO"
        languageCode="en"
        headerParams={
          <>
            <Image mediaId="123" />
            <Image mediaId="123" />
          </>
        }
      />
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"\\"headerParams\\" prop contain more than 1 media"`
  );
  await expect(
    renderUnitElement(
      <CustomTemplate
        name="FOO"
        languageCode="en"
        headerParams={<QuickReplyParam payload="" />}
      />
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<QuickReplyParam /> is not a valid text parameter"`
  );
  await expect(
    renderUnitElement(
      <CustomTemplate
        name="FOO"
        languageCode="en"
        bodyParams={<QuickReplyParam payload="" />}
      />
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<QuickReplyParam /> is not a valid text parameter"`
  );
  await expect(
    renderUnitElement(
      <CustomTemplate
        name="FOO"
        languageCode="en"
        bodyParams={<Image mediaId="123" />}
      />
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<Image /> is not a valid text parameter"`
  );
  await expect(
    renderUnitElement(
      <CustomTemplate
        name="FOO"
        languageCode="en"
        buttonParams={<TextParam>_</TextParam>}
      />
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<TextParam /> is not a valid button parameter"`
  );
  await expect(
    renderUnitElement(
      <CustomTemplate
        name="FOO"
        languageCode="en"
        buttonParams={<Image mediaId="123" />}
      />
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<Image /> is not a valid button parameter"`
  );
});
