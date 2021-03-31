import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import generalComponentDelegator from '../general';

const renderer = new Renderer('messenger', generalComponentDelegator);

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
    Array [
      Object {
        "method": "sendMessage",
        "parameters": Object {
          "parse_mode": "HTML",
          "text": "abc",
        },
      },
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
    Array [
      Object {
        "method": "sendMessage",
        "parameters": Object {
          "parse_mode": "HTML",
          "text": "Mic test <code>Hello, <b>Luke Skywalker!</b></code>
    You know what?
    <i><u>I'm your</u> <s>FATHER</s> <code>droid</code>.</i>

    <pre>May the force be with you!</pre> Test over",
        },
      },
    ]
  `);
});

test('<p/> hoist textual children into text message object', async () => {
  const segments = await renderer.render(
    <p>
      foo
      <br />
      bar
      <br />
      <br />
      baz
    </p>
  );

  expect(segments).toMatchSnapshot();
  expect(segments.map((seg) => seg.value)).toMatchInlineSnapshot(`
    Array [
      Object {
        "method": "sendMessage",
        "parameters": Object {
          "parse_mode": "HTML",
          "text": "foo
    bar

    baz",
        },
      },
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
    `"non-textual node <img /> received, only textual nodes and <br/> allowed"`
  );

  for (const node of [
    <b>{children}</b>,
    <i>{children}</i>,
    <s>{children}</s>,
    <u>{children}</u>,
    <code>{children}</code>,
    <pre>{children}</pre>,
  ]) {
    // eslint-disable-next-line no-await-in-loop
    await expect(renderer.render(node)).rejects.toThrow(
      'non-textual node <img /> received, only textual nodes allowed'
    );
  }
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
    Array [
      Object {
        "message": Object {
          "method": "sendPhoto",
          "parameters": Object {
            "photo": "http://avatar.my.bot",
          },
        },
      },
      Object {
        "message": Object {
          "method": "sendVideo",
          "parameters": Object {
            "video": "http://vid.my.bot",
          },
        },
      },
      Object {
        "message": Object {
          "method": "sendAudio",
          "parameters": Object {
            "audio": "http://sound.my.bot",
          },
        },
      },
      Object {
        "message": Object {
          "method": "sendDocument",
          "parameters": Object {
            "document": "http://profile.my.bot",
          },
        },
      },
    ]
  `);
});
