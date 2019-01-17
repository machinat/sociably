import query from 'querystring';

import Machinat from 'machinat';
import Renderer from 'machinat-renderer';

import MessengerRenderDelegate from '../delegate';
import * as nativeComponents from '../../component';
import * as generalComponents from '../../component/general';
import {
  THREAD_IDENTIFIER,
  ATTACHED_FILE_DATA,
  ATTACHED_FILE_INFO,
} from '../../symbol';

jest.mock('../../component/general');
jest.mock('../../component');

const { isNativeComponent } = MessengerRenderDelegate;

describe('delegate.isNativeComponent()', () => {
  it('reports true for all exported messenger components', () => {
    Object.values(nativeComponents).forEach(Components => {
      expect(isNativeComponent(Components)).toBe(true);
    });
  });

  it('reports false for everything else', () => {
    const MyComponent = () => 'foo';
    [
      null,
      undefined,
      123,
      'abc',
      {},
      [],
      <text>abc</text>,
      <MyComponent />,
      <Machinat.Pause />,
    ].forEach(Components => {
      expect(isNativeComponent(Components)).toBe(false);
    });
  });
});

describe('delegate.renderGeneralElement()', () => {
  it('handles general element rendered value right', () => {
    const renderer = new Renderer('test', MessengerRenderDelegate);

    const elements = [
      <b>abc</b>,
      <i>def</i>,
      <text>ghi</text>,
      <code>jkl</code>,
      <a>mno</a>,
      <pre>pqr</pre>,
    ];

    const values = renderer.render(elements, {}).map(r => r.value);

    const { b, i, text, code, a, pre } = generalComponents;

    expect(values).toEqual([
      ...b.mock.calls[0].result,
      ...i.mock.calls[0].result,
      ...text.mock.calls[0].result,
      ...code.mock.calls[0].result,
      ...a.mock.calls[0].result,
      ...pre.mock.calls[0].result,
    ]);

    expect(b.mock.calls[0].args[0]).toBe(elements[0].props);
    expect(i.mock.calls[0].args[0]).toBe(elements[1].props);
    expect(text.mock.calls[0].args[0]).toBe(elements[2].props);
    expect(code.mock.calls[0].args[0]).toBe(elements[3].props);
    expect(a.mock.calls[0].args[0]).toBe(elements[4].props);
    expect(pre.mock.calls[0].args[0]).toBe(elements[5].props);
  });

  it('throw if invalid general type passed', () => {
    const renderer = new Renderer('test', MessengerRenderDelegate);

    expect(() => renderer.render(<invalid />, {})).toThrow(
      TypeError(
        '<invalid /> is not valid general element supported in messenger'
      )
    );
  });
});

describe('delegate.renderNativeElement()', () => {
  it('handles native element rendered value right', () => {
    const renderer = new Renderer('test', MessengerRenderDelegate);
    const { TypingOn, QuickReply, Image } = nativeComponents;

    const elements = [
      <TypingOn>abc</TypingOn>,
      <QuickReply title="yes" />,
      <Image src="http://foo.bar/baz.jpg" />,
    ];

    const values = renderer.render(elements, {}).map(r => r.value);

    expect(values).toEqual([
      ...TypingOn.mock.calls[0].result,
      ...QuickReply.mock.calls[0].result,
      ...Image.mock.calls[0].result,
    ]);

    expect(TypingOn.mock.calls[0].args[0]).toBe(elements[0].props);
    expect(QuickReply.mock.calls[0].args[0]).toBe(elements[1].props);
    expect(Image.mock.calls[0].args[0]).toBe(elements[2].props);
  });
});
