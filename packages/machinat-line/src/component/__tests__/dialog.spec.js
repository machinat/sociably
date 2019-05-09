import moxy from 'moxy';
import Machinat from 'machinat';

import { Dialog } from '../dialog';
import { QuickReply } from '../quickReply';

import { LINE_NATIVE_TYPE } from '../../constant';

import renderHelper from './renderHelper';

const renderInner = moxy();
const render = renderHelper(renderInner);

beforeEach(() => {
  renderInner.mock.reset();
});

it('is valid native component', () => {
  expect(typeof Dialog).toBe('function');

  expect(Dialog.$$native).toBe(LINE_NATIVE_TYPE);
  expect(Dialog.$$getEntry).toBe(undefined);
});

it('return segments of what children rendered', () => {
  const childrenSegments = [
    {
      type: 'unit',
      node: <foo />,
      value: { type: 'text', text: 'foo' },
      path: '$:0#Dialog.children:0',
    },
    {
      type: 'unit',
      node: <bar />,
      value: { type: 'text', text: 'bar' },
      path: '$:0#Dialog.children:1',
    },
    {
      type: 'unit',
      node: <baz />,
      value: { type: 'text', text: 'baz' },
      path: '$:0#Dialog.children:2',
    },
  ];
  renderInner.mock.fake(node =>
    node === '__CHILDREN__' ? childrenSegments : null
  );

  expect(render(<Dialog>__CHILDREN__</Dialog>)).toEqual(childrenSegments);
});

it('hoist children rendered text into text message object', () => {
  renderInner.mock.fake(node =>
    node === '__CHILDREN__'
      ? [
          {
            type: 'text',
            node: <foo />,
            value: 'foo',
            path: '$:0#Dialog.children:0',
          },
          {
            type: 'unit',
            node: <bar />,
            value: { type: 'text', text: 'bar' },
            path: '$:0#Dialog.children:1',
          },
          {
            type: 'text',
            node: <baz />,
            value: 'baz',
            path: '$:0#Dialog.children:2',
          },
        ]
      : null
  );

  expect(render(<Dialog>__CHILDREN__</Dialog>)).toEqual([
    {
      type: 'unit',
      node: <foo />,
      value: { type: 'text', text: 'foo' },
      path: '$:0#Dialog.children:0',
    },
    {
      type: 'unit',
      node: <bar />,
      value: { type: 'text', text: 'bar' },
      path: '$:0#Dialog.children:1',
    },
    {
      type: 'unit',
      node: <baz />,
      value: { type: 'text', text: 'baz' },
      path: '$:0#Dialog.children:2',
    },
  ]);
});

it('attach quickReply to last message object', () => {
  const Something = () => {};
  Something.$$getEntry = () => 'just/like/this';

  const childrenSegments = [
    {
      type: 'text',
      node: <foo />,
      value: 'Where you ganna go',
      path: '$:0#Dialog.children:0',
    },
    {
      type: 'unit',
      node: <bar />,
      value: {
        type: 'text',
        text: 'What you ganna risk',
      },
      path: '$:0#Dialog.children:1',
    },
    {
      type: 'text',
      node: <baz />,
      value: "I'm looking for",
      path: '$:0#Dialog.children:2',
    },
    {
      type: 'unit',
      node: <Something />,
      value: { someone: 'i can kiss' },
      path: '$:0#Dialog.children:3',
    },
  ];

  const quickReplySegments = [
    {
      type: 'part',
      node: <QuickReply action="..." />,
      value: {
        type: 'action',
        action: { type: 'message', label: '👮‍', text: 'Some superhero' },
      },
    },
    {
      type: 'part',
      node: <QuickReply action="..." />,
      value: {
        type: 'action',
        action: {
          type: 'message',
          label: '🧚‍',
          text: 'Some fairytale bliss',
        },
      },
    },
    {
      type: 'part',
      node: <QuickReply action="..." />,
      value: {
        type: 'action',
        imageUrl: 'https://somthing.just.like/this',
        action: {
          type: 'message',
          label: '💑',
          text: 'Somebody I can kiss',
        },
      },
    },
  ];

  renderInner.mock.fake(node =>
    node === '__CHILDREN__' ? childrenSegments : quickReplySegments
  );

  expect(
    render(<Dialog quickReplies="__QUICK_REPLIES__">__CHILDREN__</Dialog>)
  ).toEqual([
    {
      type: 'unit',
      node: <foo />,
      value: { type: 'text', text: 'Where you ganna go' },
      path: '$:0#Dialog.children:0',
    },
    childrenSegments[1],
    {
      type: 'unit',
      node: <baz />,
      value: {
        type: 'text',
        text: "I'm looking for",
        quickReply: {
          items: quickReplySegments.map(seg => seg.value),
        },
      },
      path: '$:0#Dialog.children:2',
    },
    childrenSegments[3],
  ]);
});

it('return null if children is empty', () => {
  renderInner.mock.fake(node =>
    node === '__QUICK_REPLIES__'
      ? [
          {
            type: 'part',
            node: <QuickReply action="..." />,
            value: {
              type: 'action',
              action: { type: 'message', text: 'just like this' },
            },
          },
        ]
      : null
  );

  expect(render(<Dialog quickReplies="__QUICK_REPLIES__" />)).toBe(null);
});
