import Machinat from '../../../../machinat';
import { MESSENGER_NAITVE_TYPE } from '../../symbol';
import { Text, Latex } from '../text';
import { QuickReply } from '../quickReply';
import renderHelper from './renderHelper';

const textNode = [<a>abcd</a>, <b>bcda</b>, <del>dabc</del>];
const quickReplies = [
  <QuickReply title="A" />,
  <QuickReply title="B" />,
  <QuickReply title="C" />,
];
const renderInside = jest.fn(
  node =>
    typeof node === 'string'
      ? [{ rendered: node, element: node }]
      : node === quickReplies
        ? [
            {
              rendered: '__RENDERED_QUICKREPLY_OBJ_1__',
              element: quickReplies[0],
            },
            {
              rendered: '__RENDERED_QUICKREPLY_OBJ_2__',
              element: quickReplies[1],
            },
            {
              rendered: '__RENDERED_QUICKREPLY_OBJ_3__',
              element: quickReplies[2],
            },
          ]
        : node === textNode
          ? [
              { rendered: '\n__RENDERED_TEXT_1__', element: textNode[0] },
              { rendered: '\n__RENDERED_TEXT_2__', element: textNode[1] },
              { rendered: '\n__RENDERED_TEXT_3__', element: textNode[2] },
            ]
          : undefined
);
const render = renderHelper(renderInside);

beforeEach(() => {
  renderInside.mockClear();
});

describe('Text', () => {
  it('is valid root Component', () => {
    expect(typeof Text).toBe('function');
    expect(Text.$$native).toBe(MESSENGER_NAITVE_TYPE);
    expect(Text.$$entry).toBe('me/messages');
    expect(Text.$$root).toBe(true);
  });

  it('match snapshot', () => {
    expect(
      [
        <Text>abc</Text>,
        <Text metadata="xyz">abc</Text>,
        <Text>{textNode}</Text>,
        <Text quickReplies={quickReplies}>{textNode}</Text>,
      ].map(render)
    ).toMatchSnapshot();
  });

  it('render children as "text" field', () => {
    expect(render(<Text>some text</Text>).message.text).toBe('some text');
    expect(render(<Text>{textNode}</Text>).message.text).toBe(`
__RENDERED_TEXT_1__
__RENDERED_TEXT_2__
__RENDERED_TEXT_3__`);
    expect(renderInside).toHaveBeenCalledWith('some text', '.children');
    expect(renderInside).toHaveBeenCalledWith(textNode, '.children');
  });

  it('render quickReplies prop as "quick_replies" field', () => {
    expect(
      render(<Text quickReplies={quickReplies}>abc</Text>).message.quick_replies
    ).toEqual([
      '__RENDERED_QUICKREPLY_OBJ_1__',
      '__RENDERED_QUICKREPLY_OBJ_2__',
      '__RENDERED_QUICKREPLY_OBJ_3__',
    ]);
    expect(renderInside).toHaveBeenCalledWith(quickReplies, '.quickReplies');
  });
});

describe('Latex', () => {
  it('is valid root Component', () => {
    expect(typeof Latex).toBe('function');
    expect(Latex.$$native).toBe(MESSENGER_NAITVE_TYPE);
    expect(Latex.$$entry).toBe(undefined);
    expect(Latex.$$root).toBe(undefined);
  });

  it('render children as "text" field', () => {
    expect(render(<Latex>some text</Latex>)).toBe('\\(some text\\)');
    expect(render(<Latex>{textNode}</Latex>)).toBe(`\\(
__RENDERED_TEXT_1__
__RENDERED_TEXT_2__
__RENDERED_TEXT_3__\\)`);
    expect(renderInside).toHaveBeenCalledWith('some text', '.children');
    expect(renderInside).toHaveBeenCalledWith(textNode, '.children');
  });
});
