import moxy from '@moxyjs/moxy';
import { makeContainer, createEmptyScope } from '@sociably/core/service';
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
    expect(eventListener).toHaveBeenCalledTimes(1);
    expect(eventListener).toHaveBeenCalledWith('foo');

    stream.next({
      scope: createEmptyScope(),
      value: 'bar',
      key: 'bar.channel',
    });
    expect(eventListener).toHaveBeenCalledTimes(2);
    expect(eventListener).toHaveBeenCalledWith('bar');
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
    expect(nextContainer.$$factory).toHaveBeenCalledTimes(1);
    expect(nextContainer.$$factory).toHaveBeenCalledWith('foo.channel');
    expect(eventListener).toHaveBeenCalledTimes(1);
    expect(eventListener).toHaveBeenCalledWith('foo');

    stream.next({
      scope: createEmptyScope(),
      value: 'bar',
      key: 'bar.channel',
    });
    expect(nextContainer.$$factory).toHaveBeenCalledTimes(2);
    expect(nextContainer.$$factory).toHaveBeenCalledWith('bar.channel');
    expect(eventListener).toHaveBeenCalledTimes(2);
    expect(eventListener).toHaveBeenCalledWith('bar');
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

    expect(eventListener).toHaveBeenCalledTimes(1);
    expect(errorListener).toHaveBeenCalledTimes(1);
    expect(errorListener).toHaveBeenCalledWith(new Error('boom'));
    expect(defaultCatcher).not.toHaveBeenCalled();
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

  expect(operators[0]).toHaveBeenCalledTimes(1);
  expect(operators[1]).toHaveBeenCalledTimes(1);
  expect(operators[2]).toHaveBeenCalledTimes(1);

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
    expect(errorListener).toHaveBeenCalledTimes(1);
    expect(errorListener).toHaveBeenCalledWith(new Error('boo'));
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

    expect(eventListener).toHaveBeenCalledTimes(1);
    expect(errorListener).toHaveBeenCalledTimes(1);
    expect(errorListener).toHaveBeenCalledWith(new Error('boom'));
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
    expect(errorContainer.$$factory).toHaveBeenCalledTimes(1);
    expect(errorContainer.$$factory).toHaveBeenCalledWith(undefined);
    expect(errorListener).toHaveBeenCalledTimes(1);
    expect(errorListener).toHaveBeenCalledWith(new Error('boo'));
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
