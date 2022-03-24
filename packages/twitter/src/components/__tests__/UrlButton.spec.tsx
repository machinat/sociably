import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils';
import Renderer from '@machinat/core/renderer';
import { UrlButton } from '../UrlButton';

const render = (element) =>
  new Promise((resolve) => {
    const renderer = new Renderer('twitter', async (n, p, renderPart) => {
      resolve(renderPart(element, ''));
      return null;
    });
    renderer.render(<p />, null, null);
  });

it('is a valid Component', () => {
  expect(typeof UrlButton).toBe('function');
  expect(isNativeType(<UrlButton label="foo" url="http://bar.baz" />)).toBe(
    true
  );
  expect(UrlButton.$$platform).toBe('twitter');
});

test('rendering', async () => {
  await expect(render(<UrlButton label="foo" url="http://bar.baz" />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <UrlButton
                label="foo"
                url="http://bar.baz"
              />,
              "path": "$#p",
              "type": "part",
              "value": Object {
                "label": "foo",
                "type": "web_url",
                "url": "http://bar.baz",
              },
            },
          ]
        `);
});
