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
  const user = { id: 'red' };
  const eventReports = [
    { channel, user, event: { id: 1 }, response: undefined },
    { channel, user, event: { id: 2 }, response: undefined },
    { channel, user, event: { id: 3 }, response: undefined },
  ];
  const webhookHandler = moxy(async () => eventReports);
  const responsesHandler = moxy(async () => {
    res.end();
  });
  const issueEvent = moxy(async (_chan, _user, event) => `Ok_${event.id}`);
  const issueError = moxy();

  beforeEach(() => {
    req = moxy(new IncomingMessage({}));
    req.mock.getter('method').fakeReturnValue('POST');
    req.mock.getter('url').fakeReturnValue('/hello');
    req.mock.getter('headers').fakeReturnValue({ wonderful: 'world' });

    res = moxy(new ServerResponse({}));

    webhookHandler.mock.reset();
    responsesHandler.mock.reset();
    issueEvent.mock.reset();
    issueError.mock.reset();
  });

  it('returns undefined', () => {
    const receiver = new WebhookReceiver(webhookHandler, responsesHandler);
    receiver.bindIssuer(issueEvent, issueError);

    expect(receiver.handleRequest(req, res, 'body')).toBe(undefined);
  });

  it('ends res with 501 if no handler bound', async () => {
    const receiver = new WebhookReceiver(webhookHandler, responsesHandler);

    receiver.handleRequest(req, res, 'body');

    jest.runAllTimers();
    await nextTick();

    expect(webhookHandler.mock).not.toHaveBeenCalled();
    expect(issueEvent.mock).not.toHaveBeenCalled();

    expect(res.end.mock).toHaveBeenCalled();
    expect(res.statusCode).toBe(501);
  });

  it('reads body from req if raw body param not given', async () => {
    const receiver = new WebhookReceiver(webhookHandler, responsesHandler);
    receiver.bindIssuer(issueEvent, issueError);

    req.mock.getter('method').fakeReturnValue('POST');
    rawBody.mock.fake(() => Promise.resolve('some body'));

    receiver.handleRequest(req, res);

    jest.runAllTimers();
    await nextTick();

    expect(rawBody.mock.calls[0].args[0]).toBe(req);
    expect(webhookHandler.mock).toHaveBeenCalledWith(req, res, 'some body');

    rawBody.mock.reset();
  });

  it('get events from webhookHandler and pass to issueEvent', async () => {
    const receiver = new WebhookReceiver(webhookHandler, responsesHandler);
    receiver.bindIssuer(issueEvent, issueError);

    receiver.handleRequest(req, res, 'hi');
    jest.runAllTimers();
    await nextTick();

    expect(webhookHandler.mock).toHaveBeenCalledTimes(1);
    expect(webhookHandler.mock).toHaveBeenCalledWith(req, res, 'hi');

    expect(issueEvent.mock).toHaveBeenCalledTimes(3);
    for (let i = 1; i < 4; i += 1) {
      expect(issueEvent.mock).toHaveBeenNthCalledWith(
        i,
        channel,
        user,
        { id: i },
        {
          source: 'webhook',
          request: {
            method: 'POST',
            url: '/hello',
            headers: { wonderful: 'world' },
            body: 'hi',
            encrypted: false,
          },
        }
      );
    }

    expect(responsesHandler.mock).toHaveBeenCalledTimes(1);

    await expect(Promise.all(issueEvent.mock.calls.map(c => c.result))).resolves
      .toMatchInlineSnapshot(`
Array [
  "Ok_1",
  "Ok_2",
  "Ok_3",
]
`);
  });

  it('set metadata.request.encrypted to true if req is encrypted', async () => {
    const receiver = new WebhookReceiver(webhookHandler, responsesHandler);
    receiver.bindIssuer(issueEvent, issueError);

    req.socket.mock.getter('encrypted').fakeReturnValue(true);

    receiver.handleRequest(req, res, 'hi');
    jest.runAllTimers();
    await nextTick();

    expect(issueEvent.mock).toHaveBeenCalledTimes(3);
    for (let i = 1; i < 4; i += 1) {
      expect(issueEvent.mock).toHaveBeenNthCalledWith(
        i,
        channel,
        user,
        { id: i },
        {
          source: 'webhook',
          request: {
            method: 'POST',
            url: '/hello',
            headers: { wonderful: 'world' },
            body: 'hi',
            encrypted: true,
          },
        }
      );
    }
  });

  it('ends res with 501 if eventHandler not end it and return no events', async () => {
    const receiver = new WebhookReceiver(webhookHandler, responsesHandler);
    receiver.bindIssuer(issueEvent, issueError);

    webhookHandler.mock.fakeReturnValue(undefined);
    receiver.handleRequest(req, res, 'body');

    jest.runAllTimers();
    await nextTick();

    expect(webhookHandler.mock).toHaveBeenCalledTimes(1);
    expect(responsesHandler.mock).not.toHaveBeenCalled();
    expect(issueEvent.mock).not.toHaveBeenCalled();

    expect(res.end.mock).toHaveBeenCalled();
    expect(res.statusCode).toBe(501);
  });

  it('pass eventReports back to responsesHandler with response attached', async () => {
    const receiver = new WebhookReceiver(webhookHandler, responsesHandler);
    receiver.bindIssuer(issueEvent, issueError);

    receiver.handleRequest(req, res, 'hi');
    jest.runAllTimers();
    await nextTick();

    expect(webhookHandler.mock).toHaveBeenCalledWith(req, res, 'hi');

    jest.runAllTimers();
    await nextTick();

    expect(webhookHandler.mock).toHaveBeenCalledTimes(1);
    expect(issueEvent.mock).toHaveBeenCalledTimes(3);

    expect(responsesHandler.mock).toHaveBeenCalledTimes(1);
    expect(responsesHandler.mock).toHaveBeenCalledWith(
      req,
      res,
      eventReports.map(report => ({
        ...report,
        response: `Ok_${report.event.id}`,
      }))
    );

    expect(res.statusCode).toBe(200);
  });

  it('not call responsesHandler if res already ended in webhookHandler', async () => {
    const receiver = new WebhookReceiver(webhookHandler, responsesHandler);
    receiver.bindIssuer(issueEvent, issueError);

    webhookHandler.mock.fake(async () => {
      res.end();
      return eventReports;
    });

    receiver.handleRequest(req, res, 'hi');
    jest.runAllTimers();
    await nextTick();

    expect(webhookHandler.mock).toHaveBeenCalledTimes(1);
    expect(issueEvent.mock).toHaveBeenCalledTimes(3);

    expect(webhookHandler.mock).toHaveBeenCalledWith(req, res, 'hi');
    expect(responsesHandler.mock).not.toHaveBeenCalled();
  });

  it('end res with 501 if both webhookHandler and responsesHandler not end it', async () => {
    const receiver = new WebhookReceiver(webhookHandler, responsesHandler);
    receiver.bindIssuer(issueEvent, issueError);

    responsesHandler.mock.fake(async () => {});

    receiver.handleRequest(req, res, 'hi');
    jest.runAllTimers();
    await nextTick();

    expect(webhookHandler.mock).toHaveBeenCalledTimes(1);
    expect(issueEvent.mock).toHaveBeenCalledTimes(3);
    expect(responsesHandler.mock).toHaveBeenCalledTimes(1);

    expect(res.end.mock).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(501);
  });

  it('end res with 501 if webhookHandler not end it and no responsesHandler given', async () => {
    const receiver = new WebhookReceiver(webhookHandler);
    receiver.bindIssuer(issueEvent, issueError);

    responsesHandler.mock.fake(async () => {});

    receiver.handleRequest(req, res, 'hi');
    jest.runAllTimers();
    await nextTick();

    expect(webhookHandler.mock).toHaveBeenCalledTimes(1);
    expect(issueEvent.mock).toHaveBeenCalledTimes(3);
    expect(res.end.mock).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(501);
  });

  it('ends res with 500 if error thrown in issueEvent', async () => {
    const receiver = new WebhookReceiver(webhookHandler, responsesHandler);
    receiver.bindIssuer(issueEvent, issueError);

    issueEvent.mock.fake(() => Promise.reject(new Error('FAIL')));
    receiver.handleRequest(req, res, 'body');

    jest.runAllTimers();
    await nextTick();

    expect(webhookHandler.mock).toHaveBeenCalledTimes(1);
    expect(issueEvent.mock).toHaveBeenCalledTimes(3);
    expect(responsesHandler.mock).not.toHaveBeenCalled();

    expect(issueError.mock).toHaveBeenCalledTimes(1);
    expect(issueError.mock).toHaveBeenCalledWith(new Error('FAIL'));

    expect(res.statusCode).toBe(500);
    expect(res.end.mock.calls[0].args[0]).toBe(undefined);
  });

  it('ends res with "status" and "body" prop of error thrown in issueEvent', async () => {
    const receiver = new WebhookReceiver(webhookHandler, responsesHandler);
    receiver.bindIssuer(issueEvent, issueError);

    const err = new Error();
    err.status = 555;
    err.body = 'YOU LOSE!';
    issueEvent.mock.fake(async () => {
      throw err;
    });

    receiver.handleRequest(req, res, 'body');

    jest.runAllTimers();
    await nextTick();

    expect(issueError.mock).toHaveBeenCalledWith(err);

    expect(res.statusCode).toBe(555);
    expect(res.end.mock.calls[0].args[0]).toBe('YOU LOSE!');
  });

  it('ends res with 500 if error thrown in webhookHandler', async () => {
    const receiver = new WebhookReceiver(webhookHandler, responsesHandler);
    receiver.bindIssuer(issueEvent, issueError);

    webhookHandler.mock.fake(() => Promise.reject(new Error('FAIL')));
    receiver.handleRequest(req, res, 'body');

    jest.runAllTimers();
    await nextTick();

    expect(webhookHandler.mock).toHaveBeenCalledTimes(1);
    expect(issueEvent.mock).not.toHaveBeenCalled();
    expect(responsesHandler.mock).not.toHaveBeenCalled();

    expect(issueError.mock).toHaveBeenCalledTimes(1);
    expect(issueError.mock).toHaveBeenCalledWith(new Error('FAIL'));

    expect(res.statusCode).toBe(500);
    expect(res.end.mock.calls[0].args[0]).toBe(undefined);
  });

  it('ends res with 500 if error thrown in responsesHandler', async () => {
    const receiver = new WebhookReceiver(webhookHandler, responsesHandler);
    receiver.bindIssuer(issueEvent, issueError);

    responsesHandler.mock.fake(() => Promise.reject(new Error('FAIL')));
    receiver.handleRequest(req, res, 'body');

    jest.runAllTimers();
    await nextTick();

    expect(webhookHandler.mock).toHaveBeenCalledTimes(1);
    expect(issueEvent.mock).toHaveBeenCalledTimes(3);
    expect(responsesHandler.mock).toHaveBeenCalledTimes(1);

    expect(issueError.mock).toHaveBeenCalledTimes(1);
    expect(issueError.mock).toHaveBeenCalledWith(new Error('FAIL'));

    expect(res.statusCode).toBe(500);
    expect(res.end.mock.calls[0].args[0]).toBe(undefined);
  });
});
