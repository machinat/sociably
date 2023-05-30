import Sociably from '@sociably/core';
import Renderer from '@sociably/core/renderer';
import generalComponentDelegator from '../general';

const renderer = new Renderer('telegram', generalComponentDelegator);

test('render shallow elements match snapshot', async () => {
  const results = await Promise.all(
    [
      <p>abc</p>,
      <b>important</b>,
      <i>italic</i>,
      <s>nooooo</s>,
      <u>underlined</u>,
      <code>foo.bar()</code>,
      <pre>foo.bar('hello world')</pre>,
      <br />,
    ].map((ele) => renderer.render(ele))
  );

  expect(results).toMatchSnapshot();
  expect(results.flat().map((seg) => seg.value)).toMatchInlineSnapshot(`
    [
      "abc",
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
    <p>
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
    </p>
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

test('<p/> renders into individual text segment', async () => {
  const segments = await renderer.render(
    <>
      <p>foo</p>
      bar
      <p>baz</p>
    </>
  );

  expect(segments).toMatchSnapshot();
  expect(segments.map((seg) => seg.value)).toMatchInlineSnapshot(`
    [
      "foo",
      "bar",
      "baz",
    ]
  `);
});

test('throw if non-texual value received', async () => {
  const children = (
    <>
      foo
      <img />
      bar
    </>
  );

  await expect(
    renderer.render(<p>{children}</p>)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <img /> is placed in <p/>"`
  );
  await expect(
    renderer.render(<b>{children}</b>)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <img /> is placed in <b/>"`
  );
  await expect(
    renderer.render(<i>{children}</i>)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <img /> is placed in <i/>"`
  );
  await expect(
    renderer.render(<s>{children}</s>)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <img /> is placed in <s/>"`
  );
  await expect(
    renderer.render(<u>{children}</u>)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <img /> is placed in <u/>"`
  );
  await expect(
    renderer.render(<code>{children}</code>)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <img /> is placed in <code/>"`
  );
  await expect(
    renderer.render(<pre>{children}</pre>)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <img /> is placed in <pre/>"`
  );
});

test('render null if content is empty', async () => {
  const elements = [<b />, <i />, <s />, <u />, <p />, <code />, <pre />];
  for (const element of elements) {
    // eslint-disable-next-line no-await-in-loop
    await expect(renderer.render(element)).resolves.toEqual(null);
  }
});

test('media elements match snapshot', async () => {
  const segments = await renderer.render(
    <>
      <img src="http://avatar.my.bot" />
      <video src="http://vid.my.bot" />
      <audio src="http://sound.my.bot" />
      <file src="http://profile.my.bot" />
    </>
  );
  expect(segments).toMatchSnapshot();
  expect(segments.map((seg) => seg.value)).toMatchInlineSnapshot(`
    [
      {
        "message": {
          "method": "sendPhoto",
          "parameters": {
            "photo": "http://avatar.my.bot",
          },
        },
      },
      {
        "message": {
          "method": "sendVideo",
          "parameters": {
            "video": "http://vid.my.bot",
          },
        },
      },
      {
        "message": {
          "method": "sendAudio",
          "parameters": {
            "audio": "http://sound.my.bot",
          },
        },
      },
      {
        "message": {
          "method": "sendDocument",
          "parameters": {
            "document": "http://profile.my.bot",
          },
        },
      },
    ]
  `);
});
