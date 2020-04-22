// @flow
import invariant from 'invariant';
import { provider } from '@machinat/core/service';
import type { MachinatChannel } from '@machinat/core/types';
import { DialogFlowClientI, MODULE_CONFIGS_I } from './interface';
import type { DialogFlowModuleConfigs } from './types';

type DetectIntentOptions = {
  languageCode?: string,
  queryParams?: Object,
};

class DialogFlowIntentRecognizer {
  _client: DialogFlowClientI;
  projectId: string;
  defaultLanguageCode: void | string;

  constructor(
    client: DialogFlowClientI,
    projectId: string,
    defaultLanguageCode?: string
  ) {
    invariant(projectId, 'projectId should not be empty');

    this._client = client;
    this.projectId = projectId;
    this.defaultLanguageCode = defaultLanguageCode;
  }

  async recognizeText(
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
      queryParams: options?.queryParams,
    });

    return queryResult;
  }
}

export default provider<DialogFlowIntentRecognizer>({
  lifetime: 'scoped',
  deps: [DialogFlowClientI, MODULE_CONFIGS_I],
  factory: (client: DialogFlowClientI, configs: DialogFlowModuleConfigs) =>
    new DialogFlowIntentRecognizer(
      client,
      configs.projectId,
      configs.defaultLanguageCode
    ),
})(DialogFlowIntentRecognizer);
