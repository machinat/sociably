import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';
import { InlineKeyboard, CallbackButton } from '../replyMarkup';
import {
  Location,
  EditLiveLocation,
  StopLiveLocation,
  Venue,
} from '../location';

const renderer = new Renderer('telegram', () => null);

describe.each([Location, EditLiveLocation, StopLiveLocation, Venue])(
  '%p',
  (LocationAction) => {
    it('is valid unit Component', () => {
      expect(typeof LocationAction).toBe('function');
      expect(isNativeType(<LocationAction />)).toBe(true);
      expect(LocationAction.$$platform).toBe('telegram');
    });
  }
);

test('Location match snapshot', async () => {
  await expect(
    renderer.render(<Location latitude={123.45} longitude={67.89} />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Location
                latitude={123.45}
                longitude={67.89}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendLocation",
                "parameters": Object {
                  "disable_notification": undefined,
                  "latitude": 123.45,
                  "live_period": undefined,
                  "longitude": 67.89,
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                },
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Location
        latitude={98.76}
        longitude={54.321}
        livePeriod={86400}
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="I got here" data="__DONE__" />
          </InlineKeyboard>
        }
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Location
                disableNotification={true}
                latitude={98.76}
                livePeriod={86400}
                longitude={54.321}
                replyMarkup={
                  <InlineKeyboard>
                    <CallbackButton
                      data="__DONE__"
                      text="I got here"
                    />
                  </InlineKeyboard>
                }
                replyToMessageId={123}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendLocation",
                "parameters": Object {
                  "disable_notification": true,
                  "latitude": 98.76,
                  "live_period": 86400,
                  "longitude": 54.321,
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Array [
                        Object {
                          "callback_data": "__DONE__",
                          "text": "I got here",
                        },
                      ],
                    ],
                  },
                  "reply_to_message_id": 123,
                },
              },
            },
          ]
        `);
});

test('EditLiveLocation match snapshot', async () => {
  await expect(
    renderer.render(
      <EditLiveLocation messageId={123} latitude={123.45} longitude={67.89} />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <EditLiveLocation
                latitude={123.45}
                longitude={67.89}
                messageId={123}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "editMessageLiveLocation",
                "parameters": Object {
                  "inline_message_id": undefined,
                  "latitude": 123.45,
                  "longitude": 67.89,
                  "message_id": 123,
                  "reply_markup": undefined,
                },
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <EditLiveLocation
        inlineMessageId="123456789"
        latitude={98.76}
        longitude={54.321}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="I got here" data="__DONE__" />
          </InlineKeyboard>
        }
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <EditLiveLocation
                inlineMessageId="123456789"
                latitude={98.76}
                longitude={54.321}
                replyMarkup={
                  <InlineKeyboard>
                    <CallbackButton
                      data="__DONE__"
                      text="I got here"
                    />
                  </InlineKeyboard>
                }
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "editMessageLiveLocation",
                "parameters": Object {
                  "inline_message_id": "123456789",
                  "latitude": 98.76,
                  "longitude": 54.321,
                  "message_id": undefined,
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Array [
                        Object {
                          "callback_data": "__DONE__",
                          "text": "I got here",
                        },
                      ],
                    ],
                  },
                },
              },
            },
          ]
        `);
});

test('StopLiveLocation match snapshot', async () => {
  await expect(renderer.render(<StopLiveLocation messageId={123} />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <StopLiveLocation
                messageId={123}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "stopMessageLiveLocation",
                "parameters": Object {
                  "inline_message_id": undefined,
                  "message_id": 123,
                  "reply_markup": undefined,
                },
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <StopLiveLocation
        inlineMessageId="123456789"
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Bye" data="__BYE__" />
          </InlineKeyboard>
        }
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <StopLiveLocation
                inlineMessageId="123456789"
                replyMarkup={
                  <InlineKeyboard>
                    <CallbackButton
                      data="__BYE__"
                      text="Bye"
                    />
                  </InlineKeyboard>
                }
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "stopMessageLiveLocation",
                "parameters": Object {
                  "inline_message_id": "123456789",
                  "message_id": undefined,
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Array [
                        Object {
                          "callback_data": "__BYE__",
                          "text": "Bye",
                        },
                      ],
                    ],
                  },
                },
              },
            },
          ]
        `);
});

test('Venue match snapshot', async () => {
  await expect(
    renderer.render(
      <Venue
        latitude={123.45}
        longitude={67.89}
        title="Bar"
        address="somewhere"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Venue
                address="somewhere"
                latitude={123.45}
                longitude={67.89}
                title="Bar"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendVenue",
                "parameters": Object {
                  "address": "somewhere",
                  "disable_notification": undefined,
                  "foursquare_id": undefined,
                  "foursquare_type": undefined,
                  "latitude": 123.45,
                  "longitude": 67.89,
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                  "title": "Bar",
                },
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Venue
        latitude={123.45}
        longitude={67.89}
        title="Bar"
        address="somewhere"
        foursquareId="xxx"
        foursquareType="food/beer"
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="That's it!" data="__YAMMY__" />
          </InlineKeyboard>
        }
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Venue
                address="somewhere"
                disableNotification={true}
                foursquareId="xxx"
                foursquareType="food/beer"
                latitude={123.45}
                longitude={67.89}
                replyMarkup={
                  <InlineKeyboard>
                    <CallbackButton
                      data="__YAMMY__"
                      text="That's it!"
                    />
                  </InlineKeyboard>
                }
                replyToMessageId={123}
                title="Bar"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendVenue",
                "parameters": Object {
                  "address": "somewhere",
                  "disable_notification": true,
                  "foursquare_id": "xxx",
                  "foursquare_type": "food/beer",
                  "latitude": 123.45,
                  "longitude": 67.89,
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Array [
                        Object {
                          "callback_data": "__YAMMY__",
                          "text": "That's it!",
                        },
                      ],
                    ],
                  },
                  "reply_to_message_id": 123,
                  "title": "Bar",
                },
              },
            },
          ]
        `);
});
