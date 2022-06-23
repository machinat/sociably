import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';
import {
  AnswerCallbackQuery,
  AnswerInlineQuery,
  AnswerShippingQuery,
  AnswerPreCheckoutQuery,
  InlineQueryResultAudio,
  InlineQueryResultArticle,
  InlineQueryResultContact,
  InlineQueryResultDocument,
  InlineQueryResultGame,
  InlineQueryResultGif,
  InlineQueryResultLocation,
  InlineQueryResultMpeg4Gif,
  InlineQueryResultPhoto,
  InlineQueryResultSticker,
  InlineQueryResultVenue,
  InlineQueryResultVideo,
  InlineQueryResultVoice,
} from '../answer';
import { InlineKeyboard, UrlButton } from '../replyMarkup';
import { Text, Contact } from '../template';
import { Location, Venue } from '../location';

describe.each([
  AnswerCallbackQuery,
  AnswerInlineQuery,
  AnswerShippingQuery,
  AnswerPreCheckoutQuery,
])('%p is valid unit Component', (Action: any) => {
  expect(typeof Action).toBe('function');
  expect(isNativeType(<Action />)).toBe(true);
  expect(Action.$$platform).toBe('telegram');
});

const renderer = new Renderer('telegram', async () => null);

test.each([
  AnswerCallbackQuery,
  AnswerInlineQuery,
  AnswerShippingQuery,
  AnswerPreCheckoutQuery,
  InlineQueryResultAudio,
  InlineQueryResultArticle,
  InlineQueryResultContact,
  InlineQueryResultDocument,
  InlineQueryResultGame,
  InlineQueryResultGif,
  InlineQueryResultLocation,
  InlineQueryResultMpeg4Gif,
  InlineQueryResultPhoto,
  InlineQueryResultSticker,
  InlineQueryResultVenue,
  InlineQueryResultVideo,
  InlineQueryResultVoice,
])('%p is valid unit Component', (Action: any) => {
  expect(typeof Action).toBe('function');
  expect(isNativeType(<Action />)).toBe(true);
  expect(Action.$$platform).toBe('telegram');
});

