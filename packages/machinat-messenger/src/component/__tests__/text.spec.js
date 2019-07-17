import moxy from 'moxy';
import Machinat from 'machinat';
import { map } from 'machinat-utility';

import { MESSENGER_NATIVE_TYPE } from '../../constant';
import { Latex, DynamicText } from '../text';

import renderHelper from './renderHelper';

const renderInner = moxy(async message =>
  map(
    message,
    (node, path) =>
      node.type === 'br'
        ? { type: 'break', node, value: null, path }
        : {
            type: 'text',
            value: typeof node === 'string' ? node : node.props.children,
            node,
            path,
          },
    '$:0#Latex.children'
  )
);

beforeEach(() => {
  renderInner.mock.clear();
});

const render = renderHelper(renderInner);

describe('Latex', () => {
  it('is valid Component', () => {
    expect(typeof Latex).toBe('function');
    expect(Latex.$$native).toBe(MESSENGER_NATIVE_TYPE);
    expect(Latex.$$namespace).toBe('Messenger');
  });

  it('render children as text', async () => {
    const nodeWithPlainText = <Latex>some text</Latex>;
    await expect(render(nodeWithPlainText)).resolves.toEqual([
      {
        type: 'text',
        value: '\\(some text\\)',
        node: nodeWithPlainText,
        path: '$',
      },
    ]);
    expect(renderInner.mock).toHaveBeenCalledTimes(1);

    const nodeWithElements = (
      <Latex>
        <a>abcd</a>
        <b>efgh</b>
        <c>ijkl</c>
      </Latex>
    );
    await expect(render(nodeWithElements)).resolves.toEqual([
      {
        type: 'text',
        node: nodeWithElements,
        value: '\\(abcdefghijkl\\)',
        path: '$',
      },
    ]);
    expect(renderInner.mock).toHaveBeenCalledTimes(2);
  });

  it('quote each text separated by break', async () => {
    const nodeWithBreak = (
      <Latex>
        <a>abcd</a>
        <br />
        <b>efgh</b>
        <br />
        <c>ijkl</c>
      </Latex>
    );
    await expect(render(nodeWithBreak)).resolves.toEqual([
      { type: 'text', node: nodeWithBreak, value: '\\(abcd\\)', path: '$' },
      {
        type: 'break',
        node: <br />,
        value: null,
        path: '$:0#Latex.children:1',
      },
      { type: 'text', node: nodeWithBreak, value: '\\(efgh\\)', path: '$' },
      {
        type: 'break',
        node: <br />,
        value: null,
        path: '$:0#Latex.children:3',
      },
      { type: 'text', node: nodeWithBreak, value: '\\(ijkl\\)', path: '$' },
    ]);
    expect(renderInner.mock).toHaveBeenCalledTimes(1);
  });
});

describe('DynamicText', () => {
  it('is valid Component', () => {
    expect(typeof DynamicText).toBe('function');
    expect(DynamicText.$$native).toBe(MESSENGER_NATIVE_TYPE);
    expect(DynamicText.$$namespace).toBe('Messenger');
  });

  it('renders dynamic text message object', async () => {
    const node = (
      <DynamicText fallback="Hello World!">
        Hello {'{{first_name}}!'}
      </DynamicText>
    );
    await expect(render(node)).resolves.toEqual([
      {
        type: 'unit',
        node,
        value: {
          message: {
            dynamic_text: {
              text: 'Hello {{first_name}}!',
              fallback_text: 'Hello World!',
            },
          },
        },
        path: '$',
      },
    ]);
  });
});
