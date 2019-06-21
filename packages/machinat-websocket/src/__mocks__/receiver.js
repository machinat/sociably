import moxy from 'moxy';

const Receiver = moxy(jest.requireActual('../receiver').default, {
  excludeProps: ['_*'],
});
export default Receiver;
