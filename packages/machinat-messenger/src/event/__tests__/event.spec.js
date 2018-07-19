import { getFixtures, eachKeyValueAsync } from './helper';

import { text, image, video, audio, file } from '../event';
import {
  MessengerEventBase,
  MessageBase,
  Text,
  NLP,
  Media,
} from '../descriptor';

const expectedMapping = {
  text: { initiator: text, mixins: [MessageBase, Text, NLP] },
  image: { initiator: image, mixins: [MessageBase, Media] },
  video: { initiator: video, mixins: [MessageBase, Media] },
  audio: { initiator: audio, mixins: [MessageBase, Media] },
  file: { initiator: file, mixins: [MessageBase, Media] },
};

it('contain "type" and "raw"', () =>
  eachKeyValueAsync(expectedMapping, async (type, { initiator }) => {
    const fixtures = await getFixtures(type);

    fixtures.forEach(raw => {
      const event = initiator(raw);
      expect(event).toEqual({ type, raw });
    });
  }));

it('match expected mixins', () => {
  eachKeyValueAsync(expectedMapping, async (type, { initiator, mixins }) => {
    const fixtures = await getFixtures(type);

    fixtures.forEach(raw => {
      const event = initiator(raw);
      const protoDescriptor = Object.getOwnPropertyDescriptors(
        Object.getPrototypeOf(event)
      );
      expect(protoDescriptor).toMatchObject(MessengerEventBase);
      mixins.forEach(mixin => expect(protoDescriptor).toMatchObject(mixin));
    });
  });
});
