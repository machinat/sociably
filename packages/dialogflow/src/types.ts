import type { v2, protos } from '@google-cloud/dialogflow';
import type { ClientOptions } from 'google-gax';
import type { RecognitionData } from '@sociably/core/base/IntentRecognizer';

export type { ClientOptions } from 'google-gax'; // eslint-disable-line import/no-extraneous-dependencies

export type DialogflowConfigs<
  Language extends string,
  Intent extends string,
> = {
  /** The id of dialogflow project */
  projectId: string;
  /** The intents data for training. */
  recognitionData: RecognitionData<Language, Intent>;
  /** The display name of the DialogFlow agent. Default to 'sociably-agent' */
  agentName?: string;
  /** The default time zone of the DialogFlow agent. Default to 'GMT' */
  agentTimeZone?: string;
  /** The environment to be used by the module. Default to 'sociably-entry' */
  environment?: string;
  /**
   * Set to true to prevent the package from editing DialogFlow data, i.e. you
   * have to mangage the DialogFlow project on your own
   */
  manualMode?: boolean;
  /**
   * If it's set to true, the default agent is used to detect intent instead
   * under the environment.
   */
  useDefaultAgent?: boolean;
  /**
   * The constructor options of a GCP client. Omit this if you already set the
   * `GOOGLE_APPLICATION_CREDENTIALS` env. Check
   * https://github.com/googleapis/gax-nodejs/blob/main/client-libraries.md#constructor-options
   */
  clientOptions?: ClientOptions;
};

export type SessionClient = v2.SessionsClient;

export type DetactIntentResponse =
  protos.google.cloud.dialogflow.v2.IDetectIntentResponse;

export type DetactIntentPayload =
  protos.google.cloud.dialogflow.v2.IQueryResult;
