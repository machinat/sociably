import Sociably from '@sociably/core';
import { PATH_MESSAGES } from '../../constant.js';
import { TextReply as _TextReply } from '../TextReply.js';
import { PhoneReply as _PhoneReply } from '../PhoneReply.js';
import { EmailReply as _EmailReply } from '../EmailReply.js';
import { Expression as _Expression } from '../Expression.js';
import { PassThreadControl as _PassThreadControl } from '../PassThreadControl.js';
import { TypingOff as _TypingOff } from '../TypingOff.js';
import { TypingOn as _TypingOn } from '../TypingOn.js';
import { MarkSeen as _MarkSeen } from '../MarkSeen.js';
import { renderUnitElement, makeTestComponent } from './utils.js';

const Expression = makeTestComponent(_Expression);
const TextReply = makeTestComponent(_TextReply);
const PhoneReply = makeTestComponent(_PhoneReply);
const EmailReply = makeTestComponent(_EmailReply);
const PassThreadControl = makeTestComponent(_PassThreadControl);
const TypingOff = makeTestComponent(_TypingOff);
const TypingOn = makeTestComponent(_TypingOn);
const MarkSeen = makeTestComponent(_MarkSeen);

const quickReplies = (
  <>
    <TextReply title="foo" payload="bar" />
    <PhoneReply />
    <EmailReply />
  </>
);

const children = (
  <>
    <p>foo</p>
    bar
  </>
);

it.each([
  [
    'Expression with type',
    <Expression messagingType="UPDATE">{children}</Expression>,
  ],
  [
    'Expression with type and tag',
    <Expression messagingType="MESSAGE_TAG" tag="ACCOUNT_UPDATE">
      {children}
    </Expression>,
  ],
  [
    'Expression with notificationType',
    <Expression notificationType="NO_PUSH">{children}</Expression>,
  ],
  [
    'Expression with metadata',
    <Expression metadata="_SOME_METADATA_">{children}</Expression>,
  ],
  [
    'Expression with quickReplies',
    <Expression quickReplies={quickReplies}>{children}</Expression>,
  ],
  [
    'Expression with personaId',
    <Expression personaId="_PERSONA_ID_">{children}</Expression>,
  ],
  [
    'Expression with all props',
    <Expression
      messagingType="MESSAGE_TAG"
      tag="CONFIRMED_EVENT_UPDATE"
      notificationType="SILENT_PUSH"
      metadata="_MY_METADATA_"
      quickReplies={quickReplies}
      personaId="_PERSONA_ID_"
    >
      {children}
    </Expression>,
  ],
  [
    'Expression with break, pause and thunk in children',
    <Expression>
      <p>foo</p>
      bar
      <Sociably.Pause time={2000} />
      baz
      <Sociably.Thunk effect={async () => {}} />
    </Expression>,
  ],
])('%s match snapshot', async (_, element) => {
  await expect(renderUnitElement(element)).resolves.toMatchSnapshot();
});

it('returns null if empty children received', async () => {
  await expect(
    renderUnitElement(<Expression>{undefined}</Expression>),
  ).resolves.toBe(null);
  await expect(
    renderUnitElement(<Expression>{null}</Expression>),
  ).resolves.toBe(null);
});

it('hoist text value into message object', async () => {
  const segments = await renderUnitElement(
    <Expression>
      foo
      <p>bar</p>
      {'baz'}
    </Expression>,
  );

  expect(segments).toMatchInlineSnapshot(`
    [
      {
        "node": "foo",
        "path": "$#Expression.children:0",
        "type": "unit",
        "value": {
          "apiPath": "me/messages",
          "params": {
            "message": {
              "text": "foo",
            },
            "messaging_type": undefined,
            "notification_type": undefined,
            "persona_id": undefined,
            "tag": undefined,
          },
          "type": "message",
        },
      },
      {
        "node": <p>
          bar
        </p>,
        "path": "$#Expression.children:1",
        "type": "unit",
        "value": {
          "apiPath": "me/messages",
          "params": {
            "message": {
              "text": "bar",
            },
            "messaging_type": undefined,
            "notification_type": undefined,
            "persona_id": undefined,
            "tag": undefined,
          },
          "type": "message",
        },
      },
      {
        "node": "baz",
        "path": "$#Expression.children:2",
        "type": "unit",
        "value": {
          "apiPath": "me/messages",
          "params": {
            "message": {
              "metadata": undefined,
              "quick_replies": undefined,
              "text": "baz",
            },
            "messaging_type": undefined,
            "notification_type": undefined,
            "persona_id": undefined,
            "tag": undefined,
          },
          "type": "message",
        },
      },
    ]
  `);
});

it('add attributes to message value', async () => {
  const segments = await renderUnitElement(
    <Expression
      messagingType="MESSAGE_TAG"
      tag="HUMAN_AGENT"
      notificationType="SILENT_PUSH"
      personaId="_PERSONA_ID_"
    >
      foo
      <p>bar</p>
      {'baz'}
    </Expression>,
  );

  segments!.forEach((segment) => {
    expect(segment.value).toEqual({
      type: 'message',
      apiPath: PATH_MESSAGES,
      params: {
        messaging_type: 'MESSAGE_TAG',
        tag: 'HUMAN_AGENT',
        notification_type: 'SILENT_PUSH',
        persona_id: '_PERSONA_ID_',
        message: {
          text: expect.any(String),
        },
      },
    });
  });
});

