import Sociably from '../../index.js';
import formatNode from '../formatNode.js';
import serviceInterface from '../../service/decorators/serviceInterface.js';

declare module '@sociably/core/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      div: { x?: string; y?: number };
    }
  }
}

const { Pause, Fragment, Provider, Raw, Thunk } = Sociably;

type TestProps = { x?: string; y?: number };

const MyComp = (_props: TestProps) => null;
const Sym = Symbol('_symbol_component_') as unknown as (
  props: TestProps,
) => null;
const Unnamed = (
  () => (_props: TestProps) =>
    null
)();

const Foo = serviceInterface({ name: 'Foo' });

test.each`
  element                                        | withProps | expected
  ${undefined}                                   | ${false}  | ${'undefined'}
  ${null}                                        | ${false}  | ${'null'}
  ${123}                                         | ${false}  | ${'123'}
  ${Sym}                                         | ${false}  | ${'Symbol(_symbol_component_)'}
  ${'hello world'}                               | ${false}  | ${'"hello world"'}
  ${(<div x="0" y={1} />)}                       | ${false}  | ${'<div />'}
  ${(<div x="0" y={1} />)}                       | ${true}   | ${'<div x="0" y={1} />'}
  ${(<MyComp x="0" y={1} />)}                    | ${false}  | ${'<MyComp />'}
  ${(<MyComp x="0" y={1} />)}                    | ${true}   | ${'<MyComp x="0" y={1} />'}
  ${(<Sym x="0" y={1} />)}                       | ${false}  | ${'<Symbol(_symbol_component_) />'}
  ${(<Sym x="0" y={1} />)}                       | ${true}   | ${'<Symbol(_symbol_component_) x="0" y={1} />'}
  ${(<Unnamed x="0" y={1} />)}                   | ${false}  | ${'<((_props)=>null) />'}
  ${(<Unnamed x="0" y={1} />)}                   | ${true}   | ${'<((_props)=>null) x="0" y={1} />'}
  ${(<Fragment />)}                              | ${false}  | ${'<Fragment />'}
  ${(<Pause time={3} />)}                        | ${false}  | ${'<Pause />'}
  ${(<Pause delay={() => Promise.resolve()} />)} | ${true}   | ${'<Pause delay={()=>Promise.resolve()} />'}
  ${(
  <Provider provide={Foo} value="foo">
    {null}
  </Provider>
)} | ${false} | ${'<Provider />'}
  ${(
  <Provider provide={Foo} value="foo">
    {null}
  </Provider>
)} | ${true} | ${'<Provider provide={[object Object]} value="foo" children={null} />'}
  ${(<Thunk effect={async () => {}} />)}         | ${false}  | ${'<Thunk />'}
  ${(<Thunk effect={async () => {}} />)}         | ${true}   | ${'<Thunk effect={async ()=>{}} />'}
  ${(<Raw value={{ raw: 'content' }} />)}        | ${false}  | ${'<Raw />'}
  ${(<Raw value={{ raw: 'content' }} />)}        | ${true}   | ${'<Raw value={[object Object]} />'}
  ${{ plain: 'object' }}                         | ${true}   | ${'[object Object]'}
  ${{ plain: 'object' }}                         | ${false}  | ${'[object Object]'}
`('foramt element $element', ({ element, withProps, expected }) => {
  expect(formatNode(element, withProps)).toBe(expected);
});
