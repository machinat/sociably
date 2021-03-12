import { makeContainer, createEmptyScope } from '@machinat/core/service';
import moxy from '@moxyjs/moxy';
import Subject from '../subject';
import partition from '../partition';
import { STREAMING_KEY_I } from '../interface';

const nextTick = () => new Promise(process.nextTick);

const eventListenerA = moxy();
const eventContainerA = moxy(
  makeContainer({ deps: [STREAMING_KEY_I] })(() => eventListenerA)
);
const eventListenerB = moxy();
const eventContainerB = moxy(
  makeContainer({ deps: [STREAMING_KEY_I] })(() => eventListenerB)
);

const errorListenerA = moxy();
const errorContainerA = moxy(
  makeContainer({ deps: [STREAMING_KEY_I] })(() => errorListenerA)
);
const errorListenerB = moxy();
const errorContainerB = moxy(
  makeContainer({ deps: [STREAMING_KEY_I] })(() => errorListenerB)
);

beforeEach(() => {
  eventListenerA.mock.reset();
  eventContainerA.mock.reset();
  eventListenerB.mock.reset();
  eventContainerB.mock.reset();
  errorListenerA.mock.reset();
  errorContainerA.mock.reset();
  errorListenerB.mock.reset();
  errorContainerB.mock.reset();
});

it('split source stream into two by the predicate result', async () => {
  const source = new Subject();

  const [a$, b$] = partition(source, (val) => val[0] === 'a');
  a$.subscribe(eventContainerA);
  b$.subscribe(eventContainerB);

  source.next({
    value: 'apple',
    key: 'foo.channel',
    scope: createEmptyScope(),
  });
  await nextTick();

  expect(eventContainerA.mock).toHaveBeenCalledTimes(1);
  expect(eventContainerA.mock).toHaveBeenCalledWith('foo.channel');
  expect(eventListenerA.mock).toHaveBeenCalledTimes(1);
  expect(eventListenerA.mock).toHaveBeenCalledWith('apple');
  expect(eventContainerB.mock).not.toHaveBeenCalled();
  expect(eventListenerB.mock).not.toHaveBeenCalled();

  source.next({
    value: 'beer',
    key: 'foo.channel',
    scope: createEmptyScope(),
  });
  await nextTick();

  expect(eventContainerB.mock).toHaveBeenCalledTimes(1);
  expect(eventContainerB.mock).toHaveBeenCalledWith('foo.channel');
  expect(eventListenerB.mock).toHaveBeenCalledTimes(1);
  expect(eventListenerB.mock).toHaveBeenCalledWith('beer');

  source.next({
    value: 'amazon',
    key: 'bar.channel',
    scope: createEmptyScope(),
  });
  await nextTick();

  expect(eventContainerA.mock).toHaveBeenCalledTimes(2);
  expect(eventContainerA.mock).toHaveBeenCalledWith('bar.channel');
  expect(eventListenerA.mock).toHaveBeenCalledTimes(2);
  expect(eventListenerA.mock).toHaveBeenCalledWith('amazon');

  source.next({
    value: 'bacon',
    key: 'bar.channel',
    scope: createEmptyScope(),
  });
  await nextTick();

  expect(eventContainerB.mock).toHaveBeenCalledTimes(2);
  expect(eventContainerB.mock).toHaveBeenCalledWith('bar.channel');
  expect(eventListenerB.mock).toHaveBeenCalledTimes(2);
  expect(eventListenerB.mock).toHaveBeenCalledWith('bacon');
});

it('pass error thrown in preidcator to both destinations', () => {
  const source = new Subject();

  const [a$, b$] = partition(source, () => {
    throw new Error('awwww');
  });
  a$.subscribe(null, errorContainerA);
  b$.subscribe(null, errorContainerB);

  source.next({ value: 'foo', key: 'foo.channel', scope: createEmptyScope() });

  expect(errorContainerA.mock).toHaveBeenCalledTimes(1);
  expect(errorContainerA.mock).toHaveBeenCalledWith('foo.channel');
  expect(errorListenerA.mock).toHaveBeenCalledTimes(1);
  expect(errorListenerA.mock).toHaveBeenCalledWith(new Error('awwww'));

  expect(errorContainerB.mock).toHaveBeenCalledTimes(1);
  expect(errorContainerB.mock).toHaveBeenCalledWith('foo.channel');
  expect(errorListenerB.mock).toHaveBeenCalledTimes(1);
  expect(errorListenerB.mock).toHaveBeenCalledWith(new Error('awwww'));
});

it('transmit error from source to both destinations', () => {
  const source = new Subject();

  const [a$, b$] = partition(source, (val) => !!val);
  a$.subscribe(null, errorContainerA);
  b$.subscribe(null, errorContainerB);

  source.error({
    value: new Error('boo'),
    key: 'foo.channel',
    scope: createEmptyScope(),
  });

  expect(errorContainerA.mock).toHaveBeenCalledTimes(1);
  expect(errorContainerA.mock).toHaveBeenCalledWith('foo.channel');
  expect(errorListenerA.mock).toHaveBeenCalledTimes(1);
  expect(errorListenerA.mock).toHaveBeenCalledWith(new Error('boo'));

  expect(errorContainerB.mock).toHaveBeenCalledTimes(1);
  expect(errorContainerB.mock).toHaveBeenCalledWith('foo.channel');
  expect(errorListenerB.mock).toHaveBeenCalledTimes(1);
  expect(errorListenerB.mock).toHaveBeenCalledWith(new Error('boo'));
});
