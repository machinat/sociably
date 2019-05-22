import moxy from 'moxy';
import Machinat from 'machinat';
import LineChannel from '../channel';
import { createChatJobs, createMulticastJobs } from '../job';

describe('createChatJobs()', () => {
  const Foo = () => {};

  const Bar = () => {};
  Bar.$$getEntry = moxy(() => 'bar');

  const Baz = () => {};
  Baz.$$getEntry = moxy(() => 'baz');

  beforeEach(() => {
    Bar.$$getEntry.mock.clear();
    Baz.$$getEntry.mock.clear();
  });

  const segments = [
    { node: <Foo />, value: { id: 0 } },
    { node: <Foo />, value: { id: 1 } },
    { node: <Foo />, value: { id: 2 } },
    { node: <Foo />, value: { id: 3 } },
    { node: <Foo />, value: { id: 4 } },
    { node: <Foo />, value: { id: 5 } },
    { node: <Foo />, value: { id: 6 } },
    { node: <Bar />, value: { id: 7 } },
    { node: <Foo />, value: { id: 8 } },
    { node: <Baz />, value: { id: 9 } },
  ];

  it('work', () => {
    const channel = new LineChannel({ type: 'user', userId: 'john' });

    const jobs = createChatJobs(channel, segments);

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

    expect(Bar.$$getEntry.mock).toHaveBeenCalledTimes(1);
    expect(Bar.$$getEntry.mock).toHaveBeenCalledWith(channel, { id: 7 });

    expect(Baz.$$getEntry.mock).toHaveBeenCalledTimes(1);
    expect(Baz.$$getEntry.mock).toHaveBeenCalledWith(channel, { id: 9 });
  });

  test('when useReplyAPI', () => {
    const channel = new LineChannel({ type: 'user', userId: 'john' });

    const jobs = createChatJobs(channel, segments, {
      replyToken: '__REPLY_TOKEN__',
    });

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

    expect(Bar.$$getEntry.mock).toHaveBeenCalledTimes(1);
    expect(Bar.$$getEntry.mock).toHaveBeenCalledWith(channel, { id: 7 });

    expect(Baz.$$getEntry.mock).toHaveBeenCalledTimes(1);
    expect(Baz.$$getEntry.mock).toHaveBeenCalledWith(channel, { id: 9 });
  });
});

describe('createMulticastJobs()', () => {
  const Foo = () => {};

  const Bar = () => {};
  Bar.$$getEntry = () => 'bar';
  Bar.$$hasBody = false;

  const segments = [
    { node: <Foo />, value: { id: 0 } },
    { node: <Foo />, value: { id: 1 } },
    { node: <Foo />, value: { id: 2 } },
    { node: <Foo />, value: { id: 3 } },
    { node: <Foo />, value: { id: 4 } },
    { node: <Foo />, value: { id: 5 } },
    { node: <Foo />, value: { id: 6 } },
    { node: <Foo />, value: { id: 7 } },
  ];

  it('create job of multicast api', () => {
    const jobs = createMulticastJobs(['foo', 'bar', 'baz'], segments);

    expect(jobs.length).toBe(2);
    expect(jobs).toMatchSnapshot();

    expect(jobs[0].channelId).toBe(jobs[1].channelId);

    jobs.forEach(job => {
      expect(job.entry).toBe('message/multicast');
      expect(job.body.to).toEqual(['foo', 'bar', 'baz']);
    });
  });

  it('throw if non message segment contained', () => {
    expect(() =>
      createMulticastJobs(
        ['foo', 'bar', 'baz'],
        [
          ...segments.slice(0, 7),
          { node: <Bar />, value: { id: 'Boom!' } },
          segments.slice(7),
        ]
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<Bar /> is invalid to be delivered in multicast"`
    );
  });
});
