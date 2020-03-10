import moxy from 'moxy';
import Machinat from '@machinat/core';
import { isNativeElement } from '@machinat/core/utils/isXxx';
import { Dialog } from '../dialog';
import { QuickReply } from '../quickReply';
import { CHANNEL_API_CALL_GETTER, BULK_API_CALL_GETTER } from '../../constant';

const renderInner = moxy(async () => null);
const render = element => element.type(element, renderInner, '$');

beforeEach(() => {
  renderInner.mock.reset();
});

it('is valid native component', () => {
  expect(typeof Dialog).toBe('function');

  expect(isNativeElement(<Dialog />)).toBe(true);
  expect(Dialog.$$platform).toBe('line');
});

it('return segments of what children rendered', async () => {
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

  renderInner.mock.fake(async node =>
    node === '__CHILDREN__' ? childrenSegments : null
  );

  await expect(render(<Dialog>__CHILDREN__</Dialog>)).resolves.toEqual(
    childrenSegments
  );
});

it('hoist children rendered text into text message object', async () => {
  renderInner.mock.fake(async node =>
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

  await expect(render(<Dialog>__CHILDREN__</Dialog>)).resolves.toEqual([
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

it('attach quickReply to last message object', async () => {
  const SomeBody = () => {};

  const childrenSegments = [
    {
      type: 'text',
      node: <foo />,
      value: 'Where you wanna go',
      path: '$:0#Dialog.children:0',
    },
    {
      type: 'unit',
      node: <bar />,
      value: {
        type: 'text',
        text: 'How much you wanna risk',
      },
      path: '$:0#Dialog.children:1',
    },
    {
      type: 'text',
      node: <baz />,
      value: "I'm not looking for",
      path: '$:0#Dialog.children:2',
    },
    {
      type: 'unit',
      node: <SomeBody />,
      value: {
        [CHANNEL_API_CALL_GETTER]() {
          return { method: 'GET', path: 'with/some', body: null };
        },
        [BULK_API_CALL_GETTER]() {
          return { method: 'GET', path: 'superhuman/gift', body: null };
        },
      },
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

  renderInner.mock.fake(async node =>
    node === '__CHILDREN__' ? childrenSegments : quickReplySegments
  );

  await expect(
    render(<Dialog quickReplies="__QUICK_REPLIES__">__CHILDREN__</Dialog>)
  ).resolves.toEqual([
    {
      type: 'unit',
      node: <foo />,
      value: { type: 'text', text: 'Where you wanna go' },
      path: '$:0#Dialog.children:0',
    },
    childrenSegments[1],
    {
      type: 'unit',
      node: <baz />,
      value: {
        type: 'text',
        text: "I'm not looking for",
        quickReply: {
          items: quickReplySegments.map(seg => seg.value),
        },
      },
      path: '$:0#Dialog.children:2',
    },
    childrenSegments[3],
  ]);
});

it('return null if children is empty', async () => {
  renderInner.mock.fake(async node =>
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

  await expect(
    render(<Dialog quickReplies="__QUICK_REPLIES__" />)
  ).resolves.toBe(null);
});
