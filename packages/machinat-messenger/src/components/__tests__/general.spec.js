import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import generalComponentDelegator from '../general';

const renderer = new Renderer('messenger', generalComponentDelegator);

test('elements match snapshot', async () => {
  const segments = await renderer.render(
    <>
      <text>abc</text>
      <br />
      <b>important</b>
      <br />
      <i>italic</i>
      <br />
      <del>nooooo</del>
      <br />
      <code>foo.bar()</code>
      <br />
      <pre>foo.bar('hello world')</pre>
    </>
  );
  expect(segments).toMatchSnapshot();
  expect(segments.map(seg => seg.value)).toMatchInlineSnapshot(`
    Array [
      Object {
        "message": Object {
          "text": "abc",
        },
      },
      "*important*",
      "_italic_",
      "~nooooo~",
      "\`foo.bar()\`",
      "\`\`\`
    foo.bar('hello world')
    \`\`\`",
    ]
  `);
});

test('nested elements match snapshot', async () => {
  const segments = await renderer.render(
    <text>
      Mic test{' '}
      <code>
        Hello, <b>Luke Skywalker!</b>
      </code>
      <br />
      You know what?
      <br />
      <i>
        I'm your <del>FATHER</del> <code>droid</code>.
      </i>
      <br />
      <br />
      <pre>May the force be with you!</pre> Test over
    </text>
  );
  expect(segments).toMatchSnapshot();
  expect(segments.map(seg => seg.value)).toMatchInlineSnapshot(`
    Array [
      Object {
        "message": Object {
          "text": "Mic test \`Hello, *Luke Skywalker!*\`",
        },
      },
      Object {
        "message": Object {
          "text": "You know what?",
        },
      },
      Object {
        "message": Object {
          "text": "_I'm your ~FATHER~ \`droid\`._",
        },
      },
      Object {
        "message": Object {
          "text": "\`\`\`
    May the force be with you!
    \`\`\` Test over",
        },
      },
    ]
  `);
});

test('<text/> hoist plain text into text message object', async () => {
  const segments = await renderer.render(
    <text>
      foo
      <br />
      bar
      <br />
      <br />
      baz
    </text>
  );

  expect(segments).toMatchSnapshot();
  expect(segments.map(seg => seg.value)).toMatchInlineSnapshot(`
    Array [
      Object {
        "message": Object {
          "text": "foo",
        },
      },
      Object {
        "message": Object {
          "text": "bar",
        },
      },
      Object {
        "message": Object {
          "text": "baz",
        },
      },
    ]
  `);
});

it('texual element throw if <br/> in children', async () => {
  const children = (
    <>
      foo
      <br />
      bar
    </>
  );

  for (const element of [
    <b>{children}</b>,
    <i>{children}</i>,
    <del>{children}</del>,
    <code>{children}</code>,
    <pre>{children}</pre>,
  ]) {
    // eslint-disable-next-line no-await-in-loop
    await expect(renderer.render(element)).rejects.toThrow(
      'non-textual node <br /> received, only textual nodes allowed'
    );
  }
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
    renderer.render(<text>{children}</text>)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <img /> received, only textual nodes and <br/> allowed"`
  );

  for (const node of [
    <b>{children}</b>,
    <i>{children}</i>,
    <del>{children}</del>,
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
  for (const element of [<b />, <i />, <del />, <text />, <code />, <pre />]) {
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
  expect(segments.map(seg => seg.value)).toMatchInlineSnapshot(`
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
