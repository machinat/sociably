import moxy from 'moxy';
import Machinat, { SEGMENT_BREAK } from 'machinat';

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
    const Native = moxy(() => [
      '_NATIVE_RENDERED_1_',
      SEGMENT_BREAK,
      '_NATIVE_RENDERED_2_',
    ]);
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
        node: <Machinat.Pause />,
        value: undefined,
        path: '$xxx',
      },
      {
        isPause: false,
        asUnit: true,
        node: 'somewhere in container',
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
      true
    );

    expect(rendered).toEqual([
      {
        isPause: false,
        asUnit: true,
        node: 123,
        value: '123',
        path: '$::0',
      },
      {
        isPause: true,
        asUnit: true,
        node: <Machinat.Pause delay={1000} />,
        value: undefined,
        path: '$::1',
      },
      {
        isPause: false,
        asUnit: true,
        node: 'abc',
        value: 'abc',
        path: '$::2',
      },
      {
        isPause: true,
        asUnit: true,
        node: <Machinat.Pause after={afterCallback} />,
        value: undefined,
        path: '$::3',
      },
      {
        isPause: false,
        asUnit: true,
        node: <b />,
        value: '_GENERAL_RENDERED_',
        path: '$::4',
      },
      {
        isPause: false,
        asUnit: true,
        node: <a>aaa</a>,
        value: '_GENERAL_RENDERED_',
        path: '$::5',
      },
      {
        isPause: true,
        asUnit: true,
        node: <Machinat.Pause after={afterCallback} />,
        value: undefined,
        path: '$::6#WrappedPause',
      },
      {
        isPause: false,
        asUnit: true,
        node: <Native x="true" y={false} />,
        value: '_NATIVE_RENDERED_1_',
        path: '$::7',
      },
      {
        isPause: false,
        asUnit: true,
        node: <Native x="true" y={false} />,
        value: '_NATIVE_RENDERED_2_',
        path: '$::7',
      },
      {
        isPause: false,
        asUnit: true,
        node: 'wrapped head',
        value: 'wrapped head',
        path: '$::8#Custom::0',
      },
      {
        isPause: false,
        asUnit: true,
        node: <Native a="A" b={2} />,
        value: '_NATIVE_RENDERED_1_',
        path: '$::8#Custom::1',
      },
      {
        isPause: false,
        asUnit: true,
        node: <Native a="A" b={2} />,
        value: '_NATIVE_RENDERED_2_',
        path: '$::8#Custom::1',
      },
      {
        isPause: false,
        asUnit: true,
        node: 'wrapped foot',
        value: 'wrapped foot',
        path: '$::8#Custom::2',
      },
      {
        isPause: false,
        asUnit: true,
        node: undefined,
        value: { raw: 'object' },
        path: '$::9',
      },
      {
        isPause: true,
        asUnit: true,
        node: <Machinat.Pause />,
        value: undefined,
        path: '$xxx',
      },
      {
        isPause: false,
        asUnit: true,
        node: 'somewhere in container',
        value: 'somewhere over the rainbow',
        path: '$xxx',
      },
    ]);

    expect(Custom.mock).toBeCalledTimes(1);
    expect(Custom.mock.calls[0].args).toEqual([{ a: 'A', b: 2 }]);

    expect(renderGeneralElement.mock).toBeCalledTimes(2);
    renderGeneralElement.mock.calls.forEach((call, i) => {
      expect(call.args[0]).toEqual(!i ? {} : { children: 'aaa' });

      const renderInner = call.args[1];
      expect(renderInner([<a />, <b />], '.children')).toEqual([
        {
          isPause: false,
          asUnit: true,
          node: <a />,
          value: '_GENERAL_RENDERED_',
          path: `$::${!i ? '4#b' : '5#a'}.children:0`,
        },
        {
          isPause: false,
          asUnit: true,
          node: <b />,
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
          node: <a />,
          value: '_GENERAL_RENDERED_',
          path: `$::${!i ? '7' : '8#Custom::1'}#Native.children:0`,
        },
        {
          isPause: false,
          asUnit: true,
          node: <b />,
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
        node: <a />,
        value: '_GENERAL_RENDERED_',
        path: `$::10#Container.children:0`,
      },
      {
        isPause: false,
        asUnit: true,
        node: <b />,
        value: '_GENERAL_RENDERED_',
        path: `$::10#Container.children:1`,
      },
    ]);
  });

  it('return null if no renderable element in the node', () => {
    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    const None = () => null;
    const Break = () => [SEGMENT_BREAK];
    Break.$$native = NATIVE_TYPE;
    Break.$$unit = true;

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
      <Break />,
    ];

    emptyNodes.forEach(node => {
      expect(renderer.render(node, true)).toBe(null);
    });
  });

  it('filter SEGMENT_BREAK value at surface layer but not in deeper', () => {
    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    const Native = moxy(() => ['head', SEGMENT_BREAK, 'foot']);
    Native.mock.getter('name').fakeReturnValue('Native');
    Native.$$unit = true;
    Native.$$native = NATIVE_TYPE;

    expect(renderer.render(<Native />, true)).toEqual([
      {
        isPause: false,
        asUnit: true,
        node: <Native />,
        value: 'head',
        path: `$`,
      },
      {
        isPause: false,
        asUnit: true,
        node: <Native />,
        value: 'foot',
        path: `$`,
      },
    ]);

    let renderInner = Native.mock.calls[0].args[1];

    expect(renderInner(<Native />, '.children')).toEqual([
      {
        isPause: false,
        asUnit: true,
        node: <Native />,
        value: 'head',
        path: `$#Native.children`,
      },
      {
        isPause: false,
        asUnit: true,
        node: <Native />,
        value: SEGMENT_BREAK,
        path: `$#Native.children`,
      },
      {
        isPause: false,
        asUnit: true,
        node: <Native />,
        value: 'foot',
        path: `$#Native.children`,
      },
    ]);

    let containedSegments;
    const Container = moxy(
      // eslint-disable-next-line no-return-assign
      () =>
        (containedSegments = [
          {
            isPause: false,
            asUnit: true,
            node: <Container />,
            value: 'head',
            path: `$`,
          },
          {
            isPause: false,
            asUnit: true,
            node: <Container />,
            value: SEGMENT_BREAK,
            path: `$`,
          },
          {
            isPause: false,
            asUnit: true,
            node: <Container />,
            value: 'foot',
            path: `$`,
          },
        ])
    );
    Container.mock.getter('name').fakeReturnValue('Container');
    Container.$$container = true;
    Container.$$unit = true;
    Container.$$native = NATIVE_TYPE;

    expect(renderer.render(<Container />, '.children')).toEqual([
      containedSegments[0],
      containedSegments[2],
    ]);

    [, renderInner] = Native.mock.calls[1].args;

    expect(renderInner(<Container />, '.children')).toEqual(containedSegments);
  });

  it('throws if non unit native component placed at surface', () => {
    const Root = () => ['_ROOT_'];
    Root.$$unit = true;
    Root.$$native = NATIVE_TYPE;

    const NonRoot = () => ['_NON_ROOT_'];
    NonRoot.$$unit = false;
    NonRoot.$$native = NATIVE_TYPE;

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    expect(() => renderer.render(<Root />, true)).not.toThrow();
    expect(() =>
      renderer.render(<NonRoot />, true)
    ).toThrowErrorMatchingInlineSnapshot(
      `"<NonRoot /> is not a valid unit to be sent and should not be placed at surface level"`
    );
  });

  it('throw if general type not supported passed', () => {
    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    expect(() =>
      renderer.render(<invalid />, true)
    ).toThrowErrorMatchingInlineSnapshot(
      `"<invalid /> is not valid general element supported in Test"`
    );
  });

  it('throw if non renderalbe passed', () => {
    const IllegalComponent = { foo: 'bar' };

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    expect(() =>
      renderer.render(<IllegalComponent />, true)
    ).toThrowErrorMatchingInlineSnapshot(
      `"{\\"type\\":{\\"foo\\":\\"bar\\"},\\"props\\":{}} at poistion '$' is not valid element"`
    );
  });

  it('throw if native component of other platform received', () => {
    const AnotherPlatformNative = () => {};
    AnotherPlatformNative.$$native = Symbol('some other platform');

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    expect(() =>
      renderer.render(<AnotherPlatformNative />, true)
    ).toThrowErrorMatchingInlineSnapshot(
      `"native component <AnotherPlatformNative /> at '$' is not supported by Test"`
    );
  });

  it('throw if <Pause/> contained in non container native component', () => {
    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    const Native = (_, render) => {
      render(<Machinat.Pause />, '.children');
      return null;
    };
    Native.$$native = NATIVE_TYPE;
    Native.$$unit = true;

    expect(() =>
      renderer.render(<Native />, true)
    ).toThrowErrorMatchingInlineSnapshot(
      `"<Pause /> at $#Native.children is not allowed"`
    );

    const Container = (_, render) => {
      render(<Machinat.Pause />, '.children');
      return null;
    };
    Container.$$container = true;
    Container.$$unit = true;
    Container.$$native = NATIVE_TYPE;

    expect(() => renderer.render(<Container />, true)).not.toThrow();
  });

  it('throw if <Pause/> contained when allowPause set to false', () => {
    const Container = (_, render) => {
      render(<Machinat.Pause />, '.children');
      return null;
    };
    Container.$$container = true;
    Container.$$unit = true;
    Container.$$native = NATIVE_TYPE;

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    expect(() =>
      renderer.render(<Machinat.Pause />, false)
    ).toThrowErrorMatchingInlineSnapshot(`"<Pause /> at $ is not allowed"`);

    expect(() =>
      renderer.render(<Container />, false)
    ).toThrowErrorMatchingInlineSnapshot(
      `"<Pause /> at $#Container.children is not allowed"`
    );
  });
});
