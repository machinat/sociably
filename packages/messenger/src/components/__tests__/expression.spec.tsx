import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import { isNativeType } from '@machinat/core/utils';
import { API_PATH } from '../../constant';
import { TextReply, EmailReply, PhoneReply } from '../quickReply';
import { Expression } from '../expression';
import { TypingOn, TypingOff, MarkSeen } from '../senderAction';
import type { MessageValue } from '../../types';

const renderGeneralElement = moxy((node, path) =>
  Promise.resolve([
    node.type === 'br'
      ? { type: 'break' as const, value: null, node, path }
      : { type: 'text' as const, value: node.type, node, path },
  ])
);

const renderer = new Renderer('messenger', renderGeneralElement);
const render = (node) => renderer.render(node, null as never);

const quickReplies = (
  <>
    <TextReply title="foo" payload="bar" />
    <PhoneReply />
    <EmailReply />
  </>
);

const children = (
  <>
    foo
    <br />
    <bar />
  </>
);

beforeEach(() => {
  renderGeneralElement.mock.reset();
});

it('is valid component', () => {
  expect(typeof Expression).toBe('function');
  expect(isNativeType(<Expression>foo</Expression>)).toBe(true);
  expect(Expression.$$platform).toBe('messenger');
});

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
      foo
      <br />
      bar
      <Machinat.Pause until={async () => {}} />
      baz
      <Machinat.Thunk effect={async () => {}} />
    </Expression>,
  ],
])('%s match snapshot', async (_, element) => {
  await expect(
    renderer.render(element, null as never)
  ).resolves.toMatchSnapshot();
});

it('returns null if empty children received', async () => {
  await expect(render(<Expression>{undefined}</Expression>)).resolves.toBe(
    null
  );
  await expect(render(<Expression>{null}</Expression>)).resolves.toBe(null);
});

it('hoist text value into message object', async () => {
  const segments = await render(
    <Expression>
      foo
      <br />
      <bar />
      <br />
      baz
    </Expression>
  );

  expect(segments).toMatchInlineSnapshot(`
    Array [
      Object {
        "node": "foo",
        "path": "$#Expression.children:0",
        "type": "unit",
        "value": Object {
          "message": Object {
            "text": "foo",
          },
          "messaging_type": undefined,
          "notification_type": undefined,
          "persona_id": undefined,
          "tag": undefined,
        },
      },
      Object {
        "node": <bar />,
        "path": "$#Expression.children:2",
        "type": "unit",
        "value": Object {
          "message": Object {
            "text": "bar",
          },
          "messaging_type": undefined,
          "notification_type": undefined,
          "persona_id": undefined,
          "tag": undefined,
        },
      },
      Object {
        "node": "baz",
        "path": "$#Expression.children:4",
        "type": "unit",
        "value": Object {
          "message": Object {
            "metadata": undefined,
            "quick_replies": undefined,
            "text": "baz",
          },
          "messaging_type": undefined,
          "notification_type": undefined,
          "persona_id": undefined,
          "tag": undefined,
        },
      },
    ]
  `);
});

it('add attributes to message value', async () => {
  const segments = await render(
    <Expression
      messagingType="MESSAGE_TAG"
      tag="HUMAN_AGENT"
      notificationType="SILENT_PUSH"
      personaId="_PERSONA_ID_"
    >
      <foo />
      <br />
      <bar />
    </Expression>
  );

  segments!.forEach((segment) => {
    expect(segment.value).toEqual({
      messaging_type: 'MESSAGE_TAG',
      tag: 'HUMAN_AGENT',
      notification_type: 'SILENT_PUSH',
      persona_id: '_PERSONA_ID_',
      message: {
        text: expect.any(String),
      },
    });
  });
});

it('add persona_id to typeing_on/typeing_off sender action', async () => {
  const segments = (await render(
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
    </Expression>
  ))!;

  expect(segments[1].value).toEqual({
    sender_action: 'typing_on',
    persona_id: '_PERSONA_ID_',
  });
  expect(segments[2].value).toEqual({
    sender_action: 'typing_off',
    persona_id: '_PERSONA_ID_',
  });
  expect(segments[3].value).toEqual({ sender_action: 'mark_seen' });
});

it('adds metadata to last message action', async () => {
  const segments = (await render(
    <Expression metadata="_META_">
      <foo />
      <br />
      bar
      <TypingOn />
    </Expression>
  ))!;

  expect(segments[0].value).toEqual({ message: { text: 'foo' } });
  expect(segments[1].value).toEqual({
    message: { text: 'bar', metadata: '_META_' },
  });
  expect(segments[2].value).toEqual({ sender_action: 'typing_on' });
});

it('adds quickReplies to last message action', async () => {
  const segments = (await render(
    <Expression
      quickReplies={
        <>
          <TextReply title="foo" payload="bar" />
          <PhoneReply />
          <EmailReply />
        </>
      }
    >
      <foo />
      <br />
      bar
      <TypingOn />
    </Expression>
  ))!;

  expect(segments[0].value).toEqual({ message: { text: 'foo' } });
  expect(segments[1].value).toEqual({
    message: {
      text: 'bar',
      quick_replies: expect.any(Array),
    },
  });
  expect(segments[2].value).toEqual({ sender_action: 'typing_on' });
  expect((segments[1].value as MessageValue).message.quick_replies)
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "content_type": "text",
        "image_url": undefined,
        "payload": "bar",
        "title": "foo",
      },
      Object {
        "content_type": "user_phone_number",
      },
      Object {
        "content_type": "user_email",
      },
    ]
  `);
});

it('do nothing to non-messgae value', async () => {
  renderGeneralElement.mock.wrap(
    (renderText) => (node, path) =>
      node.type === 'nonMessage'
        ? [
            {
              type: 'unit',
              value: {
                something: 'else',
                [API_PATH]: 'some/other/api',
              },
              node,
              path,
            },
          ]
        : renderText(node, path)
  );

  const segments = (await render(
    <Expression
      messagingType="MESSAGE_TAG"
      tag="CONFIRMED_EVENT_UPDATE"
      notificationType="SILENT_PUSH"
      personaId="_PERSONA_ID_"
      quickReplies={<TextReply title="foo" payload="bar" />}
    >
      <foo />
      <nonMessage />
    </Expression>
  ))!;

  expect(segments[1].value).toEqual({
    something: 'else',
    [API_PATH]: 'some/other/api',
  });
  expect(segments[0].value).toMatchInlineSnapshot(`
    Object {
      "message": Object {
        "metadata": undefined,
        "quick_replies": Array [
          Object {
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
    }
  `);
});
