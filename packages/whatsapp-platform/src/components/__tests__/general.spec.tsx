import Sociably from '@sociably/core';
import Renderer from '@sociably/core/renderer';
import generalComponentDelegator from '../general.js';
import { Image } from '../Media.js';

const renderer = new Renderer('whatsapp', generalComponentDelegator);

it('<br/> renders into line break text', async () => {
  const [segment] = await renderer.render(<br />, null, null);

  expect(segment?.type).toBe('text');
  expect(segment?.value).toBe('\n');
});

it('<b/> renders transformed text', async () => {
  const [segment] = await renderer.render(<b>foo</b>, null, null);

  expect(segment?.type).toBe('text');
  expect(segment?.value).toBe('*foo*');
});

it('throw if non-textual node within text children', async () => {
  const children = (
    <>
      foo
      <Image mediaId="123" />
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

it('throw on invalid general element tags', async () => {
  await expect(
    renderer.render(<p>foo</p>, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""p" is not valid general component tag on WhatsApp platform"`,
  );
  await expect(
    renderer.render(<img src="http://..." />, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""img" is not valid general component tag on WhatsApp platform"`,
  );
  await expect(
    renderer.render(<video src="http://..." />, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""video" is not valid general component tag on WhatsApp platform"`,
  );
  await expect(
    renderer.render(<audio src="http://..." />, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""audio" is not valid general component tag on WhatsApp platform"`,
  );
  await expect(
    renderer.render(<file src="http://..." />, null, null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""file" is not valid general component tag on WhatsApp platform"`,
  );
});
