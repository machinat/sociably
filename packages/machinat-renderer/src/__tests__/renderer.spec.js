import moxy from 'moxy';

import Machinat from '../../../machinat';
import Renderer from '../renderer';

it('is a constructor', () => {
  expect(() => new Renderer('Test')).not.toThrow();
});

const Native = () => {};
Native.$$root = true;

const Custom = moxy(props => (
  <>
    wrapped head
    <Native {...props} />
    wrapped foot
  </>
));
Custom.mock.getter('name').fakeReturnValue('Custom');

const delegate = moxy({
  isNativeComponent: t => t === Native,
  renderGeneralElement: () => '__GENERAL_ELE__',
  renderNativeElement: e => e.props,
});

afterEach(() => {
  Custom.mock.clear();
  delegate.mock.clear();
});

describe('#renderInner()', () => {
  it('works', () => {
    const context = {};
    const renderer = new Renderer('Test', delegate);
    const rendered = renderer.renderInner(
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
      { isSeparator: false, element: 123, value: 123, path: '$::0' },
      { isSeparator: false, element: 'abc', value: 'abc', path: '$::1' },
      {
        isSeparator: false,
        element: <a>aaa</a>,
        value: '__GENERAL_ELE__',
        path: '$::2',
      },
      {
        isSeparator: false,
        element: <Native x="true" y={false} />,
        value: { x: 'true', y: false },
        path: '$::3',
      },
      {
        isSeparator: false,
        element: 'wrapped head',
        value: 'wrapped head',
        path: '$::4#Custom::0',
      },
      {
        isSeparator: false,
        element: <Native a="A" b={2} />,
        value: { a: 'A', b: 2 },
        path: '$::4#Custom::1',
      },
      {
        isSeparator: false,
        element: 'wrapped foot',
        value: 'wrapped foot',
        path: '$::4#Custom::2',
      },
    ]);

    expect(Custom.mock).toBeCalledTimes(1);
    expect(Custom.mock.calls[0].args).toEqual([{ a: 'A', b: 2 }, context]);

    expect(delegate.isNativeComponent.mock).toHaveBeenNthCalledWith(1, Native);
    expect(delegate.isNativeComponent.mock).toHaveBeenNthCalledWith(2, Custom);
    expect(delegate.isNativeComponent.mock).toHaveBeenNthCalledWith(3, Native);

    expect(delegate.renderGeneralElement.mock).toBeCalledTimes(1);
    const renderGeneralCall = delegate.renderGeneralElement.mock.calls[0];
    expect(renderGeneralCall.args[0]).toEqual(<a>aaa</a>);
    expect(typeof renderGeneralCall.args[1]).toBe('function');
    expect(renderGeneralCall.args[2]).toEqual(context);
    expect(renderGeneralCall.args[3]).toEqual('$::2');

    expect(delegate.renderNativeElement.mock).toBeCalledTimes(2);
    delegate.renderNativeElement.mock.calls.forEach((call, i) => {
      expect(call.args[0]).toEqual(
        [<Native x="true" y={false} />, <Native a="A" b={2} />][i]
      );
      expect(typeof call.args[1]).toBe('function');
      expect(call.args[2]).toEqual(context);
      expect(call.args[3]).toEqual(['$::3', '$::4#Custom::1'][i]);
    });
  });

  it('return null if no renderable element in the node', () => {
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
      expect(renderer.renderInner(node)).toBe(null);
    });
  });

  it('throw if Immediate included', () => {
    const renderer = new Renderer('Test', delegate);

    expect(() =>
      renderer.renderInner(
        <>
          foo<Machinat.Immediate />bar
        </>
      )
    ).toThrow(
      'separator element should not be placed beneath native or general element props'
    );
  });
});

