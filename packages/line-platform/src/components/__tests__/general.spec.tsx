/* eslint-disable no-await-in-loop */
import Sociably from '@sociably/core';
import Renderer from '@sociably/core/renderer';
import generalComponentDelegator from '../general.js';
import { Image } from '../Image.js';

const renderer = new Renderer('line', generalComponentDelegator);

it('throw on <p/> tag', async () => {
  await expect(
    renderer.render(<p>foo</p>, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""p" is not a valid general component tag on LINE platform"`,
  );
});

test('render shallow text elements', async () => {
  const results = await Promise.all(
    [
      <b>important</b>,
      <i>italic</i>,
      <s>nooooo</s>,
      <u>underlined</u>,
      <code>foo.bar()</code>,
      <pre>foo.bar('hello world')</pre>,
      <br />,
    ].map((element) => renderer.render(element, null, null)),
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

test('render nested text elements', async () => {
  const promise = renderer.render(
    <>
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
    </>,
    null,
    null,
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

it('throw if non-textual node within text children', async () => {
  const children = (
    <>
      foo
      <Image
        originalContentUrl="https://example.com/original.png"
        previewImageUrl="https://example.com/preview.png"
      />
      bar
    </>
  );

  await expect(
    renderer.render(<b>{children}</b>, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Image /> is placed in <b/>"`,
  );
  await expect(
    renderer.render(<i>{children}</i>, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Image /> is placed in <i/>"`,
  );
  await expect(
    renderer.render(<s>{children}</s>, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Image /> is placed in <s/>"`,
  );
  await expect(
    renderer.render(<u>{children}</u>, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Image /> is placed in <u/>"`,
  );
  await expect(
    renderer.render(<code>{children}</code>, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Image /> is placed in <code/>"`,
  );
  await expect(
    renderer.render(<pre>{children}</pre>, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Image /> is placed in <pre/>"`,
  );
});

test('return null if text content is empty', async () => {
  const elements = [<b />, <i />, <s />, <u />, <code />, <pre />];

  for (const element of elements) {
    await expect(renderer.render(element, null, null)).resolves.toEqual(null);
  }
});

it('throw on invalid general element tags', async () => {
  await expect(
    renderer.render(<img src="http://..." />, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""img" is not a valid general component tag on LINE platform"`,
  );
  await expect(
    renderer.render(<video src="http://..." />, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""video" is not a valid general component tag on LINE platform"`,
  );
  await expect(
    renderer.render(<audio src="http://..." />, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""audio" is not a valid general component tag on LINE platform"`,
  );
  await expect(
    renderer.render(<file src="http://..." />, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""file" is not a valid general component tag on LINE platform"`,
  );
});
