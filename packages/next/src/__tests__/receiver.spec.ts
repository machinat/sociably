import { parse as parseUrl } from 'url';
import {
  createEmptyScope,
  serviceContainer,
  ServiceScope,
} from '@sociably/core/service';
import moxy from '@moxyjs/moxy';
import type createNextApp from 'next';
import { IncomingMessage, ServerResponse } from 'http';
import { NextReceiver } from '../receiver';

const nextDefaultHandler = moxy(async () => {});

const nextApp = moxy<ReturnType<typeof createNextApp>>({
  getRequestHandler: () => nextDefaultHandler,
  prepare: async () => {},
  close: async () => {},
  render: async () => {},
  renderError: async () => {},
  setAssetPrefix() {},
  options: { assetPrefix: '' },
} as never);

const nextTick = () => new Promise((resolve) => process.nextTick(resolve));

const handleRequest = moxy(() => ({ ok: true as const }));
const initScope = moxy(createEmptyScope);
const popError = moxy();

const req = moxy<IncomingMessage>({
  method: 'GET',
  url: 'http://sociably.io/hello?foo=bar',
  headers: { 'x-y-z': 'abc' },
} as never);
let res;

beforeEach(() => {
  nextDefaultHandler.mock.clear();
  nextApp.mock.reset();
  req.mock.reset();
  res = moxy(new ServerResponse(req));

  handleRequest.mock.reset();
  initScope.mock.reset();
  popError.mock.reset();
});

it('respond 503 if request received before prepared', async () => {
  const receiver = new NextReceiver(nextApp, {
    noPrepare: false,
    handleRequest,
  });

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(res.statusCode).toBe(503);
  expect(res.end).toHaveBeenCalledTimes(1);

  expect(nextApp.renderError).not.toHaveBeenCalled();
  expect(handleRequest).not.toHaveBeenCalled();
});

describe('.prepare()', () => {
  test('call nextServer.prepare()', async () => {
    const receiver = new NextReceiver(nextApp);
    expect(nextApp.prepare).not.toHaveBeenCalled();

    await receiver.prepare();

    expect(nextApp.prepare).toHaveBeenCalledTimes(1);
  });

  test('make no call if noPrepare is true', async () => {
    const receiver = new NextReceiver(nextApp, { noPrepare: true });
    await receiver.prepare();

    expect(nextApp.prepare).not.toHaveBeenCalled();
  });
});

test('.close() call nextServer.close()', async () => {
  const receiver = new NextReceiver(nextApp);
  await receiver.close();

  expect(nextApp.close).toHaveBeenCalledTimes(1);
});

test('handle http request', async () => {
  const receiver = new NextReceiver(nextApp, {
    noPrepare: true,
    popError,
    handleRequest,
  });
  await receiver.prepare();

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(res.statusCode).toBe(200);

  expect(nextApp.renderError).not.toHaveBeenCalled();
  expect(nextApp.render).not.toHaveBeenCalled();

  expect(nextDefaultHandler).toHaveBeenCalledTimes(1);
  expect(nextDefaultHandler).toHaveBeenCalledWith(req, res, expect.any(Object));
  expect(nextDefaultHandler.mock.calls[0].args[2]).toMatchInlineSnapshot(`
    Url {
      "auth": null,
      "hash": null,
      "host": "sociably.io",
      "hostname": "sociably.io",
      "href": "http://sociably.io/hello?foo=bar",
      "path": "/hello?foo=bar",
      "pathname": "/hello",
      "port": null,
      "protocol": "http:",
      "query": Object {
        "foo": "bar",
      },
      "search": "?foo=bar",
      "slashes": true,
    }
  `);

  expect(handleRequest).toHaveBeenCalledTimes(1);
  expect(handleRequest).toHaveBeenCalledWith({
    method: 'GET',
    url: 'http://sociably.io/hello?foo=bar',
    route: '/hello',
    headers: { 'x-y-z': 'abc' },
  });
});

