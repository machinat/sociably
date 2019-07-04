import moxy from 'moxy';

const mockedModule = moxy(jest.requireActual('../'));

module.exports = {
  __esModule: true,
  ...mockedModule,
};
