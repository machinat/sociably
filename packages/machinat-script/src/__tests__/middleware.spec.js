import moxy from 'moxy';
import { processInterceptor } from '../processor';
import interceptProcessingScript from '../middleware';

jest.mock('../processor', () =>
  jest.requireActual('moxy').default({
    processInterceptor: () => async () => null,
  })
);

const interceptEvent = moxy(async () => null);
processInterceptor.mock.fakeReturnValue(interceptEvent);

const sessionStore = moxy();
const libs = [{ fake: 'Script1' }, { fake: 'Script2' }, { fake: 'Script3' }];

const next = moxy(async () => ({ foo: 'bar' }));

beforeEach(() => {
  next.mock.clear();
  processInterceptor.mock.clear();
  interceptEvent.mock.reset();
});

it('not pass the event if interceptor resolve null', async () => {
  const intercept = interceptProcessingScript(sessionStore, libs)(next);
  await expect(intercept({ hello: 'world' })).resolves.toBe(null);

  expect(processInterceptor.mock).toHaveBeenCalledTimes(1);
  expect(processInterceptor.mock).toHaveBeenCalledWith(sessionStore, libs);

  expect(interceptEvent.mock).toHaveBeenCalledTimes(1);
  expect(interceptEvent.mock).toHaveBeenCalledWith({ hello: 'world' });

  expect(next.mock).not.toHaveBeenCalled();
});

it('pass the new frame interceptor resolve', async () => {
  interceptEvent.mock.fake(async frame => ({ ...frame, processed: true }));

  const intercept = interceptProcessingScript(sessionStore, libs)(next);
  await expect(intercept({ hello: 'world' })).resolves.toEqual({ foo: 'bar' });

  expect(processInterceptor.mock).toHaveBeenCalledTimes(1);
  expect(processInterceptor.mock).toHaveBeenCalledWith(sessionStore, libs);
  expect(interceptEvent.mock).toHaveBeenCalledTimes(1);
  expect(interceptEvent.mock).toHaveBeenCalledWith({ hello: 'world' });

  expect(next.mock).toHaveBeenCalledTimes(1);
  expect(next.mock).toHaveBeenCalledWith({
    hello: 'world',
    processed: true,
  });
});
