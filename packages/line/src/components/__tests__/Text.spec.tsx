import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { Image } from '../Image';
import { UriAction } from '../Action';
import { Emoji, Text } from '../Text';
import { renderPartElement, renderUnitElement } from './utils';

describe('Emoji', () => {
  it('is valid native unit component', () => {
    expect(typeof Emoji).toBe('function');
    expect(isNativeType(<Emoji productId="" emojiId="" />)).toBe(true);
    expect(Emoji.$$platform).toBe('line');
  });

  it('renders to corespond unicode char', async () => {
    await expect(renderPartElement(<Emoji productId="foo" emojiId="bar" />))
      .resolves.toMatchInlineSnapshot(`
                  Array [
                    Object {
                      "node": <Emoji
                        emojiId="bar"
                        productId="foo"
                      />,
                      "path": "$#container",
                      "type": "part",
                      "value": Object {
                        "emojiId": "bar",
                        "productId": "foo",
                        "type": "emoji_placeholder",
                      },
                    },
                  ]
              `);
  });
});

describe('Text', () => {
  it('is valid native unit component', () => {
    expect(typeof Text).toBe('function');
    expect(isNativeType(<Text> </Text>)).toBe(true);
    expect(Text.$$platform).toBe('line');
  });

  test('matching snpshot', async () => {
    await expect(
      renderUnitElement(
        <Text>
          FOO {'BAR'} <b>BAZ</b>
        </Text>
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <Text>
                  FOO 
                  BAR
                   
                  <b>
                    BAZ
                  </b>
                </Text>,
                "path": "$",
                "type": "unit",
                "value": Object {
                  "params": Object {
                    "emojis": undefined,
                    "text": "FOO BAR BAZ",
                    "type": "text",
                  },
                  "type": "message",
                },
              },
            ]
          `);
    await expect(
      renderUnitElement(
        <Text>
          foo <Emoji productId="_PRUDUCT_1_" emojiId="_EMOJI_1_" /> bar{' '}
          <Emoji productId="_PRUDUCT_2_" emojiId="_EMOJI_2_" /> baz
        </Text>
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <Text>
                  foo 
                  <Emoji
                    emojiId="_EMOJI_1_"
                    productId="_PRUDUCT_1_"
                  />
                   bar
                   
                  <Emoji
                    emojiId="_EMOJI_2_"
                    productId="_PRUDUCT_2_"
                  />
                   baz
                </Text>,
                "path": "$",
                "type": "unit",
                "value": Object {
                  "params": Object {
                    "emojis": Array [
                      Object {
                        "emojiId": "_EMOJI_1_",
                        "index": 4,
                        "productId": "_PRUDUCT_1_",
                      },
                      Object {
                        "emojiId": "_EMOJI_2_",
                        "index": 10,
                        "productId": "_PRUDUCT_2_",
                      },
                    ],
                    "text": "foo $ bar $ baz",
                    "type": "text",
                  },
                  "type": "message",
                },
              },
            ]
          `);
    await expect(
      renderUnitElement(
        <Text>
          <Emoji productId="_PRUDUCT_1_" emojiId="_EMOJI_1_" /> <i>foo</i>{' '}
          <Emoji productId="_PRUDUCT_2_" emojiId="_EMOJI_2_" /> bar{' '}
          <Emoji productId="_PRUDUCT_3_" emojiId="_EMOJI_3_" /> <s>baz</s>{' '}
          <Emoji productId="_PRUDUCT_4_" emojiId="_EMOJI_4_" />
        </Text>
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <Text>
                  <Emoji
                    emojiId="_EMOJI_1_"
                    productId="_PRUDUCT_1_"
                  />
                   
                  <i>
                    foo
                  </i>
                   
                  <Emoji
                    emojiId="_EMOJI_2_"
                    productId="_PRUDUCT_2_"
                  />
                   bar
                   
                  <Emoji
                    emojiId="_EMOJI_3_"
                    productId="_PRUDUCT_3_"
                  />
                   
                  <s>
                    baz
                  </s>
                   
                  <Emoji
                    emojiId="_EMOJI_4_"
                    productId="_PRUDUCT_4_"
                  />
                </Text>,
                "path": "$",
                "type": "unit",
                "value": Object {
                  "params": Object {
                    "emojis": Array [
                      Object {
                        "emojiId": "_EMOJI_1_",
                        "index": 0,
                        "productId": "_PRUDUCT_1_",
                      },
                      Object {
                        "emojiId": "_EMOJI_2_",
                        "index": 6,
                        "productId": "_PRUDUCT_2_",
                      },
                      Object {
                        "emojiId": "_EMOJI_3_",
                        "index": 12,
                        "productId": "_PRUDUCT_3_",
                      },
                      Object {
                        "emojiId": "_EMOJI_4_",
                        "index": 18,
                        "productId": "_PRUDUCT_4_",
                      },
                    ],
                    "text": "$ foo $ bar $ baz $",
                    "type": "text",
                  },
                  "type": "message",
                },
              },
            ]
          `);
  });

  it('throw if invalid content received', async () => {
    await expect(
      renderUnitElement(
        <Text>
          FOO <Sociably.Pause />
        </Text>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"<Pause /> can't be placed in <Text/>, only textual node and <Emoji/> allowed"`
    );
    await expect(
      renderUnitElement(
        <Text>
          FOO <UriAction uri="" />
        </Text>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"<UriAction /> can't be placed in <Text/>, only textual node and <Emoji/> allowed"`
    );
    await expect(
      renderUnitElement(
        <Text>
          FOO <Image previewImageUrl="" originalContentUrl="" />
        </Text>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"<Image /> can't be placed in <Text/>, only textual node and <Emoji/> allowed"`
    );
  });
});
