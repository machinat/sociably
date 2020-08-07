import { readFile } from 'fs/promises'; // eslint-disable-line import/no-unresolved
import createEvent from '..';

const getFixtures = async (fileName) => {
  const file = `${__dirname}/../__fixtures__/${fileName}.json`;
  const content = await readFile(file, 'utf8');
  return JSON.parse(content);
};

test('text message event', async () => {
  for (const rawEvent of await getFixtures('text')) {
    const event = createEvent(false, rawEvent);

    expect(event.platform).toBe('messenger');
    expect(event.isStandby).toBe(false);

    expect(event.type).toBe('message');
    expect(event.subtype).toBe('text');

    expect(event.sender).toBe(rawEvent.sender);
    expect(event.senderId).toBe(rawEvent.sender.id);

    expect(event.messageId).toBe(rawEvent.message.mid);
    expect(event.text).toBe(rawEvent.message.text);
    expect(event.fallback).toBe(rawEvent.message.attachments?.[0]);
    expect(event.nlp).toBe(rawEvent.message.nlp);
  }
});

test('quick_reply postback event', async () => {
  for (const rawEvent of await getFixtures('quick_reply')) {
    const event = createEvent(false, rawEvent);

    expect(event.platform).toBe('messenger');
    expect(event.isStandby).toBe(false);
    expect(event.sender).toBe(rawEvent.sender);
    expect(event.senderId).toBe(rawEvent.sender.id);

    expect(event.type).toBe('postback');
    expect(event.subtype).toBe('quick_reply');

    expect(event.data).toBe(rawEvent.message.quick_reply.payload);
    expect(event.messageId).toBe(rawEvent.message.mid);
    expect(event.text).toBe(rawEvent.message.text);
  }
});

test('image message event', async () => {
  for (const rawEvent of await getFixtures('image')) {
    const event = createEvent(false, rawEvent);

    expect(event.platform).toBe('messenger');
    expect(event.isStandby).toBe(false);
    expect(event.sender).toBe(rawEvent.sender);
    expect(event.senderId).toBe(rawEvent.sender.id);

    expect(event.type).toBe('message');
    expect(event.subtype).toBe('image');

    expect(event.url).toBe(rawEvent.message.attachments[0].payload.url);
    expect(event.messageId).toBe(rawEvent.message.mid);
  }
});
