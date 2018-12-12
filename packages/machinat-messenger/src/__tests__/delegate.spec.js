import query from 'querystring';

import Machinat from '../../../machinat';
import Renderer from '../../../machinat-renderer';

import MessengerRenderDelegate from '../delegate';
import * as nativeComponents from '../component';
import * as generalComponents from '../component/general';
import {
  THREAD_IDENTIFIER,
  ATTACHED_FILE_DATA,
  ATTACHED_FILE_INFO,
} from '../symbol';

jest.mock('../component/general');
jest.mock('../component');

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
      <Machinat.Immediate />,
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

    const values = renderer.renderInner(elements, '$').map(r => r.value);

    const { b, i, text, code, a, pre } = generalComponents;

    expect(values).toEqual([
      b.mock.calls[0].result,
      i.mock.calls[0].result,
      text.mock.calls[0].result,
      code.mock.calls[0].result,
      a.mock.calls[0].result,
      pre.mock.calls[0].result,
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

    expect(() => renderer.renderInner(<invalid />, '$')).toThrow(
      TypeError(
        '<invalid /> is not valid general element supported in messenger'
      )
    );
  });
});

describe('delegate.renderNativeElement()', () => {
  it('handles native element rendered value right', () => {
    const renderer = new Renderer('test', MessengerRenderDelegate);
    const { Text, QuickReply, Image } = nativeComponents;

    const elements = [
      <Text>abc</Text>,
      <QuickReply title="yes" />,
      <Image src="http://foo.bar/baz.jpg" />,
    ];

    const values = renderer.renderInner(elements, '$').map(r => r.value);

    expect(values).toEqual([
      Text.mock.calls[0].result,
      QuickReply.mock.calls[0].result,
      Image.mock.calls[0].result,
    ]);

    expect(Text.mock.calls[0].args[0]).toBe(elements[0].props);
    expect(QuickReply.mock.calls[0].args[0]).toBe(elements[1].props);
    expect(Image.mock.calls[0].args[0]).toBe(elements[2].props);
  });
});

describe('delegate.createJobsFromRendered()', () => {
  it('renders nodes into jobs sequence', () => {
    const renderer = new Renderer('test', MessengerRenderDelegate);

    const messages = new Array(5).fill(0).map((_, i) => <text>{i}</text>);

    const sequence = renderer.renderJobSequence(messages, {
      thread: { id: 'foo' },
    });

    [...sequence].forEach(batch => {
      batch.forEach((job, i) => {
        expect(job.method).toBe('POST');
        expect(job.relative_url).toBe('me/messages');

        const { message, recipient } = query.parse(job.body);

        expect(JSON.parse(message)).toEqual({ text: `${i}` });
        expect(JSON.parse(recipient)).toEqual({ id: 'foo' });

        expect(job[THREAD_IDENTIFIER]).toBe('id:foo');
        expect(job[ATTACHED_FILE_DATA]).toBe(undefined);
        expect(job[ATTACHED_FILE_INFO]).toBe(undefined);
      });
    });
  });

  it('add ATTACHED_FILE_DATA & ATTACHED_FILE_DATA to the job if they appeared on rendered value', () => {
    const { Image, Video, Audio } = nativeComponents;
    const renderer = new Renderer('test', MessengerRenderDelegate);

    const MyUpload = () => ({
      message: { text: 'foo' },
      [ATTACHED_FILE_DATA]: '_some_file_content_',
      [ATTACHED_FILE_INFO]: { some: '_file_info_' },
    });

    const messages = [
      <MyUpload />,
      <Image data="_image_data_" info={{ filename: 'myfooimg.jpg' }} />,
      <Video data="_image_data_" info={{ filename: 'myfoovideo.jpg' }} />,
      <Audio data="_image_data_" info={{ filename: 'myfooaudio.jpg' }} />,
    ];

    const sequence = renderer.renderJobSequence(messages, {
      thread: { id: 'foo' },
    });

    [...sequence].forEach(batch => {
      batch.forEach((job, i) => {
        expect(job.method).toBe('POST');
        expect(job.relative_url).toBe('me/messages');

        const { message, recipient } = query.parse(job.body);
        expect(recipient).toEqual('{"id":"foo"}');
        if (i === 0) {
          expect(message).toEqual('{"text":"foo"}');
        }

        expect(job[THREAD_IDENTIFIER]).toBe('id:foo');

        expect(job[ATTACHED_FILE_DATA]).toBe(
          i ? messages[i].props.data : '_some_file_content_'
        );
        expect(job[ATTACHED_FILE_INFO]).toEqual(
          i ? messages[i].props.fileInfo : { some: '_file_info_' }
        );
      });
    });
  });
});
