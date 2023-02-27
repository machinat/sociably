import moxy, { Moxy } from '@moxyjs/moxy';
import {
  SessionsClient as _SessionsClient,
  AgentsClient as _AgentsClient,
  VersionsClient as _VersionsClient,
  EnvironmentsClient as _EnvironmentsClient,
  IntentsClient as _IntentsClient,
} from '@google-cloud/dialogflow';
import { DialogflowIntentRecognizer as Recognizer } from '../recognizer';

const SessionsClient: Moxy<typeof _SessionsClient> = _SessionsClient as never;
type SessionsClient = _SessionsClient;
const AgentsClient: Moxy<typeof _AgentsClient> = _AgentsClient as never;
type AgentsClient = _AgentsClient;
const VersionsClient: Moxy<typeof _VersionsClient> = _VersionsClient as never;
type VersionsClient = _VersionsClient;
const EnvironmentsClient: Moxy<typeof _EnvironmentsClient> =
  _EnvironmentsClient as never;
type EnvironmentsClient = _EnvironmentsClient;
const IntentsClient: Moxy<typeof _IntentsClient> = _IntentsClient as never;
type IntentsClient = _IntentsClient;

jest.mock('@google-cloud/dialogflow', () =>
  jest.requireActual('@moxyjs/moxy').default({
    SessionsClient: class {},
    AgentsClient: class {},
    VersionsClient: class {},
    EnvironmentsClient: class {},
    IntentsClient: class {},
  })
);

beforeEach(() => {
  SessionsClient.mock.reset();
  AgentsClient.mock.reset();
  VersionsClient.mock.reset();
  EnvironmentsClient.mock.reset();
  IntentsClient.mock.reset();
});

