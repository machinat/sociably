import { makeContainer, createEmptyScope } from '@sociably/core/service';
import moxy from '@moxyjs/moxy';
import Stream from '../stream';
import conditions from '../conditions';
import { STREAMING_KEY_I } from '../interface';

const nextTick = () => new Promise(process.nextTick);

it('split source stream and transmit by the first condtion the value match', async () => {
  const source = new Stream<string>();

  const eventListenerFoo = moxy();
  const eventContainerFoo = moxy(
    makeContainer({ deps: [STREAMING_KEY_I] })(() => eventListenerFoo)
  );
  const eventListenerBar = moxy();
  const eventContainerBar = moxy(
    makeContainer({ deps: [STREAMING_KEY_I] })(() => eventListenerBar)
  );
  const eventListenerBaz = moxy();
  const eventContainerBaz = moxy(
    makeContainer({ deps: [STREAMING_KEY_I] })(() => eventListenerBaz)
  );

  const [foo$, bar$, baz$] = conditions(source, [
    (val) => val === 'foo',
    (val) => val === 'bar',
    (val) => val[0] === 'b',
  ]);
  foo$.subscribe(eventContainerFoo);
  bar$.subscribe(eventContainerBar);
  baz$.subscribe(eventContainerBaz);

  source.next({
    value: 'foo',
    key: 'foo.channel',
    scope: createEmptyScope(),
  });
  await nextTick();

  expect(eventContainerFoo.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(eventContainerFoo.$$factory.mock).toHaveBeenCalledWith('foo.channel');
  expect(eventListenerFoo.mock).toHaveBeenCalledTimes(1);
  expect(eventListenerFoo.mock).toHaveBeenCalledWith('foo');

  source.next({
    value: 'bar',
    key: 'bar.channel',
    scope: createEmptyScope(),
  });
  await nextTick();

  expect(eventContainerBar.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(eventContainerBar.$$factory.mock).toHaveBeenCalledWith('bar.channel');
  expect(eventListenerBar.mock).toHaveBeenCalledTimes(1);
  expect(eventListenerBar.mock).toHaveBeenCalledWith('bar');

  source.next({
    value: 'baz',
    key: 'baz.channel',
    scope: createEmptyScope(),
  });
  await nextTick();

  expect(eventContainerBaz.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(eventContainerBaz.$$factory.mock).toHaveBeenCalledWith('baz.channel');
  expect(eventListenerBaz.mock).toHaveBeenCalledTimes(1);
  expect(eventListenerBaz.mock).toHaveBeenCalledWith('baz');

  source.next({
    key: 'poor.boy',
    value: 'nobody likes me',
    scope: createEmptyScope(),
  });
  await nextTick();

  expect(eventContainerFoo.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(eventContainerBar.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(eventContainerBaz.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(eventListenerFoo.mock).toHaveBeenCalledTimes(1);
  expect(eventListenerBar.mock).toHaveBeenCalledTimes(1);
  expect(eventListenerBaz.mock).toHaveBeenCalledTimes(1);
});

const errorListenerA = moxy();
const errorContainerA = moxy(
  makeContainer({ deps: [STREAMING_KEY_I] })(() => errorListenerA)
);
const errorListenerB = moxy();
const errorContainerB = moxy(
  makeContainer({ deps: [STREAMING_KEY_I] })(() => errorListenerB)
);
const errorListenerC = moxy();
const errorContainerC = moxy(
  makeContainer({ deps: [STREAMING_KEY_I] })(() => errorListenerC)
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
    (val) => val[0] === 'a',
    () => {
      throw new Error('boo');
    },
    (val) => val[0] === 'c',
  ]);
  a$.catch(errorContainerA);
  b$.catch(errorContainerB);
  c$.catch(errorContainerC);

  source.next({
    value: 'bar',
    key: 'foo.channel',
    scope: createEmptyScope(),
  });
  await nextTick();

  expect(errorContainerA.$$factory.mock).not.toHaveBeenCalled();
  expect(errorListenerA.mock).not.toHaveBeenCalled();

  expect(errorContainerB.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(errorContainerB.$$factory.mock).toHaveBeenCalledWith('foo.channel');
  expect(errorListenerB.mock).toHaveBeenCalledTimes(1);
  expect(errorListenerB.mock).toHaveBeenCalledWith(new Error('boo'));

  expect(errorContainerC.$$factory.mock).not.toHaveBeenCalled();
  expect(errorListenerC.mock).not.toHaveBeenCalled();
});

it('transmit error from source to all branches', () => {
  const source = new Stream<string>();

  const [a$, b$, c$] = conditions(source, [
    (val) => val[0] === 'a',
    (val) => val[0] === 'b',
    (val) => val[0] === 'c',
  ]);
  a$.catch(errorContainerA);
  b$.catch(errorContainerB);
  c$.catch(errorContainerC);

  source.error({
    value: new Error('boo'),
    key: 'foo.channel',
    scope: createEmptyScope(),
  });

  expect(errorContainerA.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(errorContainerA.$$factory.mock).toHaveBeenCalledWith('foo.channel');
  expect(errorListenerA.mock).toHaveBeenCalledTimes(1);
  expect(errorListenerA.mock).toHaveBeenCalledWith(new Error('boo'));

  expect(errorContainerB.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(errorContainerB.$$factory.mock).toHaveBeenCalledWith('foo.channel');
  expect(errorListenerB.mock).toHaveBeenCalledTimes(1);
  expect(errorListenerB.mock).toHaveBeenCalledWith(new Error('boo'));

  expect(errorContainerC.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(errorContainerC.$$factory.mock).toHaveBeenCalledWith('foo.channel');
  expect(errorListenerC.mock).toHaveBeenCalledTimes(1);
  expect(errorListenerC.mock).toHaveBeenCalledWith(new Error('boo'));
});
