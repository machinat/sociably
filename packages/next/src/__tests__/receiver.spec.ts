import { parse as parseUrl } from 'url';
import {
  createEmptyScope,
  makeContainer,
  ServiceScope,
} from '@machinat/core/service';
import moxy from '@moxyjs/moxy';
import type createNextApp from 'next';
import { IncomingMessage, ServerResponse } from 'http';
import { NextReceiver } from '../receiver';

const nextDefaultHandler = moxy();

const nextApp = moxy<ReturnType<typeof createNextApp>>({
  getRequestHandler: () => nextDefaultHandler,
  prepare: async () => {},
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
  url: 'http://machinat.com/hello?foo=bar',
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
  expect(res.end.mock).toHaveBeenCalledTimes(1);

  expect(nextApp.renderError.mock).not.toHaveBeenCalled();
  expect(handleRequest.mock).not.toHaveBeenCalled();
});

test('#prepare() call next.prepare()', async () => {
  const receiver = new NextReceiver(nextApp, { noPrepare: false });
  expect(nextApp.prepare.mock).not.toHaveBeenCalled();

  await receiver.prepare();

  expect(nextApp.prepare.mock).toHaveBeenCalledTimes(1);
});

test('#prepare() not call next.prepare() if shouldPrepare is false', async () => {
  const receiver = new NextReceiver(nextApp, { noPrepare: true });
  await receiver.prepare();

  expect(nextApp.prepare.mock).not.toHaveBeenCalled();
});