test('with entryPath', async () => {
  const receiver = new NextReceiver(nextApp, {
    noPrepare: true,
    entryPath: '/hello',
    popError,
    handleRequest,
  });
  await receiver.prepare();

  req.mock.getter('url').fakeReturnValue('http://sociably.io/hello/world');
  receiver.handleRequest(req, res);
  await nextTick();

  expect(nextApp.renderError).not.toHaveBeenCalled();
  expect(nextApp.render).not.toHaveBeenCalled();

  expect(nextDefaultHandler).toHaveBeenCalledTimes(1);
  expect(nextDefaultHandler).toHaveBeenCalledWith(
    req,
    res,
    parseUrl('http://sociably.io/hello/world', true)
  );

  expect(handleRequest).toHaveBeenCalledTimes(1);
  expect(handleRequest).toHaveBeenCalledWith({
    method: 'GET',
    url: 'http://sociably.io/hello/world',
    route: '/world',
    headers: { 'x-y-z': 'abc' },
  });
});

it('respond 404 if entryPath not match', async () => {
  const receiver = new NextReceiver(nextApp, {
    noPrepare: true,
    entryPath: '/hello',
    popError,
    handleRequest,
  });
  await receiver.prepare();

  req.mock.getter('url').fakeReturnValue('http://sociably.io/foo/world');

  receiver.handleRequest(req, res);
  await nextTick();

  expect(handleRequest).not.toHaveBeenCalled();
  expect(nextApp.render).not.toHaveBeenCalled();
  expect(nextDefaultHandler).not.toHaveBeenCalled();

  expect(nextApp.render).not.toHaveBeenCalled();
  expect(nextApp.renderError).toHaveBeenCalledTimes(1);
  expect(nextApp.renderError).toHaveBeenCalledWith(
    null,
    req,
    res,
    '/foo/world',
    {}
  );

  expect(res.mock.setter('statusCode')).toHaveBeenCalledTimes(1);
  expect(res.mock.setter('statusCode')).toHaveBeenCalledWith(404);
});

test('customized headers returned by handleRequest', async () => {
  handleRequest.mock.fake(async () => ({
    ok: true,
    headers: { 'x-foo': 'foo', 'x-bar': 'bar' },
  }));

  const receiver = new NextReceiver(nextApp, {
    noPrepare: true,
    popError,
    handleRequest,
  });
  await receiver.prepare();

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(handleRequest).toHaveBeenCalledTimes(1);
  expect(handleRequest).toHaveBeenCalledWith({
    method: 'GET',
    url: 'http://sociably.io/hello?foo=bar',
    route: '/hello',
    headers: { 'x-y-z': 'abc' },
  });

  expect(res.statusCode).toBe(200);
  expect(res.getHeaders()).toEqual({ 'x-foo': 'foo', 'x-bar': 'bar' });
});

it('call next.render() with page/query returned by handleRequest', async () => {
  const receiver = new NextReceiver(nextApp, {
    noPrepare: true,
    popError,
    handleRequest,
  });
  await receiver.prepare();

  handleRequest.mock.fake(async () => ({
    ok: true,
    page: '/hello/world',
    query: { foo: 'bar' },
    headers: { 'x-y-z': 'a_b_c' },
  }));

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(handleRequest).toHaveReturnedTimes(1);
  expect(handleRequest.mock.calls[0].args[0]).toMatchSnapshot();

  expect(nextDefaultHandler).not.toHaveBeenCalled();
  expect(nextApp.renderError).not.toHaveBeenCalled();

  expect(nextApp.render).toHaveBeenCalledTimes(1);
  expect(nextApp.render).toHaveBeenCalledWith(
    req,
    res,
    '/hello/world',
    { foo: 'bar' },
    expect.any(Object)
  );

  expect(nextApp.render.mock.calls[0].args[4]).toMatchInlineSnapshot(`
    Url {
      "auth": null,
      "hash": null,
      "host": "sociably.io",
      "hostname": "sociably.io",
      "href": "http://sociably.io/hello?foo=bar",
      "path": "/hello?foo=bar",
      "pathname": "/hello",
      "port": null,
      "protocol": "http:",
      "query": Object {
        "foo": "bar",
      },
      "search": "?foo=bar",
      "slashes": true,
    }
  `);

  expect(handleRequest).toHaveBeenCalledTimes(1);
  expect(handleRequest).toHaveBeenCalledWith({
    method: 'GET',
    url: 'http://sociably.io/hello?foo=bar',
    route: '/hello',
    headers: { 'x-y-z': 'abc' },
  });

  expect(res.statusCode).toBe(200);
  expect(res.getHeaders()).toEqual({ 'x-y-z': 'a_b_c' });
});

