import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import { isNativeType } from '@machinat/core/utils/isX';

import { QuickReply } from '../quickReply';
import { URIAction } from '../action';

it('is valid native component', () => {
  expect(typeof QuickReply).toBe('function');

  expect(isNativeType(<QuickReply />)).toBe(true);
  expect(QuickReply.$$platform).toBe('line');
});

it('renders match snapshot', async () => {
  let rendered;
  const renderer = new Renderer('line', async (_, __, render) => {
    rendered = await render(
      <QuickReply
        imageURL="https://..."
        action={<URIAction uri="https://..." label="foo" />}
      />
    );
    return null;
  });

  await renderer.render(<container />);

  expect(rendered).toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <QuickReply
          action={
            <URIAction
              label="foo"
              uri="https://..."
            />
          }
          imageURL="https://..."
        />,
        "path": "$#container",
        "type": "part",
        "value": Object {
          "action": Object {
            "label": "foo",
            "type": "uri",
            "uri": "https://...",
          },
          "imageUrl": "https://...",
          "type": "action",
        },
      },
    ]
  `);
});
