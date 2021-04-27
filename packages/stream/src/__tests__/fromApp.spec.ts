import moxy from '@moxyjs/moxy';
import { MachinatApp } from '@machinat/core';
import {
  isServiceContainer,
  makeContainer,
  ServiceScope,
} from '@machinat/core/service';
import { STREAMING_KEY_I } from '../interface';
import fromApp from '../fromApp';

const scope = moxy({
  injectContainer(container, provisions) {
    return container(provisions.get(STREAMING_KEY_I));
  },
});

const app = moxy<MachinatApp<any, any>>({
  onError() {
    return undefined;
  },
  onEvent() {
    return undefined;
  },
} as never);

beforeEach(() => {
  scope.mock.reset();
  app.mock.reset();
});

it('emit events from app.onEvent()', () => {
  const event$ = fromApp(app);
  const nextListener = moxy();

  event$.subscribe(nextListener);

  expect(app.onEvent.mock).toHaveBeenCalledTimes(1);
  expect(app.onEvent.mock).toHaveBeenCalledWith(expect.any(Function));

  const handlerEventContainer = app.onEvent.mock.calls[0].args[0];
  expect(isServiceContainer(handlerEventContainer)).toBe(true);
  expect(handlerEventContainer.$$deps).toEqual([
    { require: ServiceScope, optional: false },
  ]);

  const eventCtx1 = {
    platform: 'test',
    event: {
      category: 'bar',
      type: 'open',
      channel: { uid: 'foo.channel' },
      user: { uid: 'john_doe' },
    },
  };

  handlerEventContainer(scope)(eventCtx1);

  expect(nextListener.mock).toHaveBeenCalledTimes(1);
  expect(nextListener.mock).toHaveBeenCalledWith(eventCtx1);

  const eventCtx2 = {
    platform: 'test',
    event: {
      category: 'bar',
      type: 'close',
      channel: { uid: 'foo.channel' },
      user: { uid: 'john_doe' },
    },
  };

  handlerEventContainer(scope)(eventCtx2);

  expect(nextListener.mock).toHaveBeenCalledTimes(2);
  expect(nextListener.mock).toHaveBeenCalledWith(eventCtx2);
});

test('transmit scope and use channel.uid as the key', () => {
  const event$ = fromApp(app);
  const nextListener = moxy();
  const nextContainer = moxy(
    makeContainer({ deps: [STREAMING_KEY_I] })(() => nextListener)
  );

  event$.subscribe(nextContainer);

  const handlerEventContainer = app.onEvent.mock.calls[0].args[0];

  const eventCtx1 = {
    platform: 'test',
    event: {
      category: 'bar',
      type: 'open',
      channel: { uid: 'foo.channel' },
      user: { uid: 'john_doe' },
    },
  };

  handlerEventContainer(scope)(eventCtx1);

  expect(nextContainer.mock).toHaveBeenCalledTimes(1);
  expect(nextContainer.mock).toHaveBeenCalledWith('foo.channel');
  expect(nextListener.mock).toHaveBeenCalledTimes(1);
  expect(nextListener.mock).toHaveBeenCalledWith(eventCtx1);
  expect(scope.injectContainer.mock).toHaveBeenCalledTimes(1);

  const eventCtx2 = {
    platform: 'test',
    event: {
      category: 'bar',
      type: 'close',
      channel: { uid: 'baz.channel' },
      user: { uid: 'john_doe' },
    },
  };

  handlerEventContainer(scope)(eventCtx2);

  expect(nextContainer.mock).toHaveBeenCalledTimes(2);
  expect(nextContainer.mock).toHaveBeenCalledWith('baz.channel');
  expect(nextListener.mock).toHaveBeenCalledTimes(2);
  expect(nextListener.mock).toHaveBeenCalledWith(eventCtx2);
  expect(scope.injectContainer.mock).toHaveBeenCalledTimes(2);
});

it('emit error from app.onError()', () => {
  const event$ = fromApp(app);
  const errorListener = moxy();

  event$.catch(errorListener);

  expect(app.onError.mock).toHaveBeenCalledTimes(1);
  expect(app.onError.mock).toHaveBeenCalledWith(expect.any(Function));

  const handlerEventContainer = app.onError.mock.calls[0].args[0];
  expect(isServiceContainer(handlerEventContainer)).toBe(true);
  expect(handlerEventContainer.$$deps).toEqual([
    { require: ServiceScope, optional: false },
  ]);

  const error = new Error('boo');
  handlerEventContainer(scope)(error);

  expect(errorListener.mock).toHaveBeenCalledTimes(1);
  expect(errorListener.mock).toHaveBeenCalledWith(error);

  const error2 = new Error('BOOO');
  handlerEventContainer(scope)(error2);

  expect(errorListener.mock).toHaveBeenCalledTimes(2);
  expect(errorListener.mock).toHaveBeenCalledWith(error2);
});

test('transmit scope and empty key', () => {
  const event$ = fromApp(app);
  const errorListener = moxy();
  const errorContainer = moxy(
    makeContainer({ deps: [STREAMING_KEY_I] })(() => errorListener)
  );

  event$.catch(errorContainer);

  const handlerEventContainer = app.onError.mock.calls[0].args[0];

  const error1 = new Error('It is a mistake');
  handlerEventContainer(scope)(error1);

  expect(errorContainer.mock).toHaveBeenCalledTimes(1);
  expect(errorContainer.mock).toHaveBeenCalledWith(undefined);
  expect(errorListener.mock).toHaveBeenCalledTimes(1);
  expect(errorListener.mock).toHaveBeenCalledWith(error1);
  expect(scope.injectContainer.mock).toHaveBeenCalledTimes(1);

  const error2 = new Error('It is another mistake');
  handlerEventContainer(scope)(error2);

  expect(errorContainer.mock).toHaveBeenCalledTimes(2);
  expect(errorContainer.mock).toHaveBeenCalledWith(undefined);
  expect(errorListener.mock).toHaveBeenCalledTimes(2);
  expect(errorListener.mock).toHaveBeenCalledWith(error2);
  expect(scope.injectContainer.mock).toHaveBeenCalledTimes(2);
});
