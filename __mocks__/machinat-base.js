import moxy from 'moxy';

const baseModule = jest.requireActual('machinat-base');

module.exports = {
  ...baseModule,
  BaseBot: moxy(baseModule.BaseBot, { mockProperty: false }),
};
