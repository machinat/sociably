import { SOCIABLY_SERVICE_INTERFACE } from '../../../symbol.js';
import serviceInterface from '../serviceInterface.js';

describe('serviceInterface(name)', () => {
  it('create annotation object', () => {
    const MyFooInterface = serviceInterface({ name: 'Foo' });

    expect(MyFooInterface.$$typeof).toBe(SOCIABLY_SERVICE_INTERFACE);
    expect(MyFooInterface.$$name).toBe('Foo');
    expect(MyFooInterface.$$multi).toBe(false);

    const MyBarsInterface = serviceInterface({ name: 'Bars', multi: true });

    expect(MyBarsInterface.$$typeof).toBe(SOCIABLY_SERVICE_INTERFACE);
    expect(MyBarsInterface.$$name).toBe('Bars');
    expect(MyBarsInterface.$$multi).toBe(true);
  });
});
