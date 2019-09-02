import moxy from 'moxy';
import { SessionsClient } from 'dialogflow';
import attachMessageIntent from '../middleware';

jest.mock('dialogflow', () =>
  jest.requireActual('moxy').default({
    SessionsClient: function MockSessionsClient() {
      return {
        sessionPath(projectId, channelUid) {
          return `projects/${projectId}/agent/sessions/${channelUid}`;
        },
        detectIntent() {
          return [
            {
              responseId: 'xxx',
              queryResult: {
                queryText: 'hello world',
                action: 'input.welcome',
                parameters: {},
                allRequiredParamsPresent: true,
                fulfillmentText: 'Greetings! How can I assist?',
                fulfillmentMessages: [
                  { text: { text: ['Greetings! How can I assist?'] } },
                ],
                intent: {
                  name: 'projects/foo/agent/intents/xxx',
                  displayName: 'Default Welcome Intent',
                },
                intentDetectionConfidence: 0.46481857,
                languageCode: 'en',
              },
            },
          ];
        },
      };
    },
  })
);

beforeEach(() => {
  SessionsClient.mock.reset();
});

it('attach recognition of text message event', async () => {
  const next = moxy(() => ({ result: 'of next' }));
  const frame = {
    channel: { uid: 'yyy-yyy' },
    event: { type: 'message', subtype: 'text', text: 'hello world' },
  };

  await expect(
    attachMessageIntent({ projectId: 'zzz-zzz', languageCode: 'en' })(next)(
      frame
    )
  ).resolves.toEqual({ result: 'of next' });

  expect(SessionsClient.mock).toHaveBeenCalledTimes(1);
  const sessionClient = SessionsClient.mock.calls[0].instance;
  expect(sessionClient.detectIntent.mock).toHaveBeenCalledTimes(1);
  expect(sessionClient.detectIntent.mock).toHaveBeenCalledWith({
    session: 'projects/zzz-zzz/agent/sessions/yyy-yyy',
    queryInput: { text: { text: 'hello world', languageCode: 'en' } },
  });

  expect(next.mock).toHaveBeenCalledTimes(1);
  expect(next.mock).toHaveBeenCalledWith({
    ...frame,
    recognition: sessionClient.detectIntent.mock.calls[0].result[0].queryResult,
  });
});

it('pass frame to next and do nothing', async () => {
  const next = moxy(() => ({ result: 'of next' }));
  const frame = {
    channel: { uid: 'yyy-yyy' },
    event: { type: 'message', subtype: 'image' },
  };

  await expect(
    attachMessageIntent({ projectId: 'zzz-zzz', languageCode: 'en' })(next)(
      frame
    )
  ).resolves.toEqual({ result: 'of next' });

  expect(next.mock).toHaveBeenCalledTimes(1);
  expect(next.mock).toHaveBeenCalledWith(frame);

  expect(SessionsClient.mock).toHaveBeenCalledTimes(1);
  const sessionClient = SessionsClient.mock.calls[0].instance;
  expect(sessionClient.detectIntent.mock).not.toHaveBeenCalled();
});

it('set languageCode and queryParams with getQueryConfig fn', async () => {
  const next = moxy(() => ({ result: 'of next' }));
  const frame = {
    channel: { uid: 'yyy-yyy' },
    event: { type: 'message', subtype: 'text', text: 'hello world' },
  };

  const queryParams = {
    timeZone: 'asia/taipei',
    getLocation: {
      latitude: 25,
      longtitude: 121,
    },
    resetContexts: true,
  };
  await expect(
    attachMessageIntent({
      projectId: 'zzz-zzz',
      languageCode: 'en',
      getQueryConfig: moxy(async () => ({
        languageCode: 'zh-tw',
        queryParams,
      })),
    })(next)(frame)
  ).resolves.toEqual({ result: 'of next' });

  expect(SessionsClient.mock).toHaveBeenCalledTimes(1);
  const sessionClient = SessionsClient.mock.calls[0].instance;
  expect(sessionClient.detectIntent.mock).toHaveBeenCalledTimes(1);
  expect(sessionClient.detectIntent.mock).toHaveBeenCalledWith({
    session: 'projects/zzz-zzz/agent/sessions/yyy-yyy',
    queryInput: {
      text: {
        text: 'hello world',
        languageCode: 'zh-tw',
      },
    },
    queryParams,
  });

  expect(next.mock).toHaveBeenCalledTimes(1);
  expect(next.mock).toHaveBeenCalledWith({
    ...frame,
    recognition: sessionClient.detectIntent.mock.calls[0].result[0].queryResult,
  });
});
