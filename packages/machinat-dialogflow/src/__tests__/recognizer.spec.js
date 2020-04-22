import moxy from 'moxy';
import Recognizer from '../recognizer';

const queryResult = {
  responseId: 'xxx',
  queryResult: {
    queryText: 'hello bot',
    action: 'input.welcome',
    parameters: {},
    allRequiredParamsPresent: true,
    fulfillmentText: 'Greetings! How can I assist?',
    fulfillmentMessages: [{ text: { text: ['Greetings! How can I assist?'] } }],
    intent: {
      name: 'projects/foo/agent/intents/xxx',
      displayName: 'Default Welcome Intent',
    },
    intentDetectionConfidence: 0.46481857,
    languageCode: 'en',
  },
};

const sessionPath = 'projects/foo/agent/sessions/bar';
const client = moxy({
  sessionPath: () => sessionPath,
  detectIntent: () => [{ responseId: 'xxx', queryResult }],
});

beforeEach(() => {
  client.mock.reset();
});

test('throw if porjectId is empty', () => {
  expect(() => new Recognizer(client)).toThrowErrorMatchingInlineSnapshot(
    `"projectId should not be empty"`
  );
});

describe('#recognizeText()', () => {
  it('detect intent and return queryResult', async () => {
    const recognizer = new Recognizer(client, '_PROJECT_ID_');
    const channel = { uid: 'chat.with.somoeone' };

    await expect(
      recognizer.recognizeText(channel, 'hello bot')
    ).resolves.toEqual(queryResult);

    expect(client.sessionPath.mock).toHaveBeenCalledTimes(1);
    expect(client.sessionPath.mock).toHaveBeenCalledWith(
      '_PROJECT_ID_',
      'chat.with.somoeone'
    );

    expect(client.detectIntent.mock).toHaveBeenCalledTimes(1);
    expect(client.detectIntent.mock).toHaveBeenCalledWith({
      session: 'projects/foo/agent/sessions/bar',
      queryInput: { text: { text: 'hello bot' } },
    });
  });

  test('use default language', async () => {
    const recognizer = new Recognizer(client, '_PROJECT_ID_', 'en-US');
    const channel = { uid: 'chat.with.somoeone' };

    await expect(
      recognizer.recognizeText(channel, 'hello bot')
    ).resolves.toEqual(queryResult);

    expect(client.detectIntent.mock).toHaveBeenCalledTimes(1);
    expect(client.detectIntent.mock).toHaveBeenCalledWith({
      session: 'projects/foo/agent/sessions/bar',
      queryInput: { text: { text: 'hello bot', languageCode: 'en-US' } },
    });
  });

  test('detect intent with options', async () => {
    const recognizer = new Recognizer(client, '_PROJECT_ID_', 'en-US');
    const channel = { uid: 'chat.with.somoeone' };

    const queryParams = { contexts: [{ some: 'context' }] };

    await expect(
      recognizer.recognizeText(channel, 'hello bot', {
        queryParams,
        languageCode: 'zh-TW',
      })
    ).resolves.toEqual(queryResult);

    expect(client.sessionPath.mock).toHaveBeenCalledTimes(1);
    expect(client.sessionPath.mock).toHaveBeenCalledWith(
      '_PROJECT_ID_',
      'chat.with.somoeone'
    );

    expect(client.detectIntent.mock).toHaveBeenCalledTimes(1);
    expect(client.detectIntent.mock).toHaveBeenCalledWith({
      session: 'projects/foo/agent/sessions/bar',
      queryInput: { text: { text: 'hello bot', languageCode: 'zh-TW' } },
      queryParams,
    });
  });
});
