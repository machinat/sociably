import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { ListRow } from '../ListRow';
import { ListSection } from '../ListSection';
import { renderPartElement } from './utils';

it('is a valid Component', () => {
  expect(typeof ListSection).toBe('function');
  expect(isNativeType(<ListSection>{[]}</ListSection>)).toBe(true);
  expect(ListSection.$$platform).toBe('whatsapp');
});

test('rendering value', async () => {
  await expect(
    renderPartElement(
      <ListSection>
        <ListRow id="0" title="FOO" />
        <ListRow id="1" title="BAR" />
      </ListSection>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <ListSection>
                <ListRow
                  id="0"
                  title="FOO"
                />
                <ListRow
                  id="1"
                  title="BAR"
                />
              </ListSection>,
              "path": "$#p",
              "type": "part",
              "value": Object {
                "rows": Array [
                  Object {
                    "description": undefined,
                    "id": "0",
                    "title": "FOO",
                  },
                  Object {
                    "description": undefined,
                    "id": "1",
                    "title": "BAR",
                  },
                ],
                "title": undefined,
              },
            },
          ]
        `);
  await expect(
    renderPartElement(
      <ListSection title="HELLO">
        <ListRow id="0" title="FOO" />
      </ListSection>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <ListSection
                title="HELLO"
              >
                <ListRow
                  id="0"
                  title="FOO"
                />
              </ListSection>,
              "path": "$#p",
              "type": "part",
              "value": Object {
                "rows": Array [
                  Object {
                    "description": undefined,
                    "id": "0",
                    "title": "FOO",
                  },
                ],
                "title": "HELLO",
              },
            },
          ]
        `);
});
