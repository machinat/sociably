import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { UrlButton } from '../UrlButton.js';
import { renderPartElement } from './utils.js';

it('is a valid Component', () => {
  expect(typeof UrlButton).toBe('function');
  expect(isNativeType(<UrlButton label="foo" url="http://bar.baz" />)).toBe(
    true
  );
  expect(UrlButton.$$platform).toBe('twitter');
});

test('rendering', async () => {
  await expect(
    renderPartElement(<UrlButton label="foo" url="http://bar.baz" />)
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <UrlButton
          label="foo"
          url="http://bar.baz"
        />,
        "path": "$#p",
        "type": "part",
        "value": {
          "label": "foo",
          "type": "web_url",
          "url": "http://bar.baz",
        },
      },
    ]
  `);
});