it('add persona_id to typeing_on/typeing_off sender action', async () => {
  const segments = await renderUnitElement(
    <Expression
      messagingType="MESSAGE_TAG"
      tag="ACCOUNT_UPDATE"
      notificationType="SILENT_PUSH"
      personaId="_PERSONA_ID_"
    >
      foo
      <TypingOn />
      <TypingOff />
      <MarkSeen />
    </Expression>,
  );

  expect(segments?.map(({ value }) => value)).toMatchInlineSnapshot(`
    [
      {
        "apiPath": "me/messages",
        "params": {
          "message": {
            "metadata": undefined,
            "quick_replies": undefined,
            "text": "foo",
          },
          "messaging_type": "MESSAGE_TAG",
          "notification_type": "SILENT_PUSH",
          "persona_id": "_PERSONA_ID_",
          "tag": "ACCOUNT_UPDATE",
        },
        "type": "message",
      },
      {
        "apiPath": "me/messages",
        "params": {
          "persona_id": "_PERSONA_ID_",
          "sender_action": "typing_on",
        },
        "type": "message",
      },
      {
        "apiPath": "me/messages",
        "params": {
          "persona_id": "_PERSONA_ID_",
          "sender_action": "typing_off",
        },
        "type": "message",
      },
      {
        "apiPath": "me/messages",
        "params": {
          "sender_action": "mark_seen",
        },
        "type": "message",
      },
    ]
  `);
});

it('adds metadata to last message action', async () => {
  const segments = await renderUnitElement(
    <Expression metadata="_META_">
      foo
      <p>bar</p>
      <TypingOn />
    </Expression>,
  );

  expect(segments?.map(({ value }) => value)).toMatchInlineSnapshot(`
    [
      {
        "apiPath": "me/messages",
        "params": {
          "message": {
            "text": "foo",
          },
          "messaging_type": undefined,
          "notification_type": undefined,
          "persona_id": undefined,
          "tag": undefined,
        },
        "type": "message",
      },
      {
        "apiPath": "me/messages",
        "params": {
          "message": {
            "metadata": "_META_",
            "quick_replies": undefined,
            "text": "bar",
          },
          "messaging_type": undefined,
          "notification_type": undefined,
          "persona_id": undefined,
          "tag": undefined,
        },
        "type": "message",
      },
      {
        "apiPath": "me/messages",
        "params": {
          "persona_id": undefined,
          "sender_action": "typing_on",
        },
        "type": "message",
      },
    ]
  `);
});

it('adds quickReplies to last message action', async () => {
  const segments = await renderUnitElement(
    <Expression
      quickReplies={
        <>
          <TextReply title="foo" payload="bar" />
          <PhoneReply />
          <EmailReply />
        </>
      }
    >
      <p>foo</p>
      bar
      <TypingOn />
    </Expression>,
  );

  expect(segments?.map(({ value }) => value)).toMatchInlineSnapshot(`
    [
      {
        "apiPath": "me/messages",
        "params": {
          "message": {
            "text": "foo",
          },
          "messaging_type": undefined,
          "notification_type": undefined,
          "persona_id": undefined,
          "tag": undefined,
        },
        "type": "message",
      },
      {
        "apiPath": "me/messages",
        "params": {
          "message": {
            "metadata": undefined,
            "quick_replies": [
              {
                "content_type": "text",
                "image_url": undefined,
                "payload": "bar",
                "title": "foo",
              },
              {
                "content_type": "user_phone_number",
              },
              {
                "content_type": "user_email",
              },
            ],
            "text": "bar",
          },
          "messaging_type": undefined,
          "notification_type": undefined,
          "persona_id": undefined,
          "tag": undefined,
        },
        "type": "message",
      },
      {
        "apiPath": "me/messages",
        "params": {
          "persona_id": undefined,
          "sender_action": "typing_on",
        },
        "type": "message",
      },
    ]
  `);
});

it('do nothing to non-messgae value', async () => {
  const segments = await renderUnitElement(
    <Expression
      messagingType="MESSAGE_TAG"
      tag="CONFIRMED_EVENT_UPDATE"
      notificationType="SILENT_PUSH"
      personaId="_PERSONA_ID_"
      quickReplies={<TextReply title="foo" payload="bar" />}
    >
      <PassThreadControl targetAppId={123} />
      foo
    </Expression>,
  );

  expect(segments?.[0].value).toMatchInlineSnapshot(`
    {
      "apiPath": "me/pass_thread_control",
      "params": {
        "metadata": undefined,
        "target_app_id": 123,
      },
      "type": "message",
    }
  `);
  expect(segments?.[1].value).toMatchInlineSnapshot(`
    {
      "apiPath": "me/messages",
      "params": {
        "message": {
          "metadata": undefined,
          "quick_replies": [
            {
              "content_type": "text",
              "image_url": undefined,
              "payload": "bar",
              "title": "foo",
            },
          ],
          "text": "foo",
        },
        "messaging_type": "MESSAGE_TAG",
        "notification_type": "SILENT_PUSH",
        "persona_id": "_PERSONA_ID_",
        "tag": "CONFIRMED_EVENT_UPDATE",
      },
      "type": "message",
    }
  `);
});
