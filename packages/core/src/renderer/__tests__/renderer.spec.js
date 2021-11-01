import moxy, { Mock } from '@moxyjs/moxy';
import Machinat from '../..';
import { MACHINAT_NATIVE_TYPE } from '../../symbol';
import { makeContainer, makeInterface } from '../../service';

import Renderer from '../renderer';

const scope = moxy({
  injectContainer(containerFn) {
    return containerFn();
  },
});

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
  scope.mock.reset();
  generalElementDelegate.mock.clear();
});

describe('#render()', () => {
  it('works', async () => {
    const waitCallback = () => Promise.resolve();
    const WrappedPause = () => <Machinat.Pause wait={waitCallback} />;

    const sideEffect1 = moxy();
    const sideEffect2 = moxy();

    const NativeUnit1 = moxy(function NativeUnit1(node, path) {
      return Promise.resolve([{ type: 'unit', node, value: node.props, path }]);
    });
    NativeUnit1.$$typeof = MACHINAT_NATIVE_TYPE;
    NativeUnit1.$$platform = 'test';

    const Custom = moxy(function Custom(props) {
      return (
        <>
          wrapped head
          <NativeUnit1 {...props} />
          <Machinat.Raw value={{ wrapped: 'footer' }} />
          <Machinat.Thunk effect={sideEffect1} />
        </>
      );
    });

    const NativeUnit2 = moxy(function NativeUnit2(node, path) {
      return Promise.resolve([
        {
          type: 'pause',
          node: <Machinat.Pause />,
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
    NativeUnit2.$$typeof = MACHINAT_NATIVE_TYPE;
    NativeUnit2.$$platform = 'test';

    const message = (
      <>
        {123}
        abc
        <Machinat.Pause wait={waitCallback} />
        <a>AAA</a>
        <b>BBB</b>
        <WrappedPause />
        <NativeUnit1 x="true" y={false} />
        <Custom a="A" b={2} />
        <Machinat.Raw value={{ raw: 'object' }} />
        <NativeUnit2>somthing wrapped</NativeUnit2>
        <Machinat.Thunk effect={sideEffect2} />
      </>
    );

    const renderer = new Renderer('test', generalElementDelegate);
    const renderPromise = renderer.render(message, scope);

    await expect(renderPromise).resolves.toEqual([
      {
        type: 'text',
        node: message,
        value: '123abc',
        path: '$',
      },
      {
        type: 'pause',
        node: <Machinat.Pause wait={waitCallback} />,
        value: waitCallback,
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
        node: <Machinat.Pause wait={waitCallback} />,
        value: waitCallback,
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
        node: <Machinat.Raw value={{ wrapped: 'footer' }} />,
        value: { wrapped: 'footer' },
        path: '$::7#Custom::2',
      },
      {
        type: 'thunk',
        node: <Machinat.Thunk effect={sideEffect1} />,
        value: sideEffect1,
        path: '$::7#Custom::3',
      },
      {
        type: 'raw',
        node: <Machinat.Raw value={{ raw: 'object' }} />,
        value: { raw: 'object' },
        path: '$::8',
      },
      {
        type: 'pause',
        node: <Machinat.Pause />,
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
        node: <Machinat.Thunk effect={sideEffect2} />,
        value: sideEffect2,
        path: '$::10',
      },
    ]);

    expect(Custom.mock).toHaveBeenCalledTimes(1);
    expect(Custom.mock).toHaveBeenCalledWith(
      { a: 'A', b: 2 },
      { platform: 'test' }
    );

    expect(generalElementDelegate.mock).toHaveBeenCalledTimes(2);
    expect(generalElementDelegate.mock).toHaveBeenNthCalledWith(
      1,
      <a>AAA</a>,
      '$::3',
      expect.any(Function)
    );
    expect(generalElementDelegate.mock).toHaveBeenNthCalledWith(
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

    expect(NativeUnit1.mock).toHaveBeenCalledTimes(2);
    expect(NativeUnit1.mock).toHaveBeenNthCalledWith(
      1,
      <NativeUnit1 x="true" y={false} />,
      '$::6',
      expect.any(Function)
    );
    expect(NativeUnit1.mock).toHaveBeenNthCalledWith(
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

    expect(NativeUnit2.mock).toHaveBeenCalledTimes(1);
    expect(NativeUnit2.mock).toHaveBeenCalledWith(
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
    Vestibulum.$$typeof = MACHINAT_NATIVE_TYPE;
    Vestibulum.$$platform = 'test';

    const Unit = (node, path) => [
      { type: 'unit', value: { foo: 'bar' }, node, path },
    ];
    Unit.$$typeof = MACHINAT_NATIVE_TYPE;
    Unit.$$platform = 'test';

    const message = (
      <>
        Lorem ipsum <dolor /> {'sit amet,'}
        <br />
        <consectetur /> adipiscing <elit />. <Vestibulum /> interdum
        <Machinat.Pause />
        aliquam <justo /> ut <aliquam />.
        <Machinat.Raw value={{ baz: 'bae' }} />
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
        node: <Machinat.Pause />,
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
        node: <Machinat.Raw value={{ baz: 'bae' }} />,
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
    None.$$typeof = MACHINAT_NATIVE_TYPE;
    None.$$platform = 'test';

    const Break = () =>
      Promise.resolve([
        { type: 'break', node: <br />, value: undefined, path: '$:0' },
      ]);
    Break.$$typeof = MACHINAT_NATIVE_TYPE;
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
      await expect(renderer.render(node, scope)).resolves.toBe(null);
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
    Section.$$typeof = MACHINAT_NATIVE_TYPE;
    Section.$$platform = 'test';

    await expect(renderer.render(<Section />, scope)).resolves.toEqual([
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
    Unit.$$typeof = MACHINAT_NATIVE_TYPE;
    Unit.$$platform = 'test';

    const Part = () =>
      Promise.resolve([
        { type: 'part', node: <Part />, value: { root: false }, path: '$' },
      ]);
    Part.$$typeof = MACHINAT_NATIVE_TYPE;
    Part.$$platform = 'test';

    const renderer = new Renderer('test', generalElementDelegate);

    await expect(renderer.render(<Unit />, scope)).resolves.toEqual([
      { type: 'unit', node: <Unit />, value: { root: true }, path: '$' },
    ]);

    const [, , renderInner] = Unit.mock.calls[0].args;
    await expect(renderInner(<Part />)).resolves.toEqual([
      { type: 'part', node: <Part />, value: { root: false }, path: '$' },
    ]);

    await expect(
      renderer.render(<Part />, scope)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"<Part /> is a part element and should not be placed at surface level"`
    );
  });

  it('render container component and provide values from Machinat.Injection at render time', async () => {
    const FooService = makeInterface('Foo');
    const BarService = makeInterface('Bar');
    const BazService = makeInterface('Baz');

    const componentMock = new Mock();
    const Container = moxy(
      makeContainer({ deps: [FooService, BarService, BazService] })(
        function Container(foo, bar, baz) {
          return componentMock.proxify(({ n }) => (
            <Machinat.Raw
              value={`#${n} foo:${foo || 'x'} bar:${bar || 'x'} baz:${
                baz || 'x'
              }`}
            />
          ));
        }
      )
    );

    scope.injectContainer.mock.fake((containerFn, provisions) =>
      containerFn(
        provisions.get(FooService),
        provisions.get(BarService),
        provisions.get(BazService)
      )
    );

    const renderer = new Renderer('test', generalElementDelegate);

    const Native = ({ props: { children } }, path, render) =>
      render(children, '.children');
    Native.$$typeof = MACHINAT_NATIVE_TYPE;
    Native.$$platform = 'test';

    const Wrapper = ({ children }) => (
      <Machinat.Injection provide={BarService} value={1}>
        <Container n={3} />
        {children}
      </Machinat.Injection>
    );

    await expect(
      renderer.render(
        <>
          <Container n={1} />

          <Machinat.Injection provide={FooService} value={1}>
            <Container n={2} />

            <Wrapper>
              <Machinat.Injection provide={BazService} value={1}>
                <Container n={4} />

                <Native>
                  <Container n={5} />
                </Native>

                <Machinat.Injection provide={FooService} value={2}>
                  <Container n={6} />

                  <Machinat.Injection provide={BarService} value={2}>
                    <Machinat.Injection provide={BazService} value={2}>
                      <Container n={7} />
                    </Machinat.Injection>

                    <Container n={8} />
                  </Machinat.Injection>
                </Machinat.Injection>
              </Machinat.Injection>
            </Wrapper>

            <Container n={9} />
          </Machinat.Injection>

          <Container n={10} />
        </>,
        scope
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <Machinat.Raw
                  value="#1 foo:x bar:x baz:x"
                />,
                "path": "$::0#Container",
                "type": "raw",
                "value": "#1 foo:x bar:x baz:x",
              },
              Object {
                "node": <Machinat.Raw
                  value="#2 foo:1 bar:x baz:x"
                />,
                "path": "$::1.children:0#Container",
                "type": "raw",
                "value": "#2 foo:1 bar:x baz:x",
              },
              Object {
                "node": <Machinat.Raw
                  value="#3 foo:1 bar:1 baz:x"
                />,
                "path": "$::1.children:1#Wrapper.children:0#Container",
                "type": "raw",
                "value": "#3 foo:1 bar:1 baz:x",
              },
              Object {
                "node": <Machinat.Raw
                  value="#4 foo:1 bar:1 baz:1"
                />,
                "path": "$::1.children:1#Wrapper.children:1.children:0#Container",
                "type": "raw",
                "value": "#4 foo:1 bar:1 baz:1",
              },
              Object {
                "node": <Machinat.Raw
                  value="#5 foo:1 bar:1 baz:1"
                />,
                "path": "$::1.children:1#Wrapper.children:1.children:1#Native.children#Container",
                "type": "raw",
                "value": "#5 foo:1 bar:1 baz:1",
              },
              Object {
                "node": <Machinat.Raw
                  value="#6 foo:2 bar:1 baz:1"
                />,
                "path": "$::1.children:1#Wrapper.children:1.children:2.children:0#Container",
                "type": "raw",
                "value": "#6 foo:2 bar:1 baz:1",
              },
              Object {
                "node": <Machinat.Raw
                  value="#7 foo:2 bar:2 baz:2"
                />,
                "path": "$::1.children:1#Wrapper.children:1.children:2.children:1.children:0.children#Container",
                "type": "raw",
                "value": "#7 foo:2 bar:2 baz:2",
              },
              Object {
                "node": <Machinat.Raw
                  value="#8 foo:2 bar:2 baz:1"
                />,
                "path": "$::1.children:1#Wrapper.children:1.children:2.children:1.children:1#Container",
                "type": "raw",
                "value": "#8 foo:2 bar:2 baz:1",
              },
              Object {
                "node": <Machinat.Raw
                  value="#9 foo:1 bar:x baz:x"
                />,
                "path": "$::1.children:2#Container",
                "type": "raw",
                "value": "#9 foo:1 bar:x baz:x",
              },
              Object {
                "node": <Machinat.Raw
                  value="#10 foo:x bar:x baz:x"
                />,
                "path": "$::2#Container",
                "type": "raw",
                "value": "#10 foo:x bar:x baz:x",
              },
            ]
          `);

    expect(scope.injectContainer.mock).toHaveBeenCalledTimes(10);
    expect(scope.injectContainer.mock).toHaveBeenCalledWith(
      Container,
      expect.any(Map)
    );

    expect(Container.mock).toHaveBeenCalledTimes(10);
    expect(componentMock).toHaveBeenCalledTimes(10);
    expect(componentMock).toHaveBeenCalledWith(
      { n: expect.any(Number) },
      { platform: 'test' }
    );
  });

  it('reject when functional component fail', async () => {
    const FunctionalComponent = () => {
      throw new Error('オラオラオラ');
    };

    const renderer = new Renderer('test', generalElementDelegate);
    expect(renderer.render(<FunctionalComponent />, scope)).rejects.toThrow(
      'オラオラオラ'
    );
  });

  it('reject when container component fail', async () => {
    const ContainerFailWhenInject = makeContainer({ deps: [] })(() => {
      throw new Error('無駄無駄無駄');
    });

    const renderer = new Renderer('test', generalElementDelegate);

    await expect(
      renderer.render(<ContainerFailWhenInject />, scope)
    ).rejects.toThrow(new Error('無駄無駄無駄'));

    const ContainerFailAtComponent = makeContainer({ deps: [] })(
      () => async () => {
        throw new Error('オラオラオラ');
      }
    );

    await expect(
      renderer.render(<ContainerFailAtComponent />, scope)
    ).rejects.toThrow(new Error('オラオラオラ'));
  });

  it('throw if generalElementDelegate throw', async () => {
    const renderer = new Renderer('test', generalElementDelegate);
    generalElementDelegate.mock.fake(async () => {
      throw new Error('<invalid /> is not good');
    });

    await expect(
      renderer.render(<invalid />, scope)
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"<invalid /> is not good"`);
  });

  it('throw if non renderalbe passed', async () => {
    const IllegalComponent = { foo: 'bar' };

    const renderer = new Renderer('test', generalElementDelegate);

    await expect(
      renderer.render(<IllegalComponent />, scope)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"[object Object] at poistion '$' is not valid element type"`
    );
  });

  it('throw if native component of other platform received', async () => {
    const AnotherPlatformUnit = () => {};
    AnotherPlatformUnit.$$typeof = MACHINAT_NATIVE_TYPE;
    AnotherPlatformUnit.$$native = Symbol('some other platform');

    const renderer = new Renderer('test', generalElementDelegate);

    await expect(
      renderer.render(<AnotherPlatformUnit />, scope)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"native component <AnotherPlatformUnit /> at '$' is not supported by test"`
    );
  });

  test('resnder <Pause/> with wait and delay props', async () => {
    jest.useFakeTimers();
    const renderer = new Renderer('test', generalElementDelegate);
    const waitFn = moxy(() => Promise.resolve());

    const segments = await renderer.render(
      <>
        <Machinat.Pause />
        <Machinat.Pause wait={waitFn} />
        <Machinat.Pause delay={1000} />
        <Machinat.Pause wait={waitFn} delay={1000} />
      </>,
      scope
    );

    expect(segments).toEqual([
      {
        type: 'pause',
        node: <Machinat.Pause />,
        value: null,
        path: '$::0',
      },
      {
        type: 'pause',
        node: <Machinat.Pause wait={waitFn} />,
        value: waitFn,
        path: '$::1',
      },
      {
        type: 'pause',
        node: <Machinat.Pause delay={1000} />,
        value: expect.any(Function),
        path: '$::2',
      },
      {
        type: 'pause',
        node: <Machinat.Pause delay={1000} wait={waitFn} />,
        value: expect.any(Function),
        path: '$::3',
      },
    ]);

    const spy = moxy();

    // delay prop only
    segments[2].value().then(spy);
    await new Promise(process.nextTick);
    expect(spy.mock).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    await new Promise(process.nextTick);
    expect(spy.mock).toHaveBeenCalledTimes(1);

    // delay + wait prop only
    segments[3].value().then(spy);
    expect(waitFn.mock).toHaveBeenCalledTimes(1);
    await new Promise(process.nextTick);
    expect(spy.mock).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    await new Promise(process.nextTick);
    expect(spy.mock).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});
