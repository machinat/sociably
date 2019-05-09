import Machinat from 'machinat';

import { QuickReply } from '../quickReply';
import { URIAction } from '../action';

import { LINE_NATIVE_TYPE } from '../../constant';

import renderHelper from './renderHelper';

const renderInner = (node, path) => node.type(node, renderInner, path);
const render = renderHelper(renderInner);

it('is valid native component', () => {
  expect(typeof QuickReply).toBe('function');

  expect(QuickReply.$$native).toBe(LINE_NATIVE_TYPE);
  expect(QuickReply.$$getEntry).toBe(undefined);
});

it('renders match snapshot', () => {
  const qr = (
    <QuickReply
      imageURL="https://..."
      action={<URIAction uri="https://..." label="foo" />}
    />
  );
  const segments = render(qr);
  expect(segments.length).toBe(1);

  const [segment] = segments;

  expect(segment.type).toBe('part');
  expect(segment.node).toBe(qr);
  expect(segment.path).toBe('$');
  expect(segment.value).toMatchInlineSnapshot(`
Object {
  "action": Object {
    "label": "foo",
    "type": "uri",
    "uri": "https://...",
  },
  "imageUrl": "https://...",
  "type": "action",
}
`);
});
