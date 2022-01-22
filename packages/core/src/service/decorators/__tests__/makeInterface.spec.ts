import { MACHINAT_SERVICE_INTERFACE } from '../../../symbol';
import makeInterface from '../makeInterface';

describe('makeInterface(name)', () => {
  it('create annotation object', () => {
    const MyFooInterface = makeInterface({ name: 'Foo' });

    expect(MyFooInterface.$$typeof).toBe(MACHINAT_SERVICE_INTERFACE);
    expect(MyFooInterface.$$name).toBe('Foo');
    expect(MyFooInterface.$$multi).toBe(false);

    const MyBarsInterface = makeInterface({ name: 'Bars', multi: true });

    expect(MyBarsInterface.$$typeof).toBe(MACHINAT_SERVICE_INTERFACE);
    expect(MyBarsInterface.$$name).toBe('Bars');
    expect(MyBarsInterface.$$multi).toBe(true);
  });
});
