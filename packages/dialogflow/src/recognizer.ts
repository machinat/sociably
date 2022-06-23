import invariant from 'invariant';
import {
  protos,
  SessionsClient,
  AgentsClient,
  VersionsClient,
  IntentsClient,
  EnvironmentsClient,
} from '@google-cloud/dialogflow';
import type { SociablyChannel } from '@sociably/core';
import { makeClassProvider } from '@sociably/core/service';
import type {
  DetectIntentResult,
  IntentRecognizer,
  RecognitionData,
} from '@sociably/core/base/IntentRecognizer';
import hashObject from 'object-hash';
import { ConfigsI } from './interface';
import { DetactIntentPayload, DialogflowConfigs, ClientOptions } from './types';
import DialogflowApiError from './error';

const getRecognitionDataId = (data: RecognitionData) =>
  `@sociably/dialogflow:V0:${hashObject(data)}`;

type DialogFlowAgent = protos.google.cloud.dialogflow.v2.IAgent;
type DialogFlowVersion = protos.google.cloud.dialogflow.v2.IVersion;
type DialogFlowEnvironment = protos.google.cloud.dialogflow.v2.IEnvironment;

type DetectIntentOptions = {
  language?: string;
  timeZone?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  contexts?: string[];
  resetContexts?: boolean;
};

/**
 * @category Provider
 */
export class DialogflowIntentRecognizer<
  Recognition extends RecognitionData<string, string> = RecognitionData<
    string,
    string
  >
