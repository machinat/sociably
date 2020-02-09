import Symbol$observable from 'symbol-observable';
import moxy from 'moxy';
import Emitter from '../emitter';

it('issue event frame', () => {
  const emitter = new Emitter();

  const eventListener = moxy();
  expect(emitter.onEvent(eventListener)).toBe(emitter);

  const frame = {
    event: { a: 'phonecall' },
    channel: { super: 'slam' },
    metadata: { champ: 'Johnnnnn Ceeeena!' },
  };

  expect(emitter.emitEvent(frame)).toBe(undefined);
  expect(eventListener.mock).toHaveBeenCalledTimes(1);
  expect(eventListener.mock).toHaveBeenCalledWith(frame);

  expect(emitter.removeEventListener(eventListener)).toBe(true);

  expect(emitter.emitEvent(frame)).toBe(undefined);
  expect(eventListener.mock).toHaveBeenCalledTimes(1);

  expect(emitter.removeEventListener(eventListener)).toBe(false);
});

it('emit error thrown', () => {
  const emitter = new Emitter();
  const errorListener = moxy();
  expect(emitter.onError(errorListener)).toBe(emitter);

  expect(emitter.emitError(new Error('NO'))).toBe(undefined);
  expect(errorListener.mock).toHaveBeenCalledTimes(1);
  expect(errorListener.mock).toHaveBeenCalledWith(new Error('NO'));

  expect(emitter.removeErrorListener(errorListener)).toBe(true);

  expect(() => emitter.emitError(new Error('NO'))).toThrow();
  expect(errorListener.mock).toHaveBeenCalledTimes(1);

  expect(emitter.removeErrorListener(errorListener)).toBe(false);
});

it('is observable', () => {
  const emitter = new Emitter();

  const observable = emitter[Symbol$observable]();
  const observer = {
    next: moxy(),
    error: moxy(),
  };

  const subscription = observable.subscribe(observer);

  const frame = {
    channel: { foo: ' bar' },
    event: { hello: 'world' },
    metadat: { love: 'peace' },
  };

  emitter.emitEvent(frame);
  expect(observer.next.mock).toHaveBeenCalledTimes(1);
  expect(observer.next.mock).toHaveBeenCalledWith(frame);

  emitter.emitError(new Error('NOOO'));
  expect(observer.error.mock).toHaveBeenCalledTimes(1);
  expect(observer.error.mock).toHaveBeenCalledWith(new Error('NOOO'));

  subscription.unsubscribe();

  emitter.emitEvent({ foo: ' bar' }, { hello: 'world' }, { love: 'peace' });
  expect(observer.next.mock).toHaveBeenCalledTimes(1);
});
