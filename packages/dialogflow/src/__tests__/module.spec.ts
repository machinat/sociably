import Machinat from '@machinat/core';
import IntentRecognizerI from '@machinat/core/base/IntentRecognizer';
import Dialogflow from '../module';
import { DialogflowIntentRecognizer as Recognizer } from '../recognizer';

it('export interfaces', () => {
  expect(Dialogflow.Recognizer).toBe(Recognizer);
  expect(Dialogflow.Configs).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "DialogflowConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
});

describe('initModule()', () => {
  const configs = {
    projectId: '_PROJECT_ID_',
    clientOptions: {},
    recognitionData: {
      defaultLanguage: 'en',
      languages: ['en'],
      intents: {},
    },
  };

  it('provide services', async () => {
    const app = Machinat.createApp({
      modules: [Dialogflow.initModule(configs)],
    });
    await app.start();

    const [recognizer, configsProvided] = app.useServices([
      Dialogflow.Recognizer,
      Dialogflow.Configs,
    ]);

    expect(recognizer).toBeInstanceOf(Recognizer);
    expect(configsProvided).toEqual(configs);
  });

  it('provide BaseIntentRecognizerI', async () => {
    const app = Machinat.createApp({
      modules: [Dialogflow.initModule(configs)],
    });
    await app.start();

    const [recognizer] = app.useServices([IntentRecognizerI]);
    expect(recognizer).toBeInstanceOf(Recognizer);
  });
});
