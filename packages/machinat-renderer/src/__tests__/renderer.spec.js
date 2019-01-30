import moxy from 'moxy';

import Machinat from '../../../machinat';
import Renderer from '../renderer';

it('is a constructor', () => {
  expect(() => new Renderer('Test')).not.toThrow();
});

const NATIVE_TYPE = Symbol('test.native.type');

const renderGeneralElement = moxy(() => ['_GENERAL_RENDERED_']);

const generalElementDelegate = moxy({
  a: renderGeneralElement,
  b: renderGeneralElement,
});

afterEach(() => {
  generalElementDelegate.mock.clear();
});

describe('#render()', () => {
  it('works', () => {
    const Native = moxy(() => ['_NATIVE_RENDERED_1_', '_NATIVE_RENDERED_2_']);
    Native.mock.getter('name').fakeReturnValue('Native');
    Native.$$native = NATIVE_TYPE;
    Native.$$unit = true;
    Native.$$container = false;

    const Custom = moxy(props => (
      <>
        wrapped head
        <Native {...props} />
        wrapped foot
      </>
    ));
    Custom.mock.getter('name').fakeReturnValue('Custom');

    const Container = moxy(() => [
      {
        isPause: true,
        asUnit: true,
        element: <Machinat.Pause />,
        value: undefined,
        path: '$xxx',
      },
      {
        isPause: false,
        asUnit: true,
        element: 'somewhere in container',
        value: 'somewhere over the rainbow',
        path: '$xxx',
      },
    ]);
    Container.mock.getter('name').fakeReturnValue('Container');
    Container.$$native = NATIVE_TYPE;
    Container.$$unit = true;
    Container.$$container = true;

    const afterCallback = () => Promise.resolve();
    const WrappedPause = () => <Machinat.Pause after={afterCallback} />;
    const context = {};

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);
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
        <Container>somthing wrapped</Container>
      </>,
      context
    );

    expect(rendered).toEqual([
      {
        isPause: false,
        asUnit: true,
        element: 123,
        value: '123',
        path: '$::0',
      },
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
      {
        isPause: true,
        asUnit: true,
        element: <Machinat.Pause />,
        value: undefined,
        path: '$xxx',
      },
      {
        isPause: false,
        asUnit: true,
        element: 'somewhere in container',
        value: 'somewhere over the rainbow',
        path: '$xxx',
      },
    ]);

    expect(Custom.mock).toBeCalledTimes(1);
    expect(Custom.mock.calls[0].args).toEqual([{ a: 'A', b: 2 }, context]);

    expect(renderGeneralElement.mock).toBeCalledTimes(2);
    renderGeneralElement.mock.calls.forEach((call, i) => {
      expect(call.args[0]).toEqual(!i ? {} : { children: 'aaa' });

      const renderInner = call.args[1];
      expect(renderInner([<a />, <b />], '.children')).toEqual([
        {
          isPause: false,
          asUnit: true,
          element: <a />,
          value: '_GENERAL_RENDERED_',
          path: `$::${!i ? '4#b' : '5#a'}.children:0`,
        },
        {
          isPause: false,
          asUnit: true,
          element: <b />,
          value: '_GENERAL_RENDERED_',
          path: `$::${!i ? '4#b' : '5#a'}.children:1`,
        },
      ]);
    });

    expect(Native.mock).toBeCalledTimes(2);
    Native.mock.calls.forEach((call, i) => {
      expect(call.args[0]).toEqual(
        !i ? { x: 'true', y: false } : { a: 'A', b: 2 }
      );

      const renderInner = call.args[1];
      expect(renderInner([<a />, <b />], '.children')).toEqual([
        {
          isPause: false,
          asUnit: true,
          element: <a />,
          value: '_GENERAL_RENDERED_',
          path: `$::${!i ? '7' : '8#Custom::1'}#Native.children:0`,
        },
        {
          isPause: false,
          asUnit: true,
          element: <b />,
          value: '_GENERAL_RENDERED_',
          path: `$::${!i ? '7' : '8#Custom::1'}#Native.children:1`,
        },
      ]);
    });

    expect(Container.mock).toBeCalledTimes(1);
    const [containerProps, containerRenderInner] = Container.mock.calls[0].args;

    expect(containerProps).toEqual({ children: 'somthing wrapped' });
    expect(containerRenderInner([<a />, <b />], '.children')).toEqual([
      {
        isPause: false,
        asUnit: true,
        element: <a />,
        value: '_GENERAL_RENDERED_',
        path: `$::10#Container.children:0`,
      },
      {
        isPause: false,
        asUnit: true,
        element: <b />,
        value: '_GENERAL_RENDERED_',
        path: `$::10#Container.children:1`,
      },
    ]);
  });

  it('return null if no renderable element in the node', () => {
    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

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
    const Root = () => ['_ROOT_'];
    Root.$$unit = true;
    Root.$$native = NATIVE_TYPE;

    const NonRoot = () => ['_NON_ROOT_'];
    NonRoot.$$unit = false;
    NonRoot.$$native = NATIVE_TYPE;

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    expect(() => renderer.render(<Root />, {})).not.toThrow();
    expect(() =>
      renderer.render(<NonRoot />, {})
    ).toThrowErrorMatchingInlineSnapshot(
      `"<NonRoot /> is not a sending unit and should not be placed at top level of messages"`
    );
  });

  it('throw if general type not supported passed', () => {
    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    expect(() =>
      renderer.render(<invalid />, {})
    ).toThrowErrorMatchingInlineSnapshot(
      `"<invalid /> is not valid general element supported in Test"`
    );
  });

  it('throw if non renderalbe passed', () => {
    const IllegalComponent = { foo: 'bar' };

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    expect(() =>
      renderer.render(<IllegalComponent />, {})
    ).toThrowErrorMatchingInlineSnapshot(
      `"element type { foo: 'bar' } at poistion '$' is illegal"`
    );
  });

  it('throw if native component of other platform received', () => {
    const AnotherPlatformNative = () => {};
    AnotherPlatformNative.$$native = Symbol('some other platform');

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    expect(() =>
      renderer.render(<AnotherPlatformNative />, {})
    ).toThrowErrorMatchingInlineSnapshot(
      `"component AnotherPlatformNative at '$' is not supported by Test"`
    );
  });
});
