import { makeContainer, createEmptyScope } from '@machinat/core/service';
import moxy from '@moxyjs/moxy';
import Subject from '../subject';
import merge from '../merge';
import { STREAMING_KEY_I } from '../interface';

it('merge events form two subjects', () => {
  const sourceA = new Subject();
  const sourceB = new Subject();
  const eventListener = moxy();
  const eventContainer = moxy(
    makeContainer({ deps: [STREAMING_KEY_I] })(() => eventListener)
  );

  const destination = merge(sourceA, sourceB);
  destination.subscribe(eventContainer);

  sourceA.next({ scope: createEmptyScope(), value: 'FOO', key: 'foo.channel' });
  expect(eventListener.mock).toHaveBeenCalledTimes(1);
  expect(eventListener.mock).toHaveBeenNthCalledWith(1, 'FOO');
  expect(eventContainer.mock).toHaveBeenCalledWith('foo.channel');

  sourceB.next({ scope: createEmptyScope(), value: 'FOO', key: 'foo.channel' });
  expect(eventListener.mock).toHaveBeenCalledTimes(2);
  expect(eventListener.mock).toHaveBeenNthCalledWith(2, 'FOO');

  sourceB.next({ scope: createEmptyScope(), value: 'BAR', key: 'bar.channel' });
  expect(eventListener.mock).toHaveBeenCalledTimes(3);
  expect(eventListener.mock).toHaveBeenNthCalledWith(3, 'BAR');
  expect(eventContainer.mock).toHaveBeenCalledWith('bar.channel');

  sourceA.next({ scope: createEmptyScope(), value: 'BAZ', key: 'baz.channel' });
  expect(eventListener.mock).toHaveBeenCalledTimes(4);
  expect(eventListener.mock).toHaveBeenNthCalledWith(4, 'BAZ');
  expect(eventContainer.mock).toHaveBeenCalledWith('baz.channel');
});

it('merge errors form two subjects', () => {
  const sourceA = new Subject();
  const sourceB = new Subject();
  const errorListener = moxy();
  const errorContainer = moxy(
    makeContainer({ deps: [STREAMING_KEY_I] })(() => errorListener)
  );

  const destination = merge(sourceA, sourceB);
  destination.subscribe(null, errorContainer);

  sourceA.error({
    scope: createEmptyScope(),
    value: new Error('boo'),
    key: 'foo.channel',
  });
  expect(errorListener.mock).toHaveBeenCalledTimes(1);
  expect(errorListener.mock).toHaveBeenNthCalledWith(1, new Error('boo'));
  expect(errorContainer.mock).toHaveBeenCalledWith('foo.channel');

  sourceB.error({
    scope: createEmptyScope(),
    value: new Error('beer'),
    key: 'bar.channel',
  });
  expect(errorListener.mock).toHaveBeenCalledTimes(2);
  expect(errorListener.mock).toHaveBeenNthCalledWith(2, new Error('beer'));
  expect(errorContainer.mock).toHaveBeenCalledWith('bar.channel');
});
