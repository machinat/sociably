import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils';
import Renderer from '@machinat/core/renderer';
import renderGeneralType from '../general';
import { ChatAction } from '../action';
import { Photo } from '../media';
import { ForceReply } from '../replyMarkup';
import { Expression } from '../expression';

const renderer = new Renderer('telegram', renderGeneralType);

it('is valid unit Component', () => {
  expect(typeof Expression).toBe('function');
  expect(isNativeType(<Expression />)).toBe(true);
  expect(Expression.$$platform).toBe('telegram');
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
  expect(result[0].value.parameters.text).toBe('foo');
  expect(result[1].value.method).toBe('sendMessage');
  expect(result[1].value.parameters.text).toBe('<b>bar</b>');
  expect(result[2].value.method).toBe('sendMessage');
  expect(result[2].value.parameters.text).toBe('baz');
  expect().toMatchSnapshot();
});

it('set disableNotification in message parameters', async () => {
  const result = await renderer.render(
    <Expression disableNotification>
      foo
      <Photo url="http://machinat.com/bar.jpg" />
    </Expression>
  );
  expect(result[0].value.parameters.disable_notification).toBe(true);
  expect(result[1].value.parameters.disable_notification).toBe(true);
  expect().toMatchSnapshot();
});

it('respect the original disableNotification setting set on the messgage', async () => {
  const result = await renderer.render(
    <Expression disableNotification>
      <Photo url="http://machinat.com/bar.jpg" />
      <Photo disableNotification={false} url="http://machinat.com/baz.jpg" />
    </Expression>
  );
  expect(result[0].value.parameters.disable_notification).toBe(true);
  expect(result[1].value.parameters.disable_notification).toBe(false);
  expect(result).toMatchSnapshot();
});

it('add replyMarkup to the last supported message', async () => {
  let result = await renderer.render(
    <Expression disableNotification replyMarkup={<ForceReply />}>
      <Photo url="http://machinat.com/foo.jpg" />
      <ChatAction action="upload_photo" />
    </Expression>
  );
  expect(result).toMatchSnapshot();
  expect(result[0].value.parameters.reply_markup).toMatchInlineSnapshot(`
    Object {
      "force_reply": true,
      "selective": undefined,
    }
  `);

  result = await renderer.render(
    <Expression disableNotification replyMarkup={<ForceReply />}>
      foo
      <Photo url="http://machinat.com/foo.jpg" replyMarkup={<ForceReply />} />
    </Expression>
  );
  expect(result).toMatchSnapshot();
  expect(result[0].value.parameters.reply_markup).toMatchInlineSnapshot(`
    Object {
      "force_reply": true,
      "selective": undefined,
    }
  `);
});

it('throw if no message available to attach replyMarkup', async () => {
  await expect(
    renderer.render(
      <Expression disableNotification replyMarkup={<ForceReply />}>
        <Photo url="http://machinat.com/foo.jpg" replyMarkup={<ForceReply />} />
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
