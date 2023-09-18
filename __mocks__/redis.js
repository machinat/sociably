/* eslint-disable import/no-import-module-exports */
import moxy from '@moxyjs/moxy';

module.exports = moxy(jest.requireActual('redis'), { mockReturnValue: true });
