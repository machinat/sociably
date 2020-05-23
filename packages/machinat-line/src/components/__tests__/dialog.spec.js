import moxy from 'moxy';
import Machinat from '@machinat/core';
import { isNativeElement } from '@machinat/core/utils/isX';
import Renderer from '@machinat/core/renderer';
import { Dialog } from '../dialog';
import { QuickReply } from '../quickReply';
import { MessageAction } from '../action';
import { CHANNEL_API_CALL_GETTER, BULK_API_CALL_GETTER } from '../../constant';

const generalComponentDelegator = moxy(async (node, path) => [
  { type: 'unit', value: { type: 'text', text: node.type }, node, path },
]);

const renderer = new Renderer('line', generalComponentDelegator);

beforeEach(() => {
  generalComponentDelegator.mock.reset();
});

it('is valid native component', () => {
  expect(typeof Dialog).toBe('function');

  expect(isNativeElement(<Dialog />)).toBe(true);
  expect(Dialog.$$platform).toBe('line');
});

it('return segments of what children rendered', async () => {
  await expect(
    renderer.render(
      <Dialog>
        <foo />
        <bar />
        <baz />
      </Dialog>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <foo />,
              "path": "$#Dialog.children:0",
              "type": "unit",
              "value": Object {
                "text": "foo",
                "type": "text",
              },
            },
            Object {
              "node": <bar />,
              "path": "$#Dialog.children:1",
              "type": "unit",
              "value": Object {
                "text": "bar",
                "type": "text",
              },
            },
            Object {
              "node": <baz />,
              "path": "$#Dialog.children:2",
              "type": "unit",
              "value": Object {
                "text": "baz",
                "type": "text",
              },
            },
          ]
        `);
});

it('hoist children rendered text into text message object', async () => {
  generalComponentDelegator.mock.fake(async (node, path) => [
    { type: 'break', node, path },
  ]);

  await expect(
    renderer.render(
      <Dialog>
        foo
        <br />
        bar
        <br />
        baz
      </Dialog>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": "foo",
              "path": "$#Dialog.children:0",
              "type": "unit",
              "value": Object {
                "text": "foo",
                "type": "text",
              },
            },
            Object {
              "node": "bar",
              "path": "$#Dialog.children:2",
              "type": "unit",
              "value": Object {
                "text": "bar",
                "type": "text",
              },
            },
            Object {
              "node": "baz",
              "path": "$#Dialog.children:4",
              "type": "unit",
              "value": Object {
                "text": "baz",
                "type": "text",
              },
            },
          ]
        `);
});

it('attach quickReply to last message object', async () => {
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
      node: <somebody />,
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

  generalComponentDelegator.mock.fakeReturnValue(childrenSegments);

  await expect(
    renderer.render(
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
        <content />
      </Dialog>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <foo />,
              "path": "$:0#Dialog.children:0",
              "type": "unit",
              "value": Object {
                "text": "Where you wanna go",
                "type": "text",
              },
            },
            Object {
              "node": <bar />,
              "path": "$:0#Dialog.children:1",
              "type": "unit",
              "value": Object {
                "text": "How much you wanna risk",
                "type": "text",
              },
            },
            Object {
              "node": <baz />,
              "path": "$:0#Dialog.children:2",
              "type": "unit",
              "value": Object {
                "quickReply": Object {
                  "items": Array [
                    Object {
                      "action": Object {
                        "label": "👮‍",
                        "text": "Some superhero",
                        "type": "message",
                      },
                      "imageUrl": undefined,
                      "type": "action",
                    },
                    Object {
                      "action": Object {
                        "label": "🧚‍",
                        "text": "Some fairytale bliss",
                        "type": "message",
                      },
                      "imageUrl": undefined,
                      "type": "action",
                    },
                    Object {
                      "action": Object {
                        "label": "💑",
                        "text": "Somebody I can kiss",
                        "type": "message",
                      },
                      "imageUrl": "https://somthing.just.like/this",
                      "type": "action",
                    },
                  ],
                },
                "text": "I'm not looking for",
                "type": "text",
              },
            },
            Object {
              "node": <somebody />,
              "path": "$:0#Dialog.children:3",
              "type": "unit",
              "value": Object {
                Symbol(line.segment.channel_api_call_getter): [Function],
                Symbol(line.segment.bulk_api_call_getter): [Function],
              },
            },
          ]
        `);
});

it('return null if children is empty', async () => {
  await expect(
    renderer.render(
      <Dialog
        quickReplies={[<QuickReply action={<MessageAction text="nope" />} />]}
      />
    )
  ).resolves.toBe(null);
});
