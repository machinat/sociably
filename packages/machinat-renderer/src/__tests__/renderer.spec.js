import Machinat from '../../../machinat';
import Renderer from '../renderer';
import { ExecutionError } from '../errors';

it('is a constructor', () => {
  expect(() => new Renderer('Test')).not.toThrow();
});

const Native = () => {};
const Custom = jest.fn(props => (
  <>
    wrapped head
    <Native {...props} />
    wrapped foot
  </>
));

const delegate = {
  isNativeElementType: jest.fn(t => t === Native),
  renderGeneralElement: jest.fn().mockReturnValue('bbb'),
  renderNativeElement: jest.fn(e => e.props),
  createJobsFromRendered: jest.fn(rendered =>
    rendered.map(r => ({ id: r.rendered }))
  ),
};

afterEach(() => {
  Custom.mockClear();
  delegate.isNativeElementType.mockClear();
  delegate.renderGeneralElement.mockClear();
  delegate.renderNativeElement.mockClear();
  delegate.createJobsFromRendered.mockClear();
});

describe('#render()', () => {
  it('works', () => {
    const context = {};
    const renderer = new Renderer('Test', delegate);
    const rendered = renderer.render(
      <>
        {123}
        abc
        <a>aaa</a>
        <Native x="true" y={false} />
        <Custom a="A" b={2} />
      </>,
      '$',
      context
    );

    expect(rendered).toEqual([
      { element: 123, rendered: 123 },
      { element: 'abc', rendered: 'abc' },
      { element: <a>aaa</a>, rendered: 'bbb' },
      {
        element: <Native x="true" y={false} />,
        rendered: { x: 'true', y: false },
      },
      { element: 'wrapped head', rendered: 'wrapped head' },
      {
        element: <Native a="A" b={2} />,
        rendered: { a: 'A', b: 2 },
      },
      { element: 'wrapped foot', rendered: 'wrapped foot' },
    ]);

    expect(Custom).toBeCalledTimes(1);
    expect(Custom.mock.calls[0]).toEqual([{ a: 'A', b: 2 }, context]);

    expect(delegate.isNativeElementType).toHaveBeenNthCalledWith(1, Native);
    expect(delegate.isNativeElementType).toHaveBeenNthCalledWith(2, Custom);
    expect(delegate.isNativeElementType).toHaveBeenNthCalledWith(3, Native);

    expect(delegate.renderGeneralElement).toBeCalledTimes(1);
    const renderGeneralCalls = delegate.renderGeneralElement.mock.calls;
    expect(renderGeneralCalls[0][0]).toEqual(<a>aaa</a>);
    expect(typeof renderGeneralCalls[0][1]).toBe('function');
    expect(renderGeneralCalls[0][2]).toEqual(context);
    expect(renderGeneralCalls[0][3]).toEqual('$::2');

    expect(delegate.renderNativeElement).toBeCalledTimes(2);
    delegate.renderNativeElement.mock.calls.forEach((call, i) => {
      expect(call[0]).toEqual(
        [<Native x="true" y={false} />, <Native a="A" b={2} />][i]
      );
      expect(typeof call[1]).toBe('function');
      expect(call[2]).toEqual(context);
      expect(call[3]).toEqual(['$::3', '$::4#mockConstructor::1'][i]);
    });
  });
});

