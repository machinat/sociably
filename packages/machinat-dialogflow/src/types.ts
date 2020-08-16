import type { v2, protos } from '@google-cloud/dialogflow';
import type { ClientOptions } from 'google-gax';

export type ModuleConfigs = {
  projectId: string;
  defaultLanguageCode: string;
  gcpAuthConfig?: ClientOptions;
};

export type SessionClient = v2.SessionsClient;

export type DetactIntentResponse = protos.google.cloud.dialogflow.v2.IDetectIntentResponse;

export type DetactIntentPayload = protos.google.cloud.dialogflow.v2.IQueryResult;
