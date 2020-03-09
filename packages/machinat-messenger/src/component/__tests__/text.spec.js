import moxy from 'moxy';
import Machinat from '@machinat/core';
import { isNativeElement } from '@machinat/core/utils/isXxx';
import map from '@machinat/core/iterator/map';

import { Latex, DynamicText } from '../text';

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

const renderHelper = element => element.type(element, renderInner, '$');

describe('Latex', () => {
  it('is valid Component', () => {
    expect(typeof Latex).toBe('function');
    expect(isNativeElement(<Latex />)).toBe(true);
    expect(Latex.$$platform).toBe('messenger');
  });

  it('render children as text', async () => {
    const nodeWithPlainText = <Latex>some text</Latex>;
    await expect(renderHelper(nodeWithPlainText)).resolves.toEqual([
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
    await expect(renderHelper(nodeWithElements)).resolves.toEqual([
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
    await expect(renderHelper(nodeWithBreak)).resolves.toEqual([
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
    expect(isNativeElement(<DynamicText />)).toBe(true);
    expect(DynamicText.$$platform).toBe('messenger');
  });

  it('renders dynamic text message object', async () => {
    const node = (
      <DynamicText fallback="Hello World!">
        Hello {'{{first_name}}!'}
      </DynamicText>
    );
    await expect(renderHelper(node)).resolves.toEqual([
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
