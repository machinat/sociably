import { Moxy } from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import IntentRecognizerI from '@machinat/core/base/IntentRecognizer';
import { SessionsClient as _SessionsClient } from '@google-cloud/dialogflow';
import Dialogflow from '../module';
import { DialogflowIntentRecognizer as Recognizer } from '../recognizer';

const SessionsClient = _SessionsClient as Moxy<typeof _SessionsClient>;

jest.mock('@google-cloud/dialogflow', () =>
  jest.requireActual('@moxyjs/moxy').default({ SessionsClient: class {} })
);

it('export interfaces', () => {
  expect(Dialogflow.IntentRecognizer).toBe(Recognizer);
  expect(Dialogflow.Configs).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "DialogflowConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);

  expect(Dialogflow.SessionClient).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "DialogflowSessionClient",
      "$$polymorphic": false,
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
      Dialogflow.SessionClient,
      Dialogflow.Configs,
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

    const [recognizer] = app.useServices([IntentRecognizerI]);
    expect(recognizer).toBeInstanceOf(Recognizer);
  });
});
