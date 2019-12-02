import { IncomingMessage, ServerResponse } from 'http';
import moxy from 'moxy';
import handleAuthRequest from '../plugin';

const next = moxy(async () => ({ accepted: true, page: '/foo' }));

const controller = moxy({
  delegateAuthRequest() {
    return Promise.resolve(true);
  },
});

const req = moxy(new IncomingMessage());
const res = moxy(new ServerResponse({}));

const frame = {
  event: { platform: 'next', type: 'request', payload: { req, res } },
  channel: { platform: 'next', type: 'server' },
  user: null,
};

beforeEach(() => {
  next.mock.clear();
  controller.mock.clear();
});

it('implement event middleware', () => {
  const plugin = handleAuthRequest(controller);
  expect(typeof plugin().eventMiddleware).toBe('function');
  expect(plugin().dispatchMiddleware).toBe(undefined);
});

it('delegate request to auth controller', async () => {
  const plugin = handleAuthRequest(controller);

  await expect(plugin().eventMiddleware(next)(frame)).resolves.toEqual({
    accepted: true,
  });

  expect(next.mock).not.toHaveBeenCalled();
  expect(controller.delegateAuthRequest.mock).toHaveBeenCalledTimes(1);
  expect(controller.delegateAuthRequest.mock).toHaveBeenCalledWith(req, res);
});

it('pass to next middleware if delegateAuthRequest resolve false', async () => {
  controller.delegateAuthRequest.mock.fake(async () => false);

  const plugin = handleAuthRequest(controller);
  await expect(plugin().eventMiddleware(next)(frame)).resolves.toEqual({
    accepted: true,
    page: '/foo',
  });

  expect(next.mock).toHaveBeenCalledTimes(1);
  expect(next.mock).toHaveBeenCalledWith(frame);
  expect(controller.delegateAuthRequest.mock).toHaveBeenCalledTimes(1);
  expect(controller.delegateAuthRequest.mock).toHaveBeenCalledWith(req, res);
});
