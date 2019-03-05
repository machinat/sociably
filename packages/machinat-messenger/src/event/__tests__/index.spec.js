import { getFixtures, eachKeyValueAsync } from './helper';

import mainFactory from '../';

const expectedMapping = {
  text: { fixturePrefix: 'text' },
  image: { fixturePrefix: 'image' },
  video: { fixturePrefix: 'video' },
  audio: { fixturePrefix: 'audio' },
  file: { fixturePrefix: 'file' },
};

test.each([
  ['text', null, 'text*'],
  ['image', null, 'image*'],
  ['video', null, 'video*'],
  ['audio', null, 'audio*'],
  ['file', null, 'file*'],
])('making %s:%s messaging event', async (type, subtype, fixturesGlob) => {
  const fixtures = await getFixtures(fixturesGlob);

  const events = fixtures.map(fixt => mainFactory(false, fixt));

  events.forEach(event => {
    expect(event.type).toEqual(type);
    expect(event.subtype).toEqual(subtype);
    expect(event.platform).toEqual('messenger');
  });
});
