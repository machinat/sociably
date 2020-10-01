import Machinat from '../..';
import formatNode from '../formatNode';

const { Pause, Fragment, Provider, Raw, Thunk } = Machinat;

const MyComp = () => {};
const Sym = Symbol('_symbol_component_');
const Unnamed = (() => () => {})();

function FooService() {}

test.each`
  element                                            | withProps | expected
  ${undefined}                                       | ${false}  | ${'undefined'}
  ${null}                                            | ${false}  | ${'null'}
  ${123}                                             | ${false}  | ${'123'}
  ${Sym}                                             | ${false}  | ${'Symbol(_symbol_component_)'}
  ${'hello world'}                                   | ${false}  | ${'"hello world"'}
  ${(<div x="0" y={1} />)}                           | ${false}  | ${'<div />'}
  ${(<div x="0" y={1} />)}                           | ${true}   | ${'<div x="0" y={1} />'}
  ${(<MyComp x="0" y={1} />)}                        | ${false}  | ${'<MyComp />'}
  ${(<MyComp x="0" y={1} />)}                        | ${true}   | ${'<MyComp x="0" y={1} />'}
  ${(<Sym x="0" y={1} />)}                           | ${false}  | ${'<Symbol(_symbol_component_) />'}
  ${(<Sym x="0" y={1} />)}                           | ${true}   | ${'<Symbol(_symbol_component_) x="0" y={1} />'}
  ${(<Unnamed x="0" y={1} />)}                       | ${false}  | ${'<(() => {}) />'}
  ${(<Unnamed x="0" y={1} />)}                       | ${true}   | ${'<(() => {}) x="0" y={1} />'}
  ${(<Fragment />)}                                  | ${false}  | ${'<Fragment />'}
  ${(<Pause until={() => 3} />)}                     | ${false}  | ${'<Pause />'}
  ${(<Pause until={() => 3} />)}                     | ${true}   | ${'<Pause until={() => 3} />'}
  ${(<Provider provide={FooService} value="foo" />)} | ${false}  | ${'<Provider />'}
  ${(<Provider provide={FooService} value="foo" />)} | ${true}   | ${'<Provider provide={function FooService() {}} value="foo" />'}
  ${(<Thunk effect={async () => {}} />)}             | ${false}  | ${'<Thunk />'}
  ${(<Thunk effect={async () => {}} />)}             | ${true}   | ${'<Thunk effect={async () => {}} />'}
  ${(<Raw value={{ raw: 'content' }} />)}            | ${false}  | ${'<Raw />'}
  ${(<Raw value={{ raw: 'content' }} />)}            | ${true}   | ${'<Raw value={[object Object]} />'}
  ${{ plain: 'object' }}                             | ${true}   | ${'[object Object]'}
  ${{ plain: 'object' }}                             | ${false}  | ${'[object Object]'}
`('foramt element $element', ({ element, withProps, expected }) => {
  expect(formatNode(element, withProps)).toBe(expected);
});
