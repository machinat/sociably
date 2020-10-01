import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils/isX';
import Renderer from '@machinat/core/renderer';
import { ChatAction } from '../action';
import { Photo } from '../media';
import { ForceReply } from '../replyMarkup';
import { Expression } from '../expression';

const renderer = new Renderer('telegram', (node, path) => [
  node.type === 'br'
    ? { type: 'break', node, path }
    : {
        type: 'text',
        node,
        path,
        value: `<${node.type}>${node.props.children}</${node.type}>`,
      },
]);

it('is valid unit Component', () => {
  expect(typeof Expression).toBe('function');
  expect(isNativeType(<Expression />)).toBe(true);
  expect(Expression.$$platform).toBe('telegram');
});

it('hoist text value into message object', async () => {
  await expect(
    renderer.render(
      <Expression>
        foo
        <br />
        <b>bar</b>
        baz
      </Expression>
    )
  ).resolves.toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <Expression>
          foo
          <br />
          <b>
            bar
          </b>
          baz
        </Expression>,
        "path": "$",
        "type": "unit",
        "value": Object {
          "method": "sendMessage",
          "parameters": Object {
            "disable_notification": undefined,
            "parse_mode": "HTML",
            "text": "foo",
          },
        },
      },
      Object {
        "node": <Expression>
          foo
          <br />
          <b>
            bar
          </b>
          baz
        </Expression>,
        "path": "$",
        "type": "unit",
        "value": Object {
          "method": "sendMessage",
          "parameters": Object {
            "disable_notification": undefined,
            "parse_mode": "HTML",
            "text": "<b>bar</b>baz",
          },
        },
      },
    ]
  `);
});

it('set disableNotification in message parameters', async () => {
  await expect(
    renderer.render(
      <Expression disableNotification>
        foo
        <Photo url="http://machinat.com/bar.jpg" />
      </Expression>
    )
  ).resolves.toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <Expression
          disableNotification={true}
        >
          foo
          <Photo
            url="http://machinat.com/bar.jpg"
          />
        </Expression>,
        "path": "$",
        "type": "unit",
        "value": Object {
          "method": "sendMessage",
          "parameters": Object {
            "disable_notification": true,
            "parse_mode": "HTML",
            "text": "foo",
          },
        },
      },
      Object {
        "node": <Photo
          url="http://machinat.com/bar.jpg"
        />,
        "path": "$#Expression.children:1",
        "type": "unit",
        "value": Object {
          "method": "sendPhoto",
          "parameters": Object {
            "caption": undefined,
            "disable_notification": true,
            "parse_mode": "HTML",
            "photo": "http://machinat.com/bar.jpg",
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
          },
          "uploadingFiles": undefined,
        },
      },
    ]
  `);
});

it('respect the original disableNotification setting set on the messgage', async () => {
  await expect(
    renderer.render(
      <Expression disableNotification>
        <Photo url="http://machinat.com/bar.jpg" />
        <Photo disableNotification={false} url="http://machinat.com/baz.jpg" />
      </Expression>
    )
  ).resolves.toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <Photo
          url="http://machinat.com/bar.jpg"
        />,
        "path": "$#Expression.children:0",
        "type": "unit",
        "value": Object {
          "method": "sendPhoto",
          "parameters": Object {
            "caption": undefined,
            "disable_notification": true,
            "parse_mode": "HTML",
            "photo": "http://machinat.com/bar.jpg",
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
          },
          "uploadingFiles": undefined,
        },
      },
      Object {
        "node": <Photo
          disableNotification={false}
          url="http://machinat.com/baz.jpg"
        />,
        "path": "$#Expression.children:1",
        "type": "unit",
        "value": Object {
          "method": "sendPhoto",
          "parameters": Object {
            "caption": undefined,
            "disable_notification": false,
            "parse_mode": "HTML",
            "photo": "http://machinat.com/baz.jpg",
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
          },
          "uploadingFiles": undefined,
        },
      },
    ]
  `);
});

it('add replyMarkup to the last supported message', async () => {
  await expect(
    renderer.render(
      <Expression disableNotification replyMarkup={<ForceReply />}>
        <Photo url="http://machinat.com/foo.jpg" />
        <ChatAction action="upload_photo" />
      </Expression>
    )
  ).resolves.toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <Photo
          url="http://machinat.com/foo.jpg"
        />,
        "path": "$#Expression.children:0",
        "type": "unit",
        "value": Object {
          "method": "sendPhoto",
          "parameters": Object {
            "caption": undefined,
            "disable_notification": true,
            "parse_mode": "HTML",
            "photo": "http://machinat.com/foo.jpg",
            "reply_markup": Object {
              "force_reply": true,
              "selective": undefined,
            },
            "reply_to_message_id": undefined,
          },
          "uploadingFiles": undefined,
        },
      },
      Object {
        "node": <ChatAction
          action="upload_photo"
        />,
        "path": "$#Expression.children:1",
        "type": "unit",
        "value": Object {
          "method": "sendChatAction",
          "parameters": Object {
            "action": "upload_photo",
          },
        },
      },
    ]
  `);

  await expect(
    renderer.render(
      <Expression disableNotification replyMarkup={<ForceReply />}>
        foo
        <ChatAction action="upload_photo" />
      </Expression>
    )
  ).resolves.toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <Expression
          disableNotification={true}
          replyMarkup={<ForceReply />}
        >
          foo
          <ChatAction
            action="upload_photo"
          />
        </Expression>,
        "path": "$",
        "type": "unit",
        "value": Object {
          "method": "sendMessage",
          "parameters": Object {
            "disable_notification": true,
            "parse_mode": "HTML",
            "reply_markup": Object {
              "force_reply": true,
              "selective": undefined,
            },
            "text": "foo",
          },
        },
      },
      Object {
        "node": <ChatAction
          action="upload_photo"
        />,
        "path": "$#Expression.children:1",
        "type": "unit",
        "value": Object {
          "method": "sendChatAction",
          "parameters": Object {
            "action": "upload_photo",
          },
        },
      },
    ]
  `);
});

it('throw if replyMarkup already set at last supported message', async () => {
  await expect(
    renderer.render(
      <Expression disableNotification replyMarkup={<ForceReply />}>
        <Photo url="http://machinat.com/foo.jpg" replyMarkup={<ForceReply />} />
        <ChatAction action="upload_photo" />
      </Expression>
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"there is already a reply markup attached at the last message"`
  );
});

it('throw if no message support replyMarkup in children', async () => {
  await expect(
    renderer.render(
      <Expression disableNotification replyMarkup={<ForceReply />}>
        <ChatAction action="upload_photo" />
      </Expression>
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"no valid message for attaching reply markup onto"`
  );
});
