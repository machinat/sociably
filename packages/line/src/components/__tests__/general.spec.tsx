/* eslint-disable no-await-in-loop */
import Sociably from '@sociably/core';
import Renderer from '@sociably/core/renderer';
import generalComponentDelegator from '../general.js';

const renderer = new Renderer('line', generalComponentDelegator);

describe('<p/>', () => {
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
      [
        "foo",
        "bar",
        "baz",
      ]
    `);
  });

  it('return null if content is empty', async () => {
    await expect(renderer.render(<></>, null, null)).resolves.toBe(null);
  });

  it('throw if non-text children received', async () => {
    expect(
      renderer.render(
        <p>
          <img />
        </p>,
        null,
        null
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"non-textual node <img /> is placed in <p/>"`
    );
  });
});

describe('text components', () => {
  test('render shallow elements', async () => {
    const results = await Promise.all(
      [
        <b>important</b>,
        <i>italic</i>,
        <s>nooooo</s>,
        <u>underlined</u>,
        <code>foo.bar()</code>,
        <pre>foo.bar('hello world')</pre>,
        <br />,
      ].map((element) => renderer.render(element, null, null))
    );

    expect(results).toMatchSnapshot();
    expect(results.flat().map((seg) => seg?.value)).toMatchInlineSnapshot(`
      [
        "important",
        "italic",
        "nooooo",
        "underlined",
        "foo.bar()",
        "foo.bar('hello world')",
        "
      ",
      ]
    `);
  });

  test('render nested elements', async () => {
    const promise = renderer.render(
      <p>
        123{' '}
        <code>
          Hello, <b>R2D2!</b>
        </code>
        <br />
        You know what?
        <br />
        <i>
          <u>I'm your</u> <s>FATHER</s> <code>creator</code>.
        </i>
        <br />
        <pre>May the force be with you!</pre> Bye!
      </p>,
      null,
      null
    );

    await expect(promise).resolves.toMatchSnapshot();
    const segments = await promise;

    expect(segments?.map((r) => r.value)).toMatchInlineSnapshot(`
      [
        "123 Hello, R2D2!
      You know what?
      I'm your FATHER creator.
      May the force be with you! Bye!",
      ]
    `);
  });

  it('throw if non-textual node within children', async () => {
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

  test('should return null if content is empty', async () => {
    const elements = [<b />, <i />, <s />, <u />, <p />, <code />, <pre />];

    for (const element of elements) {
      await expect(renderer.render(element, null, null)).resolves.toEqual(null);
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
      await expect(renderer.render(media, null, null)).resolves.toEqual([
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

  it('return "" if content is empty', async () => {
    const medias = [<img />, <video />, <audio />, <file />];

    for (const media of medias) {
      await expect(renderer.render(media, null, null)).resolves.toEqual([
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
