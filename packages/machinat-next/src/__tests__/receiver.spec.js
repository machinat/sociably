import { IncomingMessage, ServerResponse } from 'http';
import moxy from 'moxy';
import NextReceiver from '../receiver';

const nextTick = () => new Promise(resolve => process.nextTick(resolve));

const next = moxy({
  render: async () => {},
  renderError: async () => {},
});

const req = moxy(new IncomingMessage());
const res = moxy(new ServerResponse({ method: 'GET' }));
req.mock.getter('method').fakeReturnValue('GET');
req.mock.getter('url').fakeReturnValue('http://machinat.com/hello?foo=bar');
req.mock.getter('headers').fakeReturnValue({ 'x-y-z': 'abc' });
res.mock.setter('statusCode').fake(() => {});

const issueEvent = moxy(async () => ({
  pathname: '/hello',
  query: { foo: 'bar' },
}));

const issueError = moxy();

beforeEach(() => {
  next.mock.clear();
  req.mock.clear();
  res.mock.clear();

  issueEvent.mock.reset();
  issueError.mock.reset();
});

it('renderError with 501 if receiver is not bound', async () => {
  const receiver = new NextReceiver(next);

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(next.renderError.mock).toHaveBeenCalledTimes(1);
  expect(next.renderError.mock).toHaveBeenCalledWith(null, req, res, '/hello', {
    foo: 'bar',
  });

  expect(res.mock.setter('statusCode')).toHaveBeenCalledWith(501);
});

it('render', async () => {
  const receiver = new NextReceiver(next);
  receiver.bindIssuer(issueEvent, issueError);

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(next.render.mock).toHaveBeenCalledTimes(1);
  expect(next.render.mock).toHaveBeenCalledWith(req, res, '/hello', {
    foo: 'bar',
  });

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
      payload: {
        pathname: '/hello',
        query: { foo: 'bar' },
      },
    },
    {
      source: 'next',
      request: {
        method: 'GET',
        url: 'http://machinat.com/hello?foo=bar',
        headers: { 'x-y-z': 'abc' },
      },
    }
  );

  expect(res.mock.setter('statusCode')).not.toHaveBeenCalled();
});

it('render with params return by event issuer', async () => {
  const receiver = new NextReceiver(next);
  receiver.bindIssuer(issueEvent, issueError);

  issueEvent.mock.fake(async () => ({
    pathname: '/hello/world',
    query: { foo: 'baz' },
  }));

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalledTimes(1);
  expect(res.mock.setter('statusCode')).not.toHaveBeenCalled();

  expect(next.render.mock).toHaveBeenCalledTimes(1);
  expect(next.render.mock).toHaveBeenCalledWith(req, res, '/hello/world', {
    foo: 'baz',
  });
});

it('renderError renderError with 501 if event issuer return empty', async () => {
  const receiver = new NextReceiver(next);
  receiver.bindIssuer(issueEvent, issueError);

  issueEvent.mock.fake(async () => {});

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalledTimes(1);
  expect(res.mock.setter('statusCode')).toHaveBeenCalledWith(501);

  expect(next.render.mock).not.toHaveBeenCalled();
  expect(next.renderError.mock).toHaveBeenCalledTimes(1);
  expect(next.renderError.mock).toHaveBeenCalledWith(null, req, res, '/hello', {
    foo: 'bar',
  });
});

it('renderError if event issuer thrown', async () => {
  const receiver = new NextReceiver(next);
  receiver.bindIssuer(issueEvent, issueError);

  issueEvent.mock.fake(async () => {
    throw new Error("I'm a teapot");
  });

  expect(receiver.handleRequest(req, res)).toBe(undefined);
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalledTimes(1);

  expect(next.render.mock).not.toHaveBeenCalled();
  expect(next.renderError.mock).toHaveBeenCalledTimes(1);
  expect(next.renderError.mock).toHaveBeenCalledWith(
    new Error("I'm a teapot"),
    req,
    res,
    '/hello',
    { foo: 'bar' }
  );

  expect(issueError.mock).toHaveBeenCalledTimes(1);
  expect(issueError.mock).toHaveBeenCalledWith(new Error("I'm a teapot"));
});
