import Sociably from '@sociably/core';
import Renderer from '@sociably/core/renderer';
import generalComponentDelegator from '../general';

const renderer = new Renderer('facebook', generalComponentDelegator);

test('render shallow element match snapshot', async () => {
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
    ].map((ele) => renderer.render(ele, null, null))
  );

  expect(results).toMatchSnapshot();
  expect(results.flat().map((seg) => seg?.value)).toMatchInlineSnapshot(`
    Array [
      "abc",
      "important",
      "italic",
      "nooooo",
      "underlined",
      "\`foo.bar()\`",
      "\`\`\`
    foo.bar('hello world')
    \`\`\`",
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
    </p>,
    null,
    null
  );
  expect(segments).toMatchSnapshot();
  expect(segments?.map((seg) => seg.value)).toMatchInlineSnapshot(`
    Array [
      "Mic test \`Hello, Luke Skywalker!\`
    You know what?
    I'm your FATHER \`droid\`.

    \`\`\`
    May the force be with you!
    \`\`\` Test over",
    ]
  `);
});

test('<p/> renders into individual text segment', async () => {
  const segments = await renderer.render(
    <>
      <p>foo</p>
      bar
      <p>baz</p>
    </>,
    null,
    null
  );

  expect(segments).toMatchSnapshot();
  expect(segments?.map((seg) => seg.value)).toMatchInlineSnapshot(`
    Array [
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
    renderer.render(<p>{children}</p>, null, null)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <img /> is placed in <p/>"`
  );
  await expect(
    renderer.render(<b>{children}</b>, null, null)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <img /> is placed in <b/>"`
  );
  await expect(
    renderer.render(<i>{children}</i>, null, null)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <img /> is placed in <i/>"`
  );
  await expect(
    renderer.render(<s>{children}</s>, null, null)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <img /> is placed in <s/>"`
  );
  await expect(
    renderer.render(<u>{children}</u>, null, null)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <img /> is placed in <u/>"`
  );
  await expect(
    renderer.render(<code>{children}</code>, null, null)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <img /> is placed in <code/>"`
  );
  await expect(
    renderer.render(<pre>{children}</pre>, null, null)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <img /> is placed in <pre/>"`
  );
});

test('render null if content is empty', async () => {
  const elements = [<b />, <i />, <s />, <u />, <p />, <code />, <pre />];
  for (const element of elements) {
    // eslint-disable-next-line no-await-in-loop
    await expect(renderer.render(element, null, null)).resolves.toEqual(null);
  }
});

test('media elements match snapshot', async () => {
  const segments = await renderer.render(
    <>
      <img src="http://avatar.my.bot" />
      <video src="http://vid.my.bot" />
      <audio src="http://sound.my.bot" />
      <file src="http://profile.my.bot" />
    </>,
    null,
    null
  );
  expect(segments).toMatchSnapshot();
  expect(segments?.map((seg) => seg.value)).toMatchInlineSnapshot(`
    Array [
      Object {
        "message": Object {
          "attachment": Object {
            "payload": Object {
              "url": "http://avatar.my.bot",
            },
            "type": "image",
          },
        },
      },
      Object {
        "message": Object {
          "attachment": Object {
            "payload": Object {
              "url": "http://vid.my.bot",
            },
            "type": "video",
          },
        },
      },
      Object {
        "message": Object {
          "attachment": Object {
            "payload": Object {
              "url": "http://sound.my.bot",
            },
            "type": "audio",
          },
        },
      },
      Object {
        "message": Object {
          "attachment": Object {
            "payload": Object {
              "url": "http://profile.my.bot",
            },
            "type": "file",
          },
        },
      },
    ]
  `);
});
