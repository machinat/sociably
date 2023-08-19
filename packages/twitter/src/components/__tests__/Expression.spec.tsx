import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';
import TwitterChat from '../../Chat.js';
import { Photo } from '../Media.js';
import { Typing } from '../Typing.js';
import { QuickReply } from '../QuickReply.js';
import { Expression } from '../Expression.js';

const renderer = new Renderer('twitter', async (node, path) => [
  { type: 'text', path, node, value: node.props.children as string },
  { type: 'break', path, node, value: null },
]);
const render = (element) => renderer.render(element, null, null);

it('is a valid Component', () => {
  expect(isNativeType(<Expression>foo</Expression>)).toBe(true);
  expect(Expression.$$platform).toBe('twitter');
  expect(Expression.$$name).toBe('Expression');
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
    [
      {
        "method": "POST",
        "params": {
          "event": {
            "message_create": {
              "custom_profile_id": "11111",
              "message_data": {
                "attachment": undefined,
                "text": "Hello",
              },
              "target": {
                "recipient_id": "67890",
              },
            },
            "type": "message_create",
          },
        },
        "url": "1.1/direct_messages/events/new.json",
      },
      {
        "method": "POST",
        "params": {
          "event": {
            "message_create": {
              "custom_profile_id": "11111",
              "message_data": {
                "attachment": undefined,
                "text": "World",
              },
              "target": {
                "recipient_id": "67890",
              },
            },
            "type": "message_create",
          },
        },
        "url": "1.1/direct_messages/events/new.json",
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
    [
      {
        "method": "POST",
        "params": {
          "event": {
            "message_create": {
              "custom_profile_id": undefined,
              "message_data": {
                "attachment": undefined,
                "text": "Hello World",
              },
              "target": {
                "recipient_id": "67890",
              },
            },
            "type": "message_create",
          },
        },
        "url": "1.1/direct_messages/events/new.json",
      },
      {
        "method": "POST",
        "params": {
          "event": {
            "message_create": {
              "custom_profile_id": undefined,
              "message_data": {
                "attachment": undefined,
                "quick_reply": {
                  "options": [
                    {
                      "description": "FOOOOOOO",
                      "label": "foo",
                      "metadata": "FOO",
                    },
                    {
                      "description": "BAAAAAAR",
                      "label": "bar",
                      "metadata": "BAR",
                    },
                    {
                      "description": "BAAAAAAZ",
                      "label": "baz",
                      "metadata": "BAZ",
                    },
                  ],
                  "type": "options",
                },
                "text": "Choose One",
              },
              "target": {
                "recipient_id": "67890",
              },
            },
            "type": "message_create",
          },
        },
        "url": "1.1/direct_messages/events/new.json",
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
    [
      {
        "method": "POST",
        "params": {
          "event": {
            "message_create": {
              "custom_profile_id": undefined,
              "message_data": {
                "attachment": undefined,
                "text": "Hello",
              },
              "target": {
                "recipient_id": "67890",
              },
            },
            "type": "message_create",
          },
        },
        "url": "1.1/direct_messages/events/new.json",
      },
      {
        "method": "POST",
        "params": {
          "event": {
            "message_create": {
              "custom_profile_id": undefined,
              "message_data": {
                "attachment": {
                  "media": {
                    "id": "11111",
                  },
                  "type": "media",
                },
                "quick_reply": {
                  "options": [
                    {
                      "description": undefined,
                      "label": "foo",
                      "metadata": undefined,
                    },
                  ],
                  "type": "options",
                },
                "text": undefined,
              },
              "target": {
                "recipient_id": "67890",
              },
            },
            "type": "message_create",
          },
        },
        "url": "1.1/direct_messages/events/new.json",
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
