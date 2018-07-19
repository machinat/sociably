import fs from 'fs';
import thenify from 'thenify';
import _glob from 'glob';

const glob = thenify(_glob);
const readFile = thenify(fs.readFile);

export const getFixtures = async type => {
  const files = await glob(`${__dirname}/../__fixtures__/${type}*`);
  const fixturesSets = await Promise.all(
    files.map(p => readFile(p).then(JSON.parse))
  );
  return [].concat(...fixturesSets);
};

export const eachKeyValueAsync = (mapping, fn) =>
  Promise.all(
    Object.keys(mapping).map((k, i) => fn(k, mapping[k], i, mapping))
  );
