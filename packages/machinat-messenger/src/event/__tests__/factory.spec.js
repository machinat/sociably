import { getFixtures, eachKeyValueAsync } from './helper';

import eventFactory from '../factory';

const expectedMapping = {
  text: { fixturePrefix: 'text' },
  image: { fixturePrefix: 'image' },
  video: { fixturePrefix: 'video' },
  audio: { fixturePrefix: 'audio' },
  file: { fixturePrefix: 'file' },
};

it('return corespond type of event', () => {
  eachKeyValueAsync(expectedMapping, async (type, { fixturePrefix }) => {
    const fixtures = await getFixtures(fixturePrefix);

    const events = eventFactory(
      fixtures.map(raw => ({
        id: 'PAGE_ID',
        time: 1458692752478,
        messaging: [raw],
      }))
    );
    events.forEach(event => {
      expect(event.type).toEqual(type);
      expect(event.platform).toEqual('messenger');
    });
  });
});