test('handleRequest', async () => {
  const receiver = new NextReceiver(nextApp, {
    noPrepare: true,
    popError,
    handleRequest,
  });
  await receiver.prepare();

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(res.statusCode).toBe(200);

  expect(nextApp.renderError.mock).not.toHaveBeenCalled();
  expect(nextApp.render.mock).not.toHaveBeenCalled();

  expect(nextDefaultHandler.mock).toHaveBeenCalledTimes(1);
  expect(nextDefaultHandler.mock).toHaveBeenCalledWith(
    req,
    res,
    expect.any(Object)
  );
  expect(nextDefaultHandler.mock.calls[0].args[2]).toMatchInlineSnapshot(`
    Url {
      "auth": null,
      "hash": null,
      "host": "machinat.com",
      "hostname": "machinat.com",
      "href": "http://machinat.com/hello?foo=bar",
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

  expect(handleRequest.mock).toHaveBeenCalledTimes(1);
  expect(handleRequest.mock).toHaveBeenCalledWith({
    method: 'GET',
    url: 'http://machinat.com/hello?foo=bar',
    route: '/hello',
    headers: { 'x-y-z': 'abc' },
  });
});

test('handleRequest with entryPath', async () => {
  const receiver = new NextReceiver(nextApp, {
    noPrepare: true,
    entryPath: '/hello',
    popError,
    handleRequest,
  });
  await receiver.prepare();

  req.mock.getter('url').fakeReturnValue('http://machinat.com/hello/world');
  receiver.handleRequest(req, res);
  await nextTick();

  expect(nextApp.renderError.mock).not.toHaveBeenCalled();
  expect(nextApp.render.mock).not.toHaveBeenCalled();

  expect(nextDefaultHandler.mock).toHaveBeenCalledTimes(1);
  expect(nextDefaultHandler.mock).toHaveBeenCalledWith(
    req,
    res,
    parseUrl('http://machinat.com/hello/world', true)
  );

  expect(handleRequest.mock).toHaveBeenCalledTimes(1);
  expect(handleRequest.mock).toHaveBeenCalledWith({
    method: 'GET',
    url: 'http://machinat.com/hello/world',
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

  req.mock.getter('url').fakeReturnValue('http://machinat.com/foo/world');

  receiver.handleRequest(req, res);
  await nextTick();

  expect(handleRequest.mock).not.toHaveBeenCalled();
  expect(nextApp.render.mock).not.toHaveBeenCalled();
  expect(nextDefaultHandler.mock).not.toHaveBeenCalled();

  expect(nextApp.render.mock).not.toHaveBeenCalled();
  expect(nextApp.renderError.mock).toHaveBeenCalledTimes(1);
  expect(nextApp.renderError.mock).toHaveBeenCalledWith(
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

  expect(handleRequest.mock).toHaveBeenCalledTimes(1);
  expect(handleRequest.mock).toHaveBeenCalledWith({
    method: 'GET',
    url: 'http://machinat.com/hello?foo=bar',
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

  expect(handleRequest.mock).toHaveReturnedTimes(1);
  expect(handleRequest.mock.calls[0].args[0]).toMatchSnapshot();

  expect(nextDefaultHandler.mock).not.toHaveBeenCalled();
  expect(nextApp.renderError.mock).not.toHaveBeenCalled();

  expect(nextApp.render.mock).toHaveBeenCalledTimes(1);
  expect(nextApp.render.mock).toHaveBeenCalledWith(
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
      "host": "machinat.com",
      "hostname": "machinat.com",
      "href": "http://machinat.com/hello?foo=bar",
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

  expect(handleRequest.mock).toHaveBeenCalledTimes(1);
  expect(handleRequest.mock).toHaveBeenCalledWith({
    method: 'GET',
    url: 'http://machinat.com/hello?foo=bar',
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
    handleRequest: makeContainer({ deps: [ServiceScope] })(useRequestHandler),
  });
  await receiver.prepare();

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(initScope.mock).toHaveBeenCalledTimes(1);
  expect(useRequestHandler.mock).toHaveReturnedTimes(1);
  expect(useRequestHandler.mock).toHaveBeenCalledWith(
    initScope.mock.calls[0].result
  );

  expect(nextDefaultHandler.mock).not.toHaveBeenCalled();
  expect(nextApp.renderError.mock).not.toHaveBeenCalled();

  expect(nextApp.render.mock).toHaveBeenCalledTimes(1);
  expect(nextApp.render.mock).toHaveBeenCalledWith(
    req,
    res,
    '/foo',
    { foo: 'bar' },
    expect.any(Object)
  );

  expect(handleRequestFn.mock).toHaveBeenCalledTimes(1);
  expect(handleRequestFn.mock).toHaveBeenCalledWith({
    method: 'GET',
    url: 'http://machinat.com/hello?foo=bar',
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

  expect(handleRequest.mock).toHaveBeenCalledTimes(1);
  expect(handleRequest.mock.calls[0].args[0]).toMatchSnapshot();

  expect(nextApp.render.mock).not.toHaveBeenCalled();
  expect(nextDefaultHandler.mock).not.toHaveBeenCalled();

  expect(nextApp.renderError.mock).toHaveBeenCalledTimes(1);
  expect(nextApp.renderError.mock).toHaveBeenCalledWith(
    new Error("I'm a teapot"),
    req,
    res,
    '/hello',
    { foo: 'bar' }
  );

  expect(res.mock.setter('statusCode')).toHaveBeenCalledWith(418);
  expect(popError.mock).not.toHaveBeenCalled();
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

  expect(nextApp.renderError.mock).toHaveBeenCalledWith(
    new Error("I'm a teapot"),
    req,
    res,
    '/hello',
    { foo: 'bar' }
  );

  expect(res.writeHead.mock).toHaveBeenCalledWith(418, {
    'x-x-x': 't-e-a-p-o-t',
  });
});

it('pass "_next" api calls to next directly', async () => {
  const receiver = new NextReceiver(nextApp, {
    noPrepare: true,
    entryPath: '/hello',
    popError,
    handleRequest,
  });
  await receiver.prepare();

  req.mock.getter('url').fakeReturnValue('http://machinat.com/hello/_next/xxx');

  receiver.handleRequest(req, res);
  await nextTick();

  expect(handleRequest.mock).not.toHaveBeenCalled();
  expect(nextApp.render.mock).not.toHaveBeenCalled();
  expect(nextApp.renderError.mock).not.toHaveBeenCalled();

  expect(nextDefaultHandler.mock).toHaveBeenCalledTimes(1);
  expect(nextDefaultHandler.mock).toHaveBeenCalledWith(
    req,
    res,
    expect.any(Object)
  );
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

  expect(nextApp.render.mock).toHaveBeenCalledTimes(1);
  expect(nextApp.render.mock).toHaveBeenCalledWith(
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

  expect(handleRequest.mock).toHaveBeenCalledTimes(1);

  expect(nextApp.render.mock).not.toHaveBeenCalled();
  expect(nextDefaultHandler.mock).not.toHaveBeenCalled();

  expect(nextApp.renderError.mock).toHaveBeenCalledTimes(1);
  expect(nextApp.renderError.mock).toHaveBeenCalledWith(
    new Error("I'm a teapot"),
    req,
    res,
    '/hello',
    { foo: 'bar' }
  );

  expect(res.mock.setter('statusCode')).toHaveBeenCalledWith(500);

  expect(popError.mock).toHaveBeenCalledTimes(1);
  expect(popError.mock).toHaveBeenCalledWith(new Error("I'm a teapot"));
});
