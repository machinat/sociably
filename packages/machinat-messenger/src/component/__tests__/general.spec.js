import { reduce } from 'machinat-children';
import Machinat from 'machinat';
import * as general from '../general';

const map = (arr, mapper) => arr && arr.map(mapper);

const render = node =>
  reduce(
    node,
    (rendered, element, path) =>
      rendered.concat(
        typeof element === 'string'
          ? { value: element, element, path }
          : typeof element.type === 'string'
          ? map(
              general[element.type](element.props, render), //
              value => ({ value, element, path })
            )
          : { value: { non: 'text' }, element, path }
      ),
    [],
    ''
  ) || null;

test('shallow textual elements match snapshot', () => {
  expect(
    render([
      <text>abc</text>,
      <a href="https://machinat.world">hello</a>,
      <b>important</b>,
      <i>italic</i>,
      <del>nooooo</del>,
      <br />,
      <code>foo.bar()</code>,
      <pre>foo.bar('hello world')</pre>,
    ]).map(r => r.value)
  ).toMatchInlineSnapshot(`
Array [
  "abc",
  "hello",
  Symbol(machinat.action.break),
  "https://machinat.world",
  Symbol(machinat.action.break),
  "*important*",
  "_italic_",
  "~nooooo~",
  Symbol(machinat.action.break),
  "\`foo.bar()\`",
  "\`\`\`
foo.bar('hello world')
\`\`\`",
]
`);
});

test('nested textual elements match snapshot', () => {
  expect(
    render(
      <text>
        123{' '}
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
        <a href="https://C3.PO">Check here</a>
        <pre>May the force be with you!</pre> abc
      </text>
    ).map(r => r.value)
  ).toMatchInlineSnapshot(`
Array [
  "123 \`Hello, *Luke Skywalker!*\`",
  Symbol(machinat.action.break),
  "You know what?",
  Symbol(machinat.action.break),
  "_I'm your ~FATHER~ \`droid\`._",
  Symbol(machinat.action.break),
  Symbol(machinat.action.break),
  "Check here",
  Symbol(machinat.action.break),
  "https://C3.PO",
  Symbol(machinat.action.break),
  "\`\`\`
May the force be with you!
\`\`\` abc",
]
`);
});

test('with break placed in children', () => {
  const children = (
    <>
      foo
      <br />
      bar
    </>
  );
  expect(
    render([
      <text>{children}</text>,
      <a href="https://machinat.world">{children}</a>,
      <b>{children}</b>,
      <i>{children}</i>,
      <del>{children}</del>,
      <code>{children}</code>,
      <pre>{children}</pre>,
    ]).map(r => r.value)
  ).toMatchInlineSnapshot(`
Array [
  "foo",
  Symbol(machinat.action.break),
  "bar",
  "foo",
  Symbol(machinat.action.break),
  "bar",
  Symbol(machinat.action.break),
  "https://machinat.world",
  Symbol(machinat.action.break),
  "*foo*",
  Symbol(machinat.action.break),
  "*bar*",
  "_foo_",
  Symbol(machinat.action.break),
  "_bar_",
  "~foo~",
  Symbol(machinat.action.break),
  "~bar~",
  "\`foo\`",
  Symbol(machinat.action.break),
  "\`bar\`",
  "\`\`\`
foo
\`\`\`",
  Symbol(machinat.action.break),
  "\`\`\`
bar
\`\`\`",
]
`);
});

test('should throw if non string value rendered', () => {
  const NonText = () => {};
  const children = (
    <>
      foo
      <NonText />
      bar
    </>
  );

  [
    <a src="...">{children}</a>,
    <b>{children}</b>,
    <i>{children}</i>,
    <del>{children}</del>,
    <text>{children}</text>,
    <code>{children}</code>,
    <pre>{children}</pre>,
  ].forEach(node => {
    expect(() => render(node)).toThrow(
      '<NonText /> at ::1 is not rendered as text content'
    );
  });
});

test('media elements match snapshot', () => {
  expect(
    render([
      <img src="http://avatar.my.bot" />,
      <video src="http://vid.my.bot" />,
      <audio src="http://sound.my.bot" />,
      <file src="http://profile.my.bot" />,
    ]).map(r => r.value)
  ).toMatchInlineSnapshot(`
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

test('should return null if content is empty', () => {
  [<a src="..." />, <b />, <i />, <del />, <text />, <code />, <pre />].forEach(
    node => {
      expect(render(node)).toEqual([null]);
    }
  );
});
