/* eslint-disable import/prefer-default-export */
import fs from 'fs';
import thenify from 'thenify';
import _glob from 'glob';

const glob = thenify(_glob);
const readFile = thenify(fs.readFile);

export const getFixtures = async fileNameGlob => {
  const files = await glob(`${__dirname}/../__fixtures__/${fileNameGlob}`);

  const fixturesSets = await Promise.all(
    files.map(p => readFile(p).then(JSON.parse))
  );

  return [].concat(...fixturesSets);
};
