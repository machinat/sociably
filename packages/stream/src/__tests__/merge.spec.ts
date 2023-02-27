import { makeContainer, createEmptyScope } from '@sociably/core/service';
import moxy from '@moxyjs/moxy';
import Stream from '../stream';
import merge from '../merge';
import { STREAMING_KEY_I } from '../interface';

it('merge events form  streams', () => {
  const sourceA = new Stream();
  const sourceB = new Stream();
  const sourceC = new Stream();
  const eventListener = moxy();
  const eventContainer = moxy(
    makeContainer({ deps: [STREAMING_KEY_I] })(() => eventListener)
  );

  const destination = merge(sourceA, sourceB, sourceC);
  destination.subscribe(eventContainer);

  sourceA.next({ scope: createEmptyScope(), value: 'FOOA', key: 'foo.chan' });
  expect(eventListener).toHaveBeenCalledTimes(1);
  expect(eventListener).toHaveBeenNthCalledWith(1, 'FOOA');
  expect(eventContainer.$$factory).toHaveBeenCalledWith('foo.chan');

  sourceB.next({ scope: createEmptyScope(), value: 'FOOB', key: 'foo.chan' });
  expect(eventListener).toHaveBeenCalledTimes(2);
  expect(eventListener).toHaveBeenNthCalledWith(2, 'FOOB');
  expect(eventContainer.$$factory).toHaveBeenCalledWith('foo.chan');

  sourceC.next({ scope: createEmptyScope(), value: 'FOOC', key: undefined });
  expect(eventListener).toHaveBeenCalledTimes(3);
  expect(eventListener).toHaveBeenNthCalledWith(3, 'FOOC');
  expect(eventContainer.$$factory).toHaveBeenCalledWith(undefined);

  sourceB.next({ scope: createEmptyScope(), value: 'BARB', key: 'bar.chan' });
  expect(eventListener).toHaveBeenCalledTimes(4);
  expect(eventListener).toHaveBeenNthCalledWith(4, 'BARB');
  expect(eventContainer.$$factory).toHaveBeenCalledWith('bar.chan');

  sourceA.next({ scope: createEmptyScope(), value: 'BAZA', key: 'baz.chan' });
  expect(eventListener).toHaveBeenCalledTimes(5);
  expect(eventListener).toHaveBeenNthCalledWith(5, 'BAZA');
  expect(eventContainer.$$factory).toHaveBeenCalledWith('baz.chan');
});

it('merge errors form streams', () => {
  const sourceA = new Stream();
  const sourceB = new Stream();
  const sourceC = new Stream();
  const errorListener = moxy();
  const errorContainer = moxy(
    makeContainer({ deps: [STREAMING_KEY_I] })(() => errorListener)
  );

  const destination = merge(sourceA, sourceB, sourceC);
  destination.catch(errorContainer);

  sourceA.error({
    scope: createEmptyScope(),
    value: new Error('boo'),
    key: 'foo.chan',
  });
  expect(errorListener).toHaveBeenCalledTimes(1);
  expect(errorListener).toHaveBeenNthCalledWith(1, new Error('boo'));
  expect(errorContainer.$$factory).toHaveBeenCalledWith('foo.chan');

  sourceB.error({
    scope: createEmptyScope(),
    value: new Error('beer'),
    key: 'bar.chan',
  });
  expect(errorListener).toHaveBeenCalledTimes(2);
  expect(errorListener).toHaveBeenNthCalledWith(2, new Error('beer'));
  expect(errorContainer.$$factory).toHaveBeenCalledWith('bar.chan');

  sourceC.error({
    scope: createEmptyScope(),
    value: new Error('bbq'),
    key: undefined,
  });
  expect(errorListener).toHaveBeenCalledTimes(3);
  expect(errorListener).toHaveBeenNthCalledWith(3, new Error('bbq'));
  expect(errorContainer.$$factory).toHaveBeenCalledWith(undefined);
});
