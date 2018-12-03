import Machinat from '../../../machinat';
import Renderer from '../renderer';
import JobSequence from '../jobSequence';

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
Object.defineProperty(Custom, 'name', { value: 'Custom' });

let jobId = 0;
const delegate = {
  isNativeComponent: jest.fn(t => t === Native),
  renderGeneralElement: jest.fn().mockReturnValue('__GENERAL_ELE__'),
  renderNativeElement: jest.fn(e => e.props),
  createJobsFromRendered: jest.fn(
    rendered => rendered.map(() => ({ id: jobId++ })) // eslint-disable-line no-plusplus
  ),
};

afterEach(() => {
  jobId = 0;
  Custom.mockClear();
  delegate.isNativeComponent.mockClear();
  delegate.renderGeneralElement.mockClear();
  delegate.renderNativeElement.mockClear();
  delegate.createJobsFromRendered.mockClear();
});

describe('#renderInner()', () => {
  it('works', () => {
    const context = {};
    const renderer = new Renderer('Test', delegate);
    const rendered = renderer.renderInner(
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
      { element: 123, value: 123, path: '$::0' },
      { element: 'abc', value: 'abc', path: '$::1' },
      { element: <a>aaa</a>, value: '__GENERAL_ELE__', path: '$::2' },
      {
        element: <Native x="true" y={false} />,
        value: { x: 'true', y: false },
        path: '$::3',
      },
      {
        element: 'wrapped head',
        value: 'wrapped head',
        path: '$::4#Custom::0',
      },
      {
        element: <Native a="A" b={2} />,
        value: { a: 'A', b: 2 },
        path: '$::4#Custom::1',
      },
      {
        element: 'wrapped foot',
        value: 'wrapped foot',
        path: '$::4#Custom::2',
      },
    ]);

    expect(Custom).toBeCalledTimes(1);
    expect(Custom.mock.calls[0]).toEqual([{ a: 'A', b: 2 }, context]);

    expect(delegate.isNativeComponent).toHaveBeenNthCalledWith(1, Native);
    expect(delegate.isNativeComponent).toHaveBeenNthCalledWith(2, Custom);
    expect(delegate.isNativeComponent).toHaveBeenNthCalledWith(3, Native);

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
      expect(call[3]).toEqual(['$::3', '$::4#Custom::1'][i]);
    });
  });

  it('return undefined if no renderable element in the node', () => {
    const renderer = new Renderer('Test', delegate);

    const None = () => null;
    const emptyNodes = [
      true,
      false,
      undefined,
      null,
      [],
      <>{null}</>,
      <None />,
      [true, false, undefined, null, <None />],
      <>
        {true}
        {false}
        {undefined}
        {null}
        <None />
      </>,
    ];

    emptyNodes.forEach(node => {
      expect(renderer.renderInner(node)).toBe(undefined);
    });
  });

  it('throw if Immediate included', () => {
    const renderer = new Renderer('Test', delegate);

    expect(() =>
      renderer.renderInner(
        <>
          foo<Machinat.Immediate />bar
        </>
      )
    ).toThrow(
      'separator element should not be placed in the inner of native or general prop'
    );
  });
});

describe('#renderJobSequence()', () => {
  it('works', () => {
    const afterCallback = () => Promise.resolve();
    const WrappedImmediate = () => <Machinat.Immediate after={afterCallback} />;
    const context = {};

    const renderer = new Renderer('Test', delegate);
    const jobSequence = renderer.renderJobSequence(
      <>
        {123}
        <Machinat.Immediate delay={1000} />
        abc
        <Machinat.Immediate after={afterCallback} />
        <b />
        <a>aaa</a>
        <WrappedImmediate />
        <Native x="true" y={false} />
        <Custom a="A" b={2} />
      </>,
      context
    );

    expect(jobSequence).toBeInstanceOf(JobSequence);

    expect(Custom).toBeCalledTimes(1);
    expect(Custom.mock.calls[0]).toEqual([{ a: 'A', b: 2 }, context]);

    const {
      isNativeComponent,
      renderGeneralElement,
      renderNativeElement,
      createJobsFromRendered,
    } = delegate;
    expect(isNativeComponent.mock.calls).toEqual([
      [WrappedImmediate],
      [Native],
      [Custom],
      [Native],
    ]);

    expect(renderGeneralElement).toBeCalledTimes(2);
    renderGeneralElement.mock.calls.forEach((call, i) => {
      expect(call[0]).toEqual([<b />, <a>aaa</a>][i]);
      expect(typeof call[1]).toBe('function');
      expect(call[2]).toEqual(context);
      expect(call[3]).toEqual(['$::4', '$::5'][i]);
    });

    expect(renderNativeElement).toBeCalledTimes(2);
    renderNativeElement.mock.calls.forEach((call, i) => {
      expect(call[0]).toEqual(
        [<Native x="true" y={false} />, <Native a="A" b={2} />][i]
      );
      expect(typeof call[1]).toBe('function');
      expect(call[2]).toEqual(context);
      expect(call[3]).toEqual(['$::7', '$::8#Custom::1'][i]);
    });

    expect(createJobsFromRendered).toBeCalledTimes(0);
    for (let i = 0; i < 7; i += 1) {
      expect(jobSequence.hasNext()).toBe(true);

      if (i === 1 || i === 3 || i === 5) {
        expect(jobSequence.next()).toBeInstanceOf(Promise);
      } else {
        const expectedBatches = [
          [{ id: 0 }],
          [{ id: 1 }],
          [{ id: 2 }, { id: 3 }],
          [{ id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }],
        ];
        expect(jobSequence.next()).toEqual(expectedBatches[i / 2]);
      }
    }
    expect(jobSequence.hasNext()).toBe(false);

    expect(createJobsFromRendered).toBeCalledTimes(4);
    expect(createJobsFromRendered.mock.calls).toEqual([
      [[{ element: 123, value: 123, path: '$::0' }], context],
      [[{ element: 'abc', value: 'abc', path: '$::2' }], context],
      [
        [
          { element: <b />, value: '__GENERAL_ELE__', path: '$::4' },
          { element: <a>aaa</a>, value: '__GENERAL_ELE__', path: '$::5' },
        ],
        context,
      ],
      [
        [
          {
            element: <Native x="true" y={false} />,
            value: { x: 'true', y: false },
            path: '$::7',
          },
          {
            element: 'wrapped head',
            value: 'wrapped head',
            path: '$::8#Custom::0',
          },
          {
            element: <Native a="A" b={2} />,
            value: { a: 'A', b: 2 },
            path: '$::8#Custom::1',
          },
          {
            element: 'wrapped foot',
            value: 'wrapped foot',
            path: '$::8#Custom::2',
          },
        ],
        context,
      ],
    ]);
  });
});
