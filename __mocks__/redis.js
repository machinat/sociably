import moxy from 'moxy';

module.exports = moxy(jest.requireActual('redis'), { mockReturnValue: true });