test('use service container for handleRequest', async () => {
  const handleRequestFn = moxy(() => ({ ok: true as const, page: '/foo' }));
  const useRequestHandler = moxy(() => handleRequestFn);

  const receiver = new NextReceiver(nextApp, {
    noPrepare: true,
    popError,
    initScope,
    handleRequest: serviceContainer({ deps: [ServiceScope] })(
      useRequestHandler
    ),
  });
  await receiver.prepare();

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(initScope).toHaveBeenCalledTimes(1);
  expect(useRequestHandler).toHaveReturnedTimes(1);
  expect(useRequestHandler).toHaveBeenCalledWith(
    initScope.mock.calls[0].result
  );

  expect(nextDefaultHandler).not.toHaveBeenCalled();
  expect(nextApp.renderError).not.toHaveBeenCalled();

  expect(nextApp.render).toHaveBeenCalledTimes(1);
  expect(nextApp.render).toHaveBeenCalledWith(
    req,
    res,
    '/foo',
    { foo: 'bar' },
    expect.any(Object)
  );

  expect(handleRequestFn).toHaveBeenCalledTimes(1);
  expect(handleRequestFn).toHaveBeenCalledWith({
    method: 'GET',
    url: 'http://sociably.io/hello?foo=bar',
    route: '/hello',
    headers: { 'x-y-z': 'abc' },
  });

  expect(res.statusCode).toBe(200);
});

it('call next.renderError() handleRequest return not ok', async () => {
  const receiver = new NextReceiver(nextApp, {
    noPrepare: true,
    popError,
    handleRequest,
  });
  await receiver.prepare();

  handleRequest.mock.fake(async () => ({
    ok: false,
    code: 418,
    reason: "I'm a teapot",
  }));

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(handleRequest).toHaveBeenCalledTimes(1);
  expect(handleRequest.mock.calls[0].args[0]).toMatchSnapshot();

  expect(nextApp.render).not.toHaveBeenCalled();
  expect(nextDefaultHandler).not.toHaveBeenCalled();

  expect(nextApp.renderError).toHaveBeenCalledTimes(1);
  expect(nextApp.renderError).toHaveBeenCalledWith(
    new Error("I'm a teapot"),
    req,
    res,
    '/hello',
    { foo: 'bar' }
  );

  expect(res.mock.setter('statusCode')).toHaveBeenCalledWith(418);
  expect(popError).not.toHaveBeenCalled();
});

it('call next.renderError() with customized headers return by handleRequest', async () => {
  const receiver = new NextReceiver(nextApp, {
    noPrepare: true,
    popError,
    handleRequest,
  });
  await receiver.prepare();

  handleRequest.mock.fake(async () => ({
    ok: false,
    code: 418,
    reason: "I'm a teapot",
    headers: { 'x-x-x': 't-e-a-p-o-t' },
  }));

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(nextApp.renderError).toHaveBeenCalledWith(
    new Error("I'm a teapot"),
    req,
    res,
    '/hello',
    { foo: 'bar' }
  );

  expect(res.mock.setter('statusCode')).toHaveBeenCalledTimes(1);
  expect(res.mock.setter('statusCode')).toHaveBeenCalledWith(418);
  expect(res.setHeader).toHaveBeenCalledTimes(1);
  expect(res.setHeader).toHaveBeenCalledWith('x-x-x', 't-e-a-p-o-t');
});

