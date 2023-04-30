import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';
import TwitterChat from '../../Chat';
import { Photo } from '../Media';
import { UrlButton } from '../UrlButton';
import { QuickReply } from '../QuickReply';
import { DirectMessage } from '../DirectMessage';

const renderer = new Renderer('twitter', async (node, path) => [
  { type: 'text', path, node, value: node.type },
]);
const render = (element) => renderer.render(element, null, null);

it('is a valid Component', () => {
  expect(typeof DirectMessage).toBe('function');
  expect(isNativeType(<DirectMessage placeId="12345" />)).toBe(true);
  expect(DirectMessage.$$platform).toBe('twitter');
});

test('rendering with plain text', async () => {
  let segments = await render(<DirectMessage>Hello World</DirectMessage>);
  expect(segments).toMatchSnapshot();
  let { request, accomplishRequest } = (segments as any)[0].value;
  expect(accomplishRequest(new TwitterChat('12345', '67890'), request, null))
    .toMatchInlineSnapshot(`
    Object {
      "href": "1.1/direct_messages/events/new.json",
      "method": "POST",
      "params": Object {
        "event": Object {
          "message_create": Object {
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
    }
  `);
  segments = await render(
    <DirectMessage customProfileId="11111">
      <foo />
    </DirectMessage>
  );
  expect(segments).toMatchSnapshot();
  ({ request, accomplishRequest } = (segments as any)[0].value);
  expect(accomplishRequest(new TwitterChat('12345', '67890'), request, null))
    .toMatchInlineSnapshot(`
    Object {
      "href": "1.1/direct_messages/events/new.json",
      "method": "POST",
      "params": Object {
        "event": Object {
          "message_create": Object {
            "custom_profile_id": "11111",
            "message_data": Object {
              "attachment": undefined,
              "text": "foo",
            },
            "target": Object {
              "recipient_id": "67890",
            },
          },
          "type": "message_create",
        },
      },
    }
  `);
});

test('rendering with media', async () => {
  const segments = await render(
    <DirectMessage media={<Photo mediaId="11111" />} />
  );
  expect(segments).toMatchSnapshot();
  const { request, accomplishRequest } = (segments as any)[0].value;
  expect(
    accomplishRequest(new TwitterChat('12345', '67890'), request, ['11111'])
  ).toMatchInlineSnapshot(`
    Object {
      "href": "1.1/direct_messages/events/new.json",
      "method": "POST",
      "params": Object {
        "event": Object {
          "message_create": Object {
            "message_data": Object {
              "attachment": Object {
                "media": Object {
                  "id": "11111",
                },
                "type": "media",
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
    }
  `);
});

test('rendering with buttons', async () => {
  const segments = await render(
    <DirectMessage
      buttons={
        <>
          <UrlButton label="foo" url="http://sociably.io/foo" />
          <UrlButton label="bar" url="http://sociably.io/bar" />
          <UrlButton label="baz" url="http://sociably.io/baz" />
        </>
      }
    >
      Guess one
    </DirectMessage>
  );
  expect(segments).toMatchSnapshot();
  const { request, accomplishRequest } = (segments as any)[0].value;
  expect(accomplishRequest(new TwitterChat('12345', '67890'), request, null))
    .toMatchInlineSnapshot(`
    Object {
      "href": "1.1/direct_messages/events/new.json",
      "method": "POST",
      "params": Object {
        "event": Object {
          "message_create": Object {
            "message_data": Object {
              "attachment": undefined,
              "ctas": Array [
                Object {
                  "label": "foo",
                  "type": "web_url",
                  "url": "http://sociably.io/foo",
                },
                Object {
                  "label": "bar",
                  "type": "web_url",
                  "url": "http://sociably.io/bar",
                },
                Object {
                  "label": "baz",
                  "type": "web_url",
                  "url": "http://sociably.io/baz",
                },
              ],
              "text": "Guess one",
            },
            "target": Object {
              "recipient_id": "67890",
            },
          },
          "type": "message_create",
        },
      },
    }
  `);
});

