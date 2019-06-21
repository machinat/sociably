import moxy from 'moxy';

export default moxy(jest.requireActual('../engine').default, {
  includeProps: ['eventIssuer', 'renderTasks', 'dispatch'],
});