it('pass "_next" api calls to next directly', async () => {
  const receiver = new NextReceiver(nextApp, {
    noPrepare: true,
    entryPath: '/hello',
    popError,
    handleRequest,
  });
  await receiver.prepare();

  req.mock.getter('url').fakeReturnValue('http://sociably.io/hello/_next/xxx');

  receiver.handleRequest(req, res);
  await nextTick();

  expect(handleRequest).not.toHaveBeenCalled();
  expect(nextApp.render).not.toHaveBeenCalled();
  expect(nextApp.renderError).not.toHaveBeenCalled();

  expect(nextDefaultHandler).toHaveBeenCalledTimes(1);
  expect(nextDefaultHandler).toHaveBeenCalledWith(req, res, expect.any(Object));
  const parsedUrl = nextDefaultHandler.mock.calls[0].args[2];
  expect(parsedUrl.path).toBe('/hello/_next/xxx');
  expect(parsedUrl.pathname).toBe('/hello/_next/xxx');
});

test('entryPath does not affect page params from middlewares', async () => {
  const receiver = new NextReceiver(nextApp, {
    noPrepare: true,
    entryPath: '/hello',
    popError,
    handleRequest,
  });
  await receiver.prepare();

  handleRequest.mock.fake(async () => ({
    ok: true,
    page: '/hello/world',
    query: { foo: 'bar' },
  }));

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(nextApp.render).toHaveBeenCalledTimes(1);
  expect(nextApp.render).toHaveBeenCalledWith(
    req,
    res,
    '/hello/world',
    { foo: 'bar' },
    expect.any(Object)
  );
});

it('call next.renderError() if middlewares reject', async () => {
  const receiver = new NextReceiver(nextApp, {
    noPrepare: true,
    popError,
    handleRequest,
  });
  await receiver.prepare();

  handleRequest.mock.fake(async () => {
    throw new Error("I'm a teapot");
  });

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(handleRequest).toHaveBeenCalledTimes(1);

  expect(nextApp.render).not.toHaveBeenCalled();
  expect(nextDefaultHandler).not.toHaveBeenCalled();

  expect(nextApp.renderError).toHaveBeenCalledTimes(1);
  expect(nextApp.renderError).toHaveBeenCalledWith(
    new Error("I'm a teapot"),
    req,
    res,
    '/hello',
    { foo: 'bar' }
  );

  expect(res.mock.setter('statusCode')).toHaveBeenCalledWith(500);

  expect(popError).toHaveBeenCalledTimes(1);
  expect(popError).toHaveBeenCalledWith(new Error("I'm a teapot"));
});

it('pass hmr upgrade request to next server', async () => {
  const receiver = new NextReceiver(nextApp, {
    noPrepare: true,
    entryPath: '/hello',
    popError,
    handleRequest,
  });
  await receiver.prepare();

  const socket = moxy({ write: () => {}, destroy: () => {} });

  receiver.handleHmrUpgrade(req, socket as never, Buffer.from(''), {
    originalPath: '/hello/_next/webpack-hmr',
    matchedPath: '/hello',
    trailingPath: '_next/webpack-hmr',
  });
  await nextTick();

  expect(nextDefaultHandler).toHaveBeenCalledWith(
    req,
    expect.any(ServerResponse)
  );
  expect(socket.write).not.toHaveBeenCalled();
  expect(socket.destroy).not.toHaveBeenCalled();

  receiver.handleHmrUpgrade(req, socket as never, Buffer.from(''), {
    originalPath: '/hello/_next/wrong-path',
    matchedPath: '/hello',
    trailingPath: '_next/wrong-path',
  });
  await nextTick();

  expect(socket.destroy).toHaveBeenCalledTimes(1);
  expect(socket.write).toHaveBeenCalledTimes(1);
  expect(socket.write.mock.calls[0].args[0]).toMatchInlineSnapshot(`
    "HTTP/1.1 404 Not Found
    Connection: close
    Content-Type: text/html
    Content-Length: 9

    Not Found"
  `);

  expect(nextDefaultHandler).toHaveBeenCalledTimes(1);
  expect(handleRequest).not.toHaveBeenCalled();
  expect(nextApp.render).not.toHaveBeenCalled();
  expect(nextApp.renderError).not.toHaveBeenCalled();
});
