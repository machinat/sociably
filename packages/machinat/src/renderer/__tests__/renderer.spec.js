import moxy, { Mock } from 'moxy';
import Machinat from '../..';
import { MACHINAT_NATIVE_TYPE } from '../../symbol';
import { inject } from '../../service';

import Renderer from '../renderer';

const scope = moxy({
  executeContainer(container) {
    return container();
  },
});

const generalElementDelegate = moxy((node, _, path) =>
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
    const untilCallback = () => Promise.resolve();
    const WrappedPause = () => <Machinat.Pause until={untilCallback} />;

    const sideEffect1 = moxy();
    const sideEffect2 = moxy();

    const NativeUnit1 = moxy(function NativeUnit1(node, _, path) {
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

    const NativeUnit2 = moxy(function NativeUnit2(node, _, path) {
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

    const renderer = new Renderer('test', generalElementDelegate);
    const renderPromise = renderer.render(
      scope,
      <>
        {123}
        abc
        <Machinat.Pause until={untilCallback} />
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

    await expect(renderPromise).resolves.toEqual([
      {
        type: 'text',
        node: 123,
        value: '123',
        path: '$::0',
      },
      {
        type: 'text',
        node: 'abc',
        value: 'abc',
        path: '$::1',
      },
      {
        type: 'pause',
        node: <Machinat.Pause until={untilCallback} />,
        value: untilCallback,
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
        node: <Machinat.Pause until={untilCallback} />,
        value: untilCallback,
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
    expect(Custom.mock.calls[0].args).toEqual([{ a: 'A', b: 2 }]);

    expect(generalElementDelegate.mock).toHaveBeenCalledTimes(2);
    expect(generalElementDelegate.mock).toHaveBeenNthCalledWith(
      1,
      <a>AAA</a>,
      expect.any(Function),
      '$::3'
    );
    expect(generalElementDelegate.mock).toHaveBeenNthCalledWith(
      2,
      <b>BBB</b>,
      expect.any(Function),
      '$::4'
    );

    let [, renderInner] = generalElementDelegate.mock.calls[0].args;
    await expect(renderInner(['foo'], '.children')).resolves.toEqual([
      { type: 'text', node: 'foo', value: 'foo', path: `$::3#a.children:0` },
    ]);

    [, renderInner] = generalElementDelegate.mock.calls[1].args;
    await expect(renderInner(['foo'], '.children')).resolves.toEqual([
      { type: 'text', node: 'foo', value: 'foo', path: `$::4#b.children:0` },
    ]);

    expect(NativeUnit1.mock).toHaveBeenCalledTimes(2);
    expect(NativeUnit1.mock).toHaveBeenNthCalledWith(
      1,
      <NativeUnit1 x="true" y={false} />,
      expect.any(Function),
      '$::6'
    );
    expect(NativeUnit1.mock).toHaveBeenNthCalledWith(
      2,
      <NativeUnit1 a="A" b={2} />,
      expect.any(Function),
      '$::7#Custom::1'
    );

    [, renderInner] = NativeUnit1.mock.calls[0].args;
    await expect(renderInner(['bar'], '.children')).resolves.toEqual([
      {
        type: 'text',
        node: 'bar',
        value: 'bar',
        path: `$::6#NativeUnit1.children:0`,
      },
    ]);
    [, renderInner] = NativeUnit1.mock.calls[1].args;
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
      expect.any(Function),
      '$::9'
    );

    [, renderInner] = NativeUnit2.mock.calls[0].args;
    await expect(renderInner(['baz'], '.children')).resolves.toEqual([
      {
        type: 'text',
        node: 'baz',
        value: 'baz',
        path: `$::9#NativeUnit2.children:0`,
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
      await expect(renderer.render(scope, node)).resolves.toBe(null);
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

    await expect(renderer.render(scope, <Section />)).resolves.toEqual([
      { type: 'text', node: 'head', value: 'head', path: '$' },
      { type: 'text', node: 'foot', value: 'foot', path: '$' },
    ]);

    const renderInner = Section.mock.calls[0].args[1];

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

    await expect(renderer.render(scope, <Unit />)).resolves.toEqual([
      { type: 'unit', node: <Unit />, value: { root: true }, path: '$' },
    ]);

    const [, renderInner] = Unit.mock.calls[0].args;
    await expect(renderInner(<Part />)).resolves.toEqual([
      { type: 'part', node: <Part />, value: { root: false }, path: '$' },
    ]);

    await expect(
      renderer.render(scope, <Part />)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"<Part /> is a part element and should not be placed at surface level"`
    );
  });

  it('render container component and provide values from Machinat.Provider at render time', async () => {
    const FooService = moxy();
    const BarService = moxy();
    const BazService = moxy();

    const componentMock = new Mock();
    const Container = moxy(
      inject({ deps: [FooService, BarService, BazService] })(function Container(
        foo,
        bar,
        baz
      ) {
        return componentMock.proxify(
          ({ n }) =>
            `#${n} foo:${foo || 'x'} bar:${bar || 'x'} baz:${baz || 'x'}`
        );
      })
    );

    scope.executeContainer.mock.fake((container, provisions) =>
      container(
        provisions.get(FooService),
        provisions.get(BarService),
        provisions.get(BazService)
      )
    );

    const renderer = new Renderer('test', generalElementDelegate);

    const Native = ({ props: { children } }, render) =>
      render(children, '.children');
    Native.$$typeof = MACHINAT_NATIVE_TYPE;
    Native.$$platform = 'test';

    const Wrapper = ({ children }) => (
      <Machinat.Provider provide={BarService} value={1}>
        <Container n={3} />
        {children}
      </Machinat.Provider>
    );

    await expect(
      renderer.render(
        scope,
        <>
          <Container n={1} />

          <Machinat.Provider provide={FooService} value={1}>
            <Container n={2} />

            <Wrapper>
              <Machinat.Provider provide={BazService} value={1}>
                <Container n={4} />

                <Native>
                  <Container n={5} />
                </Native>

                <Machinat.Provider provide={FooService} value={2}>
                  <Container n={6} />

                  <Machinat.Provider provide={BarService} value={2}>
                    <Machinat.Provider provide={BazService} value={2}>
                      <Container n={7} />
                    </Machinat.Provider>

                    <Container n={8} />
                  </Machinat.Provider>
                </Machinat.Provider>
              </Machinat.Provider>
            </Wrapper>

            <Container n={9} />
          </Machinat.Provider>

          <Container n={10} />
        </>
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": "#1 foo:x bar:x baz:x",
                "path": "$::0#Container",
                "type": "text",
                "value": "#1 foo:x bar:x baz:x",
              },
              Object {
                "node": "#2 foo:1 bar:x baz:x",
                "path": "$::1.children:0#Container",
                "type": "text",
                "value": "#2 foo:1 bar:x baz:x",
              },
              Object {
                "node": "#3 foo:1 bar:1 baz:x",
                "path": "$::1.children:1#Wrapper.children:0#Container",
                "type": "text",
                "value": "#3 foo:1 bar:1 baz:x",
              },
              Object {
                "node": "#4 foo:1 bar:1 baz:1",
                "path": "$::1.children:1#Wrapper.children:1.children:0#Container",
                "type": "text",
                "value": "#4 foo:1 bar:1 baz:1",
              },
              Object {
                "node": "#5 foo:1 bar:1 baz:1",
                "path": "$::1.children:1#Wrapper.children:1.children:1#Native.children#Container",
                "type": "text",
                "value": "#5 foo:1 bar:1 baz:1",
              },
              Object {
                "node": "#6 foo:2 bar:1 baz:1",
                "path": "$::1.children:1#Wrapper.children:1.children:2.children:0#Container",
                "type": "text",
                "value": "#6 foo:2 bar:1 baz:1",
              },
              Object {
                "node": "#7 foo:2 bar:2 baz:2",
                "path": "$::1.children:1#Wrapper.children:1.children:2.children:1.children:0.children#Container",
                "type": "text",
                "value": "#7 foo:2 bar:2 baz:2",
              },
              Object {
                "node": "#8 foo:2 bar:2 baz:1",
                "path": "$::1.children:1#Wrapper.children:1.children:2.children:1.children:1#Container",
                "type": "text",
                "value": "#8 foo:2 bar:2 baz:1",
              },
              Object {
                "node": "#9 foo:1 bar:x baz:x",
                "path": "$::1.children:2#Container",
                "type": "text",
                "value": "#9 foo:1 bar:x baz:x",
              },
              Object {
                "node": "#10 foo:x bar:x baz:x",
                "path": "$::2#Container",
                "type": "text",
                "value": "#10 foo:x bar:x baz:x",
              },
            ]
          `);

    expect(scope.executeContainer.mock).toHaveBeenCalledTimes(10);
    expect(scope.executeContainer.mock).toHaveBeenCalledWith(
      Container,
      expect.any(Map)
    );

    expect(Container.mock).toHaveBeenCalledTimes(10);
    expect(componentMock).toHaveBeenCalledTimes(10);
    expect(componentMock).toHaveBeenCalledWith({ n: expect.any(Number) });
  });

  it('reject when functional component fail', async () => {
    const FunctionalComponent = () => {
      throw new Error('オラオラオラ');
    };

    const renderer = new Renderer('test', generalElementDelegate);
    expect(renderer.render(scope, <FunctionalComponent />)).rejects.toThrow(
      'オラオラオラ'
    );
  });

  it('reject when container component fail', async () => {
    const ContainerFailWhenInject = inject({ deps: [] })(() => {
      throw new Error('無駄無駄無駄');
    });

    const renderer = new Renderer('test', generalElementDelegate);

    await expect(
      renderer.render(scope, <ContainerFailWhenInject />)
    ).rejects.toThrow(new Error('無駄無駄無駄'));

    const ContainerFailAtComponent = inject({ deps: [] })(() => async () => {
      throw new Error('オラオラオラ');
    });

    await expect(
      renderer.render(scope, <ContainerFailAtComponent />)
    ).rejects.toThrow(new Error('オラオラオラ'));
  });

  it('throw if generalElementDelegate throw', async () => {
    const renderer = new Renderer('test', generalElementDelegate);
    generalElementDelegate.mock.fake(async () => {
      throw new Error('<invalid /> is not good');
    });

    await expect(
      renderer.render(scope, <invalid />)
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"<invalid /> is not good"`);
  });

  it('throw if non renderalbe passed', async () => {
    const IllegalComponent = { foo: 'bar' };

    const renderer = new Renderer('test', generalElementDelegate);

    await expect(
      renderer.render(scope, <IllegalComponent />)
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
      renderer.render(scope, <AnotherPlatformUnit />)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"native component <AnotherPlatformUnit /> at '$' is not supported by test"`
    );
  });
});
