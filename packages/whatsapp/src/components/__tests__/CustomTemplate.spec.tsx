import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { CustomTemplate } from '../CustomTemplate.js';
import { Image, Audio } from '../Media.js';
import { TextParam } from '../TextParam.js';
import { CurrencyParam } from '../CurrencyParam.js';
import { QuickReplyParam } from '../QuickReplyParam.js';
import { UrlButtonParam } from '../UrlButtonParam.js';
import { renderUnitElement } from './utils.js';

it('is a valid Component', () => {
  expect(typeof CustomTemplate).toBe('function');
  expect(isNativeType(<CustomTemplate name="" languageCode="" />)).toBe(true);
  expect(CustomTemplate.$$platform).toBe('whatsapp');
});

test('rendering value', async () => {
  await expect(
    renderUnitElement(<CustomTemplate name="FOO" languageCode="en" />)
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <CustomTemplateProps
          languageCode="en"
          name="FOO"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "message": {
            "context": undefined,
            "template": {
              "components": [],
              "language": {
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
        buttonParams={<UrlButtonParam index={1} urlPostfix="/baz" />}
      />
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
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
              urlPostfix="/baz"
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
        "value": {
          "message": {
            "context": undefined,
            "template": {
              "components": [
                {
                  "parameters": [
                    {
                      "text": "FOO",
                      "type": "text",
                    },
                    {
                      "text": "BAR",
                      "type": "text",
                    },
                  ],
                  "type": "header",
                },
                {
                  "parameters": [
                    {
                      "text": "BAZ",
                      "type": "text",
                    },
                    {
                      "currency": {
                        "amount_1000": 999000,
                        "code": "TWD",
                        "fallback_value": "$_$",
                      },
                      "type": "currency",
                    },
                  ],
                  "type": "body",
                },
                {
                  "index": 1,
                  "parameters": [
                    {
                      "text": "/baz",
                      "type": "text",
                    },
                  ],
                  "sub_type": "url",
                  "type": "button",
                },
              ],
              "language": {
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
    [
      {
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
        "value": {
          "message": {
            "context": {
              "message_id": "REPLY_TO_MESSAGE_ID",
            },
            "template": {
              "components": [
                {
                  "parameters": [
                    {
                      "image": {
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
                {
                  "parameters": [
                    {
                      "text": "hello",
                      "type": "text",
                    },
                    {
                      "text": "world",
                      "type": "text",
                    },
                  ],
                  "type": "body",
                },
                {
                  "index": 0,
                  "parameters": [
                    {
                      "payload": "FOO",
                      "type": "payload",
                    },
                  ],
                  "sub_type": "quick_reply",
                  "type": "button",
                },
                {
                  "index": 1,
                  "parameters": [
                    {
                      "payload": "BAR",
                      "type": "payload",
                    },
                  ],
                  "sub_type": "quick_reply",
                  "type": "button",
                },
                {
                  "index": 2,
                  "parameters": [
                    {
                      "payload": "BAZ",
                      "type": "payload",
                    },
                  ],
                  "sub_type": "quick_reply",
                  "type": "button",
                },
              ],
              "language": {
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
    `""headerParams" prop contain more than 1 media"`
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
