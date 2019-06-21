import moxy from 'moxy';

export default moxy(jest.requireActual('../bot').default, {
  mockProperty: false,
});
