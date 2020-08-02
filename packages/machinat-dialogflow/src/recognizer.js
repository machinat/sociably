// @flow
import invariant from 'invariant';
import { provider } from '@machinat/core/service';
import { AbstractIntentRecognizer } from '@machinat/core/base/IntentRecognizerI';
import type { MachinatChannel } from '@machinat/core/types';
import { DialogFlowClientI, MODULE_CONFIGS_I } from './interface';

type RecognizerOptions = {
  projectId: string,
  defaultLanguageCode: string,
};

type DetectIntentOptions = {
  languageCode?: string,
  timeZone?: string,
  geoLocation?: Object,
  contexts?: string[],
  resetContexts?: boolean,
};

class DialogFlowIntentRecognizer implements AbstractIntentRecognizer {
  _client: DialogFlowClientI;
  projectId: string;
  defaultLanguageCode: void | string;

  constructor(
    client: DialogFlowClientI,
    { projectId, defaultLanguageCode }: RecognizerOptions = {}
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
  ) {
    const sessionPath = this._client.sessionPath(this.projectId, channel.uid);

    const [{ queryResult }] = await this._client.detectIntent({
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

    return {
      intentType: queryResult.intent?.displayName || undefined,
      confidence: queryResult.intentDetectionConfidence || 0,
      payload: queryResult,
    };
  }
}

export default provider<DialogFlowIntentRecognizer>({
  lifetime: 'scoped',
  deps: [DialogFlowClientI, MODULE_CONFIGS_I],
})(DialogFlowIntentRecognizer);
