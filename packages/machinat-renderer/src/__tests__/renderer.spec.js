import Machinat from '../../../machinat';
import Renderer from '../renderer';

it('is a constructor', () => {
  expect(() => new Renderer('Test')).not.toThrow();
});

describe('#_renderInternal()', () => {
  it('works', () => {
    const Native = () => {};
    const Custom = jest.fn(props => <Native {...props} />);

    const delegate = {
      isNativeElementType: jest.fn(t => t === Native),
      renderGeneralElement: jest.fn().mockReturnValueOnce('bbb'),
      renderNativeElement: jest.fn(e => e.props),
    };
    const context = {};

    const renderer = new Renderer('Test', delegate);
    const rendered = renderer._renderInternal(
      <>
        {123}
        abc
        <a>aaa</a>
        <Native x="true" y={false} />
        <Custom a="A" b={2} />
      </>,
      '$',
      context
    );

    expect(rendered).toEqual([
      { element: 123, rendered: 123 },
      { element: 'abc', rendered: 'abc' },
      { element: <a>aaa</a>, rendered: 'bbb' },
      {
        element: <Native x="true" y={false} />,
        rendered: { x: 'true', y: false },
      },
      {
        element: <Native a="A" b={2} />,
        rendered: { a: 'A', b: 2 },
      },
    ]);

    expect(Custom).toBeCalledTimes(1);
    expect(Custom.mock.calls[0]).toEqual([{ a: 'A', b: 2 }, context]);

    expect(delegate.isNativeElementType).toHaveBeenNthCalledWith(1, Native);
    expect(delegate.isNativeElementType).toHaveBeenNthCalledWith(2, Custom);
    expect(delegate.isNativeElementType).toHaveBeenNthCalledWith(3, Native);

    expect(delegate.renderGeneralElement).toBeCalledTimes(1);
    expect(delegate.renderGeneralElement.mock.calls[0]).toEqual([
      <a>aaa</a>,
      renderer._renderInternal,
      '$::2',
      context,
    ]);

    expect(delegate.renderNativeElement).toBeCalledTimes(2);
    expect(delegate.renderNativeElement.mock.calls[0]).toEqual([
      <Native x="true" y={false} />,
      renderer._renderInternal,
      '$::3',
      context,
    ]);
    expect(delegate.renderNativeElement.mock.calls[1]).toEqual([
      <Native a="A" b={2} />,
      renderer._renderInternal,
      '$::4#mockConstructor',
      context,
    ]);
  });
});
