import { getFixtures } from './helper';

import { text, image, video, audio, file } from '../factory';
import { EventBase, Message, Text, NLP, Media } from '../descriptor';

describe.each([
  ['text', null, text, 'text*', [Message, Text, NLP]],
  ['image', null, image, 'image*', [Message, Media]],
  ['video', null, video, 'video*', [Message, Media]],
  ['audio', null, audio, 'audio*', [Message, Media]],
  ['file', null, file, 'file*', [Message, Media]],
])('%s:%s event factory', (type, subtype, factory, fixturesGlob, mixins) => {
  //
  it('implements MachinatEvent interface', async () => {
    const fixtures = await getFixtures(fixturesGlob);

    fixtures.forEach(raw => {
      const event = factory(raw);

      expect({ ...event }).toEqual({ type, subtype, raw });
    });
  });

  it('contains expected mixins', async () => {
    const fixtures = await getFixtures(type, subtype);

    fixtures.forEach(raw => {
      const event = factory(raw);
      const protoDescriptor = Object.getOwnPropertyDescriptors(
        Object.getPrototypeOf(event)
      );

      expect(protoDescriptor).toMatchObject(EventBase);
      mixins.forEach(mixin => {
        expect(protoDescriptor).toMatchObject(mixin);
      });
    });
  });
});
