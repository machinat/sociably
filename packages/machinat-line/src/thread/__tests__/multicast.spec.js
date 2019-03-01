import Machinat from 'machinat';
import MulticastThread from '../multicast';

it('implements MachinatThread', () => {
  const thread = new MulticastThread(['foo', 'bar', 'baz']);

  expect(thread.platform).toBe('line');
  expect(thread.type).toBe('multicast');
  expect(thread.allowPause).toBe(false);
  expect(thread.to).toEqual(['foo', 'bar', 'baz']);
});

describe('#createJobs(actions)', () => {
  const Foo = () => {};

  const Bar = () => {};
  Bar.$$entry = () => 'bar';
  Bar.$$hasBody = false;

  const actions = [
    { element: <Foo />, value: { id: 0 } },
    { element: <Foo />, value: { id: 1 } },
    { element: <Foo />, value: { id: 2 } },
    { element: <Foo />, value: { id: 3 } },
    { element: <Foo />, value: { id: 4 } },
    { element: <Foo />, value: { id: 5 } },
    { element: <Foo />, value: { id: 6 } },
    { element: <Foo />, value: { id: 7 } },
  ];

  it('create job of multicast api', () => {
    const thread = new MulticastThread(['foo', 'bar', 'baz']);

    const jobs = thread.createJobs(actions);

    expect(jobs.length).toBe(2);
    expect(jobs).toMatchSnapshot();

    expect(jobs[0].threadId).toBe(jobs[1].threadId);

    jobs.forEach(job => {
      expect(job.entry).toBe('message/multicast');
      expect(job.body.to).toEqual(['foo', 'bar', 'baz']);
    });
  });

  it('always retrun identical threadId of jobs', () => {
    const jobs = [];

    jobs.push(...new MulticastThread(['foo', 'bar']).createJobs(actions));
    jobs.push(...new MulticastThread(['foo', 'baz']).createJobs(actions));
    jobs.push(...new MulticastThread(['bar', 'baz']).createJobs(actions));

    expect(jobs.length).toBe(6);

    const { threadId } = jobs[0];

    jobs.forEach(job => {
      expect(job.threadId).toBe(threadId);
    });
  });

  it('throw if non message action contained', () => {
    const thread = new MulticastThread(['foo', 'bar', 'baz']);

    expect(() =>
      thread.createJobs([
        ...actions.slice(0, 7),
        { element: <Bar />, value: { id: 'Boom!' } },
        actions.slice(7),
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"<Bar /> is invalid to be delivered in multicast"`
    );
  });
});
