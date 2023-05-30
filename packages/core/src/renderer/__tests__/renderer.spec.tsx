import { moxy, Mock } from '@moxyjs/moxy';
import Sociably from '../../index.js';
import { SOCIABLY_NATIVE_TYPE } from '../../symbol.js';
import {
  createEmptyScope,
  serviceContainer,
  serviceInterface,
} from '../../service/index.js';
import Renderer from '../renderer.js';

const generalElementDelegate = moxy((node, path) =>
  Promise.resolve(
    node.type === 'a'
      ? [
          { type: 'text', node, value: `${node.props.children}1`, path },
          { type: 'break', node, value: undefined, path },
          { type: 'text', node, value: `${node.props.children}2`, path },
        ]
      : [{ type: 'unit', node, value: { letters: node.props.children }, path }]
  )
);

beforeEach(() => {
  generalElementDelegate.mock.clear();
});

describe('.render()', () => {
  it('works', async () => {
    const delayCallback = () => Promise.resolve();
    const WrappedPause = () => <Sociably.Pause delay={delayCallback} />;

    const sideEffect1 = moxy();
    const sideEffect2 = moxy();

    const NativeUnit1 = moxy(function NativeUnit1(node, path) {
      return Promise.resolve([{ type: 'unit', node, value: node.props, path }]);
    });
    NativeUnit1.$$typeof = SOCIABLY_NATIVE_TYPE;
    NativeUnit1.$$platform = 'test';

    const Custom = moxy(function Custom(props) {
      return (
        <>
          wrapped head
          <NativeUnit1 {...props} />
          <Sociably.Raw value={{ wrapped: 'footer' }} />
          <Sociably.Thunk effect={sideEffect1} />
        </>
      );
    });

    const NativeUnit2 = moxy(function NativeUnit2(node, path) {
      return Promise.resolve([
        {
          type: 'pause',
          node: <Sociably.Pause />,
          value: undefined,
          path: `${path}.propA`,
        },
        {
          type: 'text',
          node: 'somewhere in container',
          value: 'somewhere over the rainbow',
          path: `${path}.children`,
        },
        {
          type: 'unit',
          node: <c />,
          value: { rendered: 'by other' },
          path: `${path}.propB`,
        },
      ]);
    });
    NativeUnit2.$$typeof = SOCIABLY_NATIVE_TYPE;
    NativeUnit2.$$platform = 'test';

    const message = (
      <>
        {123}
        abc
        <Sociably.Pause delay={delayCallback} />
        <a>AAA</a>
        <b>BBB</b>
        <WrappedPause />
        <NativeUnit1 x="true" y={false} />
        <Custom a="A" b={2} />
        <Sociably.Raw value={{ raw: 'object' }} />
        <NativeUnit2>somthing wrapped</NativeUnit2>
        <Sociably.Thunk effect={sideEffect2} />
      </>
    );

    const renderer = new Renderer('test', generalElementDelegate);
    const renderPromise = renderer.render(message, null);

    await expect(renderPromise).resolves.toEqual([
      {
        type: 'text',
        node: message,
        value: '123abc',
        path: '$',
      },
      {
        type: 'pause',
        node: <Sociably.Pause delay={delayCallback} />,
        value: delayCallback,
        path: '$::2',
      },
      {
        type: 'text',
        node: <a>AAA</a>,
        value: 'AAA1',
        path: '$::3',
      },
      {
        type: 'text',
        node: <a>AAA</a>,
        value: 'AAA2',
        path: '$::3',
      },
      {
        type: 'unit',
        node: <b>BBB</b>,
        value: { letters: 'BBB' },
        path: '$::4',
      },
      {
        type: 'pause',
        node: <Sociably.Pause delay={delayCallback} />,
        value: delayCallback,
        path: '$::5#WrappedPause',
      },
      {
        type: 'unit',
        node: <NativeUnit1 x="true" y={false} />,
        value: { x: 'true', y: false },
        path: '$::6',
      },
      {
        type: 'text',
        node: 'wrapped head',
        value: 'wrapped head',
        path: '$::7#Custom::0',
      },
      {
        type: 'unit',
        node: <NativeUnit1 a="A" b={2} />,
        value: { a: 'A', b: 2 },
        path: '$::7#Custom::1',
      },
      {
        type: 'raw',
        node: <Sociably.Raw value={{ wrapped: 'footer' }} />,
        value: { wrapped: 'footer' },
        path: '$::7#Custom::2',
      },
      {
        type: 'thunk',
        node: <Sociably.Thunk effect={sideEffect1} />,
        value: sideEffect1,
        path: '$::7#Custom::3',
      },
      {
        type: 'raw',
        node: <Sociably.Raw value={{ raw: 'object' }} />,
        value: { raw: 'object' },
        path: '$::8',
      },
      {
        type: 'pause',
        node: <Sociably.Pause />,
        value: undefined,
        path: '$::9.propA',
      },
      {
        type: 'text',
        node: 'somewhere in container',
        value: 'somewhere over the rainbow',
        path: '$::9.children',
      },
      {
        type: 'unit',
        node: <c />,
        value: { rendered: 'by other' },
        path: '$::9.propB',
      },
      {
        type: 'thunk',
        node: <Sociably.Thunk effect={sideEffect2} />,
        value: sideEffect2,
        path: '$::10',
      },
    ]);

    expect(Custom).toHaveBeenCalledTimes(1);
    expect(Custom).toHaveBeenCalledWith(
      { a: 'A', b: 2 },
      { platform: 'test', path: '$::7' }
    );

    expect(generalElementDelegate).toHaveBeenCalledTimes(2);
    expect(generalElementDelegate).toHaveBeenNthCalledWith(
      1,
      <a>AAA</a>,
      '$::3',
      expect.any(Function)
    );
    expect(generalElementDelegate).toHaveBeenNthCalledWith(
      2,
      <b>BBB</b>,
      '$::4',
      expect.any(Function)
    );

    let [, , renderInner] = generalElementDelegate.mock.calls[0].args;
    await expect(renderInner(['foo'], '.children')).resolves.toEqual([
      { type: 'text', node: 'foo', value: 'foo', path: `$::3#a.children:0` },
    ]);

    [, , renderInner] = generalElementDelegate.mock.calls[1].args;
    await expect(renderInner(['foo'], '.children')).resolves.toEqual([
      { type: 'text', node: 'foo', value: 'foo', path: `$::4#b.children:0` },
    ]);

    expect(NativeUnit1).toHaveBeenCalledTimes(2);
    expect(NativeUnit1).toHaveBeenNthCalledWith(
      1,
      <NativeUnit1 x="true" y={false} />,
      '$::6',
      expect.any(Function)
    );
    expect(NativeUnit1).toHaveBeenNthCalledWith(
      2,
      <NativeUnit1 a="A" b={2} />,
      '$::7#Custom::1',
      expect.any(Function)
    );

    [, , renderInner] = NativeUnit1.mock.calls[0].args;
    await expect(renderInner(['bar'], '.children')).resolves.toEqual([
      {
        type: 'text',
        node: 'bar',
        value: 'bar',
        path: `$::6#NativeUnit1.children:0`,
      },
    ]);
    [, , renderInner] = NativeUnit1.mock.calls[1].args;
    await expect(renderInner(['bar'], '.children')).resolves.toEqual([
      {
        type: 'text',
        node: 'bar',
        value: 'bar',
        path: `$::7#Custom::1#NativeUnit1.children:0`,
      },
    ]);

    expect(NativeUnit2).toHaveBeenCalledTimes(1);
    expect(NativeUnit2).toHaveBeenCalledWith(
      <NativeUnit2>somthing wrapped</NativeUnit2>,
      '$::9',
      expect.any(Function)
    );

    [, , renderInner] = NativeUnit2.mock.calls[0].args;
    await expect(renderInner(['baz'], '.children')).resolves.toEqual([
      {
        type: 'text',
        node: 'baz',
        value: 'baz',
        path: `$::9#NativeUnit2.children:0`,
      },
    ]);
  });

  it('join continuous text segments', async () => {
    const renderer = new Renderer('test', (node, path) => [
      node.type === 'br'
        ? { type: 'break', node, path }
        : { type: 'text', value: node.type, node, path },
    ]);

    const Vestibulum = (node, path) => [
      { type: 'text', value: 'Vestibulum', node, path },
    ];
    Vestibulum.$$typeof = SOCIABLY_NATIVE_TYPE;
    Vestibulum.$$platform = 'test';

    const Unit = (node, path) => [
      { type: 'unit', value: { foo: 'bar' }, node, path },
    ];
    Unit.$$typeof = SOCIABLY_NATIVE_TYPE;
    Unit.$$platform = 'test';

    const message = (
      <>
        Lorem ipsum <dolor /> {'sit amet,'}
        <br />
        <consectetur /> adipiscing <elit />. <Vestibulum /> interdum
        <Sociably.Pause />
        aliquam <justo /> ut <aliquam />.
        <Sociably.Raw value={{ baz: 'bae' }} />
        Donec <nec_odio /> auctor, <ultricies />
        <Unit />
        <elit /> at, <pretium /> erat.
      </>
    );

    await expect(renderer.render(message)).resolves.toEqual([
      {
        type: 'text',
        value: 'Lorem ipsum dolor sit amet,',
        node: message,
        path: '$',
      },
      {
        type: 'text',
        value: 'consectetur adipiscing elit. Vestibulum interdum',
        node: message,
        path: '$',
      },
      {
        type: 'pause',
        value: null,
        node: <Sociably.Pause />,
        path: '$::11',
      },
      {
        type: 'text',
        value: 'aliquam justo ut aliquam.',
        node: message,
        path: '$',
      },
      {
        type: 'raw',
        value: { baz: 'bae' },
        node: <Sociably.Raw value={{ baz: 'bae' }} />,
        path: '$::17',
      },
      {
        type: 'text',
        value: 'Donec nec_odio auctor, ultricies',
        node: message,
        path: '$',
      },
      {
        type: 'unit',
        value: { foo: 'bar' },
        node: <Unit />,
        path: '$::22',
      },
      {
        type: 'text',
        value: 'elit at, pretium erat.',
        node: message,
        path: '$',
      },
    ]);
  });

  it('return null if no renderable element in the node', async () => {
    const renderer = new Renderer('test', generalElementDelegate);

    const None = () => Promise.resolve(null);
    None.$$typeof = SOCIABLY_NATIVE_TYPE;
    None.$$platform = 'test';

    const Break = () =>
      Promise.resolve([
        { type: 'break', node: <br />, value: undefined, path: '$:0' },
      ]);
    Break.$$typeof = SOCIABLY_NATIVE_TYPE;
    Break.$$platform = 'test';

    const Empty = () => (
      <>
        {undefined}
        <None />
        {null}
        <Break />
        {[]}
      </>
    );

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
      <Empty />,
    ];

    for (const node of emptyNodes) {
      // eslint-disable-next-line no-await-in-loop
      await expect(renderer.render(node, null)).resolves.toBe(null);
    }
  });

  it('filter break segment at outside of native component, keep it at inside', async () => {
    const renderer = new Renderer('test', generalElementDelegate);

    const Section = moxy(() =>
      Promise.resolve([
        { type: 'text', node: 'head', value: 'head', path: '$' },
        { type: 'break', node: <br />, value: undefined, path: '$' },
        { type: 'text', node: 'foot', value: 'foot', path: '$' },
      ])
    );
    Section.mock.getter('name').fakeReturnValue('Section');
    Section.$$typeof = SOCIABLY_NATIVE_TYPE;
    Section.$$platform = 'test';

    await expect(renderer.render(<Section />, null)).resolves.toEqual([
      { type: 'text', node: 'head', value: 'head', path: '$' },
      { type: 'text', node: 'foot', value: 'foot', path: '$' },
    ]);

    const renderInner = Section.mock.calls[0].args[2];

    await expect(renderInner(<Section />, '.children')).resolves.toEqual([
      { type: 'text', node: 'head', value: 'head', path: '$' },
      { type: 'break', node: <br />, value: undefined, path: '$' },
      { type: 'text', node: 'foot', value: 'foot', path: '$' },
    ]);
  });

  it('render part segment but throws if placed at surface', async () => {
    const Unit = moxy(function Unit(node) {
      return Promise.resolve([
        { type: 'unit', node, value: { root: true }, path: '$' },
      ]);
    });
    Unit.$$typeof = SOCIABLY_NATIVE_TYPE;
    Unit.$$platform = 'test';

    const Part = () =>
      Promise.resolve([
        { type: 'part', node: <Part />, value: { root: false }, path: '$' },
      ]);
    Part.$$typeof = SOCIABLY_NATIVE_TYPE;
    Part.$$platform = 'test';

    const renderer = new Renderer('test', generalElementDelegate);

    await expect(renderer.render(<Unit />, null)).resolves.toEqual([
      { type: 'unit', node: <Unit />, value: { root: true }, path: '$' },
    ]);

    const [, , renderInner] = Unit.mock.calls[0].args;
    await expect(renderInner(<Part />)).resolves.toEqual([
      { type: 'part', node: <Part />, value: { root: false }, path: '$' },
    ]);

    await expect(
      renderer.render(<Part />, null)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"<Part /> is a part element and should not be placed at surface level"`
    );
  });

  it('provide services with Sociably.Provider', async () => {
    const FooI = serviceInterface('Foo');
    const BarI = serviceInterface('Bar');
    const BazI = serviceInterface('Baz');
    const scope = moxy(createEmptyScope());

    const componentMock = new Mock();
    const Container = moxy(
      serviceContainer({
        deps: [
          { require: FooI, optional: true },
          { require: BarI, optional: true },
          { require: BazI, optional: true },
        ],
      })(function Container(foo, bar, baz) {
        return componentMock.proxify(({ n }) => (
          <Sociably.Raw
            value={`#${n} foo:${foo || 'x'} bar:${bar || 'x'} baz:${
              baz || 'x'
            }`}
          />
        ));
      })
    );

    const renderer = new Renderer('test', generalElementDelegate);

    const Native = ({ props: { children } }, path, render) =>
      render(children, '.children');
    Native.$$typeof = SOCIABLY_NATIVE_TYPE;
    Native.$$platform = 'test';

    const Wrapper = ({ children }) => (
      <Sociably.Provider provide={BarI} value={1}>
        <Container n={3} />
        {children}
      </Sociably.Provider>
    );

    await expect(
      renderer.render(
        <>
          <Container n={1} />

          <Sociably.Provider provide={FooI} value={1}>
            <Container n={2} />

            <Wrapper>
              <Sociably.Provider provide={BazI} value={1}>
                <Container n={4} />

                <Native>
                  <Container n={5} />
                </Native>

                <Sociably.Provider provide={FooI} value={2}>
                  <Container n={6} />

                  <Sociably.Provider provide={BarI} value={2}>
                    <Sociably.Provider provide={BazI} value={2}>
                      <Container n={7} />
                    </Sociably.Provider>

                    <Container n={8} />
                  </Sociably.Provider>
                </Sociably.Provider>
              </Sociably.Provider>
            </Wrapper>

            <Container n={9} />
          </Sociably.Provider>

          <Container n={10} />
        </>,
        scope
      )
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "node": <Sociably.Raw
            value="#1 foo:x bar:x baz:x"
          />,
          "path": "$::0#Container",
          "type": "raw",
          "value": "#1 foo:x bar:x baz:x",
        },
        {
          "node": <Sociably.Raw
            value="#2 foo:1 bar:x baz:x"
          />,
          "path": "$::1.children:0#Container",
          "type": "raw",
          "value": "#2 foo:1 bar:x baz:x",
        },
        {
          "node": <Sociably.Raw
            value="#3 foo:1 bar:1 baz:x"
          />,
          "path": "$::1.children:1#Wrapper.children:0#Container",
          "type": "raw",
          "value": "#3 foo:1 bar:1 baz:x",
        },
        {
          "node": <Sociably.Raw
            value="#4 foo:1 bar:1 baz:1"
          />,
          "path": "$::1.children:1#Wrapper.children:1.children:0#Container",
          "type": "raw",
          "value": "#4 foo:1 bar:1 baz:1",
        },
        {
          "node": <Sociably.Raw
            value="#5 foo:1 bar:1 baz:1"
          />,
          "path": "$::1.children:1#Wrapper.children:1.children:1#Native.children#Container",
          "type": "raw",
          "value": "#5 foo:1 bar:1 baz:1",
        },
        {
          "node": <Sociably.Raw
            value="#6 foo:2 bar:1 baz:1"
          />,
          "path": "$::1.children:1#Wrapper.children:1.children:2.children:0#Container",
          "type": "raw",
          "value": "#6 foo:2 bar:1 baz:1",
        },
        {
          "node": <Sociably.Raw
            value="#7 foo:2 bar:2 baz:2"
          />,
          "path": "$::1.children:1#Wrapper.children:1.children:2.children:1.children:0.children#Container",
          "type": "raw",
          "value": "#7 foo:2 bar:2 baz:2",
        },
        {
          "node": <Sociably.Raw
            value="#8 foo:2 bar:2 baz:1"
          />,
          "path": "$::1.children:1#Wrapper.children:1.children:2.children:1.children:1#Container",
          "type": "raw",
          "value": "#8 foo:2 bar:2 baz:1",
        },
        {
          "node": <Sociably.Raw
            value="#9 foo:1 bar:x baz:x"
          />,
          "path": "$::1.children:2#Container",
          "type": "raw",
          "value": "#9 foo:1 bar:x baz:x",
        },
        {
          "node": <Sociably.Raw
            value="#10 foo:x bar:x baz:x"
          />,
          "path": "$::2#Container",
          "type": "raw",
          "value": "#10 foo:x bar:x baz:x",
        },
      ]
    `);

    expect(scope.injectContainer).toHaveBeenCalledTimes(10);
    expect(scope.injectContainer).toHaveBeenCalledWith(
      Container,
      expect.any(Map)
    );

    expect(Container.$$factory).toHaveBeenCalledTimes(10);
    expect(componentMock).toHaveBeenCalledTimes(10);
    expect(componentMock).toHaveBeenCalledWith(
      { n: expect.any(Number) },
      { platform: 'test', path: expect.any(String) }
    );
  });

  test('with runtime provisions', async () => {
    const FooI = serviceInterface('Foo');
    const BarI = serviceInterface('Bar');
    const BazI = serviceInterface('Baz');
    const renderer = new Renderer('test', generalElementDelegate);

    const Container = moxy(
      serviceContainer({
        deps: [
          { require: FooI, optional: true },
          { require: BarI, optional: true },
          { require: BazI, optional: true },
        ],
      })(function Container(foo, bar, baz) {
        return () => `foo:${foo || 'x'} bar:${bar || 'x'} baz:${baz || 'x'}`;
      })
    );

    await expect(
      renderer.render(<Container />, null, [
        [FooI, 1],
        [BarI, 2],
      ])
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "node": "foo:1 bar:2 baz:x",
          "path": "$#Container",
          "type": "text",
          "value": "foo:1 bar:2 baz:x",
        },
      ]
    `);

    expect(Container.$$factory).toHaveBeenCalledTimes(1);
    expect(Container.$$factory).toHaveBeenCalledWith(1, 2, null);
  });

  it('reject when functional component fail', async () => {
    const FunctionalComponent = () => {
      throw new Error('オラオラオラ');
    };

    const renderer = new Renderer('test', generalElementDelegate);
    expect(renderer.render(<FunctionalComponent />, null)).rejects.toThrow(
      'オラオラオラ'
    );
  });

  it('reject when container component fail', async () => {
    const ContainerFailWhenInject = serviceContainer({ deps: [] })(() => {
      throw new Error('無駄無駄無駄');
    });

    const renderer = new Renderer('test', generalElementDelegate);

    await expect(
      renderer.render(<ContainerFailWhenInject />, null)
    ).rejects.toThrow(new Error('無駄無駄無駄'));

    const ContainerFailAtComponent = serviceContainer({ deps: [] })(
      () => async () => {
        throw new Error('オラオラオラ');
      }
    );

    await expect(
      renderer.render(<ContainerFailAtComponent />, null)
    ).rejects.toThrow(new Error('オラオラオラ'));
  });

  it('throw if generalElementDelegate throw', async () => {
    const renderer = new Renderer('test', generalElementDelegate);
    generalElementDelegate.mock.fake(async () => {
      throw new Error('<invalid /> is not good');
    });

    await expect(
      renderer.render(<invalid />, null)
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"<invalid /> is not good"`);
  });

  it('throw if non renderalbe passed', async () => {
    const IllegalComponent = { foo: 'bar' };

    const renderer = new Renderer('test', generalElementDelegate);

    await expect(
      renderer.render(<IllegalComponent />, null)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"[object Object] at poistion '$' is not valid element type"`
    );
  });

  it('throw if native component of other platform received', async () => {
    const AnotherPlatformUnit = () => {};
    AnotherPlatformUnit.$$typeof = SOCIABLY_NATIVE_TYPE;
    AnotherPlatformUnit.$$native = Symbol('some other platform');

    const renderer = new Renderer('test', generalElementDelegate);

    await expect(
      renderer.render(<AnotherPlatformUnit />, null)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"native component <AnotherPlatformUnit /> at '$' is not supported by test"`
    );
  });

  test('render <Pause/> with time/delay props', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] });

    const renderer = new Renderer('test', generalElementDelegate);
    const delayFn = moxy(() => Promise.resolve());

    const segments = await renderer.render(
      <>
        <Sociably.Pause />
        <Sociably.Pause delay={delayFn} />
        <Sociably.Pause time={1000} />
        <Sociably.Pause time={1000} delay={delayFn} />
      </>,
      null
    );

    expect(segments).toEqual([
      {
        type: 'pause',
        node: <Sociably.Pause />,
        value: null,
        path: '$::0',
      },
      {
        type: 'pause',
        node: <Sociably.Pause delay={delayFn} />,
        value: delayFn,
        path: '$::1',
      },
      {
        type: 'pause',
        node: <Sociably.Pause time={1000} />,
        value: expect.any(Function),
        path: '$::2',
      },
      {
        type: 'pause',
        node: <Sociably.Pause time={1000} delay={delayFn} />,
        value: expect.any(Function),
        path: '$::3',
      },
    ]);

    const spy = moxy();

    // time prop only
    segments[2].value().then(spy);
    await new Promise(process.nextTick);
    expect(spy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    await new Promise(process.nextTick);
    expect(spy).toHaveBeenCalledTimes(1);

    // time + delay prop only
    segments[3].value().then(spy);
    expect(delayFn).toHaveBeenCalledTimes(1);
    await new Promise(process.nextTick);
    expect(spy).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    await new Promise(process.nextTick);
    expect(spy).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});
