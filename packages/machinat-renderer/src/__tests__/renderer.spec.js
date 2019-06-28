import moxy from 'moxy';
import Machinat, { SEGMENT_BREAK, MACHINAT_NATIVE_TYPE } from 'machinat';

import Renderer from '../renderer';

it('is a constructor', () => {
  expect(() => new Renderer('Test')).not.toThrow();
});

const NATIVE_TYPE = Symbol('test.native.type');

const generalElementDelegate = moxy((node, _, path) =>
  Promise.resolve(
    node.type === 'a'
      ? [
          { type: 'text', node, value: `${node.props.children}1`, path },
          { type: 'break', node, value: SEGMENT_BREAK, path },
          { type: 'text', node, value: `${node.props.children}2`, path },
        ]
      : [{ type: 'unit', node, value: { letters: node.props.children }, path }]
  )
);

afterEach(() => {
  generalElementDelegate.mock.clear();
});

describe('#render()', () => {
  it('works', async () => {
    const Unit = moxy((node, _, path) =>
      Promise.resolve([{ type: 'unit', node, value: node.props, path }])
    );
    Unit.mock.getter('name').fakeReturnValue('Unit');
    Unit.$$native = NATIVE_TYPE;

    const Custom = moxy(props => (
      <>
        wrapped head
        <Unit {...props} />
        wrapped foot
      </>
    ));
    Custom.mock.getter('name').fakeReturnValue('Custom');

    const Container = moxy(() =>
      Promise.resolve([
        {
          type: 'pause',
          node: <Machinat.Pause />,
          value: undefined,
          path: '$xxx',
        },
        {
          type: 'text',
          node: 'somewhere in container',
          value: 'somewhere over the rainbow',
          path: '$xxx',
        },
        {
          type: 'unit',
          node: <c />,
          value: { rendered: 'by other' },
          path: '$xxx',
        },
      ])
    );
    Container.mock.getter('name').fakeReturnValue('Container');
    Container.$$native = NATIVE_TYPE;

    const untilCallback = () => Promise.resolve();
    const WrappedPause = () => <Machinat.Pause until={untilCallback} />;

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);
    const renderPromise = renderer.render(
      <>
        {123}
        <Machinat.Pause delay={1000} />
        abc
        <Machinat.Pause until={untilCallback} />
        <a>AAA</a>
        <b>BBB</b>
        <WrappedPause />
        <Unit x="true" y={false} />
        <Custom a="A" b={2} />
        {{ raw: 'object' }}
        <Container>somthing wrapped</Container>
      </>,
      true
    );

    await expect(renderPromise).resolves.toEqual([
      {
        type: 'text',
        node: 123,
        value: '123',
        path: '$::0',
      },
      {
        type: 'pause',
        node: <Machinat.Pause delay={1000} />,
        value: undefined,
        path: '$::1',
      },
      {
        type: 'text',
        node: 'abc',
        value: 'abc',
        path: '$::2',
      },
      {
        type: 'pause',
        node: <Machinat.Pause until={untilCallback} />,
        value: undefined,
        path: '$::3',
      },
      {
        type: 'text',
        node: <a>AAA</a>,
        value: 'AAA1',
        path: '$::4',
      },
      {
        type: 'text',
        node: <a>AAA</a>,
        value: 'AAA2',
        path: '$::4',
      },
      {
        type: 'unit',
        node: <b>BBB</b>,
        value: { letters: 'BBB' },
        path: '$::5',
      },
      {
        type: 'pause',
        node: <Machinat.Pause until={untilCallback} />,
        value: undefined,
        path: '$::6#WrappedPause',
      },
      {
        type: 'unit',
        node: <Unit x="true" y={false} />,
        value: { x: 'true', y: false },
        path: '$::7',
      },
      {
        type: 'text',
        node: 'wrapped head',
        value: 'wrapped head',
        path: '$::8#Custom::0',
      },
      {
        type: 'unit',
        node: <Unit a="A" b={2} />,
        value: { a: 'A', b: 2 },
        path: '$::8#Custom::1',
      },
      {
        type: 'text',
        node: 'wrapped foot',
        value: 'wrapped foot',
        path: '$::8#Custom::2',
      },
      {
        type: 'raw',
        node: undefined,
        value: { raw: 'object' },
        path: '$::9',
      },
      {
        type: 'pause',
        node: <Machinat.Pause />,
        value: undefined,
        path: '$xxx',
      },
      {
        type: 'text',
        node: 'somewhere in container',
        value: 'somewhere over the rainbow',
        path: '$xxx',
      },
      {
        type: 'unit',
        node: <c />,
        value: { rendered: 'by other' },
        path: '$xxx',
      },
    ]);

    expect(Custom.mock).toHaveBeenCalledTimes(1);
    expect(Custom.mock.calls[0].args).toEqual([{ a: 'A', b: 2 }]);

    expect(generalElementDelegate.mock).toHaveBeenCalledTimes(2);
    expect(generalElementDelegate.mock).toHaveBeenNthCalledWith(
      1,
      <a>AAA</a>,
      expect.any(Function),
      '$::4'
    );
    expect(generalElementDelegate.mock).toHaveBeenNthCalledWith(
      2,
      <b>BBB</b>,
      expect.any(Function),
      '$::5'
    );

    let [, renderInner] = generalElementDelegate.mock.calls[0].args;
    await expect(renderInner(['foo'], '.children')).resolves.toEqual([
      { type: 'text', node: 'foo', value: 'foo', path: `$::4#a.children:0` },
    ]);

    [, renderInner] = generalElementDelegate.mock.calls[1].args;
    await expect(renderInner(['foo'], '.children')).resolves.toEqual([
      { type: 'text', node: 'foo', value: 'foo', path: `$::5#b.children:0` },
    ]);

    expect(Unit.mock).toHaveBeenCalledTimes(2);
    expect(Unit.mock).toHaveBeenNthCalledWith(
      1,
      <Unit x="true" y={false} />,
      expect.any(Function),
      '$::7'
    );
    expect(Unit.mock).toHaveBeenNthCalledWith(
      2,
      <Unit a="A" b={2} />,
      expect.any(Function),
      '$::8#Custom::1'
    );

    [, renderInner] = Unit.mock.calls[0].args;
    await expect(renderInner(['bar'], '.children')).resolves.toEqual([
      { type: 'text', node: 'bar', value: 'bar', path: `$::7#Unit.children:0` },
    ]);
    [, renderInner] = Unit.mock.calls[1].args;
    await expect(renderInner(['bar'], '.children')).resolves.toEqual([
      {
        type: 'text',
        node: 'bar',
        value: 'bar',
        path: `$::8#Custom::1#Unit.children:0`,
      },
    ]);

    expect(Container.mock).toHaveBeenCalledTimes(1);
    expect(Container.mock).toHaveBeenCalledWith(
      <Container>somthing wrapped</Container>,
      expect.any(Function),
      '$::10'
    );

    [, renderInner] = Container.mock.calls[0].args;
    await expect(renderInner(['baz'], '.children')).resolves.toEqual([
      {
        type: 'text',
        node: 'baz',
        value: 'baz',
        path: `$::10#Container.children:0`,
      },
    ]);
  });

  it('return null if no renderable element in the node', async () => {
    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    const None = () => Promise.resolve(null);
    None.$$native = NATIVE_TYPE;
    None.$$unit = true;

    const Break = () =>
      Promise.resolve([
        { type: 'break', node: <br />, value: undefined, path: '$:0' },
      ]);
    Break.$$native = NATIVE_TYPE;
    Break.$$unit = true;

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
      await expect(renderer.render(node, true)).resolves.toBe(null);
    }
  });

  it('filter SEGMENT_BREAK value at surface layer but not in deeper', async () => {
    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    const Section = moxy(() =>
      Promise.resolve([
        { type: 'text', node: 'head', value: 'head', path: '$' },
        { type: 'break', node: <br />, value: SEGMENT_BREAK, path: '$' },
        { type: 'text', node: 'foot', value: 'foot', path: '$' },
      ])
    );
    Section.mock.getter('name').fakeReturnValue('Section');
    Section.$$native = NATIVE_TYPE;

    await expect(renderer.render(<Section />, true)).resolves.toEqual([
      { type: 'text', node: 'head', value: 'head', path: '$' },
      { type: 'text', node: 'foot', value: 'foot', path: '$' },
    ]);

    const renderInner = Section.mock.calls[0].args[1];

    await expect(renderInner(<Section />, '.children')).resolves.toEqual([
      { type: 'text', node: 'head', value: 'head', path: '$' },
      { type: 'break', node: <br />, value: SEGMENT_BREAK, path: '$' },
      { type: 'text', node: 'foot', value: 'foot', path: '$' },
    ]);
  });

  it('throws if non unit native component placed at surface', async () => {
    const Unit = () =>
      Promise.resolve([
        { type: 'unit', node: <Unit />, value: { root: true }, path: '$' },
      ]);
    Unit.$$native = NATIVE_TYPE;

    const Part = () =>
      Promise.resolve([
        { type: 'part', node: <Part />, value: { root: false }, path: '$' },
      ]);
    Part.$$native = NATIVE_TYPE;

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    await expect(renderer.render(<Unit />, true)).resolves.toEqual([
      { type: 'unit', node: <Unit />, value: { root: true }, path: '$' },
    ]);
    await expect(
      renderer.render(<Part />, true)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"<Part /> is a part element and should not be placed at surface level"`
    );
  });

  it('provide and consume service', async () => {
    const mockReturnOpt = { mockReturnValue: true };
    const serveFoo = moxy(() => async () => 'FOO', mockReturnOpt);
    const serveBar = moxy(() => async () => 'BAR', mockReturnOpt);
    const serveBaz = moxy(() => async () => 'BAZ', mockReturnOpt);
    const ServiceFoo = Machinat.createService(serveFoo);
    const ServiceBar = Machinat.createService(serveBar);
    const ServiceBaz = Machinat.createService(serveBaz);

    const identity = x => x;
    const fooSpy = moxy(identity);
    const barSpy = moxy(identity);
    const bazSpy = moxy(identity);

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    const Native = ({ props: { children } }, render) =>
      render(children, '.children');
    Native.$$native = NATIVE_TYPE;

    const Wrapper = (
      { children } // eslint-disable-line react/prop-types
    ) => (
      <ServiceBar.Provider provide="B">
        <ServiceFoo.Consumer consume="X">{fooSpy}</ServiceFoo.Consumer>
        {children}
      </ServiceBar.Provider>
    );

    await expect(
      renderer.render(
        <ServiceFoo.Provider provide="A">
          <Wrapper>
            <ServiceBaz.Provider provide="C">
              <ServiceBar.Consumer consume="Y">{barSpy}</ServiceBar.Consumer>
              <Native>
                <ServiceBaz.Consumer consume="Z">{bazSpy}</ServiceBaz.Consumer>
              </Native>
              <ServiceFoo.Consumer consume="x">
                {x => (
                  <ServiceBar.Consumer consume="y">
                    {y => (
                      <ServiceBaz.Consumer consume="z">
                        {z => x + y + z}
                      </ServiceBaz.Consumer>
                    )}
                  </ServiceBar.Consumer>
                )}
              </ServiceFoo.Consumer>
            </ServiceBaz.Provider>
          </Wrapper>
        </ServiceFoo.Provider>,
        true
      )
    ).resolves.toMatchInlineSnapshot(`
Array [
  Object {
    "node": "FOO",
    "path": "$.children#Wrapper.children:0#consume",
    "type": "text",
    "value": "FOO",
  },
  Object {
    "node": "BAR",
    "path": "$.children#Wrapper.children:1.children:0#consume",
    "type": "text",
    "value": "BAR",
  },
  Object {
    "node": "BAZ",
    "path": "$.children#Wrapper.children:1.children:1#Native.children#consume",
    "type": "text",
    "value": "BAZ",
  },
  Object {
    "node": "FOOBARBAZ",
    "path": "$.children#Wrapper.children:1.children:2#consume#consume#consume",
    "type": "text",
    "value": "FOOBARBAZ",
  },
]
`);

    expect(fooSpy.mock).toHaveBeenCalledTimes(1);
    expect(fooSpy.mock).toHaveBeenCalledWith('FOO');
    expect(barSpy.mock).toHaveBeenCalledTimes(1);
    expect(barSpy.mock).toHaveBeenCalledWith('BAR');
    expect(bazSpy.mock).toHaveBeenCalledTimes(1);
    expect(bazSpy.mock).toHaveBeenCalledWith('BAZ');

    expect(serveFoo.mock).toHaveBeenCalledTimes(1);
    expect(serveFoo.mock).toHaveBeenCalledWith('A');
    const provideFoo = serveFoo.mock.calls[0].result;
    expect(provideFoo.mock).toHaveBeenCalledTimes(2);
    expect(provideFoo.mock).toHaveBeenCalledWith('X');
    expect(provideFoo.mock).toHaveBeenCalledWith('x');

    expect(serveBar.mock).toHaveBeenCalledTimes(1);
    expect(serveBar.mock).toHaveBeenCalledWith('B');
    const provideBar = serveBar.mock.calls[0].result;
    expect(provideBar.mock).toHaveBeenCalledTimes(2);
    expect(provideBar.mock).toHaveBeenCalledWith('Y');
    expect(provideBar.mock).toHaveBeenCalledWith('y');

    expect(serveBaz.mock).toHaveBeenCalledTimes(1);
    expect(serveBaz.mock).toHaveBeenCalledWith('C');
    const provideBaz = serveBaz.mock.calls[0].result;
    expect(provideBaz.mock).toHaveBeenCalledTimes(2);
    expect(provideBaz.mock).toHaveBeenCalledWith('Z');
    expect(provideBaz.mock).toHaveBeenCalledWith('z');
  });

  test('without/with/overwrite service provided', async () => {
    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    const mockReturnOpt = { mockReturnValue: true };
    const serveFoo = moxy(x => async () => `FOO${x || ''}`, mockReturnOpt);
    const serveBar = moxy(x => async () => `BAR${x || ''}`, mockReturnOpt);
    const ServiceFoo = Machinat.createService(serveFoo);
    const ServiceBar = Machinat.createService(serveBar);

    const spy = moxy(x => x);
    await expect(
      renderer.render(
        <>
          <ServiceFoo.Consumer>{spy}</ServiceFoo.Consumer>
          <ServiceBar.Consumer>{spy}</ServiceBar.Consumer>

          <ServiceFoo.Provider provide="O">
            <ServiceBar.Provider provide="O">
              <ServiceFoo.Consumer>{spy}</ServiceFoo.Consumer>
              <ServiceBar.Consumer>{spy}</ServiceBar.Consumer>

              <ServiceFoo.Provider provide="L">
                <ServiceBar.Provider provide="E">
                  <ServiceFoo.Consumer>{spy}</ServiceFoo.Consumer>
                  <ServiceBar.Consumer>{spy}</ServiceBar.Consumer>

                  <ServiceFoo.Provider provide="H">
                    <ServiceFoo.Consumer>{spy}</ServiceFoo.Consumer>
                    <ServiceBar.Consumer>{spy}</ServiceBar.Consumer>
                  </ServiceFoo.Provider>
                </ServiceBar.Provider>
              </ServiceFoo.Provider>
            </ServiceBar.Provider>
          </ServiceFoo.Provider>

          <ServiceFoo.Consumer>{spy}</ServiceFoo.Consumer>
          <ServiceBar.Consumer>{spy}</ServiceBar.Consumer>
        </>,
        true
      )
    ).resolves.toMatchInlineSnapshot(`
Array [
  Object {
    "node": "FOO",
    "path": "$::0#consume",
    "type": "text",
    "value": "FOO",
  },
  Object {
    "node": "BAR",
    "path": "$::1#consume",
    "type": "text",
    "value": "BAR",
  },
  Object {
    "node": "FOOO",
    "path": "$::2.children.children:0#consume",
    "type": "text",
    "value": "FOOO",
  },
  Object {
    "node": "BARO",
    "path": "$::2.children.children:1#consume",
    "type": "text",
    "value": "BARO",
  },
  Object {
    "node": "FOOL",
    "path": "$::2.children.children:2.children.children:0#consume",
    "type": "text",
    "value": "FOOL",
  },
  Object {
    "node": "BARE",
    "path": "$::2.children.children:2.children.children:1#consume",
    "type": "text",
    "value": "BARE",
  },
  Object {
    "node": "FOOH",
    "path": "$::2.children.children:2.children.children:2.children:0#consume",
    "type": "text",
    "value": "FOOH",
  },
  Object {
    "node": "BARE",
    "path": "$::2.children.children:2.children.children:2.children:1#consume",
    "type": "text",
    "value": "BARE",
  },
  Object {
    "node": "FOO",
    "path": "$::3#consume",
    "type": "text",
    "value": "FOO",
  },
  Object {
    "node": "BAR",
    "path": "$::4#consume",
    "type": "text",
    "value": "BAR",
  },
]
`);

    expect(serveFoo.mock).toHaveBeenCalledTimes(5);
    expect(serveFoo.mock).toHaveBeenNthCalledWith(1, ...[]);
    expect(serveFoo.mock.calls[0].result.mock).toHaveBeenCalledTimes(1);
    expect(serveFoo.mock).toHaveBeenNthCalledWith(2, 'O');
    expect(serveFoo.mock.calls[1].result.mock).toHaveBeenCalledTimes(1);
    expect(serveFoo.mock).toHaveBeenNthCalledWith(3, 'L');
    expect(serveFoo.mock.calls[2].result.mock).toHaveBeenCalledTimes(1);
    expect(serveFoo.mock).toHaveBeenNthCalledWith(4, 'H');
    expect(serveFoo.mock.calls[3].result.mock).toHaveBeenCalledTimes(1);
    expect(serveFoo.mock).toHaveBeenNthCalledWith(5, ...[]);
    expect(serveFoo.mock.calls[4].result.mock).toHaveBeenCalledTimes(1);

    expect(serveBar.mock).toHaveBeenCalledTimes(4);
    expect(serveBar.mock).toHaveBeenNthCalledWith(1, ...[]);
    expect(serveBar.mock.calls[0].result.mock).toHaveBeenCalledTimes(1);
    expect(serveBar.mock).toHaveBeenNthCalledWith(2, 'O');
    expect(serveBar.mock.calls[1].result.mock).toHaveBeenCalledTimes(1);
    expect(serveBar.mock).toHaveBeenNthCalledWith(3, 'E');
    expect(serveBar.mock.calls[2].result.mock).toHaveBeenCalledTimes(2);
    expect(serveBar.mock).toHaveBeenNthCalledWith(4, ...[]);
    expect(serveBar.mock.calls[3].result.mock).toHaveBeenCalledTimes(1);

    expect(spy.mock).toHaveBeenCalledTimes(10);
  });

  it('reject when service reject', async () => {
    const ServiceFailWhenProvide = Machinat.createService(() => {
      throw new Error('オラオラオラ');
    });

    const ServiceFailWhenConsume = Machinat.createService(() => async () => {
      throw new Error('無駄無駄無駄');
    });

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    await expect(
      renderer.render(
        <ServiceFailWhenProvide.Provider>stand</ServiceFailWhenProvide.Provider>
      )
    ).rejects.toThrow(new Error('オラオラオラ'));

    const stand = moxy();
    await expect(
      renderer.render(
        <ServiceFailWhenConsume.Provider>
          <ServiceFailWhenConsume.Consumer>
            {stand}
          </ServiceFailWhenConsume.Consumer>
        </ServiceFailWhenConsume.Provider>
      )
    ).rejects.toThrow(new Error('無駄無駄無駄'));

    expect(stand.mock).not.toHaveBeenCalled();
  });

  it('throw if generalElementDelegate throw', async () => {
    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);
    generalElementDelegate.mock.fake(async () => {
      throw new Error('<invalid /> is not good');
    });

    await expect(
      renderer.render(<invalid />, true)
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"<invalid /> is not good"`);
  });

  it('throw if non renderalbe passed', async () => {
    const IllegalComponent = { foo: 'bar' };

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    await expect(
      renderer.render(<IllegalComponent />, true)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"{\\"type\\":{\\"foo\\":\\"bar\\"},\\"props\\":{}} at poistion '$' is not valid element"`
    );
  });

  it('throw if native component of other platform received', async () => {
    const AnotherPlatformUnit = () => {};
    AnotherPlatformUnit.$$typeof = MACHINAT_NATIVE_TYPE;
    AnotherPlatformUnit.$$native = Symbol('some other platform');

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    await expect(
      renderer.render(<AnotherPlatformUnit />, true)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"native component <AnotherPlatformUnit /> at '$' is not supported by Test"`
    );
  });

  it('throw if <Pause/> contained when allowPause set to false', async () => {
    const Container = async (_, render) => {
      await render(<Machinat.Pause />, '.children');
      return null;
    };
    Container.$$container = true;
    Container.$$unit = true;
    Container.$$native = NATIVE_TYPE;

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    await expect(
      renderer.render(<Machinat.Pause />, false)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"<Pause /> at $ is not allowed"`
    );

    await expect(
      renderer.render(<Container />, false)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"<Pause /> at $#Container.children is not allowed"`
    );
  });
});
