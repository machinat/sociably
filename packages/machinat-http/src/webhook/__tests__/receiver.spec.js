import { Readable } from 'stream';
import moxy from '@moxyjs/moxy';
import WebhookReceiver from '../receiver';

const createReq = ({ method, url = '/', body = '', headers = {} }) => {
  const req = new Readable({
    read() {
      if (body) req.push(body);
      req.push(null);
    },
  });
  return Object.assign(req, { method, url, body, headers });
};

const createRes = () =>
  moxy({
    finished: false,
    statusCode: 200,
    writeHead(code, headers) {
      this.statusCode = code;
      this.headers = headers;
    },
    end(...args) {
      this.finished = true;
      for (let i = args.length - 1; i >= 0; i -= 1) {
        if (typeof args[i] === 'function') args[i]();
      }
    },
  });

const webhookHandler = moxy(async () => ({ code: 200 }));

beforeEach(() => {
  webhookHandler.mock.reset();
});

test('handle GET request', async () => {
  const req = createReq({
    method: 'GET',
    url: '/app',
    headers: { foo: 'bae' },
  });
  const res = createRes();

  const receiver = new WebhookReceiver(webhookHandler);
  await receiver.handleRequest(req, res);

  expect(webhookHandler.mock).toHaveBeenCalledTimes(1);
  expect(webhookHandler.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "request": Object {
          "body": undefined,
          "headers": Object {
            "foo": "bae",
          },
          "method": "GET",
          "url": "/app",
        },
        "source": "webhook",
      }
    `);

  expect(res.statusCode).toBe(200);
  expect(res.end.mock).toHaveBeenCalledTimes(1);
});

test('handle POST request with body', async () => {
  const req = createReq({
    method: 'POST',
    url: '/app',
    headers: { foo: 'bae' },
    body: '{ "hello": "webhook" }',
  });
  const res = createRes();

  const receiver = new WebhookReceiver(webhookHandler);
  await receiver.handleRequest(req, res);

  expect(webhookHandler.mock).toHaveBeenCalledTimes(1);
  expect(webhookHandler.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "request": Object {
          "body": "{ \\"hello\\": \\"webhook\\" }",
          "headers": Object {
            "foo": "bae",
          },
          "method": "POST",
          "url": "/app",
        },
        "source": "webhook",
      }
    `);

  expect(res.statusCode).toBe(200);
  expect(res.end.mock).toHaveBeenCalledTimes(1);
});

it('respond according to the response obj what webhookHandler return', async () => {
  const req = createReq({ method: 'GET' });
  const res = createRes();

  webhookHandler.mock.fake(async () => ({
    code: 400,
    headers: { foo: 'bad' },
    body: 'Bad bad bad request',
  }));

  const receiver = new WebhookReceiver(webhookHandler);
  await receiver.handleRequest(req, res);

  expect(webhookHandler.mock).toHaveBeenCalledTimes(1);

  expect(res.statusCode).toBe(400);
  expect(res.headers).toEqual({ foo: 'bad' });
  expect(res.end.mock).toHaveBeenCalledTimes(1);
  expect(res.end.mock.calls[0].args[0]).toBe('Bad bad bad request');
});

it("respond JSON of the body if it's an object", async () => {
  const req = createReq({ method: 'GET' });
  const res = createRes();

  webhookHandler.mock.fake(async () => ({
    code: 408,
    body: { hello: 'teapot' },
  }));

  const receiver = new WebhookReceiver(webhookHandler);
  await receiver.handleRequest(req, res);

  expect(webhookHandler.mock).toHaveBeenCalledTimes(1);

  expect(res.statusCode).toBe(408);
  expect(res.end.mock).toHaveBeenCalledTimes(1);
  expect(res.end.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `"{\\"hello\\":\\"teapot\\"}"`
  );
});

it('ends res with 500 if error thrown in webhookHandler', async () => {
  const req = createReq({ method: 'GET' });
  const res = createRes();

  webhookHandler.mock.fake(async () => {
    throw new Error('very interal error');
  });

  const receiver = new WebhookReceiver(webhookHandler);
  await receiver.handleRequest(req, res);

  expect(webhookHandler.mock).toHaveBeenCalledTimes(1);

  expect(res.statusCode).toBe(500);
  expect(res.end.mock).toHaveBeenCalledTimes(1);
  expect(res.end.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `"{\\"code\\":500,\\"message\\":\\"very interal error\\"}"`
  );
});

test('#handleRequestCallback() work', async () => {
  const req = createReq({
    method: 'POST',
    url: '/app',
    headers: { foo: 'bae' },
    body: '{ "hello": "webhook" }',
  });
  const res = createRes();

  const receiver = new WebhookReceiver(webhookHandler);
  const callback = receiver.handleRequestCallback();
  await callback(req, res);

  await new Promise(process.nextTick);

  expect(webhookHandler.mock).toHaveBeenCalledTimes(1);
  expect(webhookHandler.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "request": Object {
          "body": "{ \\"hello\\": \\"webhook\\" }",
          "headers": Object {
            "foo": "bae",
          },
          "method": "POST",
          "url": "/app",
        },
        "source": "webhook",
      }
    `);

  expect(res.statusCode).toBe(200);
  expect(res.end.mock).toHaveBeenCalledTimes(1);
});
