import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';
import renderGeneralType from '../general';
import { ChatAction } from '../action';
import { Photo } from '../media';
import { ForceReply } from '../replyMarkup';
import { Expression } from '../expression';

const renderer = new Renderer('telegram', renderGeneralType);

it('is valid unit Component', () => {
  expect(isNativeType(<Expression />)).toBe(true);
  expect(Expression.$$platform).toBe('telegram');
  expect(Expression.$$name).toBe('Expression');
});

it('hoist text value into message object', async () => {
  const result = await renderer.render(
    <Expression>
      <p>foo</p>
      <p>
        <b>bar</b>
      </p>
      baz
    </Expression>
  );
  expect(result[0].value.method).toBe('sendMessage');
  expect(result[0].value.params.text).toBe('foo');
  expect(result[1].value.method).toBe('sendMessage');
  expect(result[1].value.params.text).toBe('<b>bar</b>');
  expect(result[2].value.method).toBe('sendMessage');
  expect(result[2].value.params.text).toBe('baz');
  expect().toMatchSnapshot();
});

it('set disableNotification in message params', async () => {
  const result = await renderer.render(
    <Expression disableNotification>
      foo
      <Photo url="http://sociably.io/bar.jpg" />
    </Expression>
  );
  expect(result[0].value.params.disable_notification).toBe(true);
  expect(result[1].value.params.disable_notification).toBe(true);
  expect().toMatchSnapshot();
});

it('respect the original disableNotification setting set on the messgage', async () => {
  const result = await renderer.render(
    <Expression disableNotification>
      <Photo url="http://sociably.io/bar.jpg" />
      <Photo disableNotification={false} url="http://sociably.io/baz.jpg" />
    </Expression>
  );
  expect(result[0].value.params.disable_notification).toBe(true);
  expect(result[1].value.params.disable_notification).toBe(false);
  expect(result).toMatchSnapshot();
});

it('add replyMarkup to the last supported message', async () => {
  let result = await renderer.render(
    <Expression disableNotification replyMarkup={<ForceReply />}>
      <Photo url="http://sociably.io/foo.jpg" />
      <ChatAction action="upload_photo" />
    </Expression>
  );
  expect(result).toMatchSnapshot();
  expect(result[0].value.params.reply_markup).toMatchInlineSnapshot(`
    {
      "force_reply": true,
      "selective": undefined,
    }
  `);

  result = await renderer.render(
    <Expression disableNotification replyMarkup={<ForceReply />}>
      foo
      <Photo url="http://sociably.io/foo.jpg" replyMarkup={<ForceReply />} />
    </Expression>
  );
  expect(result).toMatchSnapshot();
  expect(result[0].value.params.reply_markup).toMatchInlineSnapshot(`
    {
      "force_reply": true,
      "selective": undefined,
    }
  `);
});

it('throw if no message available to attach replyMarkup', async () => {
  await expect(
    renderer.render(
      <Expression disableNotification replyMarkup={<ForceReply />}>
        <Photo url="http://sociably.io/foo.jpg" replyMarkup={<ForceReply />} />
        <ChatAction action="upload_photo" />
      </Expression>
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"no message available to attach reply markup"`
  );

  await expect(
    renderer.render(
      <Expression disableNotification replyMarkup={<ForceReply />}>
        <ChatAction action="upload_photo" />
      </Expression>
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"no message available to attach reply markup"`
  );
});
