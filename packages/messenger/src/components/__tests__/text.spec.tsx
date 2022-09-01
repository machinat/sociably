import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { Latex } from '../text';
import { Image } from '../media';
import { renderUnitElement } from './utils';

describe('Latex', () => {
  it('is valid Component', () => {
    expect(typeof Latex).toBe('function');
    expect(isNativeType(<Latex>_</Latex>)).toBe(true);
    expect(Latex.$$platform).toBe('messenger');
  });

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
});
