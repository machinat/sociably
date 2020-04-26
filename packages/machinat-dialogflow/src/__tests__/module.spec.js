import Machinat from '@machinat/core';
import { SessionsClient } from 'dialogflow';
import DialogFlow from '..';
import DialogFlowIntentRecognizer from '../recognizer';

jest.mock(
  'dialogflow',
  () => require('moxy').default({ SessionsClient: class {} }) // eslint-disable-line global-require
);

it('export interfaces', () => {
  expect(DialogFlow.IntentRecognizer).toBe(DialogFlowIntentRecognizer);
  expect(DialogFlow.CONFIGS_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "DialogFlowModuleConfigs",
      "$$typeof": Symbol(machinat.services.interface),
    }
  `);

  expect(typeof DialogFlow.ClientI).toBe('function');
  const { $$typeof, $$name, $$multi } = DialogFlow.ClientI;
  expect({ $$typeof, $$name, $$multi }).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "DialogFlowClient",
      "$$typeof": Symbol(machinat.services.interface),
    }
  `);
});

describe('initModule()', () => {
  const configs = {
    projectId: '_PROJECT_ID_',
    gcpAuthConfig: {},
    defaultLanguageCode: 'en-US',
  };

  it('', async () => {
    const app = Machinat.createApp({
      modules: [DialogFlow.initModule(configs)],
    });
    await app.start();

    expect(SessionsClient.mock).not.toHaveBeenCalled();

    const [recognizer, client, configsProvided] = app.useServices([
      DialogFlow.IntentRecognizer,
      DialogFlow.ClientI,
      DialogFlow.CONFIGS_I,
    ]);

    expect(SessionsClient.mock).toHaveBeenCalledTimes(1);

    expect(recognizer).toBeInstanceOf(DialogFlowIntentRecognizer);
    expect(client).toBe(SessionsClient.mock.calls[0].instance);
    expect(configsProvided).toEqual(configs);
  });
});
