import moxy from 'moxy';
import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import { isNativeElement } from '@machinat/core/utils/isX';
import { ENTRY_PATH } from '../../constant';
import {
  QuickReply,
  LocationQuickReply,
  EmailQuickReply,
  PhoneQuickReply,
} from '../quickReply';
import { Dialog } from '../dialog';
import { TypingOn, TypingOff, MarkSeen } from '../senderAction';

const generalComponentDelegator = moxy((node, path) => [
  node.type === 'br'
    ? { type: 'break', node, path }
    : { type: 'text', value: node.type, node, path },
]);

const renderer = new Renderer('messenger', generalComponentDelegator);

const quickReplies = (
  <>
    <QuickReply title="foo" />
    <LocationQuickReply />
    <PhoneQuickReply />
    <EmailQuickReply />
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
  generalComponentDelegator.mock.reset();
});

it('is valid component', () => {
  expect(typeof Dialog).toBe('function');
  expect(isNativeElement(<Dialog />)).toBe(true);
  expect(Dialog.$$platform).toBe('messenger');
});

it.each([
  ['Dialog with type', <Dialog type="UPDATE">{children}</Dialog>],
  [
    'Dialog with type and tag',
    <Dialog type="MESSAGE_TAG" tag="COMMUNITY_ALERT">
      {children}
    </Dialog>,
  ],
  [
    'Dialog with notificationType',
    <Dialog notificationType="NO_PUSH">{children}</Dialog>,
  ],
  [
    'Dialog with metadata',
    <Dialog metadata="_SOME_METADATA_">{children}</Dialog>,
  ],
  [
    'Dialog with quickReplies',
    <Dialog quickReplies={quickReplies}>{children}</Dialog>,
  ],
  [
    'Dialog with personaId',
    <Dialog personaId="_PERSONA_ID_">{children}</Dialog>,
  ],
  [
    'Dialog with all props',
    <Dialog
      type="MESSAGE_TAG"
      tag="PAYMENT_UPDATE"
      notificationType="SILENT_PUSH"
      metadata="_MY_METADATA_"
      quickReplies={quickReplies}
      personaId="_PERSONA_ID_"
    >
      {children}
    </Dialog>,
  ],
])('%s match snapshot', async (_, element) => {
  await expect(renderer.render(element)).resolves.toMatchSnapshot();
});

it('returns null if empty children received', async () => {
  await expect(renderer.render(<Dialog />)).resolves.toBe(null);
  await expect(renderer.render(<Dialog>{null}</Dialog>)).resolves.toBe(null);
});

it('hoist text value into message object', async () => {
  const segments = await renderer.render(
    <Dialog>
      foo
      <br />
      <bar />
      <br />
      baz
    </Dialog>
  );

  expect(segments).toMatchInlineSnapshot(`
    Array [
      Object {
        "node": "foo",
        "path": "$#Dialog.children:0",
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
        "path": "$#Dialog.children:2",
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
        "path": "$#Dialog.children:4",
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
  const segments = await renderer.render(
    <Dialog
      type="MESSAGE_TAG"
      tag="PAYMENT_UPDATE"
      notificationType="SILENT_PUSH"
      personaId="_PERSONA_ID_"
    >
      <foo />
      <br />
      <bar />
    </Dialog>
  );

  segments.forEach(segment => {
    expect(segment.value).toEqual({
      messaging_type: 'MESSAGE_TAG',
      tag: 'PAYMENT_UPDATE',
      notification_type: 'SILENT_PUSH',
      persona_id: '_PERSONA_ID_',
      message: {
        text: expect.any(String),
      },
    });
  });
});

it('add persona_id to typeing_on/typeing_off sender action', async () => {
  const segments = await renderer.render(
    <Dialog
      type="MESSAGE_TAG"
      tag="PAYMENT_UPDATE"
      notificationType="SILENT_PUSH"
      personaId="_PERSONA_ID_"
    >
      foo
      <TypingOn />
      <TypingOff />
      <MarkSeen />
    </Dialog>
  );

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
  const segments = await renderer.render(
    <Dialog metadata="_META_">
      <foo />
      <br />
      bar
      <TypingOn />
    </Dialog>
  );

  expect(segments[0].value).toEqual({ message: { text: 'foo' } });
  expect(segments[1].value).toEqual({
    message: { text: 'bar', metadata: '_META_' },
  });
  expect(segments[2].value).toEqual({ sender_action: 'typing_on' });
});

it('adds quickReplies to last message action', async () => {
  const segments = await renderer.render(
    <Dialog
      quickReplies={[
        <QuickReply title="foo" />,
        <LocationQuickReply />,
        <PhoneQuickReply />,
        <EmailQuickReply />,
      ]}
    >
      <foo />
      <br />
      bar
      <TypingOn />
    </Dialog>
  );

  expect(segments[0].value).toEqual({ message: { text: 'foo' } });
  expect(segments[1].value).toEqual({
    message: {
      text: 'bar',
      quick_replies: expect.any(Array),
    },
  });
  expect(segments[2].value).toEqual({ sender_action: 'typing_on' });
  expect(segments[1].value.message.quick_replies).toMatchInlineSnapshot(`
    Array [
      Object {
        "content_type": "text",
        "image_url": undefined,
        "payload": undefined,
        "title": "foo",
      },
      Object {
        "content_type": "location",
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
  generalComponentDelegator.mock.wrap(renderText => (node, path) =>
    node.type === 'nonMessage'
      ? [
          {
            type: 'unit',
            value: {
              something: 'else',
              [ENTRY_PATH]: 'some/other/api',
            },
            node,
            path,
          },
        ]
      : renderText(node, path)
  );

  const segments = await renderer.render(
    <Dialog
      type="MESSAGE_TAG"
      tag="PAYMENT_UPDATE"
      notificationType="SILENT_PUSH"
      personaId="_PERSONA_ID_"
      quickReplies={[<QuickReply title="foo" />]}
    >
      <foo />
      <nonMessage />
    </Dialog>
  );

  expect(segments[1].value).toEqual({
    something: 'else',
    [ENTRY_PATH]: 'some/other/api',
  });
  expect(segments[0].value).toMatchInlineSnapshot(`
    Object {
      "message": Object {
        "metadata": undefined,
        "quick_replies": Array [
          Object {
            "content_type": "text",
            "image_url": undefined,
            "payload": undefined,
            "title": "foo",
          },
        ],
        "text": "foo",
      },
      "messaging_type": "MESSAGE_TAG",
      "notification_type": "SILENT_PUSH",
      "persona_id": "_PERSONA_ID_",
      "tag": "PAYMENT_UPDATE",
    }
  `);
});
