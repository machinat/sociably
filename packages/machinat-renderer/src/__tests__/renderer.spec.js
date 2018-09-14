import Machinat from '../../../machinat';
import Renderer from '../renderer';

it('is a constructor', () => {
  expect(() => new Renderer('Test')).not.toThrow();
});

const Native = () => {};
const Custom = jest.fn(props => (
  <>
    wrapped head
    <Native {...props} />
    wrapped foot
  </>
));
Object.defineProperty(Custom, 'name', { value: 'Custom' });

let jobId = 0;
const delegate = {
  isNativeComponent: jest.fn(t => t === Native),
  renderGeneralElement: jest.fn().mockReturnValue('bbb'),
  renderNativeElement: jest.fn(e => e.props),
  createJobsFromRendered: jest.fn(
    rendered => rendered.map(() => ({ id: jobId++ })) // eslint-disable-line no-plusplus
  ),
};

afterEach(() => {
  jobId = 0;
  Custom.mockClear();
  delegate.isNativeComponent.mockClear();
  delegate.renderGeneralElement.mockClear();
  delegate.renderNativeElement.mockClear();
  delegate.createJobsFromRendered.mockClear();
});

describe('#render()', () => {
  it('works', () => {
    const context = {};
    const renderer = new Renderer('Test', delegate);
    const rendered = renderer.render(
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
      { element: 123, rendered: 123, path: '$::0' },
      { element: 'abc', rendered: 'abc', path: '$::1' },
      { element: <a>aaa</a>, rendered: 'bbb', path: '$::2' },
      {
        element: <Native x="true" y={false} />,
        rendered: { x: 'true', y: false },
        path: '$::3',
      },
      {
        element: 'wrapped head',
        rendered: 'wrapped head',
        path: '$::4#Custom::0',
      },
      {
        element: <Native a="A" b={2} />,
        rendered: { a: 'A', b: 2 },
        path: '$::4#Custom::1',
      },
      {
        element: 'wrapped foot',
        rendered: 'wrapped foot',
        path: '$::4#Custom::2',
      },
    ]);

    expect(Custom).toBeCalledTimes(1);
    expect(Custom.mock.calls[0]).toEqual([{ a: 'A', b: 2 }, context]);

    expect(delegate.isNativeComponent).toHaveBeenNthCalledWith(1, Native);
    expect(delegate.isNativeComponent).toHaveBeenNthCalledWith(2, Custom);
    expect(delegate.isNativeComponent).toHaveBeenNthCalledWith(3, Native);

    expect(delegate.renderGeneralElement).toBeCalledTimes(1);
    const renderGeneralCalls = delegate.renderGeneralElement.mock.calls;
    expect(renderGeneralCalls[0][0]).toEqual(<a>aaa</a>);
    expect(typeof renderGeneralCalls[0][1]).toBe('function');
    expect(renderGeneralCalls[0][2]).toEqual(context);
    expect(renderGeneralCalls[0][3]).toEqual('$::2');

    expect(delegate.renderNativeElement).toBeCalledTimes(2);
    delegate.renderNativeElement.mock.calls.forEach((call, i) => {
      expect(call[0]).toEqual(
        [<Native x="true" y={false} />, <Native a="A" b={2} />][i]
      );
      expect(typeof call[1]).toBe('function');
      expect(call[2]).toEqual(context);
      expect(call[3]).toEqual(['$::3', '$::4#Custom::1'][i]);
    });
  });

  it('return undefined if no renderable element in the node', () => {
    const renderer = new Renderer('Test', delegate);

    const None = () => null;
    const emptyNodes = [
      true,
      false,
      undefined,
      null,
      [],
      <>{null}</>,
      <None />,
      [true, false, undefined, null, <None />],
      <>
        {true}
        {false}
        {undefined}
        {null}
        <None />
      </>,
    ];

    emptyNodes.forEach(node => {
      expect(renderer.render(node)).toBe(undefined);
    });
  });
});

describe('#renderJobSequence()', () => {
  it('works', () => {
    const afterCallback = () => Promise.resolve();
    const WrappedImmediately = () => (
      <Machinat.Immediately after={afterCallback} />
    );
    const context = {};

    const renderer = new Renderer('Test', delegate);
    const rendered = renderer.renderJobSequence(
      <>
        <Machinat.Immediately />
        {123}
        abc
        <Machinat.Immediately after={afterCallback} />
        <a>aaa</a>
        <Native x="true" y={false} />
        <WrappedImmediately />
        <Custom a="A" b={2} />
      </>,
      context
    );

    expect(rendered).toEqual([
      <Machinat.Immediately />,
      [{ id: 0 }, { id: 1 }],
      <Machinat.Immediately after={afterCallback} />,
      [{ id: 2 }, { id: 3 }],
      <Machinat.Immediately after={afterCallback} />,
      [{ id: 4 }, { id: 5 }, { id: 6 }],
    ]);

    expect(Custom).toBeCalledTimes(1);
    expect(Custom.mock.calls[0]).toEqual([{ a: 'A', b: 2 }, context]);

    const {
      isNativeComponent,
      renderGeneralElement,
      renderNativeElement,
      createJobsFromRendered,
    } = delegate;
    expect(isNativeComponent).toHaveBeenNthCalledWith(1, Native);
    expect(isNativeComponent).toHaveBeenNthCalledWith(2, WrappedImmediately);
    expect(isNativeComponent).toHaveBeenNthCalledWith(3, Custom);
    expect(isNativeComponent).toHaveBeenNthCalledWith(4, Native);

    expect(renderGeneralElement).toBeCalledTimes(1);
    expect(renderGeneralElement.mock.calls[0][0]).toEqual(<a>aaa</a>);
    expect(typeof renderGeneralElement.mock.calls[0][1]).toBe('function');
    expect(renderGeneralElement.mock.calls[0][2]).toEqual(context);
    expect(renderGeneralElement.mock.calls[0][3]).toEqual('$::4');

    expect(renderNativeElement).toBeCalledTimes(2);
    renderNativeElement.mock.calls.forEach((call, i) => {
      expect(call[0]).toEqual(
        [<Native x="true" y={false} />, <Native a="A" b={2} />][i]
      );
      expect(typeof call[1]).toBe('function');
      expect(call[2]).toEqual(context);
      expect(call[3]).toEqual(['$::5', '$::7#Custom::1'][i]);
    });

    expect(createJobsFromRendered).toBeCalledTimes(3);
    expect(createJobsFromRendered).toHaveBeenNthCalledWith(
      1,
      [
        { element: 123, rendered: 123, path: '$::1' },
        { element: 'abc', rendered: 'abc', path: '$::2' },
      ],
      context
    );
    expect(createJobsFromRendered).toHaveBeenNthCalledWith(
      2,
      [
        { element: <a>aaa</a>, rendered: 'bbb', path: '$::4' },
        {
          element: <Native x="true" y={false} />,
          rendered: { x: 'true', y: false },
          path: '$::5',
        },
      ],
      context
    );
    expect(createJobsFromRendered).toHaveBeenNthCalledWith(
      3,
      [
        {
          element: 'wrapped head',
          rendered: 'wrapped head',
          path: '$::7#Custom::0',
        },
        {
          element: <Native a="A" b={2} />,
          rendered: { a: 'A', b: 2 },
          path: '$::7#Custom::1',
        },
        {
          element: 'wrapped foot',
          rendered: 'wrapped foot',
          path: '$::7#Custom::2',
        },
      ],
      context
    );
  });
});