test('AnswerCallbackQuery match snapshot', async () => {
  await expect(
    renderer.render(<AnswerCallbackQuery queryId="12345" />, null as never)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <AnswerCallbackQuery
                queryId="12345"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "answerCallbackQuery",
                "parameters": Object {
                  "cache_time": undefined,
                  "callback_query_id": "12345",
                  "show_alert": undefined,
                  "text": undefined,
                  "url": undefined,
                },
                "toNonChatTarget": true,
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <AnswerCallbackQuery queryId="12345" text="foo" showAlert />,
      null as never
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <AnswerCallbackQuery
                queryId="12345"
                showAlert={true}
                text="foo"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "answerCallbackQuery",
                "parameters": Object {
                  "cache_time": undefined,
                  "callback_query_id": "12345",
                  "show_alert": true,
                  "text": "foo",
                  "url": undefined,
                },
                "toNonChatTarget": true,
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <AnswerCallbackQuery
        queryId="12345"
        url="http://foo.bar/baz"
        cacheTime={999}
      />,
      null as never
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <AnswerCallbackQuery
                cacheTime={999}
                queryId="12345"
                url="http://foo.bar/baz"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "answerCallbackQuery",
                "parameters": Object {
                  "cache_time": 999,
                  "callback_query_id": "12345",
                  "show_alert": undefined,
                  "text": undefined,
                  "url": "http://foo.bar/baz",
                },
                "toNonChatTarget": true,
              },
            },
          ]
        `);
});

test('AnswerInlineQuery match snapshot', async () => {
  await expect(
    renderer.render(
      <AnswerInlineQuery queryId="12345">
        <InlineQueryResultAudio
          id="1"
          url="http://foo.bar/audio"
          duration={123}
          performer="Doe"
          title="foo"
          caption="*bar*"
          parseMode="MarkdownV2"
        />
        <InlineQueryResultArticle
          id="2"
          url="http://foo.bar/article"
          hideUrl
          title="foo"
          description="bar"
          thumbUrl="http://foo.bar/article_thumb"
          thumbWidth={123}
          thumbHeight={456}
        />
        <InlineQueryResultContact
          id="3"
          firstName="John"
          lastName="Doe"
          phoneNumber="0123456789"
          vcard="foo"
          thumbUrl="http://foo.bar/contact_thumb"
          thumbWidth={123}
          thumbHeight={456}
        />
        <InlineQueryResultDocument
          id="4"
          url="http://foo.bar/document"
          mimeType="application/pdf"
          title="foo"
          thumbUrl="http://foo.bar/document_thumb"
          thumbWidth={123}
          thumbHeight={456}
          caption="*bar*"
          parseMode="MarkdownV2"
        />
        <InlineQueryResultGame id="5" gameShortName="foo" />
        <InlineQueryResultGif
          id="6"
          url="http://foo.bar/gif"
          thumbUrl="http://foo.bar/gif_thumb"
          thumbMimeType="image/gif"
          width={123}
          height={456}
          duration={789}
          title="foo"
          caption="*bar*"
          parseMode="MarkdownV2"
        />
        <InlineQueryResultLocation
          id="7"
          latitude={123.45}
          longitude={67.89}
          title="foo"
          livePeriod={999}
          thumbUrl="http://foo.bar/location_thumb"
          thumbWidth={123}
          thumbHeight={456}
        />
        <InlineQueryResultMpeg4Gif
          id="8"
          url="http://foo.bar/mpeg4"
          thumbUrl="http://foo.bar/mpeg4_thumb"
          thumbMimeType="image/gif"
          width={123}
          height={456}
          duration={789}
          title="foo"
          caption="*bar*"
          parseMode="MarkdownV2"
        />
        <InlineQueryResultPhoto
          id="9"
          url="http://foo.bar/photo"
          thumbUrl="http://foo.bar/photo_thumb"
          height={123}
          width={456}
          title="foo"
          description="bar"
        />
        <InlineQueryResultSticker id="10" fileId="12345" />
        <InlineQueryResultVenue
          id="11"
          latitude={123.45}
          longitude={67.89}
          title="foo"
          address="somewhere"
          foursquareId="bar"
          foursquareType="baz"
          thumbUrl="http://foo.bar/venue_thumb"
          thumbWidth={123}
          thumbHeight={456}
        />
        <InlineQueryResultVideo
          id="12"
          url="http://foo.bar/video"
          mimeType="video/mp4"
          width={123}
          height={456}
          thumbUrl="http://foo.bar/video_thumb"
          title="foo"
          description="bar"
          caption="baz"
          parseMode="None"
        />
        <InlineQueryResultVoice
          id="13"
          url="http://foo.bar/voice"
          duration={999}
          title="foo"
          caption="bar"
        />
      </AnswerInlineQuery>,
      null as never
    )
  ).resolves.toMatchSnapshot();

  const inlineKeyboard = (
    <InlineKeyboard>
      <UrlButton text="foo" url="http://foo.bar/article" />
    </InlineKeyboard>
  );

  await expect(
    renderer.render(
      <AnswerInlineQuery
        queryId="12345"
        cacheTime={999}
        isPersonal
        nextOffset="14"
      >
        <InlineQueryResultAudio
          id="1"
          fileId="1234"
          inputMessageContent={<Text>foo</Text>}
          replyMarkup={inlineKeyboard}
        />
        <InlineQueryResultArticle
          id="2"
          title="baz"
          inputMessageContent={
            <Location latitude={123.45} longitude={67.89} livePeriod={999} />
          }
          replyMarkup={inlineKeyboard}
        />
        <InlineQueryResultContact
          id="3"
          firstName="John"
          phoneNumber="1234567890"
          inputMessageContent={<Text parseMode="MarkdownV2">*foo*</Text>}
          replyMarkup={inlineKeyboard}
        />
        <InlineQueryResultDocument
          id="4"
          fileId="12345"
          title="foo"
          inputMessageContent={
            <Contact
              firstName="John"
              lastName="Doe"
              phoneNumber="12345678"
              vcard="foo"
            />
          }
          replyMarkup={inlineKeyboard}
        />
        <InlineQueryResultGame
          id="5"
          gameShortName="foo"
          replyMarkup={inlineKeyboard}
        />
        <InlineQueryResultGif
          id="6"
          url="http://foo.bar/gif"
          thumbUrl="http://foo.bar/gif_thumb"
          inputMessageContent={
            <Venue
              latitude={123.45}
              longitude={67.89}
              address="somewhere"
              title="bar"
              foursquareId="123"
              foursquareType="xxx"
            />
          }
          replyMarkup={inlineKeyboard}
        />
        <InlineQueryResultLocation
          id="7"
          latitude={123.45}
          longitude={67.89}
          title="foo"
          inputMessageContent="foo"
          replyMarkup={inlineKeyboard}
        />
        <InlineQueryResultMpeg4Gif
          id="8"
          url="http://foo.bar/mpeg4"
          thumbUrl="http://foo.bar/mpeg4_thumb"
          inputMessageContent="foo"
          replyMarkup={inlineKeyboard}
        />
        <InlineQueryResultPhoto
          id="9"
          fileId="12345"
          inputMessageContent="foo"
          replyMarkup={inlineKeyboard}
        />
        <InlineQueryResultSticker
          id="10"
          fileId="12345"
          inputMessageContent="foo"
          replyMarkup={inlineKeyboard}
        />
        <InlineQueryResultVenue
          id="11"
          latitude={123.45}
          longitude={67.89}
          title="foo"
          address="somewhere"
          inputMessageContent="foo"
          replyMarkup={inlineKeyboard}
        />
        <InlineQueryResultVideo
          id="12"
          fileId="12345"
          inputMessageContent="foo"
          replyMarkup={inlineKeyboard}
        />
        <InlineQueryResultVoice
          id="13"
          fileId="12345"
          inputMessageContent="foo"
          replyMarkup={inlineKeyboard}
        />
      </AnswerInlineQuery>,
      null as never
    )
  ).resolves.toMatchSnapshot();

  await expect(
    renderer.render(
      <AnswerInlineQuery
        queryId="123456"
        switchPMText="foo"
        switchPMParameter="bar"
      />,
      null as never
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <AnswerInlineQuery
                queryId="123456"
                switchPMParameter="bar"
                switchPMText="foo"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "answerInlineQuery",
                "parameters": Object {
                  "cache_time": undefined,
                  "inline_query_id": "123456",
                  "is_personal": undefined,
                  "next_offset": undefined,
                  "results": Array [],
                  "switch_pm_parameter": "bar",
                  "switch_pm_text": "foo",
                },
                "toNonChatTarget": true,
              },
            },
          ]
        `);
});

test('AnswerShippingQuery match snapshot', async () => {
  await expect(
    renderer.render(<AnswerShippingQuery queryId="12345" ok />, null as never)
  ).resolves.toMatchSnapshot();
  await expect(
    renderer.render(
      <AnswerShippingQuery
        queryId="12345"
        ok
        shippingOptions={[
          { id: '1', title: 'cat', prices: [{ label: 'food', amount: 123 }] },
          { id: '2', title: 'dog', prices: [{ label: 'food', amount: 456 }] },
        ]}
      />,
      null as never
    )
  ).resolves.toMatchSnapshot();
  await expect(
    renderer.render(
      <AnswerShippingQuery queryId="12345" ok={false} errorMessage="NOOO" />,
      null as never
    )
  ).resolves.toMatchSnapshot();
});

test('AnswerPreCheckoutQuery match snapshot', async () => {
  await expect(
    renderer.render(
      <AnswerPreCheckoutQuery queryId="12345" ok />,
      null as never
    )
  ).resolves.toMatchSnapshot();

  await expect(
    renderer.render(
      <AnswerPreCheckoutQuery queryId="12345" ok={false} errorMessage="NOOO" />,
      null as never
    )
  ).resolves.toMatchSnapshot();
});
