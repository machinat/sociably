import moxy from 'moxy';
import { IncomingMessage } from 'http';
import Router from '../router';
import { path } from '../requestMatcher';

describe('#provide()', () => {
  const _bot = {};
  const fooBot = moxy(_bot);
  const barBot = moxy(_bot);
  const defaultBot = moxy(_bot);

  let router;

  const req = moxy(new IncomingMessage());

  beforeEach(() => {
    router = new Router();
    router.route(path('/foo'), fooBot);
    router.route(path('/bar'), barBot);

    req.mock.clear();
  });

  it('returns provider which provide corresonded bot', () => {
    const provider = router.provide();

    req.mock.getter('url').fakeReturnValue('/foo');
    expect(provider(req)).toBe(fooBot);

    req.mock.getter('url').fakeReturnValue('/bar');
    expect(provider(req)).toBe(barBot);

    req.mock.getter('url').fakeReturnValue('/baz');
    expect(provider(req)).toBe(undefined);
  });

  it('returns default bot if set when no matcher matched', () => {
    router.default(defaultBot);

    const provider = router.provide();

    req.mock.getter('url').fakeReturnValue('/foo');
    expect(provider(req)).toBe(fooBot);

    req.mock.getter('url').fakeReturnValue('/bar');
    expect(provider(req)).toBe(barBot);

    req.mock.getter('url').fakeReturnValue('/baz');
    expect(provider(req)).toBe(defaultBot);
  });

  test('setup after provide() called not effected to previouse provider', () => {
    const provider = router.provide();
    router.route(path('/foooo'), fooBot);
    router.route(path('/barrr'), barBot);
    router.default(defaultBot);

    req.mock.getter('url').fakeReturnValue('/foo');
    expect(provider(req)).toBe(fooBot);
    req.mock.getter('url').fakeReturnValue('/bar');
    expect(provider(req)).toBe(barBot);

    req.mock.getter('url').fakeReturnValue('/baz');
    expect(provider(req)).toBe(undefined);
    req.mock.getter('url').fakeReturnValue('/foooo');
    expect(provider(req)).toBe(undefined);
    req.mock.getter('url').fakeReturnValue('/barrr');
    expect(provider(req)).toBe(undefined);

    const newProvider = router.provide();

    req.mock.getter('url').fakeReturnValue('/baz');
    expect(newProvider(req)).toBe(defaultBot);
    req.mock.getter('url').fakeReturnValue('/foooo');
    expect(newProvider(req)).toBe(fooBot);
    req.mock.getter('url').fakeReturnValue('/barrr');
    expect(newProvider(req)).toBe(barBot);
  });
});
