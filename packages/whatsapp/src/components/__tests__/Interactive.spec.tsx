import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { ListTemplate, ButtonsTemplate } from '../Interactive.js';
import { Image, Audio } from '../Media.js';
import { ListRow } from '../ListRow.js';
import { ListSection } from '../ListSection.js';
import { ReplyButton } from '../ReplyButton.js';
import { renderUnitElement } from './utils.js';

describe('ListTemplate', () => {
  it('is a valid Component', () => {
    expect(typeof ListTemplate).toBe('function');
    expect(
      isNativeType(
        <ListTemplate buttonTitle="" sections={[]}>
          FOO
        </ListTemplate>
      )
    ).toBe(true);
    expect(ListTemplate.$$platform).toBe('whatsapp');
  });

  test('rendering value', async () => {
    await expect(
      renderUnitElement(
        <ListTemplate
          buttonTitle="open"
          sections={
            <ListSection>
              <ListRow id="0" title="FOO" />
              <ListRow id="1" title="BAR" />
            </ListSection>
          }
        >
          hello world
        </ListTemplate>
      )
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "node": <ListTemplateProps
            buttonTitle="open"
            sections={
              <ListSection>
                <ListRow
                  id="0"
                  title="FOO"
                />
                <ListRow
                  id="1"
                  title="BAR"
                />
              </ListSection>
            }
          >
            hello world
          </ListTemplateProps>,
          "path": "$",
          "type": "unit",
          "value": {
            "mediaFile": undefined,
            "message": {
              "context": undefined,
              "interactive": {
                "actions": {
                  "button": "open",
                  "sections": [
                    {
                      "rows": [
                        {
                          "description": undefined,
                          "id": "0",
                          "title": "FOO",
                        },
                        {
                          "description": undefined,
                          "id": "1",
                          "title": "BAR",
                        },
                      ],
                      "title": undefined,
                    },
                  ],
                },
                "body": {
                  "text": "hello world",
                },
                "footer": undefined,
                "header": undefined,
                "type": "list",
              },
              "type": "interactive",
            },
          },
        },
      ]
    `);
    await expect(
      renderUnitElement(
        <ListTemplate
          buttonTitle="open"
          header={<Image url="http://foo.bar/baz.jpg" />}
          footer="world"
          sections={
            <>
              <ListSection title="a">
                <ListRow id="0" title="FOO" />
                <ListRow id="1" title="BAR" />
              </ListSection>
              <ListSection title="b">
                <ListRow id="2" title="BAZ" />
              </ListSection>
            </>
          }
          replyTo="REPLY_TO_MESSAGE_ID"
        >
          hello
        </ListTemplate>
      )
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "node": <ListTemplateProps
            buttonTitle="open"
            footer="world"
            header={
              <Image
                url="http://foo.bar/baz.jpg"
              />
            }
            replyTo="REPLY_TO_MESSAGE_ID"
            sections={
              <Sociably.Fragment>
                <ListSection
                  title="a"
                >
                  <ListRow
                    id="0"
                    title="FOO"
                  />
                  <ListRow
                    id="1"
                    title="BAR"
                  />
                </ListSection>
                <ListSection
                  title="b"
                >
                  <ListRow
                    id="2"
                    title="BAZ"
                  />
                </ListSection>
              </Sociably.Fragment>
            }
          >
            hello
          </ListTemplateProps>,
          "path": "$",
          "type": "unit",
          "value": {
            "mediaFile": undefined,
            "message": {
              "context": {
                "message_id": "REPLY_TO_MESSAGE_ID",
              },
              "interactive": {
                "actions": {
                  "button": "open",
                  "sections": [
                    {
                      "rows": [
                        {
                          "description": undefined,
                          "id": "0",
                          "title": "FOO",
                        },
                        {
                          "description": undefined,
                          "id": "1",
                          "title": "BAR",
                        },
                      ],
                      "title": "a",
                    },
                    {
                      "rows": [
                        {
                          "description": undefined,
                          "id": "2",
                          "title": "BAZ",
                        },
                      ],
                      "title": "b",
                    },
                  ],
                },
                "body": {
                  "text": "hello",
                },
                "footer": {
                  "text": "world",
                },
                "header": {
                  "image": {
                    "caption": undefined,
                    "filename": undefined,
                    "id": undefined,
                    "link": "http://foo.bar/baz.jpg",
                  },
                  "type": "image",
                },
                "type": "list",
              },
              "type": "interactive",
            },
          },
        },
      ]
    `);
    await expect(
      renderUnitElement(
        <ListTemplate
          buttonTitle="open"
          header={<>HE{'AD'}ER</>}
          footer={<>FOO{'TER'}</>}
          sections={
            <>
              <ListSection title="a">
                <ListRow id="0" title="FOO" />
              </ListSection>
              <ListSection title="b">
                <ListRow id="1" title="BAR" />
              </ListSection>
              <ListSection title="c">
                <ListRow id="2" title="BAZ" />
              </ListSection>
            </>
          }
          replyTo="REPLY_TO_MESSAGE_ID"
        >
          BO{'DY'}
        </ListTemplate>
      )
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "node": <ListTemplateProps
            buttonTitle="open"
            footer={
              <Sociably.Fragment>
                FOO
                TER
              </Sociably.Fragment>
            }
            header={
              <Sociably.Fragment>
                HE
                AD
                ER
              </Sociably.Fragment>
            }
            replyTo="REPLY_TO_MESSAGE_ID"
            sections={
              <Sociably.Fragment>
                <ListSection
                  title="a"
                >
                  <ListRow
                    id="0"
                    title="FOO"
                  />
                </ListSection>
                <ListSection
                  title="b"
                >
                  <ListRow
                    id="1"
                    title="BAR"
                  />
                </ListSection>
                <ListSection
                  title="c"
                >
                  <ListRow
                    id="2"
                    title="BAZ"
                  />
                </ListSection>
              </Sociably.Fragment>
            }
          >
            BO
            DY
          </ListTemplateProps>,
          "path": "$",
          "type": "unit",
          "value": {
            "mediaFile": undefined,
            "message": {
              "context": {
                "message_id": "REPLY_TO_MESSAGE_ID",
              },
              "interactive": {
                "actions": {
                  "button": "open",
                  "sections": [
                    {
                      "rows": [
                        {
                          "description": undefined,
                          "id": "0",
                          "title": "FOO",
                        },
                      ],
                      "title": "a",
                    },
                    {
                      "rows": [
                        {
                          "description": undefined,
                          "id": "1",
                          "title": "BAR",
                        },
                      ],
                      "title": "b",
                    },
                    {
                      "rows": [
                        {
                          "description": undefined,
                          "id": "2",
                          "title": "BAZ",
                        },
                      ],
                      "title": "c",
                    },
                  ],
                },
                "body": {
                  "text": "BODY",
                },
                "footer": {
                  "text": "FOOTER",
                },
                "header": {
                  "text": "HEADER",
                  "type": "text",
                },
                "type": "list",
              },
              "type": "interactive",
            },
          },
        },
      ]
    `);
  });

  it('throw if invalid props received', async () => {
    await expect(
      renderUnitElement(
        <ListTemplate buttonTitle="" sections={[]}>
          <Image mediaId="123" />
        </ListTemplate>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `""children" prop should contain only textual content"`
    );
    await expect(
      renderUnitElement(
        <ListTemplate
          buttonTitle=""
          sections={[]}
          header={<Audio mediaId="123" />}
        >
          FOO
        </ListTemplate>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `""header" prop should contain only text or one <Image/>, <Video/>, <Document/> element"`
    );
    await expect(
      renderUnitElement(
        <ListTemplate
          buttonTitle=""
          sections={[]}
          header={
            <>
              <Image mediaId="123" />
              <Image mediaId="123" />
            </>
          }
        >
          FOO
        </ListTemplate>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `""header" prop should contain only text or one <Image/>, <Video/>, <Document/> element"`
    );
    await expect(
      renderUnitElement(
        <ListTemplate
          buttonTitle=""
          sections={[]}
          header={<ReplyButton id="0" title="?" />}
        >
          FOO
        </ListTemplate>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `""header" prop should contain only text or one <Image/>, <Video/>, <Document/> element"`
    );
    await expect(
      renderUnitElement(
        <ListTemplate buttonTitle="" sections={[]}>
          {null}
        </ListTemplate>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `""children" prop should not be empty"`
    );
    await expect(
      renderUnitElement(
        <ListTemplate buttonTitle="" sections={[]}>
          <Image mediaId="123" />
        </ListTemplate>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `""children" prop should contain only textual content"`
    );
    await expect(
      renderUnitElement(
        <ListTemplate
          buttonTitle=""
          sections={[]}
          footer={<Image mediaId="123" />}
        >
          FOO
        </ListTemplate>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `""footer" prop should contain only textual content"`
    );
    await expect(
      renderUnitElement(
        <ListTemplate buttonTitle="" sections={[]}>
          FOO
        </ListTemplate>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `""sections" prop should not be empty"`
    );
  });
});

describe('ButtonsTemplate', () => {
  it('is a valid Component', () => {
    expect(typeof ButtonsTemplate).toBe('function');
    expect(
      isNativeType(<ButtonsTemplate buttons={[]}>FOO</ButtonsTemplate>)
    ).toBe(true);
    expect(ButtonsTemplate.$$platform).toBe('whatsapp');
  });

  test('rendering value', async () => {
    await expect(
      renderUnitElement(
        <ButtonsTemplate buttons={<ReplyButton id="0" title="FOO" />}>
          hello world
        </ButtonsTemplate>
      )
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "node": <ButtonsTemplate
            buttons={
              <ReplyButton
                id="0"
                title="FOO"
              />
            }
          >
            hello world
          </ButtonsTemplate>,
          "path": "$",
          "type": "unit",
          "value": {
            "mediaFile": undefined,
            "message": {
              "context": undefined,
              "interactive": {
                "actions": {
                  "buttons": [
                    {
                      "id": "0",
                      "title": "FOO",
                      "type": "reply",
                    },
                  ],
                },
                "body": {
                  "text": "hello world",
                },
                "footer": undefined,
                "header": undefined,
                "type": "buttons",
              },
              "type": "interactive",
            },
          },
        },
      ]
    `);
    await expect(
      renderUnitElement(
        <ButtonsTemplate
          header={<Image url="http://foo.bar/baz.jpg" />}
          footer="world"
          buttons={
            <>
              <ReplyButton id="0" title="FOO" />
              <ReplyButton id="1" title="BAR" />
            </>
          }
        >
          hello
        </ButtonsTemplate>
      )
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "node": <ButtonsTemplate
            buttons={
              <Sociably.Fragment>
                <ReplyButton
                  id="0"
                  title="FOO"
                />
                <ReplyButton
                  id="1"
                  title="BAR"
                />
              </Sociably.Fragment>
            }
            footer="world"
            header={
              <Image
                url="http://foo.bar/baz.jpg"
              />
            }
          >
            hello
          </ButtonsTemplate>,
          "path": "$",
          "type": "unit",
          "value": {
            "mediaFile": undefined,
            "message": {
              "context": undefined,
              "interactive": {
                "actions": {
                  "buttons": [
                    {
                      "id": "0",
                      "title": "FOO",
                      "type": "reply",
                    },
                    {
                      "id": "1",
                      "title": "BAR",
                      "type": "reply",
                    },
                  ],
                },
                "body": {
                  "text": "hello",
                },
                "footer": {
                  "text": "world",
                },
                "header": {
                  "image": {
                    "caption": undefined,
                    "filename": undefined,
                    "id": undefined,
                    "link": "http://foo.bar/baz.jpg",
                  },
                  "type": "image",
                },
                "type": "buttons",
              },
              "type": "interactive",
            },
          },
        },
      ]
    `);
    await expect(
      renderUnitElement(
        <ButtonsTemplate
          header={<>HE{'AD'}ER</>}
          footer={<>FOO{'TER'}</>}
          buttons={
            <>
              <ReplyButton id="0" title="FOO" />
              <ReplyButton id="1" title="BAR" />
              <ReplyButton id="2" title="BAZ" />
            </>
          }
          replyTo="REPLY_TO_MESSAGE_ID"
        >
          BO{'DY'}
        </ButtonsTemplate>
      )
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "node": <ButtonsTemplate
            buttons={
              <Sociably.Fragment>
                <ReplyButton
                  id="0"
                  title="FOO"
                />
                <ReplyButton
                  id="1"
                  title="BAR"
                />
                <ReplyButton
                  id="2"
                  title="BAZ"
                />
              </Sociably.Fragment>
            }
            footer={
              <Sociably.Fragment>
                FOO
                TER
              </Sociably.Fragment>
            }
            header={
              <Sociably.Fragment>
                HE
                AD
                ER
              </Sociably.Fragment>
            }
            replyTo="REPLY_TO_MESSAGE_ID"
          >
            BO
            DY
          </ButtonsTemplate>,
          "path": "$",
          "type": "unit",
          "value": {
            "mediaFile": undefined,
            "message": {
              "context": {
                "message_id": "REPLY_TO_MESSAGE_ID",
              },
              "interactive": {
                "actions": {
                  "buttons": [
                    {
                      "id": "0",
                      "title": "FOO",
                      "type": "reply",
                    },
                    {
                      "id": "1",
                      "title": "BAR",
                      "type": "reply",
                    },
                    {
                      "id": "2",
                      "title": "BAZ",
                      "type": "reply",
                    },
                  ],
                },
                "body": {
                  "text": "BODY",
                },
                "footer": {
                  "text": "FOOTER",
                },
                "header": {
                  "text": "HEADER",
                  "type": "text",
                },
                "type": "buttons",
              },
              "type": "interactive",
            },
          },
        },
      ]
    `);
  });

  it('throw if invalid props received', async () => {
    await expect(
      renderUnitElement(
        <ButtonsTemplate buttons={[]}>
          <Image mediaId="123" />
        </ButtonsTemplate>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `""children" prop should contain only textual content"`
    );
    await expect(
      renderUnitElement(
        <ButtonsTemplate buttons={[]} header={<Audio mediaId="123" />}>
          FOO
        </ButtonsTemplate>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `""header" prop should contain only text or one <Image/>, <Video/>, <Document/> element"`
    );
    await expect(
      renderUnitElement(
        <ButtonsTemplate
          buttons={[]}
          header={
            <>
              <Image mediaId="123" />
              <Image mediaId="123" />
            </>
          }
        >
          FOO
        </ButtonsTemplate>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `""header" prop should contain only text or one <Image/>, <Video/>, <Document/> element"`
    );
    await expect(
      renderUnitElement(
        <ButtonsTemplate buttons={[]} header={<ReplyButton id="0" title="?" />}>
          FOO
        </ButtonsTemplate>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `""header" prop should contain only text or one <Image/>, <Video/>, <Document/> element"`
    );
    await expect(
      renderUnitElement(<ButtonsTemplate buttons={[]}>{null}</ButtonsTemplate>)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `""children" prop should not be empty"`
    );
    await expect(
      renderUnitElement(
        <ButtonsTemplate buttons={[]}>
          <Image mediaId="123" />
        </ButtonsTemplate>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `""children" prop should contain only textual content"`
    );
    await expect(
      renderUnitElement(
        <ButtonsTemplate buttons={[]} footer={<Image mediaId="123" />}>
          FOO
        </ButtonsTemplate>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `""footer" prop should contain only textual content"`
    );
    await expect(
      renderUnitElement(<ButtonsTemplate buttons={[]}>FOO</ButtonsTemplate>)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `""buttons" prop should not be empty"`
    );
  });
});
