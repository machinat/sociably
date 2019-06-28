/* eslint-disable no-await-in-loop */
import { map } from 'machinat-utility';
import Machinat from 'machinat';
import generalDelegate from '../general';

const render = async children => {
  const renderings = map(
    children,
    (node, path) =>
      typeof node === 'string'
        ? { type: 'text', value: node, node, path }
        : typeof node.type === 'string'
        ? generalDelegate(node, render, path)
        : { type: 'part', value: { something: 'unknown' }, node, path },
    '$'
  );

  return renderings ? [].concat(...(await Promise.all(renderings))) : null;
};

describe('text components', () => {
  test('shallow textual elements match snapshot', async () => {
    const promise = render([
      <text>abc</text>,
      <a href="https://machinat.world">hello</a>,
      <b>important</b>,
      <i>italic</i>,
      <del>nooooo</del>,
      <br />,
      <code>foo.bar()</code>,
      <pre>foo.bar('hello world')</pre>,
    ]);

    await expect(promise).resolves.toMatchSnapshot();

    const segments = await promise;

    expect(segments.map(s => s.value)).toMatchInlineSnapshot(`
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

  test('nested textual elements match snapshot', async () => {
    const promise = render(
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
    );

    await expect(promise).resolves.toMatchSnapshot();
    const segments = await promise;

    expect(segments.map(r => r.value)).toMatchInlineSnapshot(`
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

  test('with break placed in children', async () => {
    const children = (
      <>
        foo
        <br />
        bar
      </>
    );

    const promise = render([
      <text>{children}</text>,
      <a href="https://machinat.world">{children}</a>,
      <b>{children}</b>,
      <i>{children}</i>,
      <del>{children}</del>,
      <code>{children}</code>,
      <pre>{children}</pre>,
    ]);

    await expect(promise).resolves.toMatchSnapshot();
    const segments = await promise;

    expect(segments.map(r => r.value)).toMatchInlineSnapshot(`
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

  test('should throw if non string value rendered', async () => {
    const NonText = () => {};
    const children = (
      <>
        foo
        <NonText />
        bar
      </>
    );

    const elements = [
      <a src="...">{children}</a>,
      <b>{children}</b>,
      <i>{children}</i>,
      <del>{children}</del>,
      <text>{children}</text>,
      <code>{children}</code>,
      <pre>{children}</pre>,
    ];

    for (const element of elements) {
      await expect(render(element)).rejects.toThrow(
        '<NonText /> at $::1 is not valid textual content'
      );
    }
  });

  test('should return null if content is empty', async () => {
    const elements = [
      <a src="..." />,
      <b />,
      <i />,
      <del />,
      <text />,
      <code />,
      <pre />,
    ];

    for (const element of elements) {
      await expect(render(element)).resolves.toEqual([null]);
    }
  });
});

describe('media components', () => {
  it('metch snapshot', async () => {
    const medias = [
      <img src="http://..." />,
      <video src="http://..." />,
      <audio src="http://..." />,
      <file src="http://..." />,
    ];

    for (const media of medias) {
      await expect(render(media)).resolves.toEqual([
        {
          type: 'unit',
          node: media,
          value: {
            text: 'http://...',
            type: 'text',
          },
          path: '$',
        },
      ]);
    }
  });

  test('should return "" if content is empty', async () => {
    const medias = [<img />, <video />, <audio />, <file />];

    for (const media of medias) {
      await expect(render(media)).resolves.toEqual([
        {
          type: 'unit',
          node: media,
          value: { text: '', type: 'text' },
          path: '$',
        },
      ]);
    }
  });
});
