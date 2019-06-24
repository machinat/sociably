import moxy from 'moxy';
import Machinat, { SEGMENT_BREAK, MACHINAT_NATIVE_TYPE } from 'machinat';

import Renderer from '../renderer';

it('is a constructor', () => {
  expect(() => new Renderer('Test')).not.toThrow();
});

const NATIVE_TYPE = Symbol('test.native.type');

const generalElementDelegate = moxy((node, _, path) =>
  node.type === 'a'
    ? [
        { type: 'text', node, value: `${node.props.children}1`, path },
        { type: 'break', node, value: SEGMENT_BREAK, path },
        { type: 'text', node, value: `${node.props.children}2`, path },
      ]
    : [{ type: 'unit', node, value: { letters: node.props.children }, path }]
);

afterEach(() => {
  generalElementDelegate.mock.clear();
});

describe('#render()', () => {
  it('works', () => {
    const Unit = moxy((node, _, path) => [
      { type: 'unit', node, value: node.props, path },
    ]);
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

    const Container = moxy(() => [
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
    Container.mock.getter('name').fakeReturnValue('Container');
    Container.$$native = NATIVE_TYPE;

    const afterCallback = () => Promise.resolve();
    const WrappedPause = () => <Machinat.Pause after={afterCallback} />;

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);
    const rendered = renderer.render(
      <>
        {123}
        <Machinat.Pause delay={1000} />
        abc
        <Machinat.Pause after={afterCallback} />
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

    expect(rendered).toEqual([
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
        node: <Machinat.Pause after={afterCallback} />,
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
        node: <Machinat.Pause after={afterCallback} />,
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

    expect(Custom.mock).toBeCalledTimes(1);
    expect(Custom.mock.calls[0].args).toEqual([{ a: 'A', b: 2 }]);

    expect(generalElementDelegate.mock).toBeCalledTimes(2);
    generalElementDelegate.mock.calls.forEach((call, i) => {
      expect(call.args[0]).toEqual(i === 0 ? <a>AAA</a> : <b>BBB</b>);
      expect(call.args[2]).toEqual(i === 0 ? '$::4' : '$::5');

      const renderInner = call.args[1];
      expect(renderInner(['foo'], '.children')).toEqual([
        {
          type: 'text',
          node: 'foo',
          value: 'foo',
          path: `$::${i === 0 ? '4#a' : '5#b'}.children:0`,
        },
      ]);
    });

    expect(Unit.mock).toBeCalledTimes(2);
    Unit.mock.calls.forEach((call, i) => {
      expect(call.args[0]).toEqual(
        i === 0 ? <Unit x="true" y={false} /> : <Unit a="A" b={2} />
      );
      expect(call.args[2]).toEqual(i === 0 ? '$::7' : '$::8#Custom::1');

      const renderInner = call.args[1];
      expect(renderInner(['bar'], '.children')).toEqual([
        {
          type: 'text',
          node: 'bar',
          value: 'bar',
          path: `$::${!i ? '7' : '8#Custom::1'}#Unit.children:0`,
        },
      ]);
    });

    expect(Container.mock).toBeCalledTimes(1);
    const [
      containerNode,
      containerRenderInner,
      containerPath,
    ] = Container.mock.calls[0].args;

    expect(containerNode).toEqual(<Container>somthing wrapped</Container>);
    expect(containerRenderInner(['baz'], '.children')).toEqual([
      {
        type: 'text',
        node: 'baz',
        value: 'baz',
        path: `$::10#Container.children:0`,
      },
    ]);
    expect(containerPath).toBe('$::10');
  });

  it('return null if no renderable element in the node', () => {
    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    const None = () => null;
    const Break = () => [
      { type: 'break', node: <br />, value: undefined, path: '$:0' },
    ];
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

    const Section = moxy(() => [
      { type: 'text', node: 'head', value: 'head', path: '$' },
      { type: 'break', node: <br />, value: SEGMENT_BREAK, path: '$' },
      { type: 'text', node: 'foot', value: 'foot', path: '$' },
    ]);
    Section.mock.getter('name').fakeReturnValue('Section');
    Section.$$native = NATIVE_TYPE;

    expect(renderer.render(<Section />, true)).toEqual([
      { type: 'text', node: 'head', value: 'head', path: '$' },
      { type: 'text', node: 'foot', value: 'foot', path: '$' },
    ]);

    const renderInner = Section.mock.calls[0].args[1];

    expect(renderInner(<Section />, '.children')).toEqual([
      { type: 'text', node: 'head', value: 'head', path: '$' },
      { type: 'break', node: <br />, value: SEGMENT_BREAK, path: '$' },
      { type: 'text', node: 'foot', value: 'foot', path: '$' },
    ]);
  });

  it('throws if non unit native component placed at surface', () => {
    const Unit = () => [
      { type: 'unit', node: <Unit />, value: { root: true }, path: '$' },
    ];
    Unit.$$native = NATIVE_TYPE;

    const Part = () => [
      { type: 'part', node: <Part />, value: { root: false }, path: '$' },
    ];
    Part.$$native = NATIVE_TYPE;

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    expect(renderer.render(<Unit />, true)).toEqual([
      { type: 'unit', node: <Unit />, value: { root: true }, path: '$' },
    ]);
    expect(() =>
      renderer.render(<Part />, true)
    ).toThrowErrorMatchingInlineSnapshot(
      `"<Part /> is a part element and should not be placed at surface level"`
    );
  });

  it('throw if generalElementDelegate throw', () => {
    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);
    generalElementDelegate.mock.fake(() => {
      throw new Error('<invalid /> is not good');
    });

    expect(() =>
      renderer.render(<invalid />, true)
    ).toThrowErrorMatchingInlineSnapshot(`"<invalid /> is not good"`);
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
    const AnotherPlatformUnit = () => {};
    AnotherPlatformUnit.$$typeof = MACHINAT_NATIVE_TYPE;
    AnotherPlatformUnit.$$native = Symbol('some other platform');

    const renderer = new Renderer('Test', NATIVE_TYPE, generalElementDelegate);

    expect(() =>
      renderer.render(<AnotherPlatformUnit />, true)
    ).toThrowErrorMatchingInlineSnapshot(
      `"native component <AnotherPlatformUnit /> at '$' is not supported by Test"`
    );
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
