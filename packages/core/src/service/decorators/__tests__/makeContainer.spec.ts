import moxy from '@moxyjs/moxy';
import {
  SOCIABLY_SERVICE_PROVIDER,
  SOCIABLY_SERVICE_CONTAINER,
  SOCIABLY_SERVICE_INTERFACE,
} from '../../../symbol';
import makeContainer from '../makeContainer';

const FooServiceI = {
  $$typeof: SOCIABLY_SERVICE_PROVIDER,
  /* ... */
} as never;
const BarServiceI = {
  $$typeof: SOCIABLY_SERVICE_INTERFACE,
  /* ... */
} as never;
const BazServiceI = {
  $$typeof: SOCIABLY_SERVICE_INTERFACE,
  /* ... */
} as never;

describe('makeContainer({ deps })(fn)', () => {
  it('annotate deps of container', () => {
    const containerFn = () => {};

    const myContainer = makeContainer({
      name: 'myContainer',
      deps: [
        FooServiceI,
        { require: BarServiceI, optional: false },
        { require: BazServiceI, optional: true },
      ],
    })(containerFn);

    expect(myContainer).toBe(containerFn);
    expect(myContainer.$$typeof).toBe(SOCIABLY_SERVICE_CONTAINER);
    expect(myContainer.$$name).toBe('myContainer');
    expect(myContainer.$$deps).toEqual([
      { require: FooServiceI, optional: false },
      { require: BarServiceI, optional: false },
      { require: BazServiceI, optional: true },
    ]);
  });

  test('default $$name and $$deps', () => {
    const containerFn = () => {};
    const myContainer = makeContainer({})(containerFn);

    expect(myContainer).toBe(containerFn);
    expect(myContainer.$$typeof).toBe(SOCIABLY_SERVICE_CONTAINER);
    expect(myContainer.$$name).toBe('containerFn');
    expect(myContainer.$$deps).toEqual([]);
  });

  it('throw if invalid deps received', () => {
    class NoneService {}

    expect(() => {
      makeContainer({ deps: [NoneService as never] })((_whatever) => 'boom');
    }).toThrowErrorMatchingInlineSnapshot(
      `"NoneService is not a valid interface"`
    );
  });
});
