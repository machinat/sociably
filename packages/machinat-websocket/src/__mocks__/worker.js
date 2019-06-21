import moxy from 'moxy';

export default moxy(jest.requireActual('../worker').default, {
  excludeProps: ['_*'],
});
