import { readFile } from 'fs/promises';
import moxy from '@moxyjs/moxy';
import { MetaApiChannel } from '@sociably/meta-api';
import createEventFactory from '../factory.js';
import {
  TextEventProto,
  QuickReplyEventProto,
  ImageEventProto,
} from '../types.js';
import { MessengerChat, MessengerUser } from '../../types.js';

const pageId = '__PAGE_ID__';

const page = {
  platform: 'test',
  id: pageId,
} as MetaApiChannel;
const createChannel = moxy(() => page);

const chat = {
  platform: 'test',
  page,
  pageId,
  id: '67890',
  target: { id: '67890' },
} as unknown as MessengerChat;
const createChat = moxy(() => chat);

const user = {
  platform: 'test',
  id: '67890',
} as MessengerUser;
const createUser = moxy(() => user);

afterEach(() => {
  createChannel.mock.clear();
  createChat.mock.clear();
  createUser.mock.clear();
});

const createEvent = createEventFactory({
  createChannel,
  createChat,
  createUser,
});

const getFixtures = async (fileName) => {
  const file = `${__dirname}/../__fixtures__/${fileName}.json`;
  const content = await readFile(file, 'utf8');
  return JSON.parse(content);
};

test('text message event', async () => {
  for (const rawEvent of await getFixtures('text')) {
    const event = createEvent(pageId, false, rawEvent) as TextEventProto & {
      platform: string;
      category: string;
      type: string;
    };

    expect(event.platform).toBe('test');
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

test('quick_reply postback event', async () => {
  for (const rawEvent of await getFixtures('quick_reply')) {
    const event = createEvent(
      pageId,
      false,
      rawEvent,
    ) as QuickReplyEventProto & {
      platform: string;
      category: string;
      type: string;
    };

    expect(event.platform).toBe('test');
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
    const event = createEvent(pageId, false, rawEvent) as ImageEventProto & {
      platform: string;
      category: string;
      type: string;
    };

    expect(event.platform).toBe('test');
    expect(event.isStandby).toBe(false);
    expect(event.sender).toBe(rawEvent.sender);

    expect(event.category).toBe('message');
    expect(event.type).toBe('image');

    expect(event.url).toBe(rawEvent.message.attachments[0].payload.url);
    expect(event.messageId).toBe(rawEvent.message.mid);
  }
});
