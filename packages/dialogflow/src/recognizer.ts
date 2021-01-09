import invariant from 'invariant';
import { makeClassProvider } from '@machinat/core/service';
import type {
  TextIntentDetectResult,
  BaseIntentRecognizer,
} from '@machinat/core/base/IntentRecognizerI';
import type { MachinatChannel } from '@machinat/core/types';
import { SESSION_CLIENT_I, MODULE_CONFIGS_I } from './interface';
import { SessionClient, DetactIntentPayload } from './types';
import DialogflowAPIError from './error';

type RecognizerOptions = {
  projectId: string;
  defaultLanguageCode: string;
};

type DetectIntentOptions = {
  languageCode?: string;
  timeZone?: string;
  geoLocation?: {
    latitude?: number;
    longitude?: number;
  };
  contexts?: string[];
  resetContexts?: boolean;
};

/**
 * @category Provider
 */
export class DialogflowIntentRecognizer
  implements BaseIntentRecognizer<DetactIntentPayload> {
  _client: SessionClient;
  projectId: string;
  defaultLanguageCode: undefined | string;

  constructor(
    client: SessionClient,
    { projectId, defaultLanguageCode }: RecognizerOptions
  ) {
    invariant(projectId, 'options.projectId should not be empty');
    invariant(
      defaultLanguageCode,
      'options.defaultLanguageCode should not be empty'
    );

    this._client = client;
    this.projectId = projectId;
    this.defaultLanguageCode = defaultLanguageCode;
  }

  async detectText(
    channel: MachinatChannel,
    text: string,
    options?: DetectIntentOptions
  ): Promise<TextIntentDetectResult<DetactIntentPayload>> {
    const sessionPath = this._client.projectAgentSessionPath(
      this.projectId,
      channel.uid
    );

    const [
      { responseId, webhookStatus, queryResult },
    ] = await this._client.detectIntent({
      session: sessionPath,
      queryInput: {
        text: {
          text,
          languageCode: options?.languageCode || this.defaultLanguageCode,
        },
      },
      queryParams: options
        ? {
            timeZone: options.timeZone,
            geoLocation: options.geoLocation,
            resetContexts: options.resetContexts,
            contexts: options.contexts?.map((contextName) => ({
              name: `projects/${this.projectId}/agent/sessions/${channel.uid}/contexts/${contextName}`,
            })),
          }
        : undefined,
    });

    if (!queryResult) {
      throw new DialogflowAPIError(responseId, webhookStatus);
    }

    return {
      intentType: queryResult.intent?.displayName || undefined,
      confidence: queryResult.intentDetectionConfidence || 0,
      payload: queryResult,
    };
  }
}

export const IntentRecognizerP = makeClassProvider({
  lifetime: 'scoped',
  deps: [SESSION_CLIENT_I, MODULE_CONFIGS_I] as const,
})(DialogflowIntentRecognizer);

export type IntentRecognizerP = DialogflowIntentRecognizer;
