import moxy from 'moxy';
import { of } from 'rxjs';
import { processInterceptor } from '../../processor';
import processScriptOperator from '../rx';

jest.mock('../../processor', () =>
  jest.requireActual('moxy').default({
    processInterceptor: () => async () => null,
  })
);

const delay = t => new Promise(resolve => setTimeout(resolve, t));

const interceptEvent = moxy(async () => null);
processInterceptor.mock.fakeReturnValue(interceptEvent);

const observer = moxy({
  next() {},
  error() {},
  complete() {},
});

const sessionStore = moxy();
const libs = [{ fake: 'Script1' }, { fake: 'Script2' }, { fake: 'Script3' }];

const frames = [
  { channel: { uid: 'foo' }, id: 0 },
  { channel: { uid: 'bar' }, id: 1 },
  { channel: { uid: 'foo' }, id: 2 },
  { channel: { uid: 'baz' }, id: 3 },
  { channel: { uid: 'foo' }, id: 4 },
];

beforeEach(() => {
  processInterceptor.mock.clear();
  observer.mock.clear();
  interceptEvent.mock.reset();
});

it('not pass the event if interceptor resolve null', async () => {
  of(...frames)
    .pipe(processScriptOperator(sessionStore, libs))
    .subscribe(observer);

  expect(processInterceptor.mock).toHaveBeenCalledTimes(1);
  expect(processInterceptor.mock).toHaveBeenCalledWith(sessionStore, libs);

  await delay();
  expect(interceptEvent.mock).toHaveBeenCalledTimes(5);
  // should process frame in order by channel
  expect(interceptEvent.mock).toHaveBeenNthCalledWith(1, frames[0]); // foo
  expect(interceptEvent.mock).toHaveBeenNthCalledWith(2, frames[1]); // bar
  expect(interceptEvent.mock).toHaveBeenNthCalledWith(3, frames[3]); // baz
  expect(interceptEvent.mock).toHaveBeenNthCalledWith(4, frames[2]); // foo
  expect(interceptEvent.mock).toHaveBeenNthCalledWith(5, frames[4]); // foo

  expect(observer.next.mock).not.toHaveBeenCalled();
  expect(observer.error.mock).not.toHaveBeenCalled();
  expect(observer.complete.mock).toHaveBeenCalled();
});

it('pass the new frame interceptor resolve', async () => {
  interceptEvent.mock.fake(async frame => ({ ...frame, processed: true }));

  of(...frames)
    .pipe(processScriptOperator(sessionStore, libs))
    .subscribe(observer.next, observer.error, observer.complete);

  expect(processInterceptor.mock).toHaveBeenCalledTimes(1);

  await delay();
  expect(interceptEvent.mock).toHaveBeenCalledTimes(5);

  expect(observer.next.mock).toHaveBeenCalledTimes(5);
  // should call next by process order
  expect(observer.next.mock).toHaveBeenNthCalledWith(1, {
    ...frames[0],
    processed: true,
  });
  expect(observer.next.mock).toHaveBeenNthCalledWith(2, {
    ...frames[1],
    processed: true,
  });
  expect(observer.next.mock).toHaveBeenNthCalledWith(3, {
    ...frames[3],
    processed: true,
  });
  expect(observer.next.mock).toHaveBeenNthCalledWith(4, {
    ...frames[2],
    processed: true,
  });
  expect(observer.next.mock).toHaveBeenNthCalledWith(5, {
    ...frames[4],
    processed: true,
  });

  expect(observer.error.mock).not.toHaveBeenCalled();
  expect(observer.complete.mock).toHaveBeenCalled();
});

it('pass error if process thrown', async () => {
  let i = -1;
  interceptEvent.mock.fake(async frame => {
    i += 1;
    if (i === 1 || i === 2) {
      throw new Error('Something wrong!!!');
    }
    if (i === 3 || i === 4) {
      return { ...frame, processed: true };
    }
    return null;
  });

  of(...frames)
    .pipe(processScriptOperator(sessionStore, libs))
    .subscribe(observer.next, observer.error, observer.complete);

  expect(processInterceptor.mock).toHaveBeenCalledTimes(1);

  await delay(10);
  expect(interceptEvent.mock).toHaveBeenCalledTimes(5);

  expect(observer.next.mock).toHaveBeenCalledTimes(4);
  expect(observer.error.mock).not.toHaveBeenCalled();
  expect(observer.complete.mock).toHaveBeenCalled();
});
