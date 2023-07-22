import Sociably from '@sociably/core';
import { Latex as _Latex } from '../Latex.js';
import { Image as _Image } from '../Media.js';
import { renderUnitElement, makeTestComponent } from './utils.js';

const Latex = makeTestComponent(_Latex);
const Image = makeTestComponent(_Image);

it('render children wrapped', async () => {
  const nodeWithPlainText = <Latex>some text</Latex>;
  await expect(renderUnitElement(nodeWithPlainText)).resolves.toEqual([
    {
      type: 'text',
      value: '\\(some text\\)',
      node: nodeWithPlainText,
      path: '$',
    },
  ]);

  const nodeWithElements = (
    <Latex>
      abcd
      {'efgh'}
      <>ijkl</>
    </Latex>
  );
  await expect(renderUnitElement(nodeWithElements)).resolves.toEqual([
    {
      type: 'text',
      node: nodeWithElements,
      value: '\\(abcdefghijkl\\)',
      path: '$',
    },
  ]);
});

it('throw if non-texual node in children', async () => {
  await expect(
    renderUnitElement(
      <Latex>
        abcd
        <Image attachmentId="123" />
        efgh
      </Latex>
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-textual node <Image /> received, only textual nodes allowed"`
  );
});
