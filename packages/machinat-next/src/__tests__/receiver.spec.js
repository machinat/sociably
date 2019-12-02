import { IncomingMessage, ServerResponse } from 'http';
import moxy from 'moxy';
import NextReceiver from '../receiver';
import nextApp from './nextApp';

const nextTick = () => new Promise(resolve => process.nextTick(resolve));

const req = moxy(new IncomingMessage({}));
const res = moxy(new ServerResponse({ method: 'GET' }));

const issueEvent = moxy(async () => ({ accepted: true }));
const issueError = moxy();

const nextHandler = moxy(async () => {});
nextApp.getRequestHandler.mock.fakeReturnValue(nextHandler);

beforeEach(() => {
  nextApp.mock.clear();
  req.mock.clear();
  res.mock.clear();

  req.mock.getter('method').fakeReturnValue('GET');
  req.mock.getter('url').fakeReturnValue('http://machinat.com/hello?foo=bar');
  req.mock.getter('headers').fakeReturnValue({ 'x-y-z': 'abc' });
  res.mock.setter('statusCode').fake(() => {});
  res.mock.getter('finished').fake(() => false);

  issueEvent.mock.reset();
  issueError.mock.reset();
  nextHandler.mock.clear();
});

it('call next.prepare() if options.noPrepare is falsy and respond 503 before ready', async () => {
  let resolve;
  nextApp.prepare.mock.fakeReturnValue(
    new Promise(_resolve => {
      resolve = _resolve;
    })
  );

  const receiver = new NextReceiver(nextApp, true);
  receiver.bindIssuer(issueEvent, issueError);
  expect(nextApp.prepare.mock).toHaveBeenCalledTimes(1);

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(res.mock.setter('statusCode')).toHaveBeenCalledWith(503);
  expect(res.end.mock).toHaveBeenCalledTimes(1);

  expect(nextApp.renderError.mock).not.toHaveBeenCalled();
  expect(issueEvent.mock).not.toHaveBeenCalled();

  resolve();
  await nextTick();

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalled();
  expect(nextHandler.mock).toHaveBeenCalled();
  expect(res.end.mock).toHaveBeenCalledTimes(1);

  nextApp.prepare.mock.reset();
});

it('not call next.prepare() if shouldPrepare is false', async () => {
  const receiver = new NextReceiver(nextApp, false);
  receiver.bindIssuer(issueEvent, issueError);

  expect(nextApp.prepare.mock).not.toHaveBeenCalled();

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalled();
  expect(nextHandler.mock).toHaveBeenCalled();
});

it('use next.getRequestHandler()() if event issuer resolve accepted', async () => {
  const receiver = new NextReceiver(nextApp, false);
  receiver.bindIssuer(issueEvent, issueError);

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalledTimes(1);
  expect(res.mock.setter('statusCode')).not.toHaveBeenCalled();

  expect(nextApp.render.mock).not.toHaveBeenCalled();
  expect(nextApp.renderError.mock).not.toHaveBeenCalled();

  expect(nextApp.getRequestHandler.mock).toHaveBeenCalledTimes(1);

  expect(nextHandler.mock).toHaveBeenCalledTimes(1);
  expect(nextHandler.mock).toHaveBeenCalledWith(req, res, expect.any(Object));
  expect(nextHandler.mock.calls[0].args[2]).toMatchInlineSnapshot(`
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

it('use nextHandler with basePath trimed if provided in options', async () => {
  const receiver = new NextReceiver(nextApp, false, '/hello');
  receiver.bindIssuer(issueEvent, issueError);

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

  expect(nextHandler.mock).toHaveBeenCalledTimes(1);
  expect(nextHandler.mock).toHaveBeenCalledWith(
    helloWorldReq,
    res,
    expect.any(Object)
  );
  expect(nextHandler.mock.calls[0].args[2].pathname).toBe('/world');
});

it('use next.renderError() with status 404 if basePath not match', async () => {
  const receiver = new NextReceiver(nextApp, false, '/hello');
  receiver.bindIssuer(issueEvent, issueError);

  const fooWorldReq = moxy(new IncomingMessage({}));
  fooWorldReq.mock
    .getter('url')
    .fakeReturnValue('http://machinat.com/foo/world');

  expect(receiver.handleRequest(fooWorldReq, res)).toBe(undefined);
  await nextTick();

  expect(issueEvent.mock).not.toHaveBeenCalled();
  expect(nextApp.render.mock).not.toHaveBeenCalled();

  expect(nextHandler.mock).not.toHaveBeenCalled();

  expect(nextApp.renderError.mock).toHaveBeenCalledTimes(1);
  expect(nextApp.renderError.mock).toHaveBeenCalledWith(
    null,
    fooWorldReq,
    res,
    '/foo/world',
    {}
  );

  expect(res.mock.setter('statusCode')).toHaveBeenCalledTimes(1);
  expect(res.mock.setter('statusCode')).toHaveBeenCalledWith(404);
});

it('use next.render() with page and query resolves by middlewares', async () => {
  const receiver = new NextReceiver(nextApp, false);
  receiver.bindIssuer(issueEvent, issueError);

  issueEvent.mock.fake(async () => ({
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
    null,
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

it('use next.renderError() if event issuer resolve unaccepted', async () => {
  const receiver = new NextReceiver(nextApp, false);
  receiver.bindIssuer(issueEvent, issueError);

  issueEvent.mock.fake(async () => ({
    accepted: false,
    code: 418,
    message: "I'm a teapot",
  }));

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

  expect(res.mock.setter('statusCode')).toHaveBeenCalledWith(418);

  expect(issueError.mock).not.toHaveBeenCalled();
});

it('do nothing if res ended by  middlewares', async () => {
  const receiver = new NextReceiver(nextApp, false);
  receiver.bindIssuer(issueEvent, issueError);

  res.mock.getter('finished').fakeReturnValue(true);
  issueEvent.mock.fake(async () => ({
    accepted: true,
  }));

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  issueEvent.mock.fake(async () => ({
    accepted: false,
    code: 666,
    message: "this won't be sent",
  }));

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalledTimes(2);
  expect(nextApp.render.mock).not.toHaveBeenCalled();
  expect(nextApp.renderError.mock).not.toHaveBeenCalled();
  expect(issueError.mock).not.toHaveBeenCalled();
});

it('basePath option not affect page params from middlewares', async () => {
  const receiver = new NextReceiver(nextApp, false, '/hello');
  receiver.bindIssuer(issueEvent, issueError);

  issueEvent.mock.fake(async () => ({
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

it('set metadata.request.encrypted to true if req is encrypted', async () => {
  const receiver = new NextReceiver(nextApp, false);
  receiver.bindIssuer(issueEvent, issueError);

  req.socket.mock.getter('encrypted').fakeReturnValue(true);

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalledTimes(1);
  expect(issueEvent.mock).toHaveBeenCalledWith(
    expect.any(Object),
    null,
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

it('use next.renderError() if event issuer reject', async () => {
  const receiver = new NextReceiver(nextApp, false);
  receiver.bindIssuer(issueEvent, issueError);

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

  expect(res.mock.setter('statusCode')).toHaveBeenCalledWith(500);

  expect(issueError.mock).toHaveBeenCalledTimes(1);
  expect(issueError.mock).toHaveBeenCalledWith(new Error("I'm a teapot"));
});
