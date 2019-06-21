import moxy from 'moxy';

export default moxy(jest.requireActual('../distributor').default, {
  excludeProps: ['_*'],
});
