import Renderer from '@sociably/core/renderer';
import generalComponentDelegator from '../general';
import { Photo } from '../media';

const renderer = new Renderer('telegram', generalComponentDelegator);

test('render shallow elements match snapshot', async () => {
  const results = await Promise.all(
    [
      <b>important</b>,
      <i>italic</i>,
      <s>nooooo</s>,
      <u>underlined</u>,
      <code>foo.bar()</code>,
      <pre>foo.bar('hello world')</pre>,
      <br />,
    ].map((ele) => renderer.render(ele)),
  );

  expect(results).toMatchSnapshot();
  expect(results.flat().map((seg) => seg.value)).toMatchInlineSnapshot(`
    [
      "<b>important</b>",
      "<i>italic</i>",
      "<s>nooooo</s>",
      "<u>underlined</u>",
      "<code>foo.bar()</code>",
      "<pre>foo.bar('hello world')</pre>",
      "
    ",
    ]
  `);
});

test('render nested elements match snapshot', async () => {
  const segments = await renderer.render(
    <>
      Mic test{' '}
      <code>
        Hello, <b>Luke Skywalker!</b>
      </code>
      <br />
      You know what?
      <br />
      <i>
        <u>I'm your</u> <s>FATHER</s> <code>droid</code>.
      </i>
      <br />
      <br />
      <pre>May the force be with you!</pre> Test over
    </>,
  );
  expect(segments).toMatchSnapshot();
  expect(segments.map((seg) => seg.value)).toMatchInlineSnapshot(`
    [
      "Mic test <code>Hello, <b>Luke Skywalker!</b></code>
    You know what?
    <i><u>I'm your</u> <s>FATHER</s> <code>droid</code>.</i>

    <pre>May the force be with you!</pre> Test over",
    ]
  `);
});

test('throw if non-texual value received', async () => {
  const children = (
    <>
      foo
      <Photo fileId="12345" />
      bar
    </>
  );

  await expect(
    renderer.render(<b>{children}</b>),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Photo /> is placed in <b/>"`,
  );
  await expect(
    renderer.render(<i>{children}</i>),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Photo /> is placed in <i/>"`,
  );
  await expect(
    renderer.render(<s>{children}</s>),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Photo /> is placed in <s/>"`,
  );
  await expect(
    renderer.render(<u>{children}</u>),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Photo /> is placed in <u/>"`,
  );
  await expect(
    renderer.render(<code>{children}</code>),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Photo /> is placed in <code/>"`,
  );
  await expect(
    renderer.render(<pre>{children}</pre>),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Photo /> is placed in <pre/>"`,
  );
});

test('render null if content is empty', async () => {
  const elements = [<b />, <i />, <s />, <u />, <code />, <pre />];
  for (const element of elements) {
    // eslint-disable-next-line no-await-in-loop
    await expect(renderer.render(element)).resolves.toEqual(null);
  }
});

test('throw on invalid general element tags', async () => {
  await expect(
    renderer.render(<p>foo</p>),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""p" is not a valid general component tag on Telegram platform"`,
  );
  await expect(
    renderer.render(<img src="http://avatar.my.bot" />),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""img" is not a valid general component tag on Telegram platform"`,
  );
  await expect(
    renderer.render(<video src="http://vid.my.bot" />),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""video" is not a valid general component tag on Telegram platform"`,
  );
  await expect(
    renderer.render(<audio src="http://sound.my.bot" />),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""audio" is not a valid general component tag on Telegram platform"`,
  );
  await expect(
    renderer.render(<file src="http://profile.my.bot" />),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""file" is not a valid general component tag on Telegram platform"`,
  );
});
