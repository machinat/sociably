export type PlatformType =
  | 'facebook'
  | 'whatsapp'
  | 'instagram'
  | 'line'
  | 'telegram'
  | 'twitter';

export type CreateAppContext = {
  projectName: string;
  recognizer: 'regex' | 'dialogflow';
  withWebview: boolean;
  platforms: PlatformType[];
};
