import Machinat from 'machinat';

import { Dialog } from '../dialog';
import { QuickReply } from '../quickReply';
import { MessageAction } from '../action';

import { LINE_NAITVE_TYPE } from '../../symbol';

import render from './render';

beforeEach(() => {
  render.mock.reset();
});

it('is valid native component', () => {
  expect(typeof Dialog).toBe('function');

  expect(Dialog.$$native).toBe(LINE_NAITVE_TYPE);
  expect(Dialog.$$entry).toBe(undefined);
  expect(Dialog.$$unit).toBe(true);
  expect(Dialog.$$container).toBe(true);
});

it('return acts of what children rendered', () => {
  const children = '__CHILDREN__';
  const childrenActs = [
    { element: <foo />, value: { type: 'text', text: 'foo' } },
    { element: <bar />, value: { type: 'text', text: 'bar' } },
    { element: <baz />, value: { type: 'text', text: 'baz' } },
  ];

  render.mock.wrap(fn => node =>
    node && node.type === Dialog
      ? Dialog(node.props, render)
      : node === children
      ? childrenActs
      : fn(node)
  );

  expect(render(<Dialog>{children}</Dialog>)).toEqual(childrenActs);
});

it('hoist children rendered text into text message object', () => {
  const children = '__CHILDREN__';

  render.mock.wrap(fn => node =>
    node && node.type === Dialog
      ? Dialog(node.props, render)
      : node === children
      ? [
          { element: <foo />, value: 'foo' },
          { element: <bar />, value: { type: 'text', text: 'bar' } },
          { element: <baz />, value: 'baz' },
        ]
      : fn(node)
  );

  expect(render(<Dialog>{children}</Dialog>)).toEqual([
    { element: <foo />, value: { type: 'text', text: 'foo' } },
    { element: <bar />, value: { type: 'text', text: 'bar' } },
    { element: <baz />, value: { type: 'text', text: 'baz' } },
  ]);
});

it('attach quickReply to last message object', () => {
  const children = '__CHILDREN__';
  const Something = () => {};
  Something.$$entry = () => 'jsut/like/this';

  render.mock.wrap(fn => node =>
    node && node.type === Dialog
      ? Dialog(node.props, render)
      : node === children
      ? [
          { element: <foo />, value: 'Where you ganna go' },
          {
            element: <bar />,
            value: { type: 'text', text: 'What you ganna risk' },
          },
          { element: <baz />, value: "I'm looking for" },
          { element: <Something />, value: { someone: 'i can kiss' } },
        ]
      : fn(node)
  );

  expect(
    render(
      <Dialog
        quickReplies={[
          <QuickReply
            action={<MessageAction label="👮‍" text="Some superhero" />}
          />,
          <QuickReply
            action={<MessageAction label="🧚‍" text="Some fairytale bliss" />}
          />,
          <QuickReply
            action={<MessageAction label="💑" text="Somebody I can kiss" />}
            imageURL="https://somthing.just.like/this"
          />,
        ]}
      >
        {children}
      </Dialog>
    )
  ).toEqual([
    { element: <foo />, value: { type: 'text', text: 'Where you ganna go' } },
    { element: <bar />, value: { type: 'text', text: 'What you ganna risk' } },
    {
      element: <baz />,
      value: {
        type: 'text',
        text: "I'm looking for",
        quickReply: {
          items: [
            {
              type: 'action',
              action: { type: 'message', label: '👮‍', text: 'Some superhero' },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '🧚‍',
                text: 'Some fairytale bliss',
              },
            },
            {
              type: 'action',
              imageUrl: 'https://somthing.just.like/this',
              action: {
                type: 'message',
                label: '💑',
                text: 'Somebody I can kiss',
              },
            },
          ],
        },
      },
    },
    { element: <Something />, value: { someone: 'i can kiss' } },
  ]);
});

it('return null if children is empty', () => {
  render.mock.wrap(fn => node =>
    node && node.type === Dialog ? Dialog(node.props, render) : fn(node)
  );

  expect(
    render(
      <Dialog
        quickReplies={[
          <QuickReply
            action={
              <MessageAction
                label="Reading‍ books of old"
                text="The legends and the myths"
              />
            }
          />,
        ]}
      />
    )
  ).toBe(null);
});
