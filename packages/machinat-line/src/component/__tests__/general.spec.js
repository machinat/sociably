import { reduce } from 'machinat-utility';
import Machinat from 'machinat';
import * as general from '../general';

const map = (arr, mapper) => arr && arr.map(mapper);

const render = node =>
  reduce(
    node,
    (rendered, element, path) =>
      rendered.concat(
        typeof element === 'string'
          ? { value: element, node: element, path }
          : typeof element.type === 'string'
          ? map(
              general[element.type](element.props, render), //
              value => ({ value, node: element, path })
            )
          : { value: { non: 'text' }, node: element, path }
      ),
    [],
    ''
  ) || null;

describe('text components', () => {
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
  Symbol(machinat.segment.break),
  "https://machinat.world",
  Symbol(machinat.segment.break),
  "important",
  "italic",
  "nooooo",
  Symbol(machinat.segment.break),
  "foo.bar()",
  "foo.bar('hello world')",
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
  "123 Hello, Luke Skywalker!",
  Symbol(machinat.segment.break),
  "You know what?",
  Symbol(machinat.segment.break),
  "I'm your FATHER droid.",
  Symbol(machinat.segment.break),
  Symbol(machinat.segment.break),
  "Check here",
  Symbol(machinat.segment.break),
  "https://C3.PO",
  Symbol(machinat.segment.break),
  "May the force be with you! abc",
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
  Symbol(machinat.segment.break),
  "bar",
  "foo",
  Symbol(machinat.segment.break),
  "bar",
  Symbol(machinat.segment.break),
  "https://machinat.world",
  Symbol(machinat.segment.break),
  "foo",
  Symbol(machinat.segment.break),
  "bar",
  "foo",
  Symbol(machinat.segment.break),
  "bar",
  "foo",
  Symbol(machinat.segment.break),
  "bar",
  "foo",
  Symbol(machinat.segment.break),
  "bar",
  "foo",
  Symbol(machinat.segment.break),
  "bar",
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

  test('should return null if content is empty', () => {
    [
      <a src="..." />,
      <b />,
      <i />,
      <del />,
      <text />,
      <code />,
      <pre />,
    ].forEach(node => {
      expect(render(node)).toEqual([null]);
    });
  });
});

describe('media components', () => {
  it('metch snapshot', () => {
    expect(
      render([
        <img src="http://..." />,
        <video src="http://..." />,
        <audio src="http://..." />,
        <file src="http://..." />,
      ]).map(act => act.value)
    ).toMatchInlineSnapshot(`
Array [
  Object {
    "text": "http://...",
    "type": "text",
  },
  Object {
    "text": "http://...",
    "type": "text",
  },
  Object {
    "text": "http://...",
    "type": "text",
  },
  Object {
    "text": "http://...",
    "type": "text",
  },
]
`);
  });

  test('should return null if content is empty', () => {
    [<img />, <video />, <audio />, <file />].forEach(node => {
      expect(render(node)).toEqual([null]);
    });
  });
});
