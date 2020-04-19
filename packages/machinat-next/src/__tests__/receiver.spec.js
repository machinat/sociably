import moxy, { Mock } from 'moxy';
import { ServerResponse } from 'http';
import NextReceiver from '../receiver';

const nextApp = moxy({
  prepare: async () => {},
  render: async () => {},
  renderError: async () => {},
  setAssetPrefix() {},
  renderOpts: { assetPrefix: '' },
});

const nextTick = () => new Promise(resolve => process.nextTick(resolve));

const popEventMock = new Mock();
const popEventWrapper = moxy(finalHandler =>
  popEventMock.proxify(finalHandler)
);
const popError = moxy();

const req = moxy({
  method: 'GET',
  url: 'http://machinat.com/hello?foo=bar',
  headers: { 'x-y-z': 'abc' },
});
let res;

beforeEach(() => {
  nextApp.mock.reset();
  req.mock.reset();
  res = moxy(new ServerResponse({ method: 'GET' }));

  popEventMock.reset();
  popEventWrapper.mock.reset();
  popError.mock.reset();
});

it('respond 503 if request received before prepared', async () => {
  const receiver = new NextReceiver(
    nextApp,
    { shouldPrepare: true },
    popEventWrapper,
    popError
  );

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(res.statusCode).toBe(503);
  expect(res.end.mock).toHaveBeenCalledTimes(1);

  expect(nextApp.renderError.mock).not.toHaveBeenCalled();
  expect(popEventMock).not.toHaveBeenCalled();
});

test('#prepare() call next.prepare() if shouldPrepare is true', async () => {
  const receiver = new NextReceiver(
    nextApp,
    { shouldPrepare: true },
    popEventWrapper,
    popError
  );
  expect(nextApp.prepare.mock).not.toHaveBeenCalled();

  await receiver.prepare();

  expect(nextApp.prepare.mock).toHaveBeenCalledTimes(1);
});

test('prepare() not call next.prepare() if shouldPrepare is false', async () => {
  const receiver = new NextReceiver(
    nextApp,
    { shouldPrepare: false },
    popEventWrapper,
    popError
  );
  await receiver.prepare();

  expect(nextApp.prepare.mock).not.toHaveBeenCalled();
});

it('call next.render() if middlewares resolve accepted', async () => {
  const receiver = new NextReceiver(
    nextApp,
    { shouldPrepare: false },
    popEventWrapper,
    popError
  );
  await receiver.prepare();

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(popEventMock).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toBe(200);

  expect(nextApp.renderError.mock).not.toHaveBeenCalled();
  expect(nextApp.render.mock).toHaveBeenCalledTimes(1);
  expect(nextApp.render.mock).toHaveBeenCalledWith(
    req,
    res,
    '/hello',
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
});

it('trim the entryPath from the url passed to next handler', async () => {
  const receiver = new NextReceiver(
    nextApp,
    { shouldPrepare: false, entryPath: '/hello' },
    popEventWrapper,
    popError
  );
  await receiver.prepare();

  req.mock.getter('url').fakeReturnValue('http://machinat.com/hello/world');
  receiver.handleRequest(req, res);
  await nextTick();

  expect(popEventMock).toHaveBeenCalledTimes(1);
  expect(nextApp.renderError.mock).not.toHaveBeenCalled();

  expect(nextApp.render.mock).toHaveBeenCalledTimes(1);
  expect(nextApp.render.mock).toHaveBeenCalledWith(
    req,
    res,
    '/world',
    {},
    expect.any(Object)
  );
});

it('call next.renderError() with status 404 if entryPath not match', async () => {
  const receiver = new NextReceiver(
    nextApp,
    { shouldPrepare: false, entryPath: '/hello' },
    popEventWrapper,
    popError
  );
  await receiver.prepare();

  req.mock.getter('url').fakeReturnValue('http://machinat.com/foo/world');

  receiver.handleRequest(req, res);
  await nextTick();

  expect(popEventMock).not.toHaveBeenCalled();
  expect(nextApp.render.mock).not.toHaveBeenCalled();

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

it('call next.render() with cutomized page, query and headers resolves by middlewares', async () => {
  const receiver = new NextReceiver(
    nextApp,
    { shouldPrepare: false },
    popEventWrapper,
    popError
  );
  await receiver.prepare();

  popEventMock.fake(async () => ({
    accepted: true,
    page: '/hello/world',
    query: { foo: 'bar' },
    headers: { 'x-y-z': 'a_b_c' },
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

  const expectedRequestObj = {
    method: 'GET',
    url: 'http://machinat.com/hello?foo=bar',
    headers: { 'x-y-z': 'abc' },
  };

  expect(popEventMock).toHaveBeenCalledTimes(1);
  expect(popEventMock).toHaveBeenCalledWith({
    platform: 'next',
    channel: { platform: 'next', type: 'server', uid: 'next.server' },
    user: null,
    bot: null,
    event: {
      platform: 'next',
      type: 'request',
      payload: { request: expectedRequestObj },
    },
    metadata: { source: 'next', request: expectedRequestObj },
  });

  expect(res.statusCode).toBe(200);
  expect(res.getHeaders()).toEqual({ 'x-y-z': 'a_b_c' });
});

it('call next.renderError() if event issuer resolve unaccepted', async () => {
  const receiver = new NextReceiver(
    nextApp,
    { shouldPrepare: false },
    popEventWrapper,
    popError
  );
  await receiver.prepare();

  popEventMock.fake(async () => ({
    accepted: false,
    code: 418,
    reason: "I'm a teapot",
  }));

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(popEventMock).toHaveBeenCalledTimes(1);

  expect(nextApp.render.mock).not.toHaveBeenCalled();
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

it('call next.renderError() with customized headers resolved by middleware', async () => {
  const receiver = new NextReceiver(
    nextApp,
    { shouldPrepare: false },
    popEventWrapper,
    popError
  );
  await receiver.prepare();

  popEventMock.fake(async () => ({
    accepted: false,
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

it('entryPath does not affect page params from middlewares', async () => {
  const receiver = new NextReceiver(
    nextApp,
    { shouldPrepare: false, entryPath: '/hello' },
    popEventWrapper,
    popError
  );
  await receiver.prepare();

  popEventMock.fake(async () => ({
    accepted: true,
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
  const receiver = new NextReceiver(
    nextApp,
    { shouldPrepare: false },
    popEventWrapper,
    popError
  );
  await receiver.prepare();

  popEventMock.fake(async () => {
    throw new Error("I'm a teapot");
  });

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(popEventMock).toHaveBeenCalledTimes(1);

  expect(nextApp.render.mock).not.toHaveBeenCalled();
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
