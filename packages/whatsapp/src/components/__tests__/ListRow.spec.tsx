import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { ListRow } from '../ListRow.js';
import { renderPartElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<ListRow title="" data="" />)).toBe(true);
  expect(ListRow.$$platform).toBe('whatsapp');
  expect(ListRow.$$name).toBe('ListRow');
});

test('rendering value', async () => {
  await expect(renderPartElement(<ListRow title="FOO" data="foo" />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <ListRow
          data="foo"
          title="FOO"
        />,
        "path": "$#p",
        "type": "part",
        "value": {
          "description": undefined,
          "id": "foo",
          "title": "FOO",
        },
      },
    ]
  `);
  await expect(
    renderPartElement(<ListRow title="BAR" data="baz" description="BAZ" />),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ListRow
          data="baz"
          description="BAZ"
          title="BAR"
        />,
        "path": "$#p",
        "type": "part",
        "value": {
          "description": "BAZ",
          "id": "baz",
          "title": "BAR",
        },
      },
    ]
  `);
});
