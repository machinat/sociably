import moxy from '@moxyjs/moxy';
import { makeContainer, createEmptyScope } from '@sociably/core/service';
import Stream from '../../stream';
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
  const stream = new Stream();
  stream.pipe(mapMetadata(mapper)).subscribe(nextContainer);

  stream.next({ scope: oldScope, value: 'foo', key: 'foo.channel' });
  await nextTick();

  expect(mapper.mock).toHaveBeenCalledTimes(1);
  expect(mapper.mock).toHaveBeenCalledWith({
    value: 'foo',
    key: 'foo.channel',
    scope: oldScope,
  });

  expect(nextContainer.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(nextContainer.$$factory.mock).toHaveBeenCalledWith('bar.channel');
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
  const stream = new Stream();
  stream.pipe(mapMetadata(mapper)).subscribe(nextContainer);

  stream.next({ scope: oldScope, value: 'foo', key: 'foo.channel' });
  await nextTick();

  expect(mapper.mock).toHaveBeenCalledTimes(1);
  expect(mapper.mock).toHaveBeenCalledWith({
    value: 'foo',
    key: 'foo.channel',
    scope: oldScope,
  });

  expect(nextContainer.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(nextContainer.$$factory.mock).toHaveBeenCalledWith('bar.channel');
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

  const stream = new Stream();
  stream.pipe(mapMetadata(mapContainer)).subscribe(nextContainer);

  stream.next({ scope: oldScope, value: 'foo', key: 'foo.channel' });
  await nextTick();

  expect(mapContainer.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(mapContainer.$$factory.mock).toHaveBeenCalledWith('foo.channel');
  expect(mapFn.mock).toHaveBeenCalledTimes(1);
  expect(mapFn.mock).toHaveBeenCalledWith({
    scope: oldScope,
    value: 'foo',
    key: 'foo.channel',
  });

  expect(nextContainer.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(nextContainer.$$factory.mock).toHaveBeenCalledWith('bar.channel');
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

  const source$ = new Stream();
  source$
    .pipe(
      mapMetadata(() => ({
        value: 'bar',
        key: 'bar.channel',
        scope: createEmptyScope(),
      }))
    )
    .catch(errorContainer);

  source$.error({
    value: new Error('boo'),
    scope: createEmptyScope(),
    key: 'foo.channel',
  });

  expect(errorContainer.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(errorContainer.$$factory.mock).toHaveBeenCalledWith('foo.channel');
  expect(errorListener.mock).toHaveBeenCalledTimes(1);
  expect(errorListener.mock).toHaveBeenCalledWith(new Error('boo'));
});
