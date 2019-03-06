import { getFixtures } from './helper';

import mainFactory from '../';

test.each([
  ['text', undefined, 'text*'],
  ['image', undefined, 'image*'],
  ['video', undefined, 'video*'],
  ['audio', undefined, 'audio*'],
  ['file', undefined, 'file*'],
])('making %s:%s messaging event', async (type, subtype, fixturesGlob) => {
  const fixtures = await getFixtures(fixturesGlob);

  const events = fixtures.map(fixt => mainFactory(false, fixt));

  events.forEach(event => {
    expect(event.type).toEqual(type);
    expect(event.subtype).toEqual(subtype);
    expect(event.platform).toEqual('messenger');
  });
});
