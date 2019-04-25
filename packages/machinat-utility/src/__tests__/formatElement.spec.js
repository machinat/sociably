import Machinat, {
  MACHINAT_FRAGMENT_TYPE as Fragment,
  MACHINAT_PAUSE_TYPE as Pause,
} from 'machinat';
import formatElement from '../formatElement';

const MyComp = () => {};
const Sym = Symbol('_symbol_component_');
const Unnamed = (() => () => {})();

test.each`
  element                    | withProps | expected
  ${undefined}               | ${false}  | ${'undefined'}
  ${null}                    | ${false}  | ${'null'}
  ${123}                     | ${false}  | ${'123'}
  ${Sym}                     | ${false}  | ${'Symbol(_symbol_component_)'}
  ${'hello world'}           | ${false}  | ${'"hello world"'}
  ${<div x="0" y={1} />}     | ${false}  | ${'<div />'}
  ${<div x="0" y={1} />}     | ${true}   | ${'<div x="0" y={1} />'}
  ${<MyComp x="0" y={1} />}  | ${false}  | ${'<MyComp />'}
  ${<MyComp x="0" y={1} />}  | ${true}   | ${'<MyComp x="0" y={1} />'}
  ${<Sym x="0" y={1} />}     | ${false}  | ${'<Symbol(_symbol_component_) />'}
  ${<Sym x="0" y={1} />}     | ${true}   | ${'<Symbol(_symbol_component_) x="0" y={1} />'}
  ${<Unnamed x="0" y={1} />} | ${false}  | ${'<(() => {}) />'}
  ${<Unnamed x="0" y={1} />} | ${true}   | ${'<(() => {}) x="0" y={1} />'}
  ${{ plain: 'object' }}     | ${true}   | ${'{"plain":"object"}'}
  ${{ plain: 'object' }}     | ${false}  | ${'{"plain":"object"}'}
  ${<Fragment />}            | ${false}  | ${'<Fragment />'}
  ${<Pause />}               | ${false}  | ${'<Pause />'}
  ${<Pause delay={777} />}   | ${true}   | ${'<Pause delay={777} />'}
`('foramt element $element', ({ element, withProps, expected }) => {
  expect(formatElement(element, withProps)).toBe(expected);
});
