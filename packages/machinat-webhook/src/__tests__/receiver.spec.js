import moxy from 'moxy';
import { IncomingMessage, ServerResponse } from 'http';
import rawBody from 'raw-body';
import WebhookReceiver from '../receiver';

jest.mock('raw-body');

describe('#handleRequest(req, res, raw, ctx)', () => {
  let req;
  let res;

  const handleWebhook = moxy(() => [{ id: 1 }, { id: 2 }, { id: 3 }]);
  const handleEvent = moxy();

  beforeEach(() => {
    req = moxy(new IncomingMessage());
    res = moxy(new ServerResponse({}));

    handleWebhook.mock.reset();
    handleEvent.mock.reset();
  });

  it('returns a promise', async () => {
    const receiver = new WebhookReceiver(handleWebhook, handleEvent);

    const promise = receiver.handleRequest(req, res, 'body');

    expect(promise).toBeInstanceOf(Promise);
    await expect(promise).resolves.toBe(undefined);
  });

  it('get events from handleWebhook and pass to handleEvent', async () => {
    const receiver = new WebhookReceiver(handleWebhook, handleEvent);

    const transportCtx = { hello: 'world' };
    await receiver.handleRequest(req, res, 'body', transportCtx);

    expect(handleWebhook.mock).toHaveBeenCalledWith(req, res, 'body');

    for (let i = 1; i < 4; i += 1) {
      expect(handleEvent.mock) //
        .toHaveBeenNthCalledWith(i, { id: i }, 'webhook', transportCtx);
    }
  });

  it('reads body from req if body not given', async () => {
    const receiver = new WebhookReceiver(handleWebhook, handleEvent);

    req.mock.getter('method').fakeReturnValue('POST');
    rawBody.mock.fake(() => Promise.resolve('some body'));

    await receiver.handleRequest(req, res);

    expect(rawBody.mock.calls[0].args[0]).toBe(req);
    expect(handleWebhook.mock).toHaveBeenCalledWith(req, res, 'some body');

    rawBody.mock.reset();
  });

  it('ends res with 200 if no event returned by handleRequest', async () => {
    const receiver = new WebhookReceiver(handleWebhook, handleEvent);

    handleWebhook.mock.fakeReturnValue(undefined);
    await receiver.handleRequest(req, res, 'body');

    expect(handleWebhook.mock).toHaveBeenCalledTimes(1);
    expect(handleEvent.mock).not.toHaveBeenCalled();

    expect(res.end.mock).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it('ends res with 200 if no shouldRespond event found', async () => {
    const receiver = new WebhookReceiver(handleWebhook, handleEvent);

    await receiver.handleRequest(req, res, 'body');

    expect(res.end.mock).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it('ends res with retruned response object', async () => {
    const receiver = new WebhookReceiver(handleWebhook, handleEvent);

    handleWebhook.mock.fakeReturnValue([{ id: 1, shouldRespond: true }]);
    handleEvent.mock.fakeReturnValue({ status: 201, body: 'success body' });

    await receiver.handleRequest(req, res, 'body');

    expect(res.statusCode).toBe(201);
    expect(res.end.mock.calls[0].args[0]).toBe('success body');
  });

  it('ends res body with json if object returned as body', async () => {
    const receiver = new WebhookReceiver(handleWebhook, handleEvent);

    handleWebhook.mock.fakeReturnValue([{ id: 1, shouldRespond: true }]);
    handleEvent.mock.fakeReturnValue({ status: 201, body: { success: true } });

    await receiver.handleRequest(req, res, 'body');

    expect(res.statusCode).toBe(201);
    expect(res.end.mock.calls[0].args[0]).toBe('{"success":true}');
  });

  it('ends res with 501 if empty returned', async () => {
    const receiver = new WebhookReceiver(handleWebhook, handleEvent);

    handleWebhook.mock.fakeReturnValue([{ id: 1, shouldRespond: true }]);

    await receiver.handleRequest(req, res, 'body');

    expect(res.statusCode).toBe(501);
    expect(res.end.mock).toHaveBeenCalled();
  });

  it('ends res with "status" and "body" prop of error thrown', async () => {
    const receiver = new WebhookReceiver(handleWebhook, handleEvent);

    handleWebhook.mock.fakeReturnValue([{ id: 1, shouldRespond: true }]);
    handleEvent.mock.fake(async () => {
      const err = new Error();
      err.status = 555;
      err.body = 'YOU LOSE!';
      throw err;
    });

    await receiver.handleRequest(req, res, 'body');

    expect(res.statusCode).toBe(555);
    expect(res.end.mock.calls[0].args[0]).toBe('YOU LOSE!');
  });
});
