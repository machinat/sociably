import moxy from '@moxyjs/moxy';
import { makeContainer, createEmptyScope } from '@machinat/core/service';
import Subject from '../subject';
import { STREAMING_KEY_I } from '../interface';

describe('#subscribe()', () => {
  it('emit event and error', () => {
    const subject = new Subject();
    const nextListener = moxy();
    const errorListener = moxy();

    subject.subscribe(nextListener, errorListener);

    subject.next({
      scope: createEmptyScope(),
      value: 'foo',
      key: 'foo.channel',
    });
    expect(nextListener.mock).toHaveBeenCalledTimes(1);
    expect(nextListener.mock).toHaveBeenCalledWith('foo');

    subject.error({
      scope: createEmptyScope(),
      value: new Error('boo'),
      key: undefined,
    });
    expect(errorListener.mock).toHaveBeenCalledTimes(1);
    expect(errorListener.mock).toHaveBeenCalledWith(new Error('boo'));

    subject.next({
      scope: createEmptyScope(),
      value: 'bar',
      key: 'bar.channel',
    });
    expect(nextListener.mock).toHaveBeenCalledTimes(2);
    expect(nextListener.mock).toHaveBeenCalledWith('bar');
  });

  test('subscribe with container', () => {
    const subject = new Subject();
    const nextListener = moxy();
    const nextContainer = moxy(
      makeContainer({ deps: [STREAMING_KEY_I] })(() => nextListener)
    );
    const errorListener = moxy();
    const errorContainer = moxy(
      makeContainer({ deps: [STREAMING_KEY_I] })(() => errorListener)
    );

    subject.subscribe(nextContainer, errorContainer);

    subject.next({
      scope: createEmptyScope(),
      value: 'foo',
      key: 'foo.channel',
    });
    expect(nextContainer.$$factory.mock).toHaveBeenCalledTimes(1);
    expect(nextContainer.$$factory.mock).toHaveBeenCalledWith('foo.channel');
    expect(nextListener.mock).toHaveBeenCalledTimes(1);
    expect(nextListener.mock).toHaveBeenCalledWith('foo');

    subject.error({
      scope: createEmptyScope(),
      value: new Error('boo'),
      key: undefined,
    });
    expect(errorContainer.$$factory.mock).toHaveBeenCalledTimes(1);
    expect(errorContainer.$$factory.mock).toHaveBeenCalledWith(undefined);
    expect(errorListener.mock).toHaveBeenCalledTimes(1);
    expect(errorListener.mock).toHaveBeenCalledWith(new Error('boo'));

    subject.next({
      scope: createEmptyScope(),
      value: 'bar',
      key: 'bar.channel',
    });
    expect(nextContainer.$$factory.mock).toHaveBeenCalledTimes(2);
    expect(nextContainer.$$factory.mock).toHaveBeenCalledWith('bar.channel');
    expect(nextListener.mock).toHaveBeenCalledTimes(2);
    expect(nextListener.mock).toHaveBeenCalledWith('bar');
  });
});

test('#pipe() make a subjects chain with operator functions', () => {
  const source = new Subject();

  const operators = [
    moxy(() => new Subject()),
    moxy(() => new Subject()),
    moxy(() => new Subject()),
  ];

  const destination = source.pipe(...operators);
  expect(destination).toBeInstanceOf(Subject);

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
  it('emit error', () => {
    const subject = new Subject();
    const errorListener = moxy();

    subject.catch(errorListener);

    subject.next({
      scope: createEmptyScope(),
      value: 'foo',
      key: 'foo.channel',
    });

    subject.error({
      scope: createEmptyScope(),
      value: new Error('boo'),
      key: undefined,
    });
    expect(errorListener.mock).toHaveBeenCalledTimes(1);
    expect(errorListener.mock).toHaveBeenCalledWith(new Error('boo'));
  });

  test('with container', () => {
    const subject = new Subject();
    const errorListener = moxy();
    const errorContainer = moxy(
      makeContainer({ deps: [STREAMING_KEY_I] })(() => errorListener)
    );

    subject.catch(errorContainer);

    subject.next({
      scope: createEmptyScope(),
      value: 'foo',
      key: 'foo.channel',
    });

    subject.error({
      scope: createEmptyScope(),
      value: new Error('boo'),
      key: undefined,
    });
    expect(errorContainer.$$factory.mock).toHaveBeenCalledTimes(1);
    expect(errorContainer.$$factory.mock).toHaveBeenCalledWith(undefined);
    expect(errorListener.mock).toHaveBeenCalledTimes(1);
    expect(errorListener.mock).toHaveBeenCalledWith(new Error('boo'));
  });

  it('throw if no error subscriber when #error()', () => {
    const subject = new Subject();
    const nextContainer = moxy();
    subject.subscribe(nextContainer);

    expect(() =>
      subject.error({
        scope: createEmptyScope(),
        key: undefined,
        value: new Error('BOOM'),
      })
    ).toThrow('BOOM');
  });
});