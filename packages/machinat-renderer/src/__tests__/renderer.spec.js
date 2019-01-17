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
  renderGeneralElement: (element, render, payload, path) => [
    {
      isPause: false,
      asUnit: true,
      element,
      value: '_GENERAL_RENDERED_',
      path,
    },
  ],
  renderNativeElement: (element, render, payload, path) => [
    {
      isPause: false,
      asUnit: true,
      element,
      value: '_NATIVE_RENDERED_1_',
      path,
    },
    {
      isPause: false,
      asUnit: true,
      element,
      value: '_NATIVE_RENDERED_2_',
      path,
    },
  ],
});

afterEach(() => {
  Custom.mock.clear();
  delegate.mock.clear();
});

describe('#render()', () => {
  it('works', () => {
    const afterCallback = () => Promise.resolve();
    const WrappedPause = () => <Machinat.Pause after={afterCallback} />;
    const context = {};

    const renderer = new Renderer('Test', delegate);
    const rendered = renderer.render(
      <>
        {123}
        <Machinat.Pause delay={1000} />
        abc
        <Machinat.Pause after={afterCallback} />
        <b />
        <a>aaa</a>
        <WrappedPause />
        <Native x="true" y={false} />
        <Custom a="A" b={2} />
        {{ raw: 'object' }}
      </>,
      context
    );

    expect(rendered).toEqual([
      { isPause: false, asUnit: true, element: 123, value: 123, path: '$::0' },
      {
        isPause: true,
        asUnit: true,
        element: <Machinat.Pause delay={1000} />,
        value: undefined,
        path: '$::1',
      },
      {
        isPause: false,
        asUnit: true,
        element: 'abc',
        value: 'abc',
        path: '$::2',
      },
      {
        isPause: true,
        asUnit: true,
        element: <Machinat.Pause after={afterCallback} />,
        value: undefined,
        path: '$::3',
      },
      {
        isPause: false,
        asUnit: true,
        element: <b />,
        value: '_GENERAL_RENDERED_',
        path: '$::4',
      },
      {
        isPause: false,
        asUnit: true,
        element: <a>aaa</a>,
        value: '_GENERAL_RENDERED_',
        path: '$::5',
      },
      {
        isPause: true,
        asUnit: true,
        element: <Machinat.Pause after={afterCallback} />,
        value: undefined,
        path: '$::6#WrappedPause',
      },
      {
        isPause: false,
        asUnit: true,
        element: <Native x="true" y={false} />,
        value: '_NATIVE_RENDERED_1_',
        path: '$::7',
      },
      {
        isPause: false,
        asUnit: true,
        element: <Native x="true" y={false} />,
        value: '_NATIVE_RENDERED_2_',
        path: '$::7',
      },
      {
        isPause: false,
        asUnit: true,
        element: 'wrapped head',
        value: 'wrapped head',
        path: '$::8#Custom::0',
      },
      {
        isPause: false,
        asUnit: true,
        element: <Native a="A" b={2} />,
        value: '_NATIVE_RENDERED_1_',
        path: '$::8#Custom::1',
      },
      {
        isPause: false,
        asUnit: true,
        element: <Native a="A" b={2} />,
        value: '_NATIVE_RENDERED_2_',
        path: '$::8#Custom::1',
      },
      {
        isPause: false,
        asUnit: true,
        element: 'wrapped foot',
        value: 'wrapped foot',
        path: '$::8#Custom::2',
      },
      {
        isPause: false,
        asUnit: true,
        element: undefined,
        value: { raw: 'object' },
        path: '$::9',
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
      [WrappedPause],
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
      expect(renderer.render(node)).toBe(null);
    });
  });

  it('throws if non root native component passed', () => {
    const Root = () => {};
    Root.$$root = true;
    const NonRoot = () => {};

    delegate.isNativeComponent.mock.fake(C => C === Root || C === NonRoot);
    delegate.renderNativeElement.mock.fake(element => [
      element.type === Root
        ? {
            isPause: false,
            asUnit: true,
            element,
            value: '_ROOT_',
            path: 'xxx',
          }
        : {
            isPause: false,
            asUnit: false,
            element,
            value: '_NON_ROOT_',
            path: 'xxx',
          },
    ]);

    const renderer = new Renderer('test', delegate);

    expect(() => renderer.render(<Root />, {})).not.toThrow();
    expect(() =>
      renderer.render(<NonRoot />, {})
    ).toThrowErrorMatchingInlineSnapshot(
      `"<NonRoot /> is not a sending unit and should not be placed at top level of messages"`
    );
  });

  it('throw if non renderalbe passed', () => {
    const IllegalComponent = { foo: 'bar' };

    const renderer = new Renderer('test', delegate);

    expect(() =>
      renderer.render(<IllegalComponent />, {})
    ).toThrowErrorMatchingInlineSnapshot(
      `"element type { foo: 'bar' } at poistion '$' is illegal"`
    );
  });

  it('throw if native component not supported received', () => {
    const AnotherPlatformNative = () => {};
    AnotherPlatformNative.$$native = Symbol('some other platform');

    const renderer = new Renderer('test', delegate);

    expect(() =>
      renderer.render(<AnotherPlatformNative />, {})
    ).toThrowErrorMatchingInlineSnapshot(
      `"component AnotherPlatformNative at '$' is not supported by test"`
    );
  });
});
