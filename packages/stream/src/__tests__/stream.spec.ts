import moxy from '@moxyjs/moxy';
import { makeContainer, createEmptyScope } from '@machinat/core/service';
import Stream from '../stream';
import { STREAMING_KEY_I } from '../interface';

describe('#subscribe()', () => {
  it('emit event', () => {
    const stream = new Stream();
    const eventListener = moxy();

    stream.subscribe(eventListener);

    stream.next({
      scope: createEmptyScope(),
      value: 'foo',
      key: 'foo.channel',
    });
    expect(eventListener.mock).toHaveBeenCalledTimes(1);
    expect(eventListener.mock).toHaveBeenCalledWith('foo');

    stream.next({
      scope: createEmptyScope(),
      value: 'bar',
      key: 'bar.channel',
    });
    expect(eventListener.mock).toHaveBeenCalledTimes(2);
    expect(eventListener.mock).toHaveBeenCalledWith('bar');
  });

  test('subscribe with container', () => {
    const stream = new Stream();
    const eventListener = moxy();
    const nextContainer = moxy(
      makeContainer({ deps: [STREAMING_KEY_I] })(() => eventListener)
    );

    stream.subscribe(nextContainer);

    stream.next({
      scope: createEmptyScope(),
      value: 'foo',
      key: 'foo.channel',
    });
    expect(nextContainer.$$factory.mock).toHaveBeenCalledTimes(1);
    expect(nextContainer.$$factory.mock).toHaveBeenCalledWith('foo.channel');
    expect(eventListener.mock).toHaveBeenCalledTimes(1);
    expect(eventListener.mock).toHaveBeenCalledWith('foo');

    stream.next({
      scope: createEmptyScope(),
      value: 'bar',
      key: 'bar.channel',
    });
    expect(nextContainer.$$factory.mock).toHaveBeenCalledTimes(2);
    expect(nextContainer.$$factory.mock).toHaveBeenCalledWith('bar.channel');
    expect(eventListener.mock).toHaveBeenCalledTimes(2);
    expect(eventListener.mock).toHaveBeenCalledWith('bar');
  });

  it('catch error from subscriber', () => {
    const stream = new Stream();
    const eventListener = moxy(() => {
      throw new Error('boom');
    });
    const errorListener = moxy();
    const defaultCatcher = moxy();

    stream.subscribe(eventListener, errorListener).catch(defaultCatcher);

    stream.next({
      scope: createEmptyScope(),
      value: 'foo',
      key: 'foo.channel',
    });

    expect(eventListener.mock).toHaveBeenCalledTimes(1);
    expect(errorListener.mock).toHaveBeenCalledTimes(1);
    expect(errorListener.mock).toHaveBeenCalledWith(new Error('boom'));
    expect(defaultCatcher.mock).not.toHaveBeenCalled();
  });
});

test('#pipe()', () => {
  const source = new Stream();

  const operators = [
    moxy(() => new Stream()),
    moxy(() => new Stream()),
    moxy(() => new Stream()),
  ];

  const destination = source.pipe(...operators);
  expect(destination).toBeInstanceOf(Stream);

  expect(operators[0].mock).toHaveBeenCalledTimes(1);
  expect(operators[1].mock).toHaveBeenCalledTimes(1);
  expect(operators[2].mock).toHaveBeenCalledTimes(1);

  expect(operators[0].mock.calls[0].result).toBe(
    operators[1].mock.calls[0].args[0]
  );
  expect(operators[1].mock.calls[0].result).toBe(
    operators[2].mock.calls[0].args[0]
  );
  expect(operators[2].mock.calls[0].result).toBe(destination);
});

describe('#catch()', () => {
  it('emit error from source', () => {
    const stream = new Stream();
    const errorListener = moxy();

    stream.catch(errorListener);

    stream.next({
      scope: createEmptyScope(),
      value: 'foo',
      key: 'foo.channel',
    });

    stream.error({
      scope: createEmptyScope(),
      value: new Error('boo'),
      key: undefined,
    });
    expect(errorListener.mock).toHaveBeenCalledTimes(1);
    expect(errorListener.mock).toHaveBeenCalledWith(new Error('boo'));
  });

  it('emit error from subscriber', () => {
    const stream = new Stream();
    const eventListener = moxy(() => {
      throw new Error('boom');
    });
    const errorListener = moxy();

    stream.subscribe(eventListener).catch(errorListener);

    stream.next({
      scope: createEmptyScope(),
      value: 'foo',
      key: 'foo.channel',
    });

    expect(eventListener.mock).toHaveBeenCalledTimes(1);
    expect(errorListener.mock).toHaveBeenCalledTimes(1);
    expect(errorListener.mock).toHaveBeenCalledWith(new Error('boom'));
  });

  test('with container', () => {
    const stream = new Stream();
    const errorListener = moxy();
    const errorContainer = moxy(
      makeContainer({ deps: [STREAMING_KEY_I] })(() => errorListener)
    );

    stream.catch(errorContainer);

    stream.next({
      scope: createEmptyScope(),
      value: 'foo',
      key: 'foo.channel',
    });

    stream.error({
      scope: createEmptyScope(),
      value: new Error('boo'),
      key: undefined,
    });
    expect(errorContainer.$$factory.mock).toHaveBeenCalledTimes(1);
    expect(errorContainer.$$factory.mock).toHaveBeenCalledWith(undefined);
    expect(errorListener.mock).toHaveBeenCalledTimes(1);
    expect(errorListener.mock).toHaveBeenCalledWith(new Error('boo'));
  });

  test('throw if no error subscriber exists', () => {
    const stream = new Stream();
    const nextContainer = moxy();
    stream.subscribe(nextContainer);

    expect(() => {
      stream.error({
        scope: createEmptyScope(),
        key: undefined,
        value: new Error('BOOM'),
      });
    }).toThrow('BOOM');
  });
});
