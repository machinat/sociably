import { readFile } from 'fs/promises'; // eslint-disable-line import/no-unresolved
import createEvent from '../factory';

const agentId = '__AGENT_IGID__';

const getFixtures = async (fileName) => {
  const file = `${__dirname}/../__fixtures__/${fileName}.json`;
  const content = await readFile(file, 'utf8');
  return JSON.parse(content);
};

test('text message event', async () => {
  for (const rawEvent of await getFixtures('text')) {
    const event = createEvent(agentId, false, rawEvent);

    expect(event.platform).toBe('instagram');
    expect(event.isStandby).toBe(false);

    expect(event.category).toBe('message');
    expect(event.type).toBe('text');

    expect(event.sender).toBe(rawEvent.sender);

    expect(event.messageId).toBe(rawEvent.message.mid);
    expect(event.text).toBe(rawEvent.message.text);
    expect(event.fallback).toBe(rawEvent.message.attachments?.[0]);
    expect(event.nlp).toBe(rawEvent.message.nlp);
  }
});

test('quick_reply callback event', async () => {
  for (const rawEvent of await getFixtures('quick_reply')) {
    const event = createEvent(agentId, false, rawEvent);

    expect(event.platform).toBe('instagram');
    expect(event.isStandby).toBe(false);
    expect(event.sender).toBe(rawEvent.sender);

    expect(event.category).toBe('callback');
    expect(event.type).toBe('quick_reply');

    expect(event.callbackData).toBe(rawEvent.message.quick_reply.payload);
    expect(event.messageId).toBe(rawEvent.message.mid);
    expect(event.text).toBe(rawEvent.message.text);
  }
});

test('image message event', async () => {
  for (const rawEvent of await getFixtures('image')) {
    const event = createEvent(agentId, false, rawEvent);

    expect(event.platform).toBe('instagram');
    expect(event.isStandby).toBe(false);
    expect(event.sender).toBe(rawEvent.sender);

    expect(event.category).toBe('message');
    expect(event.type).toBe('image');

    expect(event.url).toBe(rawEvent.message.attachments[0].payload.url);
    expect(event.messageId).toBe(rawEvent.message.mid);
  }
});
