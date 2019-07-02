import moxy from 'moxy';
import { BaseReceiver } from 'machinat-base';
import { IncomingMessage, ServerResponse } from 'http';
import rawBody from 'raw-body';
import WebhookReceiver from '../receiver';

jest.mock('raw-body');
jest.useFakeTimers();

const nextTick = () => new Promise(process.nextTick);

it('extends BaseReceiver', () => {
  expect(new WebhookReceiver(() => {})).toBeInstanceOf(BaseReceiver);
});

describe('#handleRequest(req, res, raw, ctx)', () => {
  let req;
  let res;

  const channel = { foo: 'bar' };
  const handleWebhook = moxy(() => [
    { channel, event: { id: 1 }, shouldRespond: false },
    { channel, event: { id: 2 }, shouldRespond: false },
    { channel, event: { id: 3 }, shouldRespond: false },
  ]);
  const handleEvent = moxy();
  const handleError = moxy();

  beforeEach(() => {
    req = moxy(new IncomingMessage());
    req.mock.getter('method').fakeReturnValue('POST');
    req.mock.getter('url').fakeReturnValue('/hello');
    req.mock.getter('headers').fakeReturnValue({ wonderful: 'world' });

    res = moxy(new ServerResponse({}));

    handleWebhook.mock.reset();
    handleEvent.mock.reset();
    handleError.mock.reset();
  });

  it('returns undefined', () => {
    const receiver = new WebhookReceiver(handleWebhook);
    receiver.bindIssuer(handleEvent, handleError);

    expect(receiver.handleRequest(req, res, 'body')).toBe(undefined);
  });

  it('get events from handleWebhook and pass to handleEvent', async () => {
    const receiver = new WebhookReceiver(handleWebhook);
    receiver.bindIssuer(handleEvent, handleError);

    receiver.handleRequest(req, res, 'hi');

    jest.runAllTimers();
    await nextTick();

    expect(handleWebhook.mock).toHaveBeenCalledWith(req, res, 'hi');

    for (let i = 1; i < 4; i += 1) {
      expect(handleEvent.mock).toHaveBeenNthCalledWith(
        i,
        channel,
        { id: i },
        {
          source: 'webhook',
          request: {
            method: 'POST',
            url: '/hello',
            headers: { wonderful: 'world' },
            body: 'hi',
          },
        }
      );
    }
  });

  it('reads body from req if body not given', async () => {
    const receiver = new WebhookReceiver(handleWebhook);
    receiver.bindIssuer(handleEvent, handleError);

    req.mock.getter('method').fakeReturnValue('POST');
    rawBody.mock.fake(() => Promise.resolve('some body'));

    receiver.handleRequest(req, res);

    jest.runAllTimers();
    await nextTick();

    expect(rawBody.mock.calls[0].args[0]).toBe(req);
    expect(handleWebhook.mock).toHaveBeenCalledWith(req, res, 'some body');

    rawBody.mock.reset();
  });

  it('ends res with 501 if no handler bound', async () => {
    const receiver = new WebhookReceiver(handleWebhook);

    receiver.handleRequest(req, res, 'body');

    jest.runAllTimers();
    await nextTick();

    expect(handleWebhook.mock).not.toHaveBeenCalled();
    expect(handleEvent.mock).not.toHaveBeenCalled();

    expect(res.end.mock).toHaveBeenCalled();
    expect(res.statusCode).toBe(501);
  });

  it('ends res with 200 if no event returned by handleRequest', async () => {
    const receiver = new WebhookReceiver(handleWebhook);
    receiver.bindIssuer(handleEvent, handleError);

    handleWebhook.mock.fakeReturnValue(undefined);
    receiver.handleRequest(req, res, 'body');

    jest.runAllTimers();
    await nextTick();

    expect(handleWebhook.mock).toHaveBeenCalledTimes(1);
    expect(handleEvent.mock).not.toHaveBeenCalled();

    expect(res.end.mock).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it('ends res with 200 if no shouldRespond event found', async () => {
    const receiver = new WebhookReceiver(handleWebhook);
    receiver.bindIssuer(handleEvent, handleError);

    receiver.handleRequest(req, res, 'body');

    jest.runAllTimers();
    await nextTick();

    expect(res.end.mock).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  const shouldRespondEvents = [
    { channel, event: { id: 1 }, shouldRespond: true },
  ];

  it('ends res with retruned response object', async () => {
    const receiver = new WebhookReceiver(handleWebhook);
    receiver.bindIssuer(handleEvent, handleError);

    handleWebhook.mock.fakeReturnValue(shouldRespondEvents);
    handleEvent.mock.fakeReturnValue({ status: 201, body: 'success body' });

    receiver.handleRequest(req, res, 'body');

    jest.runAllTimers();
    await nextTick();

    expect(res.statusCode).toBe(201);
    expect(res.end.mock.calls[0].args[0]).toBe('success body');
  });

  it('ends res body with json if object returned as body', async () => {
    const receiver = new WebhookReceiver(handleWebhook);
    receiver.bindIssuer(handleEvent, handleError);

    handleWebhook.mock.fakeReturnValue(shouldRespondEvents);
    handleEvent.mock.fakeReturnValue({ status: 201, body: { success: true } });

    receiver.handleRequest(req, res, 'body');

    jest.runAllTimers();
    await nextTick();

    expect(handleEvent.mock).toHaveBeenCalledTimes(1);
    expect(handleEvent.mock).toHaveBeenCalledWith(
      channel,
      { id: 1 },
      {
        source: 'webhook',
        request: {
          method: 'POST',
          url: '/hello',
          headers: { wonderful: 'world' },
          body: 'body',
        },
      }
    );

    expect(res.statusCode).toBe(201);
    expect(res.end.mock.calls[0].args[0]).toBe('{"success":true}');
  });

  it('ends res with 501 if shouldRespond but empty returned', async () => {
    const receiver = new WebhookReceiver(handleWebhook);
    receiver.bindIssuer(handleEvent, handleError);

    handleWebhook.mock.fakeReturnValue(shouldRespondEvents);

    receiver.handleRequest(req, res, 'body');

    jest.runAllTimers();
    await nextTick();

    expect(res.statusCode).toBe(501);
    expect(res.end.mock).toHaveBeenCalled();
  });

  it('ends res with 500 if error thrown', async () => {
    const receiver = new WebhookReceiver(handleWebhook);
    receiver.bindIssuer(handleEvent, handleError);
    handleWebhook.mock.fakeReturnValue(shouldRespondEvents);

    const err = new Error();
    handleEvent.mock.fake(() => Promise.reject(err));

    receiver.handleRequest(req, res, 'body');

    jest.runAllTimers();
    await nextTick();

    expect(handleError.mock).toHaveBeenCalledWith(err);

    expect(res.statusCode).toBe(500);
    expect(res.end.mock.calls[0].args[0]).toBe(undefined);
  });

  it('ends res with "status" and "body" prop of error thrown if given', async () => {
    const receiver = new WebhookReceiver(handleWebhook);
    receiver.bindIssuer(handleEvent, handleError);
    handleWebhook.mock.fakeReturnValue(shouldRespondEvents);

    const err = new Error();
    err.status = 555;
    err.body = 'YOU LOSE!';
    handleEvent.mock.fake(async () => {
      throw err;
    });

    receiver.handleRequest(req, res, 'body');

    jest.runAllTimers();
    await nextTick();

    expect(handleError.mock).toHaveBeenCalledWith(err);

    expect(res.statusCode).toBe(555);
    expect(res.end.mock.calls[0].args[0]).toBe('YOU LOSE!');
  });
});
