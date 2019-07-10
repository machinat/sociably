import { IncomingMessage, ServerResponse } from 'http';
import moxy from 'moxy';
import NextReceiver from '../receiver';
import nextApp from './nextApp';

const nextTick = () => new Promise(resolve => process.nextTick(resolve));

const req = moxy(new IncomingMessage({}));
const res = moxy(new ServerResponse({ method: 'GET' }));
req.mock.getter('method').fakeReturnValue('GET');
req.mock.getter('url').fakeReturnValue('http://machinat.com/hello?foo=bar');
req.mock.getter('headers').fakeReturnValue({ 'x-y-z': 'abc' });
res.mock.setter('statusCode').fake(() => {});

const issueEvent = moxy(async () => {});

const issueError = moxy();

beforeEach(() => {
  nextApp.mock.clear();
  req.mock.clear();
  res.mock.clear();

  issueEvent.mock.reset();
  issueError.mock.reset();
});

it('call next.prepare() and respond 503 before ready', async () => {
  const receiver = new NextReceiver({ nextApp });
  expect(nextApp.prepare.mock).toHaveBeenCalledTimes(1);

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  expect(res.mock.setter('statusCode')).toHaveBeenCalledWith(503);

  expect(nextApp.renderError.mock).not.toHaveBeenCalled();
  expect(issueEvent.mock).not.toHaveBeenCalled();
});

it('call next.renderError() with status 501 if receiver is not bound', async () => {
  const receiver = new NextReceiver({ nextApp });
  await nextTick();

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(nextApp.renderError.mock).toHaveBeenCalledTimes(1);
  expect(nextApp.renderError.mock).toHaveBeenCalledWith(
    null,
    req,
    res,
    '/hello',
    {
      foo: 'bar',
    }
  );

  expect(res.mock.setter('statusCode')).toHaveBeenCalledWith(501);
});

it('call next.getRequestHandler()() if event issuer return empty', async () => {
  const receiver = new NextReceiver({ nextApp });
  receiver.bindIssuer(issueEvent, issueError);
  await nextTick();

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalledTimes(1);
  expect(res.mock.setter('statusCode')).not.toHaveBeenCalled();

  expect(nextApp.render.mock).not.toHaveBeenCalled();
  expect(nextApp.renderError.mock).not.toHaveBeenCalled();

  expect(nextApp.getRequestHandler.mock).toHaveBeenCalledTimes(1);
  const nextHandler = nextApp.getRequestHandler.mock.calls[0].result;

  expect(nextHandler.mock).toHaveBeenCalledTimes(1);
  expect(nextHandler.mock).toHaveBeenCalledWith(req, res, expect.any(Object));
  expect(nextHandler.mock.calls[0].args[2]).toMatchInlineSnapshot(`
        Object {
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

it('call nextHandler with basePath trimed if provided in options', async () => {
  const receiver = new NextReceiver({ nextApp, basePath: '/hello' });
  receiver.bindIssuer(issueEvent, issueError);
  await nextTick();

  const helloWorldReq = moxy(new IncomingMessage({}));
  helloWorldReq.mock
    .getter('url')
    .fakeReturnValue('http://machinat.com/hello/world');

  expect(receiver.handleRequest(helloWorldReq, res)).toBe(undefined);
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalledTimes(1);
  expect(nextApp.render.mock).not.toHaveBeenCalled();
  expect(nextApp.renderError.mock).not.toHaveBeenCalled();
  expect(nextApp.getRequestHandler.mock).toHaveBeenCalledTimes(1);
  const nextHandler = nextApp.getRequestHandler.mock.calls[0].result;

  expect(nextHandler.mock).toHaveBeenCalledTimes(1);
  expect(nextHandler.mock).toHaveBeenCalledWith(
    helloWorldReq,
    res,
    expect.any(Object)
  );
  expect(nextHandler.mock.calls[0].args[2].pathname).toBe('/world');
});

it('call next.renderError() with status 404 trimed if basePath not match', async () => {
  const receiver = new NextReceiver({ nextApp, basePath: '/hello' });
  receiver.bindIssuer(issueEvent, issueError);
  await nextTick();

  const fooWorldReq = moxy(new IncomingMessage({}));
  fooWorldReq.mock
    .getter('url')
    .fakeReturnValue('http://machinat.com/foo/world');

  expect(receiver.handleRequest(fooWorldReq, res)).toBe(undefined);
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalledTimes(1);
  expect(nextApp.render.mock).not.toHaveBeenCalled();
  const nextHandler = nextApp.getRequestHandler.mock.calls[0].result;
  expect(nextHandler.mock).not.toHaveBeenCalled();

  expect(nextApp.renderError.mock).toHaveBeenCalledTimes(1);
  expect(nextApp.renderError.mock).toHaveBeenCalledWith(
    null,
    fooWorldReq,
    res,
    '/foo/world',
    {}
  );
});

it('call next.render() with params return by middlewares', async () => {
  const receiver = new NextReceiver({ nextApp });
  receiver.bindIssuer(issueEvent, issueError);
  await nextTick();

  issueEvent.mock.fake(async () => ({
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

  expect(issueEvent.mock).toHaveBeenCalledTimes(1);
  expect(issueEvent.mock).toHaveBeenCalledWith(
    {
      platform: 'next',
      type: 'server',
      uid: 'next:server',
    },
    {
      platform: 'next',
      type: 'request',
      payload: { req, res },
    },
    {
      source: 'next',
      request: {
        method: 'GET',
        url: 'http://machinat.com/hello?foo=bar',
        headers: { 'x-y-z': 'abc' },
        encrypted: false,
      },
    }
  );

  expect(res.mock.setter('statusCode')).not.toHaveBeenCalled();
});

it('basePath option not affect page params from middlewares', async () => {
  const receiver = new NextReceiver({ nextApp, basePath: '/hello' });
  receiver.bindIssuer(issueEvent, issueError);
  await nextTick();

  issueEvent.mock.fake(async () => ({
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

it('set metadata.request.encrypted to true if req is encrypted', async () => {
  const receiver = new NextReceiver({ nextApp });
  receiver.bindIssuer(issueEvent, issueError);
  await nextTick();

  req.socket.mock.getter('encrypted').fakeReturnValue(true);

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalledTimes(1);
  expect(issueEvent.mock).toHaveBeenCalledWith(
    expect.any(Object),
    expect.any(Object),
    {
      source: 'next',
      request: {
        method: 'GET',
        url: 'http://machinat.com/hello?foo=bar',
        headers: { 'x-y-z': 'abc' },
        encrypted: true,
      },
    }
  );
});

it('call next.renderError() if event issuer thrown', async () => {
  const receiver = new NextReceiver({ nextApp });
  receiver.bindIssuer(issueEvent, issueError);
  await nextTick();

  issueEvent.mock.fake(async () => {
    throw new Error("I'm a teapot");
  });

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalledTimes(1);

  expect(nextApp.render.mock).not.toHaveBeenCalled();
  expect(nextApp.renderError.mock).toHaveBeenCalledTimes(1);
  expect(nextApp.renderError.mock).toHaveBeenCalledWith(
    new Error("I'm a teapot"),
    req,
    res,
    '/hello',
    { foo: 'bar' }
  );

  expect(issueError.mock).toHaveBeenCalledTimes(1);
  expect(issueError.mock).toHaveBeenCalledWith(new Error("I'm a teapot"));
});
