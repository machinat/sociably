import moxy from '@moxyjs/moxy';
import { makeContainer, ServiceScope } from '@machinat/core/service';
import { STREAMING_KEY_I } from '../interface';
import injectMaybe from '../injectMaybe';

const scope = moxy<ServiceScope>({
  injectContainer(container) {
    return container('foo');
  },
} as never);
const frame = { scope, value: '_VALUE_', key: '_KEY_' };

beforeEach(() => {
  scope.mock.reset();
});

it('inject container with frame.scope', () => {
  const containedFn = moxy((...args) => 'baz');
  const myContainer = moxy(
    makeContainer({
      deps: [
        /* FooProvider */
      ],
    })((...args) => containedFn)
  );

  expect(injectMaybe(myContainer)(frame)('bar')).toBe('baz');

  expect(scope.injectContainer.mock).toHaveBeenCalledTimes(1);
  expect(scope.injectContainer.mock).toHaveBeenCalledWith(
    myContainer,
    expect.any(Map)
  );

  expect(myContainer.mock).toHaveBeenCalledTimes(1);
  expect(myContainer.mock).toHaveBeenCalledWith('foo');

  expect(containedFn.mock).toHaveBeenCalledTimes(1);
  expect(containedFn.mock).toHaveBeenCalledWith('bar');

  expect(injectMaybe(myContainer)(frame)('bar', 'beer', 'bacon')).toBe('baz');

  expect(scope.injectContainer.mock).toHaveBeenCalledTimes(2);
  expect(myContainer.mock).toHaveBeenCalledTimes(2);
  expect(containedFn.mock).toHaveBeenCalledTimes(2);
  expect(containedFn.mock).toHaveBeenCalledWith('bar', 'beer', 'bacon');
});

it('return a thunk if target is normal function', () => {
  const fn = moxy((v) => `${v}!!!`);
  expect(injectMaybe(fn)(frame)('foo')).toBe('foo!!!');

  expect(scope.injectContainer.mock).not.toHaveBeenCalled();
  expect(fn.mock).toHaveBeenCalledTimes(1);
  expect(fn.mock).toHaveBeenCalledWith('foo');

  const multiParamFn = moxy((...args) => args.map((v) => `${v}!`).join(' '));
  expect(injectMaybe(multiParamFn)(frame)('bar', 'beer', 'bacon')).toBe(
    'bar! beer! bacon!'
  );

  expect(scope.injectContainer.mock).not.toHaveBeenCalled();
  expect(multiParamFn.mock).toHaveBeenCalledTimes(1);
  expect(multiParamFn.mock).toHaveBeenCalledWith('bar', 'beer', 'bacon');
});

it('provide StreamFrame key when inject', () => {
  const myContainer = moxy(makeContainer({})(() => () => 'baz'));

  expect(injectMaybe(myContainer)(frame)('bar')).toBe('baz');

  const expectedProvision = new Map([[STREAMING_KEY_I, '_KEY_']]);

  expect(scope.injectContainer.mock).toHaveBeenCalledTimes(1);
  expect(scope.injectContainer.mock).toHaveBeenCalledWith(
    myContainer,
    expectedProvision
  );
});
