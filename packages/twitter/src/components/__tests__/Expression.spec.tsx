import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';
import TwitterChat from '../../Chat';
import { Photo } from '../Media';
import { Typing } from '../Typing';
import { QuickReply } from '../QuickReply';
import { Expression } from '../Expression';

const renderer = new Renderer('twitter', async (node, path) => [
  { type: 'text', path, node, value: node.props.children },
  { type: 'break', path, node, value: null },
]);
const render = (element) => renderer.render(element, null, null);

it('is a valid Component', () => {
  expect(typeof Expression).toBe('function');
  expect(isNativeType(<Expression>foo</Expression>)).toBe(true);
  expect(Expression.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await render(
    <Expression customProfileId="11111">
      <p>Hello</p>
      <p>World</p>
    </Expression>
  );
  expect(segments).toMatchSnapshot();
  expect(
    (segments as any).map(({ value: { request, accomplishRequest } }) =>
      accomplishRequest(new TwitterChat('12345', '67890'), request, null)
    )
  ).toMatchInlineSnapshot(`
    Array [
      Object {
        "href": "1.1/direct_messages/events/new.json",
        "method": "POST",
        "parameters": Object {
          "event": Object {
            "message_create": Object {
              "custom_profile_id": "11111",
              "message_data": Object {
                "attachment": undefined,
                "text": "Hello",
              },
              "target": Object {
                "recipient_id": "67890",
              },
            },
            "type": "message_create",
          },
        },
      },
      Object {
        "href": "1.1/direct_messages/events/new.json",
        "method": "POST",
        "parameters": Object {
          "event": Object {
            "message_create": Object {
              "custom_profile_id": "11111",
              "message_data": Object {
                "attachment": undefined,
                "text": "World",
              },
              "target": Object {
                "recipient_id": "67890",
              },
            },
            "type": "message_create",
          },
        },
      },
    ]
  `);
});

test('rendering with quick replies', async () => {
  const segments = await render(
    <Expression
      quickReplies={
        <>
          <QuickReply label="foo" description="FOOOOOOO" metadata="FOO" />
          <QuickReply label="bar" description="BAAAAAAR" metadata="BAR" />
          <QuickReply label="baz" description="BAAAAAAZ" metadata="BAZ" />
        </>
      }
    >
      <p>Hello World</p>
      <p>Choose One</p>
    </Expression>
  );
  expect(segments).toMatchSnapshot();
  expect(
    (segments as any).map(({ value: { request, accomplishRequest } }) =>
      accomplishRequest(new TwitterChat('12345', '67890'), request, null)
    )
  ).toMatchInlineSnapshot(`
    Array [
      Object {
        "href": "1.1/direct_messages/events/new.json",
        "method": "POST",
        "parameters": Object {
          "event": Object {
            "message_create": Object {
              "custom_profile_id": undefined,
              "message_data": Object {
                "attachment": undefined,
                "text": "Hello World",
              },
              "target": Object {
                "recipient_id": "67890",
              },
            },
            "type": "message_create",
          },
        },
      },
      Object {
        "href": "1.1/direct_messages/events/new.json",
        "method": "POST",
        "parameters": Object {
          "event": Object {
            "message_create": Object {
              "custom_profile_id": undefined,
              "message_data": Object {
                "attachment": undefined,
                "quick_reply": Object {
                  "options": Array [
                    Object {
                      "description": "FOOOOOOO",
                      "label": "foo",
                      "metadata": "FOO",
                    },
                    Object {
                      "description": "BAAAAAAR",
                      "label": "bar",
                      "metadata": "BAR",
                    },
                    Object {
                      "description": "BAAAAAAZ",
                      "label": "baz",
                      "metadata": "BAZ",
                    },
                  ],
                  "type": "options",
                },
                "text": "Choose One",
              },
              "target": Object {
                "recipient_id": "67890",
              },
            },
            "type": "message_create",
          },
        },
      },
    ]
  `);
});

test('rendering with media content', async () => {
  const segments = await render(
    <Expression quickReplies={<QuickReply label="foo" />}>
      <p>Hello</p>
      <Photo shared url="http://foo.bar/baz.png" />
    </Expression>
  );
  expect(segments).toMatchSnapshot();

  const chat = new TwitterChat('12345', '67890');
  expect(
    (segments as any).map(({ value: { request, accomplishRequest } }, i) =>
      accomplishRequest(chat, request, i === 1 ? ['11111'] : null)
    )
  ).toMatchInlineSnapshot(`
    Array [
      Object {
        "href": "1.1/direct_messages/events/new.json",
        "method": "POST",
        "parameters": Object {
          "event": Object {
            "message_create": Object {
              "custom_profile_id": undefined,
              "message_data": Object {
                "attachment": undefined,
                "text": "Hello",
              },
              "target": Object {
                "recipient_id": "67890",
              },
            },
            "type": "message_create",
          },
        },
      },
      Object {
        "href": "1.1/direct_messages/events/new.json",
        "method": "POST",
        "parameters": Object {
          "event": Object {
            "message_create": Object {
              "custom_profile_id": undefined,
              "message_data": Object {
                "attachment": Object {
                  "media": Object {
                    "id": "11111",
                  },
                  "type": "media",
                },
                "quick_reply": Object {
                  "options": Array [
                    Object {
                      "description": undefined,
                      "label": "foo",
                      "metadata": undefined,
                    },
                  ],
                  "type": "options",
                },
                "text": undefined,
              },
              "target": Object {
                "recipient_id": "67890",
              },
            },
            "type": "message_create",
          },
        },
      },
    ]
  `);
});

it('throw if no message to attach quick replies', async () => {
  await expect(
    render(
      <Expression quickReplies={<QuickReply label="foo" />}>{null}</Expression>
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"no message content available to attach quick replies"`
  );
  await expect(
    render(
      <Expression quickReplies={<QuickReply label="foo" />}>
        <Typing />
      </Expression>
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"no message content available to attach quick replies"`
  );
});

it('render null if inner content is empty', async () => {
  await expect(render(<Expression>{null}</Expression>)).resolves.toBe(null);
});
