import GeneralMessengerAPIThread from '../general';

it('implements MachinatThread', () => {
  const thread = new GeneralMessengerAPIThread('me/foo');

  expect(thread.platform).toBe('messenger');
  expect(thread.type).toBe('page_api');
  expect(thread.subtype).toBe('foo');
  expect(thread.allowPause).toBe(false);
  expect(thread.uid).toBe('messenger:default:foo');
});

it('create jobs to specified path and body', () => {
  const thread = new GeneralMessengerAPIThread('me/foo');
  expect(thread.createJobs(null, { bar: 'baz' })).toEqual([
    {
      threadId: 'messenger:default:foo',
      request: {
        method: 'POST',
        relative_url: 'me/foo',
        body: 'bar=baz',
      },
    },
  ]);
});

it('create body with common static fields', () => {
  const thread = new GeneralMessengerAPIThread('me/foo', { bar: 'rab' });
  expect(thread.createJobs(null, { baz: 'zab' })).toEqual([
    {
      threadId: 'messenger:default:foo',
      request: {
        method: 'POST',
        relative_url: 'me/foo',
        body: 'bar=rab&baz=zab',
      },
    },
  ]);
});

it('throw when rendering tree is not null', () => {
  const thread = new GeneralMessengerAPIThread('me/foo');
  expect(() =>
    thread.createJobs('somthing', { bar: 'baz' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"there should be nothing rendered at GeneralMessengerAPIThread"`
  );
});