> implements IntentRecognizer<Recognition, DetactIntentPayload>
{
  projectId: string;
  manualMode: boolean;
  useDefaultAgent: boolean;
  environment: string;
  agentTimeZone: undefined | string;
  agentName: undefined | string;
  private _recognitionData: RecognitionData;
  private _clientOptions: undefined | ClientOptions;

  constructor(
    options: Recognition extends RecognitionData<infer Language, infer Intent>
      ? DialogflowConfigs<Language, Intent>
      : never
  ) {
    const {
      projectId,
      recognitionData,
      clientOptions,
      agentName,
      agentTimeZone,
      manualMode = false,
      useDefaultAgent = false,
      environment = 'sociably-entry',
    } = options;

    invariant(projectId, 'options.projectId should not be empty');
    invariant(recognitionData, 'options.recognitionData should not be empty');

    this.projectId = projectId;
    this.environment = environment;
    this.agentName = agentName;
    this.agentTimeZone = agentTimeZone;
    this.manualMode = manualMode;
    this.useDefaultAgent = useDefaultAgent;
    this._clientOptions = clientOptions;
    this._recognitionData = recognitionData;
  }

  async detectText(
    channel: SociablyChannel,
    text: string,
    options?: DetectIntentOptions
  ): Promise<DetectIntentResult<Recognition, DetactIntentPayload>> {
    const client = new SessionsClient(this._clientOptions);

    const language = options?.language || this._recognitionData.defaultLanguage;
    const sessionPath = this.useDefaultAgent
      ? client.projectAgentSessionPath(this.projectId, channel.uid)
      : client.projectAgentEnvironmentUserSessionPath(
          this.projectId,
          this.environment,
          '-',
          channel.uid
        );

    const [{ responseId, webhookStatus, queryResult }] =
      await client.detectIntent({
        session: sessionPath,
        queryInput: {
          text: { text, languageCode: language },
        },
        queryParams: options
          ? {
              timeZone: options.timeZone,
              geoLocation: options.location,
              resetContexts: options.resetContexts,
              contexts: options.contexts?.map((contextName) => ({
                name: this.useDefaultAgent
                  ? client.projectAgentSessionContextPath(
                      this.projectId,
                      channel.uid,
                      contextName
                    )
                  : client.projectAgentEnvironmentUserSessionContextPath(
                      this.projectId,
                      this.environment,
                      '-',
                      channel.uid,
                      contextName
                    ),
              })),
            }
          : undefined,
      });

    if (!queryResult) {
      throw new DialogflowApiError(responseId, webhookStatus);
    }

    return {
      type: queryResult.intent?.displayName || undefined,
      language,
      confidence: queryResult.intentDetectionConfidence || 0,
      payload: queryResult,
    } as DetectIntentResult<Recognition, DetactIntentPayload>;
  }

  async train(): Promise<boolean> {
    const recognitionData = this._recognitionData;
    if (!recognitionData) {
      throw new Error('options.recognitionData is required for training');
    }

    await this._updateAgent(recognitionData);
    const [version, isCreated] = await this._updateVersion(recognitionData);

    await this._updateEnvironment(version);
    return isCreated;
  }

  private async _updateAgent(agentData: RecognitionData) {
    const agentsClient = new AgentsClient(this._clientOptions);

    const projectPath = agentsClient.projectPath(this.projectId);
    const supportedLanguages = agentData.languages.filter(
      (lang) => lang !== agentData.defaultLanguage
    );

    // get agent if existed
    let agent: undefined | DialogFlowAgent;
    try {
      [agent] = await agentsClient.getAgent({
        parent: projectPath,
      });
    } catch (err) {
      // agent is not set yet
      if (err.code !== 5) {
        throw err;
      }
    }

    // create new agent
    if (!agent) {
      await agentsClient.setAgent({
        agent: {
          parent: projectPath,
          displayName: this.agentName || 'sociably-agent',
          description:
            'This agent is generated by @sociably/dialogflow package',
          defaultLanguageCode: agentData.defaultLanguage,
          supportedLanguageCodes: supportedLanguages,
          timeZone: this.agentTimeZone || 'GMT',
        },
      });
    }
    // check if existed agent needs updating
    else if (
      !this.manualMode &&
      ((this.agentName && agent.displayName !== this.agentName) ||
        (this.agentTimeZone && agent.timeZone !== this.agentTimeZone) ||
        (agent.supportedLanguageCodes?.sort().join(',') || '') !==
          supportedLanguages.sort().join(','))
    ) {
      await agentsClient.setAgent({
        agent: {
          parent: projectPath,
          displayName: this.agentName || 'sociably-agent',
          timeZone: this.agentTimeZone,
          supportedLanguageCodes: supportedLanguages,
        },
      });
    }
  }

  private async _updateVersion(
    agentData: RecognitionData
  ): Promise<[DialogFlowVersion, boolean]> {
    const versionsClient = new VersionsClient(this._clientOptions);
    const intentsClient = new IntentsClient(this._clientOptions);
    const agentPath = versionsClient.projectAgentPath(this.projectId);

    // create a snapshot if user manually manages the DialogFlow project
    if (this.manualMode) {
      const [newVersion] = await versionsClient.createVersion({
        parent: agentPath,
        version: {
          description: `@sociably/dialogflow snapshot at ${new Date().toISOString()}`,
        },
      });
      return [newVersion, true];
    }

    // check if current version exist
    const [versions] = await versionsClient.listVersions({
      parent: agentPath,
    });

    const versionDesc = getRecognitionDataId(agentData);
    const existedVersion = versions.find(
      (ver) => ver.description === versionDesc
    );
    if (existedVersion) {
      return [existedVersion, false];
    }

    // clear current intents
    const [currentIntents] = await intentsClient.listIntents({
      parent: agentPath,
    });

    const [deleteOperation] = await intentsClient.batchDeleteIntents({
      parent: agentPath,
      intents: currentIntents.map(({ name }) => ({ name })),
    });
    await deleteOperation.promise();

    // update current intents
    const intentsDataByLangs: Map<string, Map<string, string[]>> = new Map();
    Object.entries(agentData.intents).forEach(([name, { trainingPhrases }]) => {
      Object.entries(trainingPhrases).forEach(([lang, phrases]) => {
        let intentsOfLang = intentsDataByLangs.get(lang);
        if (!intentsOfLang) {
          intentsOfLang = new Map();
          intentsDataByLangs.set(lang, intentsOfLang);
        }
        intentsOfLang.set(name, phrases);
      });
    });

    const createdIntents = new Map();
    for (const [lang, phrasesOfIntents] of intentsDataByLangs) {
      /* eslint-disable no-await-in-loop */
      const [updateOperation] = await intentsClient.batchUpdateIntents({
        parent: agentPath,
        languageCode: lang,
        intentBatchInline: {
          intents: Array.from(phrasesOfIntents).map(([name, phrases]) => ({
            name: createdIntents.get(name),
            displayName: name,
            trainingPhrases: phrases.map((text) => ({ parts: [{ text }] })),
          })),
        },
      });

      const [{ intents }] = await updateOperation.promise();
      intents?.forEach((intent) => {
        createdIntents.set(intent.displayName, intent.name);
      });
      /* eslint-enable no-await-in-loop */
    }

    const [newVersion] = await versionsClient.createVersion({
      parent: agentPath,
      version: { description: versionDesc },
    });
    return [newVersion, true];
  }

  private async _updateEnvironment(version: DialogFlowVersion) {
    const environmentsClient = new EnvironmentsClient(this._clientOptions);
    const agentPath = environmentsClient.projectAgentPath(this.projectId);

    let environment: undefined | DialogFlowEnvironment;
    try {
      [environment] = await environmentsClient.getEnvironment({
        name: environmentsClient.projectAgentEnvironmentPath(
          this.projectId,
          this.environment
        ),
      });
    } catch (err) {
      if (err.code !== 5) {
        throw err;
      }
    }

    if (!environment) {
      await environmentsClient.createEnvironment({
        parent: agentPath,
        environmentId: this.environment,
        environment: {
          description:
            'This evnironment is generated by @sociably/dialogflow package',
          agentVersion: version.name,
        },
      });
    } else if (environment.agentVersion !== version.name) {
      // HACK: workaround to update agentVersion, follow https://github.com/googleapis/nodejs-dialogflow/issues/924
      await environmentsClient.auth.request({
        url: `https://dialogflow.googleapis.com/v2/${environment.name}`,
        method: 'PATCH',
        params: { updateMask: 'agentVersion' },
        data: {
          agentVersion: version.name,
        },
      });
    }
  }
}

const IntentRecognizerP = makeClassProvider({
  lifetime: 'scoped',
  deps: [ConfigsI],
})(DialogflowIntentRecognizer);

type IntentRecognizerP = DialogflowIntentRecognizer;

export default IntentRecognizerP;
