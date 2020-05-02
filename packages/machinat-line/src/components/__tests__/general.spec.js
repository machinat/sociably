/* eslint-disable no-await-in-loop */
import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import generalComponentDelegator from '../general';

const renderer = new Renderer('line', generalComponentDelegator);

describe('<text/>', () => {
  it('hoist text to text message object', async () => {
    await expect(
      renderer.render(
        <text>
          foo
          <br />
          bar
          <br />
          baz
        </text>
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <text>
                  foo
                  <br />
                  bar
                  <br />
                  baz
                </text>,
                "path": "$",
                "type": "unit",
                "value": Object {
                  "text": "foo",
                  "type": "text",
                },
              },
              Object {
                "node": <text>
                  foo
                  <br />
                  bar
                  <br />
                  baz
                </text>,
                "path": "$",
                "type": "unit",
                "value": Object {
                  "text": "bar",
                  "type": "text",
                },
              },
              Object {
                "node": <text>
                  foo
                  <br />
                  bar
                  <br />
                  baz
                </text>,
                "path": "$",
                "type": "unit",
                "value": Object {
                  "text": "baz",
                  "type": "text",
                },
              },
            ]
          `);
  });

  it('return null if content is empty', async () => {
    await expect(renderer.render(<text />)).resolves.toBe(null);
  });

  it('throw if non-text received', async () => {
    expect(
      renderer.render(
        <text>
          <img />
        </text>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"non-textual node <img /> received, only textual node and <br/> allowed"`
    );
  });

  test('with textual nodes', async () => {
    const promise = renderer.render(
      <text>
        123{' '}
        <code>
          Hello, <b>R2D2!</b>
        </code>
        <br />
        You know what?
        <br />
        <i>
          I'm your <del>FATHER</del> <code>creator</code>.
        </i>
        <br />
        <pre>May the force be with you!</pre> Bye!
      </text>
    );

    await expect(promise).resolves.toMatchSnapshot();
    const segments = await promise;

    expect(segments.map(r => r.value)).toMatchInlineSnapshot(`
      Array [
        Object {
          "text": "123 Hello, R2D2!",
          "type": "text",
        },
        Object {
          "text": "You know what?",
          "type": "text",
        },
        Object {
          "text": "I'm your FATHER creator.",
          "type": "text",
        },
        Object {
          "text": "May the force be with you! Bye!",
          "type": "text",
        },
      ]
    `);
  });
});

describe('text components', () => {
  test('shallow textual elements match snapshot', async () => {
    const promise = renderer.render([
      <b>important</b>,
      <br />,
      <i>italic</i>,
      <br />,
      <del>nooooo</del>,
      <br />,
      <code>foo.bar()</code>,
      <br />,
      <pre>foo.bar('hello world')</pre>,
    ]);

    await expect(promise).resolves.toMatchSnapshot();

    const segments = await promise;

    expect(segments.map(s => s.value)).toMatchInlineSnapshot(`
      Array [
        "important",
        "italic",
        "nooooo",
        "foo.bar()",
        "foo.bar('hello world')",
      ]
    `);
  });

  it('throw if <br/> within children', async () => {
    const children = (
      <>
        foo
        <br />
        bar
      </>
    );

    for (const node of [
      <b>{children}</b>,
      <i>{children}</i>,
      <del>{children}</del>,
      <code>{children}</code>,
      <pre>{children}</pre>,
    ]) {
      await expect(renderer.render(node)).rejects.toThrow(
        'non-textual node <br /> received, only textual nodes allowed'
      );
    }
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
      <del>{children}</del>,
      <code>{children}</code>,
      <pre>{children}</pre>,
    ]) {
      await expect(renderer.render(node)).rejects.toThrow(
        'non-textual node <img /> received, only textual nodes allowed'
      );
    }
  });

  test('should return null if content is empty', async () => {
    const elements = [<b />, <i />, <del />, <text />, <code />, <pre />];

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
