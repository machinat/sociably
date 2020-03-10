/* eslint-disable no-await-in-loop */
import Machinat from '@machinat/core';
import map from '@machinat/core/iterator/map';
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
        "important",
        "italic",
        "nooooo",
        undefined,
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
        <pre>May the force be with you!</pre> abc
      </text>
    );

    await expect(promise).resolves.toMatchSnapshot();
    const segments = await promise;

    expect(segments.map(r => r.value)).toMatchInlineSnapshot(`
      Array [
        "123 Hello, Luke Skywalker!",
        undefined,
        "You know what?",
        undefined,
        "I'm your FATHER droid.",
        undefined,
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
        undefined,
        "bar",
        "foo",
        undefined,
        "bar",
        "foo",
        undefined,
        "bar",
        "foo",
        undefined,
        "bar",
        "foo",
        undefined,
        "bar",
        "foo",
        undefined,
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
    const elements = [<b />, <i />, <del />, <text />, <code />, <pre />];

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
