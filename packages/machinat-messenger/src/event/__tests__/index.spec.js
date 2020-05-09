import { getFixtures } from './helper';

import mainFactory from '..';

test.each([
  ['message', 'text', 'text*'],
  ['message', 'image', 'image*'],
  ['message', 'video', 'video*'],
  ['message', 'audio', 'audio*'],
  ['message', 'file', 'file*'],
])('making %s:%s messaging event', async (type, subtype, fixturesGlob) => {
  const fixtures = await getFixtures(fixturesGlob);

  const events = fixtures.map((fixt) => mainFactory(false, fixt));

  events.forEach((event) => {
    expect(event.type).toEqual(type);
    expect(event.subtype).toEqual(subtype);
    expect(event.platform).toEqual('messenger');
  });
});
