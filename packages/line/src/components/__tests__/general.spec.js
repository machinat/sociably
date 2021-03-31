/* eslint-disable no-await-in-loop */
import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import generalComponentDelegator from '../general';

const renderer = new Renderer('line', generalComponentDelegator);

describe('<p/>', () => {
  it('hoist textual children to text message object', async () => {
    await expect(
      renderer.render(
        <p>
          foo
          <br />
          bar
        </p>
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <p>
                  foo
                  <br />
                  bar
                </p>,
                "path": "$",
                "type": "unit",
                "value": Object {
                  "text": "foo
            bar",
                  "type": "text",
                },
              },
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
      `"non-textual node <img /> received, only textual node and <br/> allowed"`
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
        Object {
          "text": "123 Hello, R2D2!
      You know what?
      I'm your FATHER creator.
      May the force be with you! Bye!",
          "type": "text",
        },
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

    for (const node of [
      <b>{children}</b>,
      <i>{children}</i>,
      <s>{children}</s>,
      <u>{children}</u>,
      <code>{children}</code>,
      <pre>{children}</pre>,
    ]) {
      await expect(renderer.render(node)).rejects.toThrow(
        'non-textual node <img /> received, only textual nodes allowed'
      );
    }
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
