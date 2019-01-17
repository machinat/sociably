import Machinat from 'machinat';
import { map } from 'machinat-children';

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
  node =>
    map(node, element =>
      typeof element === 'string'
        ? { value: element, element }
        : typeof element.type === 'string'
        ? { value: { message: { text: element.type } }, element }
        : element.type === Unknown
        ? { value: { you: "don't know me" }, element }
        : { value: '_QUICK_REPLY_RENDERED_', element }
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
  const actions = render(
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

  actions.forEach(action => {
    expect(action.value.messaging_type).toBe('MESSAGE_TAG');
    expect(action.value.tag).toBe('PAYMENT_UPDATE');
    expect(action.value.notification_type).toBe('SILENT_PUSH');
    expect(action.value.persona_id).toBe('_PERSONA_ID_');
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
    `"<Unknown /> is invalid in .quickReplies, only <[QuickReply, LocationQuickReply, PhoneQuickReply, EmailQuickReply]/> allowed"`
  );
});
