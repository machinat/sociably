import moxy from '@moxyjs/moxy';
import { SociablyApp } from '@sociably/core';
import {
  isServiceContainer,
  serviceContainer,
  ServiceScope,
} from '@sociably/core/service';
import { STREAMING_KEY_I } from '../interface.js';
import fromApp from '../fromApp.js';

const scope = moxy({
  injectContainer(container, provisions) {
    return container(provisions.get(STREAMING_KEY_I));
  },
});

const app = moxy<SociablyApp<any, any>>({
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

  expect(app.onEvent).toHaveBeenCalledTimes(1);
  expect(app.onEvent).toHaveBeenCalledWith(expect.any(Function));

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
      thread: { uid: 'foo.thread' },
      user: { uid: 'john_doe' },
    },
  };

  handlerEventContainer(scope)(eventCtx1);

  expect(nextListener).toHaveBeenCalledTimes(1);
  expect(nextListener).toHaveBeenCalledWith(eventCtx1);

  const eventCtx2 = {
    platform: 'test',
    event: {
      category: 'bar',
      type: 'close',
      thread: { uid: 'foo.thread' },
      user: { uid: 'john_doe' },
    },
  };

  handlerEventContainer(scope)(eventCtx2);

  expect(nextListener).toHaveBeenCalledTimes(2);
  expect(nextListener).toHaveBeenCalledWith(eventCtx2);
});

test('transmit scope and use thread.uid as the key', () => {
  const event$ = fromApp(app);
  const nextListener = moxy();
  const nextContainer = moxy(
    serviceContainer({ deps: [STREAMING_KEY_I] })(() => nextListener),
  );

  event$.subscribe(nextContainer);

  const handlerEventContainer = app.onEvent.mock.calls[0].args[0];

  const eventCtx1 = {
    platform: 'test',
    event: {
      category: 'bar',
      type: 'open',
      thread: { uid: 'foo.thread' },
      user: { uid: 'john_doe' },
    },
  };

  handlerEventContainer(scope)(eventCtx1);

  expect(nextContainer).toHaveBeenCalledTimes(1);
  expect(nextContainer).toHaveBeenCalledWith('foo.thread');
  expect(nextListener).toHaveBeenCalledTimes(1);
  expect(nextListener).toHaveBeenCalledWith(eventCtx1);
  expect(scope.injectContainer).toHaveBeenCalledTimes(1);

  const eventCtx2 = {
    platform: 'test',
    event: {
      category: 'bar',
      type: 'close',
      thread: { uid: 'baz.thread' },
      user: { uid: 'john_doe' },
    },
  };

  handlerEventContainer(scope)(eventCtx2);

  expect(nextContainer).toHaveBeenCalledTimes(2);
  expect(nextContainer).toHaveBeenCalledWith('baz.thread');
  expect(nextListener).toHaveBeenCalledTimes(2);
  expect(nextListener).toHaveBeenCalledWith(eventCtx2);
  expect(scope.injectContainer).toHaveBeenCalledTimes(2);
});

it('emit error from app.onError()', () => {
  const event$ = fromApp(app);
  const errorListener = moxy();

  event$.catch(errorListener);

  expect(app.onError).toHaveBeenCalledTimes(1);
  expect(app.onError).toHaveBeenCalledWith(expect.any(Function));

  const handlerEventContainer = app.onError.mock.calls[0].args[0];
  expect(isServiceContainer(handlerEventContainer)).toBe(true);
  expect(handlerEventContainer.$$deps).toEqual([
    { require: ServiceScope, optional: false },
  ]);

  const error = new Error('boo');
  handlerEventContainer(scope)(error);

  expect(errorListener).toHaveBeenCalledTimes(1);
  expect(errorListener).toHaveBeenCalledWith(error);

  const error2 = new Error('BOOO');
  handlerEventContainer(scope)(error2);

  expect(errorListener).toHaveBeenCalledTimes(2);
  expect(errorListener).toHaveBeenCalledWith(error2);
});

test('transmit scope and empty key', () => {
  const event$ = fromApp(app);
  const errorListener = moxy();
  const errorContainer = moxy(
    serviceContainer({ deps: [STREAMING_KEY_I] })(() => errorListener),
  );

  event$.catch(errorContainer);

  const handlerEventContainer = app.onError.mock.calls[0].args[0];

  const error1 = new Error('It is a mistake');
  handlerEventContainer(scope)(error1);

  expect(errorContainer).toHaveBeenCalledTimes(1);
  expect(errorContainer).toHaveBeenCalledWith(undefined);
  expect(errorListener).toHaveBeenCalledTimes(1);
  expect(errorListener).toHaveBeenCalledWith(error1);
  expect(scope.injectContainer).toHaveBeenCalledTimes(1);

  const error2 = new Error('It is another mistake');
  handlerEventContainer(scope)(error2);

  expect(errorContainer).toHaveBeenCalledTimes(2);
  expect(errorContainer).toHaveBeenCalledWith(undefined);
  expect(errorListener).toHaveBeenCalledTimes(2);
  expect(errorListener).toHaveBeenCalledWith(error2);
  expect(scope.injectContainer).toHaveBeenCalledTimes(2);
});
