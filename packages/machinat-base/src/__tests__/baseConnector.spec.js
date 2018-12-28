import EventEmitter from 'events';
import BaseConnector from '../baseConnector';

describe('BaseConnector', () => {
  it('is a constructor', () => {
    expect(typeof BaseConnector).toBe('function');
    expect(() => new BaseConnector()).not.toThrow();
  });

  it('inheritate EventEmitter', () => {
    expect(BaseConnector.prototype instanceof EventEmitter).toBe(true);
  });
});

describe('#constructor()', () => {
  it('inits .middlewares', () => {
    expect(new BaseConnector().middlewares).toEqual([]);
  });
});

describe('#use(middleware)', () => {
  it('throws if non function passed', () => {
    const connector = new BaseConnector();
    const invalidParams = [undefined, null, 1, true, 'foo', {}];
    invalidParams.forEach(p => expect(() => connector.use(p)).toThrow());
  });

  it('returns the connector itself', () => {
    const connector = new BaseConnector();
    expect(connector.use(async () => {})).toBe(connector);
  });

  it('adds middleware function to .middlewares', () => {
    const connector = new BaseConnector();

    const middleware1 = async () => {};
    const middleware2 = async () => {};
    const middleware3 = async () => {};

    connector
      .use(middleware1)
      .use(middleware2)
      .use(middleware3);

    expect(connector.middlewares).toEqual([
      middleware1,
      middleware2,
      middleware3,
    ]);
  });
});

describe('#createHandler()', () => {
  it('returns a function that compose all the middlewares together', async () => {
    const connector = new BaseConnector();

    const middleware1 = jest.fn(async (_, next) => next());
    const middleware2 = jest.fn(async (_, next) => {
      expect(middleware1).toHaveBeenCalled();
      return next();
    });
    const middleware3 = jest.fn(async (_, next) => {
      expect(middleware2).toHaveBeenCalled();
      return next();
    });

    connector
      .use(middleware1)
      .use(middleware2)
      .use(middleware3);

    const fn = connector.createHandler();

    const context = { foo: 'bar' };
    await fn(context);

    expect(middleware1).toHaveBeenCalledTimes(1);
    expect(middleware2).toHaveBeenCalledTimes(1);
    expect(middleware3).toHaveBeenCalledTimes(1);

    expect(middleware1.mock.calls[0][0]).toBe(context);
    expect(middleware2.mock.calls[0][0]).toBe(context);
    expect(middleware3.mock.calls[0][0]).toBe(context);

    expect(typeof middleware1.mock.calls[0][1]).toBe('function');
    expect(typeof middleware2.mock.calls[0][1]).toBe('function');
    expect(typeof middleware3.mock.calls[0][1]).toBe('function');
  });
});

describe('#handleEvent(contexts, fn)', () => {
  it('map all contexts to fn', () => {
    const connector = new BaseConnector();
    const contexts = [{ x: 1 }, { x: 2 }, { x: 3 }];
    const fn = jest.fn(x => x);

    const promise = connector.handleEvents(contexts, fn);
    expect(promise).toBeInstanceOf(Promise);
    expect(promise).resolves.toEqual(contexts);

    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn).toHaveBeenNthCalledWith(1, { x: 1 });
    expect(fn).toHaveBeenNthCalledWith(2, { x: 2 });
    expect(fn).toHaveBeenNthCalledWith(3, { x: 3 });
  });
});
