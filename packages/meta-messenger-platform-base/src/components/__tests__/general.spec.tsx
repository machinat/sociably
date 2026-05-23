import Sociably, { type SociablyNode } from '@sociably/core';
import Renderer from '@sociably/core/renderer';
import generalComponentDelegator from '../general.js';

const renderer = new Renderer('facebook', generalComponentDelegator);

test('render shallow element match snapshot', async () => {
  const results = await Promise.all(
    [
      <b>important</b>,
      <i>italic</i>,
      <s>nooooo</s>,
      <u>underlined</u>,
      <code>foo.bar()</code>,
      <pre>foo.bar('hello world')</pre>,
      <br />,
    ].map((ele) => renderer.render(ele, null, null)),
  );

  expect(results).toMatchSnapshot();
  expect(results.flat().map((seg) => seg?.value)).toMatchInlineSnapshot(`
    [
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
    <>
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
    </>,
    null,
    null,
  );
  expect(segments).toMatchSnapshot();
  expect(segments?.map((seg) => seg.value)).toMatchInlineSnapshot(`
    [
      "Mic test \`Hello, Luke Skywalker!\`
    You know what?
    I'm your FATHER \`droid\`.

    \`\`\`
    May the force be with you!
    \`\`\` Test over",
    ]
  `);
});

test('throw if non-texual value received', async () => {
  const children = (
    <>
      foo
      <Sociably.Pause />
      bar
    </>
  );

  await expect(
    renderer.render(<b>{children}</b>, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Pause /> is placed in <b/>"`,
  );
  await expect(
    renderer.render(<i>{children}</i>, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Pause /> is placed in <i/>"`,
  );
  await expect(
    renderer.render(<s>{children}</s>, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Pause /> is placed in <s/>"`,
  );
  await expect(
    renderer.render(<u>{children}</u>, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Pause /> is placed in <u/>"`,
  );
  await expect(
    renderer.render(<code>{children}</code>, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Pause /> is placed in <code/>"`,
  );
  await expect(
    renderer.render(<pre>{children}</pre>, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Pause /> is placed in <pre/>"`,
  );
});

test('render null if content is empty', async () => {
  const elements = [<b />, <i />, <s />, <u />, <code />, <pre />];
  for (const element of elements) {
    // eslint-disable-next-line no-await-in-loop
    await expect(renderer.render(element, null, null)).resolves.toEqual(null);
  }
});

declare module '@sociably/core/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      p: { children?: SociablyNode };
      img: { src?: string };
      video: { src?: string };
      audio: { src?: string };
      file: { src?: string };
    }
  }
}

test('throw on invalid general element tags', async () => {
  await expect(
    renderer.render(<p>foo</p>, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""p" is not a valid general component tag on Facebook platform"`,
  );
  await expect(
    renderer.render(<img src="http://avatar.my.bot" />, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""img" is not a valid general component tag on Facebook platform"`,
  );
  await expect(
    renderer.render(<video src="http://vid.my.bot" />, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""video" is not a valid general component tag on Facebook platform"`,
  );
  await expect(
    renderer.render(<audio src="http://sound.my.bot" />, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""audio" is not a valid general component tag on Facebook platform"`,
  );
  await expect(
    renderer.render(<file src="http://profile.my.bot" />, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""file" is not a valid general component tag on Facebook platform"`,
  );
});
