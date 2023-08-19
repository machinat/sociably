import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { ListRow } from '../ListRow.js';
import { renderPartElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<ListRow title="" id="" />)).toBe(true);
  expect(ListRow.$$platform).toBe('whatsapp');
  expect(ListRow.$$name).toBe('ListRow');
});

test('rendering value', async () => {
  await expect(renderPartElement(<ListRow title="FOO" id="0" />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <ListRow
          id="0"
          title="FOO"
        />,
        "path": "$#p",
        "type": "part",
        "value": {
          "description": undefined,
          "id": "0",
          "title": "FOO",
        },
      },
    ]
  `);
  await expect(
    renderPartElement(<ListRow title="BAR" id="1" description="BAZ" />)
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ListRow
          description="BAZ"
          id="1"
          title="BAR"
        />,
        "path": "$#p",
        "type": "part",
        "value": {
          "description": "BAZ",
          "id": "1",
          "title": "BAR",
        },
      },
    ]
  `);
});
