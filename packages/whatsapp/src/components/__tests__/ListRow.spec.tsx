import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { ListRow } from '../ListRow';
import { renderPartElement } from './utils';

it('is a valid Component', () => {
  expect(typeof ListRow).toBe('function');
  expect(isNativeType(<ListRow title="" id="" />)).toBe(true);
  expect(ListRow.$$platform).toBe('whatsapp');
});

test('rendering value', async () => {
  await expect(renderPartElement(<ListRow title="FOO" id="0" />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <ListRow
                id="0"
                title="FOO"
              />,
              "path": "$#p",
              "type": "part",
              "value": Object {
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
          Array [
            Object {
              "node": <ListRow
                description="BAZ"
                id="1"
                title="BAR"
              />,
              "path": "$#p",
              "type": "part",
              "value": Object {
                "description": "BAZ",
                "id": "1",
                "title": "BAR",
              },
            },
          ]
        `);
});
