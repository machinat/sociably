import Machinat, {
  MACHINAT_FRAGMENT_TYPE as Fragment,
  MACHINAT_PAUSE_TYPE as Pause,
} from 'machinat';
import formatNode from '../formatNode';

const MyComp = () => {};
const Sym = Symbol('_symbol_component_');
const Unnamed = (() => () => {})();

const { Provider, Consumer } = Machinat.createService(() => () => {});

test.each`
  element                     | withProps | expected
  ${undefined}                | ${false}  | ${'undefined'}
  ${null}                     | ${false}  | ${'null'}
  ${123}                      | ${false}  | ${'123'}
  ${Sym}                      | ${false}  | ${'Symbol(_symbol_component_)'}
  ${'hello world'}            | ${false}  | ${'"hello world"'}
  ${<div x="0" y={1} />}      | ${false}  | ${'<div />'}
  ${<div x="0" y={1} />}      | ${true}   | ${'<div x="0" y={1} />'}
  ${<MyComp x="0" y={1} />}   | ${false}  | ${'<MyComp />'}
  ${<MyComp x="0" y={1} />}   | ${true}   | ${'<MyComp x="0" y={1} />'}
  ${<Sym x="0" y={1} />}      | ${false}  | ${'<Symbol(_symbol_component_) />'}
  ${<Sym x="0" y={1} />}      | ${true}   | ${'<Symbol(_symbol_component_) x="0" y={1} />'}
  ${<Unnamed x="0" y={1} />}  | ${false}  | ${'<(() => {}) />'}
  ${<Unnamed x="0" y={1} />}  | ${true}   | ${'<(() => {}) x="0" y={1} />'}
  ${{ plain: 'object' }}      | ${true}   | ${'[object Object]'}
  ${{ plain: 'object' }}      | ${false}  | ${'[object Object]'}
  ${<Fragment />}             | ${false}  | ${'<Fragment />'}
  ${<Pause />}                | ${false}  | ${'<Pause />'}
  ${<Pause delay={777} />}    | ${true}   | ${'<Pause delay={777} />'}
  ${<Provider provide="X" />} | ${false}  | ${'<ServiceProvider />'}
  ${<Provider provide="X" />} | ${true}   | ${'<ServiceProvider provide="X" />'}
  ${<Consumer consume="Y" />} | ${false}  | ${'<ServiceConsumer />'}
  ${<Consumer consume="Y" />} | ${true}   | ${'<ServiceConsumer consume="Y" />'}
`('foramt element $element', ({ element, withProps, expected }) => {
  expect(formatNode(element, withProps)).toBe(expected);
});
