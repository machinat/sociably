import moxy from 'moxy';
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

const renderInner = moxy(async message => {
  const renderings = map(
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
        : [
            QuickReply,
            LocationQuickReply,
            EmailQuickReply,
            PhoneQuickReply,
          ].includes(node.type)
        ? { type: 'unit', value: '_QUICK_REPLY_RENDERED_', node, path }
        : { type: 'raw', node: undefined, value: node, path },
    '$'
  );
  return renderings ? [].concat(...(await Promise.all(renderings))) : null;
});

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
])('%s match snapshot', async (_, element) => {
  await expect(render(element)).resolves.toMatchSnapshot();
});

it('returns null if empty children received', async () => {
  await expect(render(<Dialog />)).resolves.toBe(null);
  await expect(render(<Dialog>{null}</Dialog>)).resolves.toBe(null);
});

it('hoist text value into message object', async () => {
  const segments = await render(
    <Dialog>
      foo
      <bar />
      baz
    </Dialog>
  );

  expect(segments[0].value).toEqual({ message: { text: 'foo' } });
  expect(segments[1].value).toEqual({ message: { text: 'bar' } });
  expect(segments[2].value).toEqual({ message: { text: 'baz' } });
});

it('add attributes to action value', async () => {
  const segments = await render(
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

it('add persona_id to typeing_on/typeing_off sender action', async () => {
  let [{ value }] = await render(
    <Dialog personaId="_PERSONA_ID_">{{ sender_action: 'typing_on' }}</Dialog>
  );
  expect(value.persona_id).toBe('_PERSONA_ID_');

  [{ value }] = await render(
    <Dialog personaId="_PERSONA_ID_">{{ sender_action: 'typing_off' }}</Dialog>
  );
  expect(value.persona_id).toBe('_PERSONA_ID_');

  [{ value }] = await render(
    <Dialog personaId="_PERSONA_ID_">{{ sender_action: 'mark_seen' }}</Dialog>
  );
  expect(value.persona_id).toBe(undefined);
});

it('adds metadata to last message action', async () => {
  const segments = await render(
    <Dialog metadata="_META_">
      <foo />
      bar
      <Unknown />
    </Dialog>
  );

  expect(segments[0].value).toEqual({ message: { text: 'foo' } });
  expect(segments[1].value).toEqual({
    message: { text: 'bar', metadata: '_META_' },
  });
  expect(segments[2].value).toEqual({ you: "don't know me" });
});

it('adds quickReplies to last message action', async () => {
  const segments = await render(
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

  expect(segments[0].value).toEqual({ message: { text: 'foo' } });
  expect(segments[1].value).toEqual({
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
  expect(segments[2].value).toEqual({ you: "don't know me" });
});

it('throw if non QuickReply element received within prop quickReplies', async () => {
  await expect(
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
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<Unknown /> at $:2 is invalid, only <[QuickReply, LocationQuickReply, PhoneQuickReply, EmailQuickReply]/> allowed"`
  );
});
