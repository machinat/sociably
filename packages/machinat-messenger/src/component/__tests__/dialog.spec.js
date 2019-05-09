import Machinat from 'machinat';
import { map } from 'machinat-utility';

import {
  QuickReply,
  LocationQuickReply,
  EmailQuickReply,
  PhoneQuickReply,
} from '../quickReply';

import { Dialog } from '../dialog';

import renderHelper from './renderHelper';

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
    <bar />
  </>
);

const Unknown = () => {};

const renderInner = jest.fn(
  message =>
    map(
      message,
      (node, path) =>
        typeof node === 'string'
          ? { type: 'unit', value: node, node, path }
          : typeof node.type === 'string'
          ? {
              type: 'unit',
              value: { message: { text: node.type } },
              node,
              path,
            }
          : node.type === Unknown
          ? { type: 'unit', value: { you: "don't know me" }, node, path }
          : { type: 'unit', value: '_QUICK_REPLY_RENDERED_', node, path },
      '$'
    ) || null
);

const render = renderHelper(renderInner);

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
])('%s match snapshot', (_, element) => {
  expect(render(element)).toMatchSnapshot();
});

it('returns null if empty children received', () => {
  expect(render(<Dialog />)).toBe(null);
  expect(render(<Dialog>{null}</Dialog>)).toBe(null);
});

it('hoist text value into message object', () => {
  const actions = render(
    <Dialog>
      foo
      <bar />
      baz
    </Dialog>
  );

  expect(actions[0].value).toEqual({ message: { text: 'foo' } });
  expect(actions[1].value).toEqual({ message: { text: 'bar' } });
  expect(actions[2].value).toEqual({ message: { text: 'baz' } });
});

it('add root fields to action value', () => {
  const segments = render(
    <Dialog
      type="MESSAGE_TAG"
      tag="PAYMENT_UPDATE"
      notificationType="SILENT_PUSH"
      personaId="_PERSONA_ID_"
    >
      <foo />
      <bar />
    </Dialog>
  );

  segments.forEach(segment => {
    expect(segment.value.messaging_type).toBe('MESSAGE_TAG');
    expect(segment.value.tag).toBe('PAYMENT_UPDATE');
    expect(segment.value.notification_type).toBe('SILENT_PUSH');
    expect(segment.value.persona_id).toBe('_PERSONA_ID_');
  });
});

it('adds metadata to last message action', () => {
  const actions = render(
    <Dialog metadata="_META_">
      <foo />
      bar
      <Unknown />
    </Dialog>
  );

  expect(actions[0].value).toEqual({ message: { text: 'foo' } });
  expect(actions[1].value).toEqual({
    message: { text: 'bar', metadata: '_META_' },
  });
  expect(actions[2].value).toEqual({ you: "don't know me" });
});

it('adds quickReplies to last message action', () => {
  const actions = render(
    <Dialog
      quickReplies={[
        <QuickReply title="foo" />,
        <LocationQuickReply />,
        <PhoneQuickReply />,
        <EmailQuickReply />,
      ]}
    >
      <foo />
      bar
      <Unknown />
    </Dialog>
  );

  expect(actions[0].value).toEqual({ message: { text: 'foo' } });
  expect(actions[1].value).toEqual({
    message: {
      text: 'bar',
      quick_replies: [
        '_QUICK_REPLY_RENDERED_',
        '_QUICK_REPLY_RENDERED_',
        '_QUICK_REPLY_RENDERED_',
        '_QUICK_REPLY_RENDERED_',
      ],
    },
  });
  expect(actions[2].value).toEqual({ you: "don't know me" });
});

it('throw if non QuickReply element received within prop quickReplies', () => {
  expect(() =>
    render(
      <Dialog
        quickReplies={[
          <QuickReply title="foo" />,
          <LocationQuickReply />,
          <Unknown />,
          <PhoneQuickReply />,
          <EmailQuickReply />,
        ]}
      >
        <foo />
        bar
      </Dialog>
    )
  ).toThrowErrorMatchingInlineSnapshot(
    `"<Unknown /> at $:2 is invalid, only <[QuickReply, LocationQuickReply, PhoneQuickReply, EmailQuickReply]/> allowed"`
  );
});
