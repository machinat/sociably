import moxy from 'moxy';

const mockedModule = moxy(jest.requireActual('../'), {
  excludeProps: ['_*', 'options'],
});

module.exports = {
  __esModule: true,
  ...mockedModule,
};
