import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import { isNativeElement } from '@machinat/core/utils/isX';
import Renderer from '@machinat/core/renderer';
import { Latex } from '../text';

const generalComponentDelegator = moxy((node, path) => [
  node.type === 'br'
    ? { type: 'break', node, path }
    : { type: 'text', value: node.type, node, path },
]);
const renderer = new Renderer('messenger', generalComponentDelegator);

describe('Latex', () => {
  it('is valid Component', () => {
    expect(typeof Latex).toBe('function');
    expect(isNativeElement(<Latex />)).toBe(true);
    expect(Latex.$$platform).toBe('messenger');
  });

  it('render children wrapped', async () => {
    const nodeWithPlainText = <Latex>some text</Latex>;
    await expect(renderer.render(nodeWithPlainText)).resolves.toEqual([
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
        <efgh />
        ijkl
      </Latex>
    );
    await expect(renderer.render(nodeWithElements)).resolves.toEqual([
      {
        type: 'text',
        node: nodeWithElements,
        value: '\\(abcdefghijkl\\)',
        path: '$',
      },
    ]);
  });

  it('throw if <br/> in children', async () => {
    await expect(
      renderer.render(
        <Latex>
          abcd
          <br />
          efgh
        </Latex>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"non-textual node <br /> received, only textual nodes allowed"`
    );
  });

  it('throw if non-texual node in children', async () => {
    generalComponentDelegator.mock.fake((node, path) => [
      { type: 'unit', value: { foo: true }, node, path },
    ]);

    await expect(
      renderer.render(
        <Latex>
          abcd
          <nonMessage />
          efgh
        </Latex>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"non-textual node <nonMessage /> received, only textual nodes allowed"`
    );
  });
});
