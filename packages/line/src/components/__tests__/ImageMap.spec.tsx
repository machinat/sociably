import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import {
  ImageMap,
  ImageMapProps,
  ImageMapArea,
  ImageMapAreaProps,
  ImageMapVideoArea,
  ImageMapVideoAreaProps,
} from '../ImageMap.js';
import { UriAction, MessageAction } from '../Action.js';
import { renderUnitElement } from './utils.js';

it('is a valid component', () => {
  expect(isNativeType(<ImageMap {...({} as ImageMapProps)} />)).toBe(true);
  expect(isNativeType(<ImageMapArea {...({} as ImageMapAreaProps)} />)).toBe(
    true,
  );
  expect(
    isNativeType(<ImageMapVideoArea {...({} as ImageMapVideoAreaProps)} />),
  ).toBe(true);
  expect(ImageMap.$$platform).toBe('line');
  expect(ImageMapArea.$$platform).toBe('line');
  expect(ImageMapVideoArea.$$platform).toBe('line');
  expect(ImageMap.$$name).toBe('ImageMap');
  expect(ImageMapArea.$$name).toBe('ImageMapArea');
  expect(ImageMapVideoArea.$$name).toBe('ImageMapVideoArea');
});

it('match snapshot', async () => {
  await expect(
    renderUnitElement(
      <ImageMap baseUrl="https://..." altText="..." height={999}>
        <ImageMapArea
          x={123}
          y={456}
          width={654}
          height={321}
          action={<MessageAction label="foo" text="bar" />}
        />

        <ImageMapArea
          x={978}
          y={654}
          width={456}
          height={789}
          action={<UriAction label="foo" uri="https://..." />}
        />
      </ImageMap>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ImageMap
          altText="..."
          baseUrl="https://..."
          height={999}
        >
          <ImageMapArea
            action={
              <MessageAction
                label="foo"
                text="bar"
              />
            }
            height={321}
            width={654}
            x={123}
            y={456}
          />
          <ImageMapArea
            action={
              <UriAction
                label="foo"
                uri="https://..."
              />
            }
            height={789}
            width={456}
            x={978}
            y={654}
          />
        </ImageMap>,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "actions": [
              {
                "area": {
                  "height": 321,
                  "width": 654,
                  "x": 123,
                  "y": 456,
                },
                "label": "foo",
                "text": "bar",
                "type": "message",
              },
              {
                "area": {
                  "height": 789,
                  "width": 456,
                  "x": 978,
                  "y": 654,
                },
                "label": "foo",
                "linkUri": "https://...",
                "type": "uri",
              },
            ],
            "altText": "...",
            "baseSize": {
              "height": 999,
              "width": 1040,
            },
            "baseUrl": "https://...",
            "type": "imagemap",
            "video": undefined,
          },
          "type": "message",
        },
      },
    ]
  `);
  await expect(
    renderUnitElement(
      <ImageMap
        baseUrl="https://..."
        altText="..."
        height={999}
        video={
          <ImageMapVideoArea
            originalContentUrl="https://..."
            previewImageUrl="https://..."
            x={123}
            y={456}
            width={654}
            height={321}
          />
        }
      >
        <ImageMapArea
          x={123}
          y={456}
          width={654}
          height={321}
          action={<MessageAction label="foo" text="bar" />}
        />
      </ImageMap>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ImageMap
          altText="..."
          baseUrl="https://..."
          height={999}
          video={
            <ImageMapVideoArea
              height={321}
              originalContentUrl="https://..."
              previewImageUrl="https://..."
              width={654}
              x={123}
              y={456}
            />
          }
        >
          <ImageMapArea
            action={
              <MessageAction
                label="foo"
                text="bar"
              />
            }
            height={321}
            width={654}
            x={123}
            y={456}
          />
        </ImageMap>,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "actions": [
              {
                "area": {
                  "height": 321,
                  "width": 654,
                  "x": 123,
                  "y": 456,
                },
                "label": "foo",
                "text": "bar",
                "type": "message",
              },
            ],
            "altText": "...",
            "baseSize": {
              "height": 999,
              "width": 1040,
            },
            "baseUrl": "https://...",
            "type": "imagemap",
            "video": {
              "area": {
                "height": 321,
                "width": 654,
                "x": 123,
                "y": 456,
              },
              "externalLink": undefined,
              "originalContentUrl": "https://...",
              "previewImageUrl": "https://...",
            },
          },
          "type": "message",
        },
      },
    ]
  `);
  await expect(
    renderUnitElement(
      <ImageMap
        baseUrl="https://..."
        altText="..."
        height={999}
        video={
          <ImageMapVideoArea
            originalContentUrl="https://..."
            previewImageUrl="https://..."
            x={123}
            y={456}
            width={654}
            height={321}
            action={<UriAction label="foo" uri="https://..." />}
          />
        }
      >
        <ImageMapArea
          x={978}
          y={654}
          width={456}
          height={789}
          action={<UriAction label="foo" uri="https://..." />}
        />
      </ImageMap>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ImageMap
          altText="..."
          baseUrl="https://..."
          height={999}
          video={
            <ImageMapVideoArea
              action={
                <UriAction
                  label="foo"
                  uri="https://..."
                />
              }
              height={321}
              originalContentUrl="https://..."
              previewImageUrl="https://..."
              width={654}
              x={123}
              y={456}
            />
          }
        >
          <ImageMapArea
            action={
              <UriAction
                label="foo"
                uri="https://..."
              />
            }
            height={789}
            width={456}
            x={978}
            y={654}
          />
        </ImageMap>,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "actions": [
              {
                "area": {
                  "height": 789,
                  "width": 456,
                  "x": 978,
                  "y": 654,
                },
                "label": "foo",
                "linkUri": "https://...",
                "type": "uri",
              },
            ],
            "altText": "...",
            "baseSize": {
              "height": 999,
              "width": 1040,
            },
            "baseUrl": "https://...",
            "type": "imagemap",
            "video": {
              "area": {
                "height": 321,
                "width": 654,
                "x": 123,
                "y": 456,
              },
              "externalLink": {
                "label": "foo",
                "linkUri": "https://...",
              },
              "originalContentUrl": "https://...",
              "previewImageUrl": "https://...",
            },
          },
          "type": "message",
        },
      },
    ]
  `);
});
