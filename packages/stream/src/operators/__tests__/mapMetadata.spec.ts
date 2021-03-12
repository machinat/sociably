import moxy from '@moxyjs/moxy';
import { makeContainer, createEmptyScope } from '@machinat/core/service';
import Subject from '../../subject';
import { STREAMING_KEY_I } from '../../interface';
import mapMetadata from '../mapMetadata';

const nextTick = () => new Promise(process.nextTick);

const nextListener = moxy();
const nextContainer = moxy(
  makeContainer({ deps: [STREAMING_KEY_I] })(() => nextListener)
);

const oldScope = moxy(createEmptyScope(), {});
const newScope = moxy(createEmptyScope(), {});

beforeEach(() => {
  nextListener.mock.clear();
  nextContainer.mock.clear();
  oldScope.mock.clear();
  newScope.mock.clear();
});

test('map with new value, key and scope', async () => {
  const mapper = moxy(() => ({
    value: 'bar',
    key: 'bar.channel',
    scope: newScope,
  }));
  const subject = new Subject();
  subject.pipe(mapMetadata(mapper)).subscribe(nextContainer);

  subject.next({ scope: oldScope, value: 'foo', key: 'foo.channel' });
  await nextTick();

  expect(mapper.mock).toHaveBeenCalledTimes(1);
  expect(mapper.mock).toHaveBeenCalledWith({
    value: 'foo',
    key: 'foo.channel',
    scope: oldScope,
  });

  expect(nextContainer.mock).toHaveBeenCalledTimes(1);
  expect(nextContainer.mock).toHaveBeenCalledWith('bar.channel');
  expect(nextListener.mock).toHaveBeenCalledTimes(1);
  expect(nextListener.mock).toHaveBeenCalledWith('bar');

  expect(oldScope.injectContainer.mock).not.toHaveBeenCalled();
  expect(newScope.injectContainer.mock).toHaveBeenCalledTimes(1);
});

test('with async mapper function', async () => {
  const mapper = moxy(async () => ({
    value: 'bar',
    key: 'bar.channel',
    scope: newScope,
  }));
  const subject = new Subject();
  subject.pipe(mapMetadata(mapper)).subscribe(nextContainer);

  subject.next({ scope: oldScope, value: 'foo', key: 'foo.channel' });
  await nextTick();

  expect(mapper.mock).toHaveBeenCalledTimes(1);
  expect(mapper.mock).toHaveBeenCalledWith({
    value: 'foo',
    key: 'foo.channel',
    scope: oldScope,
  });

  expect(nextContainer.mock).toHaveBeenCalledTimes(1);
  expect(nextContainer.mock).toHaveBeenCalledWith('bar.channel');
  expect(nextListener.mock).toHaveBeenCalledTimes(1);
  expect(nextListener.mock).toHaveBeenCalledWith('bar');

  expect(oldScope.injectContainer.mock).not.toHaveBeenCalled();
  expect(newScope.injectContainer.mock).toHaveBeenCalledTimes(1);
});

test('with async mapper container', async () => {
  const mapFn = moxy(async () => ({
    value: 'bar',
    key: 'bar.channel',
    scope: newScope,
  }));
  const mapContainer = moxy(
    makeContainer({ deps: [STREAMING_KEY_I] })(() => mapFn)
  );

  const subject = new Subject();
  subject
    .pipe(mapMetadata(mapContainer))
    .subscribe(nextContainer, console.error);

  subject.next({ scope: oldScope, value: 'foo', key: 'foo.channel' });
  await nextTick();

  expect(mapContainer.mock).toHaveBeenCalledTimes(1);
  expect(mapContainer.mock).toHaveBeenCalledWith('foo.channel');
  expect(mapFn.mock).toHaveBeenCalledTimes(1);
  expect(mapFn.mock).toHaveBeenCalledWith({
    scope: oldScope,
    value: 'foo',
    key: 'foo.channel',
  });

  expect(nextContainer.mock).toHaveBeenCalledTimes(1);
  expect(nextContainer.mock).toHaveBeenCalledWith('bar.channel');
  expect(nextListener.mock).toHaveBeenCalledTimes(1);
  expect(nextListener.mock).toHaveBeenCalledWith('bar');

  expect(oldScope.injectContainer.mock).toHaveBeenCalledTimes(1);
  expect(newScope.injectContainer.mock).toHaveBeenCalledTimes(1);
});

it('transmit error down', () => {
  const errorListener = moxy();
  const errorContainer = moxy(
    makeContainer({ deps: [STREAMING_KEY_I] })(() => errorListener)
  );

  const subject = new Subject();
  subject
    .pipe(
      mapMetadata(() => ({
        value: 'bar',
        key: 'bar.channel',
        scope: createEmptyScope(),
      }))
    )
    .subscribe(null, errorContainer);

  subject.error({
    value: new Error('boo'),
    scope: createEmptyScope(),
    key: 'foo.channel',
  });

  expect(errorContainer.mock).toHaveBeenCalledTimes(1);
  expect(errorContainer.mock).toHaveBeenCalledWith('foo.channel');
  expect(errorListener.mock).toHaveBeenCalledTimes(1);
  expect(errorListener.mock).toHaveBeenCalledWith(new Error('boo'));
});
