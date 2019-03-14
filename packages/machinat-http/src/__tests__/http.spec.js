import moxy from 'moxy';
import { connect, connectByRoutes } from '../http';

describe('connect(bot)', () => {
  const bot = {
    adaptor: {
      handleRequest: moxy(),
    },
  };

  beforeEach(() => {
    bot.adaptor.handleRequest.mock.clear();
  });

  it('proxy request and response to bot.adaptor.handleRequest()', () => {
    const req = moxy({});
    const res = moxy({});

    const callback = connect(bot);

    expect(callback(req, res)).toBe(undefined);
    expect(bot.adaptor.handleRequest.mock).toHaveBeenCalledTimes(1);
    expect(bot.adaptor.handleRequest.mock).toHaveBeenCalledWith(req, res);
  });
});

describe('connectByRoutes(mapping)', () => {
  const _bot = {
    adaptor: {
      handleRequest: () => {},
    },
  };

  const fooBot = moxy(_bot);
  const barBot = moxy(_bot);
  const fooBazBot = moxy(_bot);
  const barBazBot = moxy(_bot);

  const mapping = {
    '/foo': fooBot,
    '/bar': barBot,
    '/foo/baz': fooBazBot,
    '/bar/baz': barBazBot,
  };

  beforeEach(() => {
    Object.values(mapping).forEach(bot => {
      bot.adaptor.handleRequest.mock.clear();
    });
  });

  it.each([
    ['/foo', fooBot],
    ['/bar', barBot],
    ['/foo/baz', fooBazBot],
    ['/bar/baz', barBazBot],
    ['/foo?x=y&a=b', fooBot],
    ['http://machinat.io/foo', fooBot],
    ['https://machinat.io/foo/baz', fooBazBot],
    ['https://machinat.io/bar/baz?c=d&y=z', barBazBot],
  ])('proxy request and response to coresonded bot', (url, expectedBot) => {
    const req = moxy({ url });
    const res = moxy({});

    const callback = connectByRoutes(mapping);

    expect(callback(req, res)).toBe(undefined);
    expect(expectedBot.adaptor.handleRequest.mock).toHaveBeenCalledTimes(1);
    expect(expectedBot.adaptor.handleRequest.mock).toHaveBeenCalledWith(
      req,
      res
    );

    Object.values(mapping).forEach(bot => {
      if (bot !== expectedBot) {
        expect(bot.adaptor.handleRequest.mock).not.toHaveBeenCalled();
      }
    });
  });
});