describe('#renderRoot()', () => {
  it('works', () => {
    const afterCallback = () => Promise.resolve();
    const WrappedImmediate = () => <Machinat.Immediate after={afterCallback} />;
    const context = {};

    const renderer = new Renderer('Test', delegate);
    const rendered = renderer.renderRoot(
      <>
        {123}
        <Machinat.Immediate delay={1000} />
        abc
        <Machinat.Immediate after={afterCallback} />
        <b />
        <a>aaa</a>
        <WrappedImmediate />
        <Native x="true" y={false} />
        <Custom a="A" b={2} />
      </>,
      context
    );

    expect(rendered).toEqual([
      { isSeparator: false, element: 123, value: 123, path: '$::0' },
      {
        isSeparator: true,
        element: <Machinat.Immediate delay={1000} />,
        value: undefined,
        path: '$::1',
      },
      { isSeparator: false, element: 'abc', value: 'abc', path: '$::2' },
      {
        isSeparator: true,
        element: <Machinat.Immediate after={afterCallback} />,
        value: undefined,
        path: '$::3',
      },
      {
        isSeparator: false,
        element: <b />,
        value: '__GENERAL_ELE__',
        path: '$::4',
      },
      {
        isSeparator: false,
        element: <a>aaa</a>,
        value: '__GENERAL_ELE__',
        path: '$::5',
      },
      {
        isSeparator: true,
        element: <Machinat.Immediate after={afterCallback} />,
        value: undefined,
        path: '$::6#WrappedImmediate',
      },
      {
        isSeparator: false,
        element: <Native x="true" y={false} />,
        value: { x: 'true', y: false },
        path: '$::7',
      },
      {
        isSeparator: false,
        element: 'wrapped head',
        value: 'wrapped head',
        path: '$::8#Custom::0',
      },
      {
        isSeparator: false,
        element: <Native a="A" b={2} />,
        value: { a: 'A', b: 2 },
        path: '$::8#Custom::1',
      },
      {
        isSeparator: false,
        element: 'wrapped foot',
        value: 'wrapped foot',
        path: '$::8#Custom::2',
      },
    ]);

    expect(Custom.mock).toBeCalledTimes(1);
    expect(Custom.mock.calls[0].args).toEqual([{ a: 'A', b: 2 }, context]);

    const {
      isNativeComponent,
      renderGeneralElement,
      renderNativeElement,
    } = delegate;

    expect(isNativeComponent.mock.calls.map(c => c.args)).toEqual([
      [WrappedImmediate],
      [Native],
      [Custom],
      [Native],
    ]);

    expect(renderGeneralElement.mock).toBeCalledTimes(2);
    renderGeneralElement.mock.calls.forEach((call, i) => {
      expect(call.args[0]).toEqual([<b />, <a>aaa</a>][i]);
      expect(typeof call.args[1]).toBe('function');
      expect(call.args[2]).toEqual(context);
      expect(call.args[3]).toEqual(['$::4', '$::5'][i]);
    });

    expect(renderNativeElement.mock).toBeCalledTimes(2);
    renderNativeElement.mock.calls.forEach((call, i) => {
      expect(call.args[0]).toEqual(
        [<Native x="true" y={false} />, <Native a="A" b={2} />][i]
      );
      expect(typeof call.args[1]).toBe('function');
      expect(call.args[2]).toEqual(context);
      expect(call.args[3]).toEqual(['$::7', '$::8#Custom::1'][i]);
    });
  });

  it('return null if no renderable element in the node', () => {
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
      expect(renderer.renderRoot(node)).toBe(null);
    });
  });

  it('throws if non root native component passed', () => {
    const Root = () => {};
    Root.$$root = true;
    const NonRoot = () => {};

    delegate.isNativeComponent.mock.fake(C => C === Root || C === NonRoot);

    const renderer = new Renderer('Test', delegate);

    expect(() => renderer.renderRoot(<Root />, {})).not.toThrow();
    expect(() => renderer.renderRoot(<NonRoot />, {})).toThrow(
      'NonRoot is not legal root component'
    );
  });

  it('throw if non renderalbe passed', () => {
    const IllegalComponent = { foo: 'bar' };

    const renderer = new Renderer('Test', delegate);

    expect(() => renderer.renderRoot(<IllegalComponent />, {})).toThrow(
      "element type { foo: 'bar' } at poistion '$' is illegal"
    );
  });

  it('throw if native compoinent of non supported', () => {
    const AnotherPlatformNative = () => {};
    AnotherPlatformNative.$$native = Symbol('some other platform');

    const renderer = new Renderer('test', delegate);

    expect(() => renderer.renderRoot(<AnotherPlatformNative />, {})).toThrow(
      "component AnotherPlatformNative at '$' is not supported by test"
    );
  });
});
