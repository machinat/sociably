import moxy from 'moxy';
import { IncomingMessage, ServerResponse } from 'http';
import rawBody from 'raw-body';
import WebhookConnector from '../webhookConnector';

jest.mock('raw-body');

describe('#handleRequest(fn)', () => {
  it('returns the handler', () => {
    const connector = new WebhookConnector({}, () => {});
    expect(typeof connector.handleRequest(() => {})).toBe('function');
  });

  describe('handler(req, res, body, httpContext)', () => {
    const req = moxy(new IncomingMessage());
    const res = moxy(new ServerResponse({}));
    res.end.mock.fake((d, e, f) => {
      const cb = f || e || d;
      if (typeof cb === 'function') cb();
    });
    const handleWebhook = moxy(() => [{ id: 1 }, { id: 2 }, { id: 3 }]);

    beforeEach(() => {
      req.mock.reset();
      res.mock.reset();
      handleWebhook.mock.reset();
      res.end.mock.fake((d, e, f) => {
        const cb = f || e || d;
        if (typeof cb === 'function') cb();
      });
    });

    it('returns a promise', async () => {
      const connector = new WebhookConnector({}, handleWebhook);

      const fn = moxy();
      const handler = connector.handleRequest(fn);

      const promise = handler(req, res, 'body');

      expect(promise).toBeInstanceOf(Promise);
      await expect(promise).resolves.toBe(undefined);
    });

    it('retrieve the event and pass it to fn', async () => {
      const connector = new WebhookConnector({}, handleWebhook);

      const fn = moxy();
      const handler = connector.handleRequest(fn);

      await handler(req, res, 'body');

      expect(handleWebhook.mock).toHaveBeenCalledWith(req, res, 'body');

      expect(fn.mock.calls[0].args[0]).toEqual(
        expect.objectContaining({ event: { id: 1 }, source: 'http' })
      );
      expect(fn.mock.calls[1].args[0]).toEqual(
        expect.objectContaining({ event: { id: 2 }, source: 'http' })
      );
      expect(fn.mock.calls[2].args[0]).toEqual(
        expect.objectContaining({ event: { id: 3 }, source: 'http' })
      );
    });

    it('reads body from req if body not given', async () => {
      const connector = new WebhookConnector({}, handleWebhook);

      req.mock.getter('method').fakeReturnValue('POST');
      rawBody.mock.fake(() => Promise.resolve('body'));

      const fn = moxy();
      const handler = connector.handleRequest(fn);

      await handler(req, res);

      expect(rawBody.mock.calls[0].args[0]).toBe(req);
      expect(handleWebhook.mock).toHaveBeenCalledWith(req, res, 'body');

      rawBody.mock.reset();
    });

    it('ends res with 200 if no event returned by handleRequest', async () => {
      const connector = new WebhookConnector({}, handleWebhook);

      const fn = moxy();
      const handler = connector.handleRequest(fn);

      handleWebhook.mock.fakeReturnValue(undefined);
      await handler(req, res, 'body');

      expect(handleWebhook.mock).toHaveBeenCalledTimes(1);
      expect(fn.mock).not.toHaveBeenCalled();

      expect(res.end.mock).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });

    it('ends res with 200 if no shouldRespond envent found', async () => {
      const connector = new WebhookConnector({}, handleWebhook);

      const fn = moxy();
      const handler = connector.handleRequest(fn);

      await handler(req, res, 'body');
      expect(res.end.mock).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });

    it('ends res with what is configured by context.respond()', async () => {
      const connector = new WebhookConnector({}, handleWebhook);
      handleWebhook.mock.fakeReturnValue([{ id: 1, shouldRespond: true }]);

      const fn = moxy(async ctx => {
        ctx.respond(201, 'success body');
      });
      const handler = connector.handleRequest(fn);

      await handler(req, res, 'body');
      expect(res.statusCode).toBe(201);
      expect(res.end.mock.calls[0].args[0]).toBe('success body');
    });

    it('ends res body with json if object pass to context.respond()', async () => {
      const connector = new WebhookConnector({}, handleWebhook);
      handleWebhook.mock.fakeReturnValue([{ id: 1, shouldRespond: true }]);

      const fn = moxy(async ctx => {
        ctx.respond(201, { success: true });
      });
      const handler = connector.handleRequest(fn);

      await handler(req, res, 'body');
      expect(res.statusCode).toBe(201);
      expect(res.end.mock.calls[0].args[0]).toBe('{"success":true}');
    });

    it('ends res with 501 if fn does not context.respond()', async () => {
      const connector = new WebhookConnector({}, handleWebhook);
      handleWebhook.mock.fakeReturnValue([{ id: 1, shouldRespond: true }]);

      const fn = moxy(async () => {});
      const handler = connector.handleRequest(fn);

      await handler(req, res, 'body');
      expect(res.statusCode).toBe(501);
      expect(res.end.mock).toHaveBeenCalled();
    });

    it('ends res error.status thrown by fn', async () => {
      const connector = new WebhookConnector({}, handleWebhook);
      handleWebhook.mock.fakeReturnValue([{ id: 1, shouldRespond: true }]);

      const fn = moxy(async () => {
        const err = new Error();
        err.status = 555;
        err.message = 'Failed!';
        throw err;
      });
      const handler = connector.handleRequest(fn);

      await expect(handler(req, res, 'body')).rejects.toThrow();

      expect(res.statusCode).toBe(555);
      expect(res.end.mock.calls[0].args[0]).toBe('Failed!');
    });
  });
});
