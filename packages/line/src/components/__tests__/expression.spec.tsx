import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils/isX';
import Renderer from '@machinat/core/renderer';
import { Expression } from '../expression';
import { QuickReply } from '../quickReply';
import { MessageAction } from '../action';
import { CHANNEL_REQUEST_GETTER, BULK_REQUEST_GETTER } from '../../constant';

const generalComponentDelegator = moxy(async (node, path) => [
  {
    type: 'unit' as const,
    value: { type: 'text', text: node.type },
    node,
    path,
  },
]);

const renderer = new Renderer('line', generalComponentDelegator);

beforeEach(() => {
  generalComponentDelegator.mock.reset();
});

it('is valid native component', () => {
  expect(typeof Expression).toBe('function');

  expect(isNativeType(<Expression>foo</Expression>)).toBe(true);
  expect(Expression.$$platform).toBe('line');
});

it('return segments of what children rendered', async () => {
  await expect(
    renderer.render(
      <Expression>
        <foo />
        <bar />
        <baz />
      </Expression>,
      null as never
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <foo />,
              "path": "$#Expression.children:0",
              "type": "unit",
              "value": Object {
                "text": "foo",
                "type": "text",
              },
            },
            Object {
              "node": <bar />,
              "path": "$#Expression.children:1",
              "type": "unit",
              "value": Object {
                "text": "bar",
                "type": "text",
              },
            },
            Object {
              "node": <baz />,
              "path": "$#Expression.children:2",
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
      <Expression>
        foo
        <br />
        bar
        <br />
        baz
      </Expression>,
      null as never
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": "foo",
              "path": "$#Expression.children:0",
              "type": "unit",
              "value": Object {
                "text": "foo",
                "type": "text",
              },
            },
            Object {
              "node": "bar",
              "path": "$#Expression.children:2",
              "type": "unit",
              "value": Object {
                "text": "bar",
                "type": "text",
              },
            },
            Object {
              "node": "baz",
              "path": "$#Expression.children:4",
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
      path: '$:0#Expression.children:0',
    },
    {
      type: 'unit',
      node: <bar />,
      value: {
        type: 'text',
        text: 'How much you wanna risk',
      },
      path: '$:0#Expression.children:1',
    },
    {
      type: 'text',
      node: <baz />,
      value: "I'm not looking for",
      path: '$:0#Expression.children:2',
    },
    {
      type: 'unit',
      node: <somebody />,
      value: {
        [CHANNEL_REQUEST_GETTER]() {
          return { method: 'GET', path: 'with/some', body: null };
        },
        [BULK_REQUEST_GETTER]() {
          return { method: 'GET', path: 'superhuman/gift', body: null };
        },
      },
      path: '$:0#Expression.children:3',
    },
  ];

  generalComponentDelegator.mock.fakeReturnValue(childrenSegments);

  await expect(
    renderer.render(
      <Expression
        quickReplies={
          <>
            <QuickReply>
              <MessageAction label="👮‍" text="Some superhero" />
            </QuickReply>
            <QuickReply>
              <MessageAction label="🧚‍" text="Some fairytale bliss" />
            </QuickReply>
            <QuickReply imageUrl="https://somthing.just.like/this">
              <MessageAction label="💑" text="Somebody I can kiss" />
            </QuickReply>
          </>
        }
      >
        <content />
      </Expression>,
      null as never
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <foo />,
              "path": "$:0#Expression.children:0",
              "type": "unit",
              "value": Object {
                "text": "Where you wanna go",
                "type": "text",
              },
            },
            Object {
              "node": <bar />,
              "path": "$:0#Expression.children:1",
              "type": "unit",
              "value": Object {
                "text": "How much you wanna risk",
                "type": "text",
              },
            },
            Object {
              "node": <baz />,
              "path": "$:0#Expression.children:2",
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
              "path": "$:0#Expression.children:3",
              "type": "unit",
              "value": Object {
                Symbol(channel_request_getter.line.machinat): [Function],
                Symbol(bulk_request_getter.line.machinat): [Function],
              },
            },
          ]
        `);
});

it('return null if children is empty', async () => {
  await expect(
    renderer.render(
      <Expression
        quickReplies={[
          <QuickReply>
            <MessageAction text="nope" />
          </QuickReply>,
        ]}
      >
        {undefined}
      </Expression>,
      null as never
    )
  ).resolves.toBe(null);
});
