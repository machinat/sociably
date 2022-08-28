import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { Location } from '../Location';
import { renderUnitElement } from './utils';

it('is a valid Component', () => {
  expect(typeof Location).toBe('function');
  expect(isNativeType(<Location latitude={0} longitude={0} />)).toBe(true);
  expect(Location.$$platform).toBe('whatsapp');
});

test('rendering value', async () => {
  await expect(renderUnitElement(<Location latitude={120} longitude={25} />))
    .resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <LocationProps
                latitude={120}
                longitude={25}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "message": Object {
                  "context": undefined,
                  "location": Object {
                    "address": undefined,
                    "latitude": 120,
                    "longitude": 25,
                    "name": undefined,
                  },
                  "type": "location",
                },
              },
            },
          ]
        `);

  await expect(
    renderUnitElement(
      <Location latitude={0} longitude={90} name="North Pole" />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <LocationProps
                latitude={0}
                longitude={90}
                name="North Pole"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "message": Object {
                  "context": undefined,
                  "location": Object {
                    "address": undefined,
                    "latitude": 0,
                    "longitude": 90,
                    "name": "North Pole",
                  },
                  "type": "location",
                },
              },
            },
          ]
        `);

  await expect(
    renderUnitElement(
      <Location
        latitude={123}
        longitude={45}
        name="Somewhere"
        address="over the rainbow"
        replyTo="REPLY_TO_MESSAGE_ID"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <LocationProps
                address="over the rainbow"
                latitude={123}
                longitude={45}
                name="Somewhere"
                replyTo="REPLY_TO_MESSAGE_ID"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "message": Object {
                  "context": Object {
                    "message_id": "REPLY_TO_MESSAGE_ID",
                  },
                  "location": Object {
                    "address": "over the rainbow",
                    "latitude": 123,
                    "longitude": 45,
                    "name": "Somewhere",
                  },
                  "type": "location",
                },
              },
            },
          ]
        `);
});
