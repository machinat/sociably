/* eslint-disable no-await-in-loop */
import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import generalComponentDelegator from '../general';

const renderer = new Renderer('line', generalComponentDelegator);

describe('<p/>', () => {
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
          Array [
            "foo",
            "bar",
            "baz",
          ]
      `);
  });

  it('return null if content is empty', async () => {
    await expect(renderer.render(<p />)).resolves.toBe(null);
  });

  it('throw if non-text children received', async () => {
    expect(
      renderer.render(
        <p>
          <img />
        </p>
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
      ].map((ele) => renderer.render(ele))
    );

    expect(results).toMatchSnapshot();
    expect(results.flat().map((seg) => seg.value)).toMatchInlineSnapshot(`
      Array [
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
      </p>
    );

    await expect(promise).resolves.toMatchSnapshot();
    const segments = await promise;

    expect(segments.map((r) => r.value)).toMatchInlineSnapshot(`
      Array [
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

  test('should return null if content is empty', async () => {
    const elements = [<b />, <i />, <s />, <u />, <p />, <code />, <pre />];

    for (const element of elements) {
      await expect(renderer.render(element)).resolves.toEqual(null);
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
      await expect(renderer.render(media)).resolves.toEqual([
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
      await expect(renderer.render(media)).resolves.toEqual([
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