describe('#renderSequence()', () => {
  it('works', () => {
    const afterCallback = () => Promise.resolve();
    const WrappedImmediately = () => (
      <Machinat.Immediately after={afterCallback} />
    );
    const context = {};

    const renderer = new Renderer('Test', delegate);
    const rendered = renderer.renderSequence(
      <>
        <Machinat.Immediately />
        {123}
        abc
        <Machinat.Immediately after={afterCallback} />
        <a>aaa</a>
        <Native x="true" y={false} />
        <WrappedImmediately />
        <Custom a="A" b={2} />
      </>,
      context
    );

    expect(rendered).toEqual([
      <Machinat.Immediately />,
      [{ element: 123, rendered: 123 }, { element: 'abc', rendered: 'abc' }],
      <Machinat.Immediately after={afterCallback} />,
      [
        { element: <a>aaa</a>, rendered: 'bbb' },
        {
          element: <Native x="true" y={false} />,
          rendered: { x: 'true', y: false },
        },
      ],
      <Machinat.Immediately after={afterCallback} />,
      [
        { element: 'wrapped head', rendered: 'wrapped head' },
        {
          element: <Native a="A" b={2} />,
          rendered: { a: 'A', b: 2 },
        },
        { element: 'wrapped foot', rendered: 'wrapped foot' },
      ],
    ]);

    expect(Custom).toBeCalledTimes(1);
    expect(Custom.mock.calls[0]).toEqual([{ a: 'A', b: 2 }, context]);

    const {
      isNativeElementType,
      renderGeneralElement,
      renderNativeElement,
    } = delegate;
    expect(isNativeElementType).toHaveBeenNthCalledWith(1, Native);
    expect(isNativeElementType).toHaveBeenNthCalledWith(2, WrappedImmediately);
    expect(isNativeElementType).toHaveBeenNthCalledWith(3, Custom);
    expect(isNativeElementType).toHaveBeenNthCalledWith(4, Native);

    expect(renderGeneralElement).toBeCalledTimes(1);
    expect(renderGeneralElement.mock.calls[0][0]).toEqual(<a>aaa</a>);
    expect(typeof renderGeneralElement.mock.calls[0][1]).toBe('function');
    expect(renderGeneralElement.mock.calls[0][2]).toEqual(context);
    expect(renderGeneralElement.mock.calls[0][3]).toEqual('$::4');

    expect(renderNativeElement).toBeCalledTimes(2);
    renderNativeElement.mock.calls.forEach((call, i) => {
      expect(call[0]).toEqual(
        [<Native x="true" y={false} />, <Native a="A" b={2} />][i]
      );
      expect(typeof call[1]).toBe('function');
      expect(call[2]).toEqual(context);
      expect(call[3]).toEqual(['$::5', '$::7#mockConstructor::1'][i]);
    });
  });

  describe('#executeSequence()', () => {
    it('works', async () => {
      const queue = {
        enqueueJobAndWait: jest.fn(jobs => ({
          error: null,
          jobsResult: jobs.map(job => ({ success: true, payload: job })),
        })),
      };
      const afterCallback = jest.fn();
      const sequence = [
        [{ rendered: 1, element: 1 }, { rendered: 2, element: 2 }],
        <Machinat.Immediately after={afterCallback} />,
        [{ rendered: 3, element: 3 }, { rendered: 4, element: 4 }],
        <Machinat.Immediately after={afterCallback} />,
        [{ rendered: 5, element: 5 }],
      ];

      const renderer = new Renderer('Test', delegate);
      const result = await renderer.executeSequence(queue, sequence);

      expect(result).toEqual([
        { success: true, payload: { id: 1 } },
        { success: true, payload: { id: 2 } },
        { success: true, payload: { id: 3 } },
        { success: true, payload: { id: 4 } },
        { success: true, payload: { id: 5 } },
      ]);

      expect(delegate.createJobsFromRendered).toBeCalledTimes(3);
      const createJobsCalls = delegate.createJobsFromRendered.mock.calls;
      expect(createJobsCalls[0][0]).toEqual([
        { rendered: 1, element: 1 },
        { rendered: 2, element: 2 },
      ]);
      expect(createJobsCalls[1][0]).toEqual([
        { rendered: 3, element: 3 },
        { rendered: 4, element: 4 },
      ]);
      expect(createJobsCalls[2][0]).toEqual([{ rendered: 5, element: 5 }]);

      expect(afterCallback).toBeCalledTimes(2);

      expect(queue.enqueueJobAndWait).toBeCalledTimes(3);
      const enqueueCalls = queue.enqueueJobAndWait.mock.calls;
      expect(enqueueCalls[0][0]).toEqual([{ id: 1 }, { id: 2 }]);
      expect(enqueueCalls[1][0]).toEqual([{ id: 3 }, { id: 4 }]);
      expect(enqueueCalls[2][0]).toEqual([{ id: 5 }]);
    });

    it('throw if executed with error', async () => {
      const queue = {
        enqueueJobAndWait: jest.fn(jobs => ({
          error: new Error('!!!'),
          jobsResult: jobs.map((job, i) => ({
            success: !(i % 2),
            payload: job,
          })),
        })),
      };
      const sequence = [
        [{ rendered: 1, element: 1 }, { rendered: 2, element: 2 }],
        [{ rendered: 3, element: 3 }, { rendered: 4, element: 4 }],
      ];

      const renderer = new Renderer('Test', delegate);

      try {
        await renderer.executeSequence(queue, sequence);
        expect('you should not come here').toBe(true);
      } catch (e) {
        expect(e).toEqual(new ExecutionError(new Error('!!!')));
        expect(e.result).toEqual([
          { success: true, payload: { id: 1 } },
          { success: false, payload: { id: 2 } },
        ]);
      }

      expect(delegate.createJobsFromRendered).toBeCalledTimes(1);
      expect(delegate.createJobsFromRendered.mock.calls[0][0]).toEqual([
        { rendered: 1, element: 1 },
        { rendered: 2, element: 2 },
      ]);

      expect(queue.enqueueJobAndWait).toBeCalledTimes(1);
      expect(queue.enqueueJobAndWait.mock.calls[0][0]).toEqual([
        { id: 1 },
        { id: 2 },
      ]);
    });
  });
});
