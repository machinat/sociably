import moxy from 'moxy';
import Machinat from 'machinat';
import { ENTRY_GETTER } from '../constant';
import LineChannel from '../channel';
import { createChatJobs, createMulticastJobs } from '../job';

const Foo = () => {};
const Bar = () => {};
const Baz = () => {};

const barEntry = moxy(() => ({ method: 'POST', path: 'bar' }));
const bazEntry = moxy(() => ({ method: 'POST', path: 'baz' }));

beforeEach(() => {
  barEntry.mock.clear();
  bazEntry.mock.clear();
});

describe('createChatJobs()', () => {
  const segments = [
    { node: <Foo />, value: { id: 0 } },
    { node: <Foo />, value: { id: 1 } },
    { node: <Foo />, value: { id: 2 } },
    { node: <Foo />, value: { id: 3 } },
    { node: <Foo />, value: { id: 4 } },
    { node: <Foo />, value: { id: 5 } },
    { node: <Foo />, value: { id: 6 } },
    { node: <Bar />, value: { id: 7, [ENTRY_GETTER]: barEntry } },
    { node: <Foo />, value: { id: 8 } },
    { node: <Baz />, value: { id: 9, [ENTRY_GETTER]: bazEntry } },
  ];

  it('work', () => {
    const channel = new LineChannel('_LINE_CHANNEL_ID_', {
      type: 'user',
      userId: 'john',
    });

    const jobs = createChatJobs(channel, segments);

    expect(jobs).toMatchSnapshot();

    expect(jobs.length).toBe(5);
    jobs.forEach((job, i) => {
      if ([2, 4].includes(i)) {
        expect(job.path).toBe(i === 2 ? 'bar' : 'baz');
      } else {
        expect(job.path).toBe('v2/bot/message/push');
        expect(job.body.to).toBe('john');
      }
    });

    expect(barEntry.mock).toHaveBeenCalledTimes(1);
    expect(barEntry.mock).toHaveBeenCalledWith(channel);

    expect(bazEntry.mock).toHaveBeenCalledTimes(1);
    expect(bazEntry.mock).toHaveBeenCalledWith(channel);
  });

  test('when useReplyAPI', () => {
    const channel = new LineChannel('_LINE_CHANNEL_ID_', {
      type: 'user',
      userId: 'john',
    });

    const jobs = createChatJobs(channel, segments, {
      replyToken: '__REPLY_TOKEN__',
    });

    expect(jobs).toMatchSnapshot();

    expect(jobs.length).toBe(5);
    jobs.forEach((job, i) => {
      if ([2, 4].includes(i)) {
        expect(job.path).toBe(i === 2 ? 'bar' : 'baz');
      } else {
        expect(job.path).toBe('v2/bot/message/reply');
        expect(job.body.replyToken).toBe('__REPLY_TOKEN__');
      }
    });

    expect(barEntry.mock).toHaveBeenCalledTimes(1);
    expect(barEntry.mock).toHaveBeenCalledWith(channel);

    expect(bazEntry.mock).toHaveBeenCalledTimes(1);
    expect(bazEntry.mock).toHaveBeenCalledWith(channel);
  });
});

describe('createMulticastJobs()', () => {
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
      expect(job.path).toBe('v2/bot/message/multicast');
      expect(job.body.to).toEqual(['foo', 'bar', 'baz']);
    });
  });

  it('throw if non message segment contained', () => {
    expect(() =>
      createMulticastJobs(
        ['foo', 'bar', 'baz'],
        [
          ...segments.slice(0, 7),
          { node: <Bar />, value: { id: 'Boom!', [ENTRY_GETTER]: barEntry } },
          segments.slice(7),
        ]
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<Bar /> is invalid to be delivered in multicast"`
    );
  });
});