const detectTextResponse = {
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

test('throw if porjectId is empty', () => {
  expect(
    () =>
      new Recognizer({
        recognitionData: {
          defaultLanguage: 'en',
          languages: ['en'],
          intents: null,
        },
      } as never)
  ).toThrowErrorMatchingInlineSnapshot(
    `"options.projectId should not be empty"`
  );
});

test('throw if recognitionData is empty', () => {
  expect(
    () => new Recognizer({ projectId: 'test' } as never)
  ).toThrowErrorMatchingInlineSnapshot(
    `"options.recognitionData should not be empty"`
  );
});

describe('.detectText()', () => {
  const client = moxy<SessionsClient>({
    detectIntent: () => [detectTextResponse],
    projectAgentSessionPath: (pId, sId) =>
      `projects/${pId}/agent/sessions/${sId}`,
    projectAgentEnvironmentUserSessionPath: (pId, eId, uId, sId) =>
      `projects/${pId}/agent/environments/${eId}/users/${uId}/sessions/${sId}`,
    projectAgentSessionContextPath: (pId, sId, cId) =>
      `projects/${pId}/agent/sessions/${sId}/contexts/${cId}`,
    projectAgentEnvironmentUserSessionContextPath: (pId, eId, uId, sId, cId) =>
      `projects/${pId}/agent/environments/${eId}/users/${uId}/sessions/${sId}/contexts/${cId}`,
  } as never);
  const recognitionData = {
    defaultLanguage: 'en',
    languages: ['en'],
    intents: {},
  };

  beforeEach(() => {
    client.mock.reset();
    SessionsClient.mock.fake(function MockSessionsClient() {
      return client;
    });
  });

  test('detect under sociably environment', async () => {
    const recognizer = new Recognizer({
      projectId: 'test',
      recognitionData,
    });
    const channel = { platform: 'test', uid: 'foo.chat' };

    await expect(recognizer.detectText(channel, 'hello bot')).resolves.toEqual({
      type: 'Default Welcome Intent',
      language: 'en',
      confidence: 0.46481857,
      payload: detectTextResponse.queryResult,
    });

    expect(client.detectIntent).toHaveBeenCalledTimes(1);
    expect(client.detectIntent.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "queryInput": Object {
          "text": Object {
            "languageCode": "en",
            "text": "hello bot",
          },
        },
        "queryParams": undefined,
        "session": "projects/test/agent/environments/sociably-entry/users/-/sessions/foo.chat",
      }
    `);
  });

  test('detect with options', async () => {
    const recognizer = new Recognizer({ projectId: 'test', recognitionData });
    const channel = { platform: 'test', uid: 'foo.chat' };

    await expect(
      recognizer.detectText(channel, 'hello bot', {
        language: 'zh-TW',
        timeZone: 'Asia/Taipei',
        location: { latitude: 25.0456, longitude: 121.5196 },
        resetContexts: true,
        contexts: ['bar', 'baz'],
      })
    ).resolves.toEqual({
      type: 'Default Welcome Intent',
      language: 'zh-TW',
      confidence: 0.46481857,
      payload: detectTextResponse.queryResult,
    });

    expect(client.detectIntent).toHaveBeenCalledTimes(1);
    expect(client.detectIntent.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "queryInput": Object {
          "text": Object {
            "languageCode": "zh-TW",
            "text": "hello bot",
          },
        },
        "queryParams": Object {
          "contexts": Array [
            Object {
              "name": "projects/test/agent/environments/sociably-entry/users/-/sessions/foo.chat/contexts/bar",
            },
            Object {
              "name": "projects/test/agent/environments/sociably-entry/users/-/sessions/foo.chat/contexts/baz",
            },
          ],
          "geoLocation": Object {
            "latitude": 25.0456,
            "longitude": 121.5196,
          },
          "resetContexts": true,
          "timeZone": "Asia/Taipei",
        },
        "session": "projects/test/agent/environments/sociably-entry/users/-/sessions/foo.chat",
      }
    `);
  });

  test('detect with specified environment', async () => {
    const recognizer = new Recognizer({
      projectId: 'test',
      environment: 'Pleasantville',
      recognitionData,
    });
    const channel = { platform: 'test', uid: 'maguire.chat' };

    await expect(
      recognizer.detectText(channel, 'Hello, Tobey!', {
        contexts: ['bar', 'baz'],
      })
    ).resolves.toEqual({
      type: 'Default Welcome Intent',
      language: 'en',
      confidence: 0.46481857,
      payload: detectTextResponse.queryResult,
    });

    expect(client.detectIntent).toHaveBeenCalledTimes(1);
    expect(client.detectIntent.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "queryInput": Object {
          "text": Object {
            "languageCode": "en",
            "text": "Hello, Tobey!",
          },
        },
        "queryParams": Object {
          "contexts": Array [
            Object {
              "name": "projects/test/agent/environments/Pleasantville/users/-/sessions/maguire.chat/contexts/bar",
            },
            Object {
              "name": "projects/test/agent/environments/Pleasantville/users/-/sessions/maguire.chat/contexts/baz",
            },
          ],
          "geoLocation": undefined,
          "resetContexts": undefined,
          "timeZone": undefined,
        },
        "session": "projects/test/agent/environments/Pleasantville/users/-/sessions/maguire.chat",
      }
    `);
  });

  test('detect when useDefaultAgent', async () => {
    const recognizer = new Recognizer({
      projectId: 'test',
      useDefaultAgent: true,
      recognitionData,
    });
    const channel = { platform: 'test', uid: 'foo.chat' };

    await expect(recognizer.detectText(channel, 'hello bot')).resolves.toEqual({
      type: 'Default Welcome Intent',
      language: 'en',
      confidence: 0.46481857,
      payload: detectTextResponse.queryResult,
    });

    expect(client.detectIntent).toHaveBeenCalledTimes(1);
    expect(client.detectIntent.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "queryInput": Object {
          "text": Object {
            "languageCode": "en",
            "text": "hello bot",
          },
        },
        "queryParams": undefined,
        "session": "projects/test/agent/sessions/foo.chat",
      }
    `);
  });

  test('detect with options when useDefaultAgent', async () => {
    const recognizer = new Recognizer({
      projectId: 'test',
      useDefaultAgent: true,
      recognitionData,
    });
    const channel = { platform: 'test', uid: 'foo.chat' };

    await expect(
      recognizer.detectText(channel, 'hello bot', {
        language: 'zh-TW',
        timeZone: 'Asia/Taipei',
        location: { latitude: 25.0456, longitude: 121.5196 },
        resetContexts: true,
        contexts: ['bar', 'baz'],
      })
    ).resolves.toEqual({
      type: 'Default Welcome Intent',
      language: 'zh-TW',
      confidence: 0.46481857,
      payload: detectTextResponse.queryResult,
    });

    expect(client.detectIntent).toHaveBeenCalledTimes(1);
    expect(client.detectIntent.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "queryInput": Object {
          "text": Object {
            "languageCode": "zh-TW",
            "text": "hello bot",
          },
        },
        "queryParams": Object {
          "contexts": Array [
            Object {
              "name": "projects/test/agent/sessions/foo.chat/contexts/bar",
            },
            Object {
              "name": "projects/test/agent/sessions/foo.chat/contexts/baz",
            },
          ],
          "geoLocation": Object {
            "latitude": 25.0456,
            "longitude": 121.5196,
          },
          "resetContexts": true,
          "timeZone": "Asia/Taipei",
        },
        "session": "projects/test/agent/sessions/foo.chat",
      }
    `);
  });
});

describe('.train()', () => {
  const agentResult = {
    defaultLanguageCode: 'ja',
    supportedLanguageCodes: ['en', 'zh-TW'],
    parent: 'projects/test',
    displayName: 'sociably-agent',
    timeZone: 'GMT',
  };
  const defaultIntents = [
    {
      name: 'projects/test/agent/intents/545b197f-04dc-4518-9237-96ffa7ecbda7',
      displayName: 'Default Welcome Intent',
    },
    {
      name: 'projects/test/agent/intents/7c3d010e-8ac3-4fd6-8898-8d15f729e78f',
      displayName: 'Default Fallback Intent',
    },
  ];
  const environment = {
    name: 'projects/test/agent/environments/sociably-entry',
    description: '...',
    agentVersion: 'projects/test/agent/versions/1',
    state: 'RUNNING',
  };

  const projectPath = (pId) => `projects/${pId}`;
  const projectAgentPath = (pId) => `projects/${pId}/agent`;
  const agentsClient = moxy<AgentsClient>({
    projectPath,
    getAgent: async () => [agentResult],
    setAgent: async () => [agentResult],
  } as never);
  const versionsClient = moxy<VersionsClient>({
    projectPath,
    projectAgentPath,
    listVersions: async () => [
      [
        {
          name: 'projects/test/agent/versions/1',
          description: '@sociably/dialogflow:V0:out-dated-version',
        },
      ],
    ],
    createVersion: async () => [
      { name: 'projects/test/agent/versions/2', description: '...' },
    ],
  } as never);
  const intentsClient = moxy<IntentsClient>({
    projectPath,
    projectAgentPath,
    listIntents: async () => [defaultIntents],
    batchDeleteIntents: async () => [{ promise: () => Promise.resolve([{}]) }],
    batchUpdateIntents: async ({ intentBatchInline: { intents } }) => [
      {
        promise: async () => [
          {
            intents: intents.map(({ displayName }) => ({
              name: `projects/test/agent/intents/_ID_OF_${displayName.toUpperCase()}_`,
              displayName,
            })),
          },
        ],
      },
    ],
  } as never);
  const environmentsClient = moxy<EnvironmentsClient>(
    {
      projectPath,
      projectAgentPath,
      projectAgentEnvironmentPath: (pId, eId) =>
        `projects/${pId}/agent/environments${eId}`,
      getEnvironment: async () => [environment],
      createEnvironment: async () => [environment],
      auth: { request: async () => {} },
    } as never,
    { includeProperties: ['auth'] }
  );

  beforeEach(() => {
    agentsClient.mock.reset();
    AgentsClient.mock.fake(function MockAgentsClient() {
      return agentsClient;
    });
    versionsClient.mock.reset();
    VersionsClient.mock.fake(function MockVersionsClient() {
      return versionsClient;
    });
    environmentsClient.mock.reset();
    EnvironmentsClient.mock.fake(function MockEnvironmentsClient() {
      return environmentsClient;
    });
    intentsClient.mock.reset();
    IntentsClient.mock.fake(function MockIntentsClient() {
      return intentsClient;
    });
  });

  const recognizerOptions = {
    projectId: 'test',
    recognitionData: {
      defaultLanguage: 'ja',
      languages: ['zh-TW', 'en', 'ja'],
      intents: {
        hello: {
          trainingPhrases: {
            en: ['hello', 'hi'],
            ja: ['こんにちは', 'おはよう'],
          },
        },
        goodBye: {
          trainingPhrases: {
            en: ['bye', 'see ya'],
            ja: ['さようなら'],
          },
        },
      },
    },
  };

  test('start from empty project', async () => {
    agentsClient.getAgent.mock.fake(async () => {
      const err = new Error(
        "5 NOT_FOUND: com.google.apps.framework.request.NotFoundException: No DesignTimeAgent found for project 'test'"
      );
      (err as any).code = 5;
      throw err;
    });
    environmentsClient.getEnvironment.mock.fake(async () => {
      const err = new Error(
        "5 NOT_FOUND: com.google.apps.framework.request.NotFoundException: Environment 'sociably-entry' not found for agent with internal ID '51adb532-5bfd-429e-94af-3fbcf2029d33'"
      );
      (err as any).code = 5;
      throw err;
    });

    const recognizer = new Recognizer(recognizerOptions);
    await recognizer.train();

    expect(agentsClient.setAgent).toHaveBeenCalledTimes(1);
    expect(agentsClient.setAgent.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "agent": Object {
          "defaultLanguageCode": "ja",
          "description": "This agent is generated by @sociably/dialogflow package",
          "displayName": "sociably-agent",
          "parent": "projects/test",
          "supportedLanguageCodes": Array [
            "zh-TW",
            "en",
          ],
          "timeZone": "GMT",
        },
      }
    `);

    expect(intentsClient.batchDeleteIntents).toHaveBeenCalledTimes(1);
    expect(intentsClient.batchDeleteIntents.mock.calls[0].args[0])
      .toMatchInlineSnapshot(`
      Object {
        "intents": Array [
          Object {
            "name": "projects/test/agent/intents/545b197f-04dc-4518-9237-96ffa7ecbda7",
          },
          Object {
            "name": "projects/test/agent/intents/7c3d010e-8ac3-4fd6-8898-8d15f729e78f",
          },
        ],
        "parent": "projects/test/agent",
      }
    `);

    expect(intentsClient.batchUpdateIntents).toHaveBeenCalledTimes(2);
    expect(
      intentsClient.batchUpdateIntents.mock.calls[0].args
    ).toMatchSnapshot();
    expect(
      intentsClient.batchUpdateIntents.mock.calls[1].args
    ).toMatchSnapshot();

    expect(versionsClient.createVersion).toHaveBeenCalledTimes(1);
    expect(versionsClient.createVersion.mock.calls[0].args[0])
      .toMatchInlineSnapshot(`
      Object {
        "parent": "projects/test/agent",
        "version": Object {
          "description": "@sociably/dialogflow:V0:c08fccf84d0eb503d0bc1356741d45f64c18a072",
        },
      }
    `);

    expect(environmentsClient.createEnvironment).toHaveBeenCalledTimes(1);
    expect(environmentsClient.createEnvironment.mock.calls[0].args[0])
      .toMatchInlineSnapshot(`
      Object {
        "environment": Object {
          "agentVersion": "projects/test/agent/versions/2",
          "description": "This evnironment is generated by @sociably/dialogflow package",
        },
        "environmentId": "sociably-entry",
        "parent": "projects/test/agent",
      }
    `);
    expect(
      (environmentsClient.auth.request as any).mock
    ).not.toHaveBeenCalled();
  });

  test('create a new version', async () => {
    const recognizer = new Recognizer(recognizerOptions);
    await recognizer.train();

    expect(agentsClient.setAgent).not.toHaveBeenCalled();

    expect(intentsClient.batchDeleteIntents).toHaveBeenCalledTimes(1);
    expect(intentsClient.batchDeleteIntents.mock.calls[0].args[0])
      .toMatchInlineSnapshot(`
      Object {
        "intents": Array [
          Object {
            "name": "projects/test/agent/intents/545b197f-04dc-4518-9237-96ffa7ecbda7",
          },
          Object {
            "name": "projects/test/agent/intents/7c3d010e-8ac3-4fd6-8898-8d15f729e78f",
          },
        ],
        "parent": "projects/test/agent",
      }
    `);

    expect(intentsClient.batchUpdateIntents).toHaveBeenCalledTimes(2);
    expect(
      intentsClient.batchUpdateIntents.mock.calls[0].args
    ).toMatchSnapshot();
    expect(
      intentsClient.batchUpdateIntents.mock.calls[1].args
    ).toMatchSnapshot();

    expect(versionsClient.createVersion).toHaveBeenCalledTimes(1);
    expect(versionsClient.createVersion.mock.calls[0].args[0])
      .toMatchInlineSnapshot(`
        Object {
          "parent": "projects/test/agent",
          "version": Object {
            "description": "@sociably/dialogflow:V0:c08fccf84d0eb503d0bc1356741d45f64c18a072",
          },
        }
      `);

    expect(environmentsClient.createEnvironment).not.toHaveBeenCalled();
    expect(environmentsClient.auth.request as any).toHaveBeenCalledTimes(1);
    expect((environmentsClient.auth.request as any).mock.calls[0].args[0])
      .toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "agentVersion": "projects/test/agent/versions/2",
        },
        "method": "PATCH",
        "params": Object {
          "updateMask": "agentVersion",
        },
        "url": "https://dialogflow.googleapis.com/v2/projects/test/agent/environments/sociably-entry",
      }
    `);
  });

  test('when version is alread existed and selected', async () => {
    const versionName = 'projects/test/agent/versions/2';
    environmentsClient.getEnvironment.mock.fake(async () => [
      { ...environment, agentVersion: versionName },
    ]);
    versionsClient.listVersions.mock.fake(async () => [
      [
        {
          name: versionName,
          description:
            '@sociably/dialogflow:V0:c08fccf84d0eb503d0bc1356741d45f64c18a072',
        },
      ],
    ]);

    const recognizer = new Recognizer(recognizerOptions);
    await recognizer.train();

    expect(agentsClient.setAgent).not.toHaveBeenCalled();
    expect(intentsClient.batchDeleteIntents).not.toHaveBeenCalled();
    expect(intentsClient.batchUpdateIntents).not.toHaveBeenCalled();
    expect(versionsClient.createVersion).not.toHaveBeenCalled();
    expect(environmentsClient.createEnvironment).not.toHaveBeenCalled();
    expect(
      (environmentsClient.auth.request as any).mock
    ).not.toHaveBeenCalled();
  });

  test('when version is existed but not selected', async () => {
    environmentsClient.getEnvironment.mock.fake(async () => [
      { ...environment, agentVersion: 'projects/test/agent/versions/1' },
    ]);
    versionsClient.listVersions.mock.fake(async () => [
      [
        {
          name: 'projects/test/agent/versions/2',
          description:
            '@sociably/dialogflow:V0:c08fccf84d0eb503d0bc1356741d45f64c18a072',
        },
      ],
    ]);

    const recognizer = new Recognizer(recognizerOptions);
    await recognizer.train();

    expect(agentsClient.setAgent).not.toHaveBeenCalled();
    expect(intentsClient.batchDeleteIntents).not.toHaveBeenCalled();
    expect(intentsClient.batchUpdateIntents).not.toHaveBeenCalled();
    expect(versionsClient.createVersion).not.toHaveBeenCalled();
    expect(environmentsClient.createEnvironment).not.toHaveBeenCalled();

    expect(environmentsClient.auth.request as any).toHaveBeenCalledTimes(1);
    expect((environmentsClient.auth.request as any).mock.calls[0].args[0])
      .toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "agentVersion": "projects/test/agent/versions/2",
        },
        "method": "PATCH",
        "params": Object {
          "updateMask": "agentVersion",
        },
        "url": "https://dialogflow.googleapis.com/v2/projects/test/agent/environments/sociably-entry",
      }
    `);
  });

  test('update agent', async () => {
    environmentsClient.getEnvironment.mock.fake(async () => {
      const err = new Error(
        "5 NOT_FOUND: com.google.apps.framework.request.NotFoundException: Environment 'sociably-entry' not found for agent with internal ID '51adb532-5bfd-429e-94af-3fbcf2029d33'"
      );
      (err as any).code = 5;
      throw err;
    });

    const recognizer = new Recognizer({
      ...recognizerOptions,
      agentName: 'smith',
      agentTimeZone: 'America/Chicago',
      environment: 'matrix',
      recognitionData: {
        ...recognizerOptions.recognitionData,
        languages: ['es', 'en'],
      },
    });
    await recognizer.train();

    expect(agentsClient.setAgent).toHaveBeenCalledTimes(1);
    expect(agentsClient.setAgent.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "agent": Object {
          "displayName": "smith",
          "parent": "projects/test",
          "supportedLanguageCodes": Array [
            "es",
            "en",
          ],
          "timeZone": "America/Chicago",
        },
      }
    `);

    expect(environmentsClient.createEnvironment).toHaveBeenCalledTimes(1);
    expect(environmentsClient.createEnvironment.mock.calls[0].args[0])
      .toMatchInlineSnapshot(`
      Object {
        "environment": Object {
          "agentVersion": "projects/test/agent/versions/2",
          "description": "This evnironment is generated by @sociably/dialogflow package",
        },
        "environmentId": "matrix",
        "parent": "projects/test/agent",
      }
    `);
  });

  test('manual mode', async () => {
    const recognizer = new Recognizer({
      ...recognizerOptions,
      manualMode: true,
    });
    await recognizer.train();

    expect(agentsClient.setAgent).not.toHaveBeenCalled();

    expect(intentsClient.batchDeleteIntents).not.toHaveBeenCalled();
    expect(intentsClient.batchUpdateIntents).not.toHaveBeenCalled();

    expect(versionsClient.createVersion).toHaveBeenCalledTimes(1);
    expect(versionsClient.createVersion.mock.calls[0].args[0]).toEqual({
      parent: 'projects/test/agent',
      version: {
        description: expect.stringMatching(
          /^@sociably\/dialogflow snapshot at \d+-\d+-\d+T\d+:\d+:\d+.\d+Z$/
        ),
      },
    });

    expect(environmentsClient.createEnvironment).not.toHaveBeenCalled();
    expect(environmentsClient.auth.request as any).toHaveBeenCalledTimes(1);
    expect((environmentsClient.auth.request as any).mock.calls[0].args[0])
      .toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "agentVersion": "projects/test/agent/versions/2",
        },
        "method": "PATCH",
        "params": Object {
          "updateMask": "agentVersion",
        },
        "url": "https://dialogflow.googleapis.com/v2/projects/test/agent/environments/sociably-entry",
      }
    `);
  });
});
