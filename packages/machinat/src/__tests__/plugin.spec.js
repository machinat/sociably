import plugin from '../plugin';

it('create plugin with middlewares provided', () => {
  const eventMiddleware = next => frame => next(frame);
  const dispatchMiddleware = next => frame => next(frame);
  const bot = { BB: 8 };

  expect(plugin(eventMiddleware, dispatchMiddleware)(bot)).toEqual({
    eventMiddleware,
    dispatchMiddleware,
  });

  expect(plugin(eventMiddleware)(bot)).toEqual({
    eventMiddleware,
  });

  expect(plugin(null, dispatchMiddleware)(bot)).toEqual({
    eventMiddleware: null,
    dispatchMiddleware,
  });
});
