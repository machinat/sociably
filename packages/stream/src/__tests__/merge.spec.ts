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
  expect(eventListener.mock).toHaveBeenCalledTimes(1);
  expect(eventListener.mock).toHaveBeenNthCalledWith(1, 'FOOA');
  expect(eventContainer.$$factory.mock).toHaveBeenCalledWith('foo.chan');

  sourceB.next({ scope: createEmptyScope(), value: 'FOOB', key: 'foo.chan' });
  expect(eventListener.mock).toHaveBeenCalledTimes(2);
  expect(eventListener.mock).toHaveBeenNthCalledWith(2, 'FOOB');
  expect(eventContainer.$$factory.mock).toHaveBeenCalledWith('foo.chan');

  sourceC.next({ scope: createEmptyScope(), value: 'FOOC', key: undefined });
  expect(eventListener.mock).toHaveBeenCalledTimes(3);
  expect(eventListener.mock).toHaveBeenNthCalledWith(3, 'FOOC');
  expect(eventContainer.$$factory.mock).toHaveBeenCalledWith(undefined);

  sourceB.next({ scope: createEmptyScope(), value: 'BARB', key: 'bar.chan' });
  expect(eventListener.mock).toHaveBeenCalledTimes(4);
  expect(eventListener.mock).toHaveBeenNthCalledWith(4, 'BARB');
  expect(eventContainer.$$factory.mock).toHaveBeenCalledWith('bar.chan');

  sourceA.next({ scope: createEmptyScope(), value: 'BAZA', key: 'baz.chan' });
  expect(eventListener.mock).toHaveBeenCalledTimes(5);
  expect(eventListener.mock).toHaveBeenNthCalledWith(5, 'BAZA');
  expect(eventContainer.$$factory.mock).toHaveBeenCalledWith('baz.chan');
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
  expect(errorListener.mock).toHaveBeenCalledTimes(1);
  expect(errorListener.mock).toHaveBeenNthCalledWith(1, new Error('boo'));
  expect(errorContainer.$$factory.mock).toHaveBeenCalledWith('foo.chan');

  sourceB.error({
    scope: createEmptyScope(),
    value: new Error('beer'),
    key: 'bar.chan',
  });
  expect(errorListener.mock).toHaveBeenCalledTimes(2);
  expect(errorListener.mock).toHaveBeenNthCalledWith(2, new Error('beer'));
  expect(errorContainer.$$factory.mock).toHaveBeenCalledWith('bar.chan');

  sourceC.error({
    scope: createEmptyScope(),
    value: new Error('bbq'),
    key: undefined,
  });
  expect(errorListener.mock).toHaveBeenCalledTimes(3);
  expect(errorListener.mock).toHaveBeenNthCalledWith(3, new Error('bbq'));
  expect(errorContainer.$$factory.mock).toHaveBeenCalledWith(undefined);
});
