import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
import { SessionsClient } from '@google-cloud/dialogflow';
import Dialogflow from '../module';
import { DialogflowIntentRecognizer as Recognizer } from '../recognizer';

jest.mock('@google-cloud/dialogflow', () =>
  jest.requireActual('@moxyjs/moxy').default({ SessionsClient: class {} })
);

it('export interfaces', () => {
  expect(Dialogflow.IntentRecognizer).toBe(Recognizer);
  expect(Dialogflow.CONFIGS_I).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": false,
      "$$name": "DialogflowModuleConfigsI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);

  expect(Dialogflow.SESSION_CLIENT_I).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": false,
      "$$name": "DialogflowSessionClientI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
});

describe('initModule()', () => {
  const configs = {
    projectId: '_PROJECT_ID_',
    gcpAuthConfig: {},
    defaultLanguageCode: 'en-US',
  };

  it('provide services', async () => {
    const app = Machinat.createApp({
      modules: [Dialogflow.initModule(configs)],
    });
    await app.start();

    expect(SessionsClient.mock).not.toHaveBeenCalled();

    const [recognizer, client, configsProvided] = app.useServices([
      Dialogflow.IntentRecognizer,
      Dialogflow.SESSION_CLIENT_I,
      Dialogflow.CONFIGS_I,
    ]);

    expect(SessionsClient.mock).toHaveBeenCalledTimes(1);

    expect(recognizer).toBeInstanceOf(Recognizer);
    expect(client).toBe(SessionsClient.mock.calls[0].instance);
    expect(configsProvided).toEqual(configs);
  });

  it('provide Base.IntentRecognizerI', async () => {
    const app = Machinat.createApp({
      modules: [Dialogflow.initModule(configs)],
    });
    await app.start();

    const [recognizer] = app.useServices([Base.IntentRecognizerI]);
    expect(recognizer).toBeInstanceOf(Recognizer);
  });
});