test('rendering with quick replies', async () => {
  const segments = await render(
    <DirectMessage
      quickReplies={
        <>
          <QuickReply label="foo" description="FOOOOOOO" metadata="FOO" />
          <QuickReply label="bar" description="BAAAAAAR" metadata="BAR" />
          <QuickReply label="baz" description="BAAAAAAZ" metadata="BAZ" />
        </>
      }
    >
      Guess one
    </DirectMessage>
  );
  expect(segments).toMatchSnapshot();
  const { request, accomplishRequest } = (segments as any)[0].value;
  expect(accomplishRequest(new TwitterChat('12345', '67890'), request, null))
    .toMatchInlineSnapshot(`
    Object {
      "href": "1.1/direct_messages/events/new.json",
      "method": "POST",
      "params": Object {
        "event": Object {
          "message_create": Object {
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
              "text": "Guess one",
            },
            "target": Object {
              "recipient_id": "67890",
            },
          },
          "type": "message_create",
        },
      },
    }
  `);
});

test('rendering with placeId', async () => {
  const segments = await render(
    <DirectMessage placeId="12345">Hello there</DirectMessage>
  );
  expect(segments).toMatchSnapshot();
  const { request, accomplishRequest } = (segments as any)[0].value;
  expect(accomplishRequest(new TwitterChat('12345', '67890'), request, null))
    .toMatchInlineSnapshot(`
    Object {
      "href": "1.1/direct_messages/events/new.json",
      "method": "POST",
      "params": Object {
        "event": Object {
          "message_create": Object {
            "message_data": Object {
              "attachment": Object {
                "location": Object {
                  "shared_place": Object {
                    "place": Object {
                      "id": "12345",
                    },
                  },
                  "type": "shared_place",
                },
                "type": "location",
              },
              "text": "Hello there",
            },
            "target": Object {
              "recipient_id": "67890",
            },
          },
          "type": "message_create",
        },
      },
    }
  `);
});

test('rendering with coordinates', async () => {
  const segments = await render(
    <DirectMessage coordinates={{ latitude: 25.1, longitude: 121.6 }} />
  );
  expect(segments).toMatchSnapshot();
  const { request, accomplishRequest } = (segments as any)[0].value;
  expect(accomplishRequest(new TwitterChat('12345', '67890'), request, null))
    .toMatchInlineSnapshot(`
    Object {
      "href": "1.1/direct_messages/events/new.json",
      "method": "POST",
      "params": Object {
        "event": Object {
          "message_create": Object {
            "message_data": Object {
              "attachment": Object {
                "location": Object {
                  "shared_coordinate": Object {
                    "coordinates": Object {
                      "coordinates": Array [
                        121.6,
                        25.1,
                      ],
                      "type": "Point",
                    },
                  },
                  "type": "shared_coordinate",
                },
                "type": "location",
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
    }
  `);
});

it('throw if no content and attachment available', async () => {
  await expect(
    render(<DirectMessage />)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"no text or attachment in <DirectMessage/>"`
  );
});

it('throw if "media", "placeId" and "coordinates" are duplicated', async () => {
  await expect(
    render(
      <DirectMessage
        placeId="12345"
        coordinates={{ latitude: 25.1, longitude: 121.6 }}
      />
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"there should be exactly one of \\"media\\", \\"placeId\\" or \\"coordinates\\" prop"`
  );
  await expect(
    render(<DirectMessage placeId="12345" media={<Photo mediaId="11111" />} />)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"there should be exactly one of \\"media\\", \\"placeId\\" or \\"coordinates\\" prop"`
  );
});

it('throw if invalid content received', async () => {
  await expect(
    render(
      <DirectMessage>
        <Photo mediaId="11111" />
      </DirectMessage>
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-texual element <Photo /> can't be placed under <DirectMessage/>"`
  );
  await expect(
    render(
      <DirectMessage>
        <Sociably.Pause />
      </DirectMessage>
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-texual element <Pause /> can't be placed under <DirectMessage/>"`
  );
});

it('throw if invalid media received', async () => {
  await expect(
    render(<DirectMessage media="foo" />)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"\\"media\\" prop should contain only 1 \\"Photo\\", \\"Video\\" or \\"AnimatedGif\\""`
  );
  await expect(
    render(<DirectMessage media={<Sociably.Pause />} />)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"\\"media\\" prop should contain only 1 \\"Photo\\", \\"Video\\" or \\"AnimatedGif\\""`
  );
});

it('throw if more than 1 media', async () => {
  await expect(
    render(
      <DirectMessage
        media={
          <>
            <Photo mediaId="11111" />
            <Photo mediaId="22222" />
          </>
        }
      />
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"\\"media\\" prop should contain only 1 \\"Photo\\", \\"Video\\" or \\"AnimatedGif\\""`
  );
});
