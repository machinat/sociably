import moxy from 'moxy';
import Machinat from 'machinat';
import ChatThread from '../chat';

test('user source', () => {
  const thread = new ChatThread(
    { type: 'user', userId: 'foo' },
    '_TOKEN_',
    false
  );

  expect(thread.platform).toBe('line');
  expect(thread.type).toBe('chat');
  expect(thread.subtype).toBe('user');
  expect(thread.allowPause).toBe(true);
  expect(thread.source).toEqual({ type: 'user', userId: 'foo' });
  expect(thread.sourceId).toBe('foo');
  expect(thread.replyToken).toBe('_TOKEN_');
  expect(thread.useReplyAPI).toBe(false);
});

test('room source', () => {
  const thread = new ChatThread(
    { type: 'room', roomId: 'foo' },
    '_TOKEN_',
    false
  );

  expect(thread.platform).toBe('line');
  expect(thread.type).toBe('chat');
  expect(thread.subtype).toBe('room');
  expect(thread.allowPause).toBe(true);
  expect(thread.source).toEqual({ type: 'room', roomId: 'foo' });
  expect(thread.sourceId).toBe('foo');
  expect(thread.replyToken).toBe('_TOKEN_');
  expect(thread.useReplyAPI).toBe(false);
});

test('group source', () => {
  const thread = new ChatThread(
    { type: 'group', groupId: 'foo' },
    '_TOKEN_',
    false
  );

  expect(thread.platform).toBe('line');
  expect(thread.type).toBe('chat');
  expect(thread.subtype).toBe('group');
  expect(thread.allowPause).toBe(true);
  expect(thread.source).toEqual({ type: 'group', groupId: 'foo' });
  expect(thread.sourceId).toBe('foo');
  expect(thread.replyToken).toBe('_TOKEN_');
  expect(thread.useReplyAPI).toBe(false);
});

test('unknown source', () => {
  const thread = new ChatThread(null, '_TOKEN_', false);

  expect(thread.platform).toBe('line');
  expect(thread.type).toBe('chat');
  expect(thread.subtype).toBe('unknown');
  expect(thread.allowPause).toBe(true);
  expect(thread.source).toEqual(null);
  expect(thread.sourceId).toBe(undefined);
  expect(thread.replyToken).toBe('_TOKEN_');
  expect(thread.useReplyAPI).toBe(false);
});

describe('#createJobs(actions)', () => {
  const Foo = () => {};

  const Bar = () => {};
  Bar.$$entry = moxy(() => 'bar');
  Bar.$$hasBody = false;

  const Baz = () => {};
  Baz.$$entry = moxy(() => 'baz');
  Baz.$$hasBody = true;

  beforeEach(() => {
    Bar.$$entry.mock.clear();
    Baz.$$entry.mock.clear();
  });

  const actions = [
    { element: <Foo />, value: { id: 0 } },
    { element: <Foo />, value: { id: 1 } },
    { element: <Foo />, value: { id: 2 } },
    { element: <Foo />, value: { id: 3 } },
    { element: <Foo />, value: { id: 4 } },
    { element: <Foo />, value: { id: 5 } },
    { element: <Foo />, value: { id: 6 } },
    { element: <Bar />, value: { id: 7 } },
    { element: <Foo />, value: { id: 8 } },
    { element: <Baz />, value: { id: 9 } },
  ];

  test('when not useReplyAPI', () => {
    const thread = new ChatThread(
      { type: 'user', userId: 'john' },
      null,
      false
    );

    const jobs = thread.createJobs(actions);

    expect(jobs).toMatchSnapshot();

    expect(jobs.length).toBe(5);
    jobs.forEach((job, i) => {
      if ([2, 4].includes(i)) {
        expect(job.entry).toBe(i === 2 ? 'bar' : 'baz');
      } else {
        expect(job.entry).toBe('message/push');
        expect(job.body.to).toBe('john');
      }
    });

    expect(Bar.$$entry.mock).toHaveBeenCalledTimes(1);
    expect(Bar.$$entry.mock).toHaveBeenCalledWith(thread, { id: 7 });
    expect(Baz.$$entry.mock).toHaveBeenCalledTimes(1);
    expect(Baz.$$entry.mock).toHaveBeenCalledWith(thread, { id: 9 });
  });

  test('when useReplyAPI', () => {
    const thread = new ChatThread(null, '__REPLY_TOKEN__', true);

    const jobs = thread.createJobs(actions);

    expect(jobs).toMatchSnapshot();

    expect(jobs.length).toBe(5);
    jobs.forEach((job, i) => {
      if ([2, 4].includes(i)) {
        expect(job.entry).toBe(i === 2 ? 'bar' : 'baz');
      } else {
        expect(job.entry).toBe('message/reply');
        expect(job.body.replyToken).toBe('__REPLY_TOKEN__');
      }
    });

    expect(Bar.$$entry.mock).toHaveBeenCalledTimes(1);
    expect(Bar.$$entry.mock).toHaveBeenCalledWith(thread, { id: 7 });
    expect(Baz.$$entry.mock).toHaveBeenCalledTimes(1);
    expect(Baz.$$entry.mock).toHaveBeenCalledWith(thread, { id: 9 });
  });

  it('throw if source not given when not useReplyAPI', async () => {
    const thread = new ChatThread(null, '_TOKEN_', false);

    expect(() => thread.createJobs()).toThrowErrorMatchingInlineSnapshot(
      `"source should not be empty when not useReplyAPI"`
    );
  });

  it('throw if replyToken not given when useReplyAPI', async () => {
    const thread = new ChatThread({ type: 'user', userId: 'foo' }, null, true);

    expect(() => thread.createJobs()).toThrowErrorMatchingInlineSnapshot(
      `"replyToken should not be empty when useReplyAPI"`
    );
  });
});
