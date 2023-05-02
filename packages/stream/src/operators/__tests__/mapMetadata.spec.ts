import moxy from '@moxyjs/moxy';
import { serviceContainer, createEmptyScope } from '@sociably/core/service';
import Stream from '../../stream';
import { STREAMING_KEY_I } from '../../interface';
import mapMetadata from '../mapMetadata';

const nextTick = () => new Promise(process.nextTick);

const nextListener = moxy();
const nextContainer = moxy(
  serviceContainer({ deps: [STREAMING_KEY_I] })(() => nextListener)
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
    key: 'bar.thread',
    scope: newScope,
  }));
  const stream = new Stream();
  stream.pipe(mapMetadata(mapper)).subscribe(nextContainer);

  stream.next({ scope: oldScope, value: 'foo', key: 'foo.thread' });
  await nextTick();

  expect(mapper).toHaveBeenCalledTimes(1);
  expect(mapper).toHaveBeenCalledWith({
    value: 'foo',
    key: 'foo.thread',
    scope: oldScope,
  });

  expect(nextContainer.$$factory).toHaveBeenCalledTimes(1);
  expect(nextContainer.$$factory).toHaveBeenCalledWith('bar.thread');
  expect(nextListener).toHaveBeenCalledTimes(1);
  expect(nextListener).toHaveBeenCalledWith('bar');

  expect(oldScope.injectContainer).not.toHaveBeenCalled();
  expect(newScope.injectContainer).toHaveBeenCalledTimes(1);
});

test('with async mapper function', async () => {
  const mapper = moxy(async () => ({
    value: 'bar',
    key: 'bar.thread',
    scope: newScope,
  }));
  const stream = new Stream();
  stream.pipe(mapMetadata(mapper)).subscribe(nextContainer);

  stream.next({ scope: oldScope, value: 'foo', key: 'foo.thread' });
  await nextTick();

  expect(mapper).toHaveBeenCalledTimes(1);
  expect(mapper).toHaveBeenCalledWith({
    value: 'foo',
    key: 'foo.thread',
    scope: oldScope,
  });

  expect(nextContainer.$$factory).toHaveBeenCalledTimes(1);
  expect(nextContainer.$$factory).toHaveBeenCalledWith('bar.thread');
  expect(nextListener).toHaveBeenCalledTimes(1);
  expect(nextListener).toHaveBeenCalledWith('bar');

  expect(oldScope.injectContainer).not.toHaveBeenCalled();
  expect(newScope.injectContainer).toHaveBeenCalledTimes(1);
});

test('with async mapper container', async () => {
  const mapFn = moxy(async () => ({
    value: 'bar',
    key: 'bar.thread',
    scope: newScope,
  }));
  const mapContainer = moxy(
    serviceContainer({ deps: [STREAMING_KEY_I] })(() => mapFn)
  );

  const stream = new Stream();
  stream.pipe(mapMetadata(mapContainer)).subscribe(nextContainer);

  stream.next({ scope: oldScope, value: 'foo', key: 'foo.thread' });
  await nextTick();

  expect(mapContainer.$$factory).toHaveBeenCalledTimes(1);
  expect(mapContainer.$$factory).toHaveBeenCalledWith('foo.thread');
  expect(mapFn).toHaveBeenCalledTimes(1);
  expect(mapFn).toHaveBeenCalledWith({
    scope: oldScope,
    value: 'foo',
    key: 'foo.thread',
  });

  expect(nextContainer.$$factory).toHaveBeenCalledTimes(1);
  expect(nextContainer.$$factory).toHaveBeenCalledWith('bar.thread');
  expect(nextListener).toHaveBeenCalledTimes(1);
  expect(nextListener).toHaveBeenCalledWith('bar');

  expect(oldScope.injectContainer).toHaveBeenCalledTimes(1);
  expect(newScope.injectContainer).toHaveBeenCalledTimes(1);
});

it('transmit error down', () => {
  const errorListener = moxy();
  const errorContainer = moxy(
    serviceContainer({ deps: [STREAMING_KEY_I] })(() => errorListener)
  );

  const source$ = new Stream();
  source$
    .pipe(
      mapMetadata(() => ({
        value: 'bar',
        key: 'bar.thread',
        scope: createEmptyScope(),
      }))
    )
    .catch(errorContainer);

  source$.error({
    value: new Error('boo'),
    scope: createEmptyScope(),
    key: 'foo.thread',
  });

  expect(errorContainer.$$factory).toHaveBeenCalledTimes(1);
  expect(errorContainer.$$factory).toHaveBeenCalledWith('foo.thread');
  expect(errorListener).toHaveBeenCalledTimes(1);
  expect(errorListener).toHaveBeenCalledWith(new Error('boo'));
});
