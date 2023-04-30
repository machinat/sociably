import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { UrlButtonParam } from '../UrlButtonParam';
import { renderPartElement } from './utils';

it('is a valid Component', () => {
  expect(typeof UrlButtonParam).toBe('function');
  expect(isNativeType(<UrlButtonParam urlPostfix="" />)).toBe(true);
  expect(UrlButtonParam.$$platform).toBe('whatsapp');
});

test('rendering value', async () => {
  await expect(
    renderPartElement(<UrlButtonParam urlPostfix="/foo#bar?baz=true" />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <UrlButtonParam
                urlPostfix="/foo#bar?baz=true"
              />,
              "path": "$#p",
              "type": "part",
              "value": Object {
                "index": undefined,
                "parameter": Object {
                  "text": "/foo#bar?baz=true",
                  "type": "text",
                },
                "type": "url",
              },
            },
          ]
        `);
  await expect(
    renderPartElement(<UrlButtonParam urlPostfix="/boo" index={2} />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <UrlButtonParam
                index={2}
                urlPostfix="/boo"
              />,
              "path": "$#p",
              "type": "part",
              "value": Object {
                "index": 2,
                "parameter": Object {
                  "text": "/boo",
                  "type": "text",
                },
                "type": "url",
              },
            },
          ]
        `);
});
