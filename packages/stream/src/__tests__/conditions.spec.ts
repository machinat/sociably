import { serviceContainer, createEmptyScope } from '@sociably/core/service';
import { moxy } from '@moxyjs/moxy';
import Stream from '../stream.js';
import conditions from '../conditions.js';
import { STREAMING_KEY_I } from '../interface.js';

const nextTick = () => new Promise(process.nextTick);

it('split source stream and transmit by the first condtion the value match', async () => {
  const source = new Stream<string>();

  const eventListenerFoo = moxy();
  const eventContainerFoo = moxy(
    serviceContainer({ deps: [STREAMING_KEY_I] })(() => eventListenerFoo)
  );
  const eventListenerBar = moxy();
  const eventContainerBar = moxy(
    serviceContainer({ deps: [STREAMING_KEY_I] })(() => eventListenerBar)
  );
  const eventListenerBaz = moxy();
  const eventContainerBaz = moxy(
    serviceContainer({ deps: [STREAMING_KEY_I] })(() => eventListenerBaz)
  );

  const [foo$, bar$, baz$] = conditions(source, [
    (val) => val === 'foo',
    (val) => val === 'bar',
    (val) => val.startsWith('b'),
  ]);
  foo$.subscribe(eventContainerFoo);
  bar$.subscribe(eventContainerBar);
  baz$.subscribe(eventContainerBaz);

  source.next({
    value: 'foo',
    key: 'foo.thread',
    scope: createEmptyScope(),
  });
  await nextTick();

  expect(eventContainerFoo.$$factory).toHaveBeenCalledTimes(1);
  expect(eventContainerFoo.$$factory).toHaveBeenCalledWith('foo.thread');
  expect(eventListenerFoo).toHaveBeenCalledTimes(1);
  expect(eventListenerFoo).toHaveBeenCalledWith('foo');

  source.next({
    value: 'bar',
    key: 'bar.thread',
    scope: createEmptyScope(),
  });
  await nextTick();

  expect(eventContainerBar.$$factory).toHaveBeenCalledTimes(1);
  expect(eventContainerBar.$$factory).toHaveBeenCalledWith('bar.thread');
  expect(eventListenerBar).toHaveBeenCalledTimes(1);
  expect(eventListenerBar).toHaveBeenCalledWith('bar');

  source.next({
    value: 'baz',
    key: 'baz.thread',
    scope: createEmptyScope(),
  });
  await nextTick();

  expect(eventContainerBaz.$$factory).toHaveBeenCalledTimes(1);
  expect(eventContainerBaz.$$factory).toHaveBeenCalledWith('baz.thread');
  expect(eventListenerBaz).toHaveBeenCalledTimes(1);
  expect(eventListenerBaz).toHaveBeenCalledWith('baz');

  source.next({
    key: 'poor.boy',
    value: 'nobody likes me',
    scope: createEmptyScope(),
  });
  await nextTick();

  expect(eventContainerFoo.$$factory).toHaveBeenCalledTimes(1);
  expect(eventContainerBar.$$factory).toHaveBeenCalledTimes(1);
  expect(eventContainerBaz.$$factory).toHaveBeenCalledTimes(1);
  expect(eventListenerFoo).toHaveBeenCalledTimes(1);
  expect(eventListenerBar).toHaveBeenCalledTimes(1);
  expect(eventListenerBaz).toHaveBeenCalledTimes(1);
});

const errorListenerA = moxy();
const errorContainerA = moxy(
  serviceContainer({ deps: [STREAMING_KEY_I] })(() => errorListenerA)
);
const errorListenerB = moxy();
const errorContainerB = moxy(
  serviceContainer({ deps: [STREAMING_KEY_I] })(() => errorListenerB)
);
const errorListenerC = moxy();
const errorContainerC = moxy(
  serviceContainer({ deps: [STREAMING_KEY_I] })(() => errorListenerC)
);

beforeEach(() => {
  errorListenerA.mock.reset();
  errorContainerA.mock.reset();
  errorListenerB.mock.reset();
  errorContainerB.mock.reset();
  errorListenerC.mock.reset();
  errorContainerC.mock.reset();
});

it('transmit error thrown in condition predocator to the corresponded destination only', async () => {
  const source = new Stream<string>();

  const [a$, b$, c$] = conditions(source, [
    (val) => val.startsWith('a'),
    () => {
      throw new Error('boo');
    },
    (val) => val.startsWith('c'),
  ]);
  a$.catch(errorContainerA);
  b$.catch(errorContainerB);
  c$.catch(errorContainerC);

  source.next({
    value: 'bar',
    key: 'foo.thread',
    scope: createEmptyScope(),
  });
  await nextTick();

  expect(errorContainerA.$$factory).not.toHaveBeenCalled();
  expect(errorListenerA).not.toHaveBeenCalled();

  expect(errorContainerB.$$factory).toHaveBeenCalledTimes(1);
  expect(errorContainerB.$$factory).toHaveBeenCalledWith('foo.thread');
  expect(errorListenerB).toHaveBeenCalledTimes(1);
  expect(errorListenerB).toHaveBeenCalledWith(new Error('boo'));

  expect(errorContainerC.$$factory).not.toHaveBeenCalled();
  expect(errorListenerC).not.toHaveBeenCalled();
});

it('transmit error from source to all branches', () => {
  const source = new Stream<string>();

  const [a$, b$, c$] = conditions(source, [
    (val) => val.startsWith('a'),
    (val) => val.startsWith('b'),
    (val) => val.startsWith('c'),
  ]);
  a$.catch(errorContainerA);
  b$.catch(errorContainerB);
  c$.catch(errorContainerC);

  source.error({
    value: new Error('boo'),
    key: 'foo.thread',
    scope: createEmptyScope(),
  });

  expect(errorContainerA.$$factory).toHaveBeenCalledTimes(1);
  expect(errorContainerA.$$factory).toHaveBeenCalledWith('foo.thread');
  expect(errorListenerA).toHaveBeenCalledTimes(1);
  expect(errorListenerA).toHaveBeenCalledWith(new Error('boo'));

  expect(errorContainerB.$$factory).toHaveBeenCalledTimes(1);
  expect(errorContainerB.$$factory).toHaveBeenCalledWith('foo.thread');
  expect(errorListenerB).toHaveBeenCalledTimes(1);
  expect(errorListenerB).toHaveBeenCalledWith(new Error('boo'));

  expect(errorContainerC.$$factory).toHaveBeenCalledTimes(1);
  expect(errorContainerC.$$factory).toHaveBeenCalledWith('foo.thread');
  expect(errorListenerC).toHaveBeenCalledTimes(1);
  expect(errorListenerC).toHaveBeenCalledWith(new Error('boo'));
});
